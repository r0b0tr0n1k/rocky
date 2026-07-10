/**
 * Sync Service
 *
 * @description Offline-first sync engine (WO-081).
 *   - syncDownload: pulls master + field data for PDA offline use (RLS-scoped
 *     automatically by the ExecutionPipeline — no manual RLS injection here).
 *   - syncUpload: applies PDA-created records in order with idempotency,
 *     version/conflict checks, and best-effort correction-case creation.
 *
 * Returns neverthrow `Result<T, Error>`; routers map `E` to `TRPCError`.
 */

import { fromAsyncThrowable, ok, err, type Result, toAppError } from "@rocky/domains-shared";

import type { HealthService } from "@rocky/domains-health";
import type { AnimalService } from "@rocky/domains-animal";
import type { FarmService } from "@rocky/domains-farm";
import type { InspectionService } from "@rocky/domains-inspection";
import type { EarTagService } from "@rocky/domains-eartag";
import type { MovementService } from "@rocky/domains-movement";
import type { CorrectionService } from "@rocky/domains-correction";

import type { SyncRepository } from "../repositories/sync.repository.js";
import type {
  SyncDownloadResponse,
  SyncUploadItem,
  SyncUploadItemType,
  SyncUploadResponse,
  SyncUploadResult,
} from "@rocky/validators/api";

/** Post-filter any array of entities by updatedAt >= since (absent/null updatedAt dropped). */
function filterByUpdatedAt<T>(arr: T[], since: Date): T[] {
  const sinceMs = since.getTime();
  return arr.filter((item) => {
    const updatedAt = (item as { updatedAt?: Date | string | null }).updatedAt;
    return updatedAt ? new Date(updatedAt).getTime() >= sinceMs : false;
  });
}

export class SyncService {
  constructor(
    private readonly syncRepo: SyncRepository,
    private readonly healthService: HealthService,
    private readonly animalService: AnimalService,
    private readonly farmService: FarmService,
    private readonly inspectionService: InspectionService,
    private readonly earTagService: EarTagService,
    private readonly movementService: MovementService,
    private readonly correctionService?: CorrectionService,
  ) {}

  // ── Download ──────────────────────────────────────────────────────

  async syncDownload(since?: Date | null): Promise<Result<SyncDownloadResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const health = await this.healthService.syncDownload();
      if (health.isErr()) throw health.error;

      const animalsRes = await this.animalService.list({ sortBy: "createdAt", sortOrder: "desc", limit: 5000, offset: 0 });
      if (animalsRes.isErr()) throw animalsRes.error;

      const farmsRes = await this.farmService.list({ sortBy: "createdAt", sortOrder: "desc", limit: 5000, offset: 0 });
      if (farmsRes.isErr()) throw farmsRes.error;

      const inspectionsRes = await this.inspectionService.list({ limit: 5000, offset: 0 });
      if (inspectionsRes.isErr()) throw inspectionsRes.error;

      const earTagsRes = await this.earTagService.list({ sortBy: "createdAt", sortOrder: "desc", limit: 5000, offset: 0 });
      if (earTagsRes.isErr()) throw earTagsRes.error;

      const movements = await this.syncRepo.listMovements(5000);
      let movementsFiltered = movements;

      let { diseases, vaccines, batches, vaccineDiseases } = health.value;
      let animals = animalsRes.value.data;
      let farms = farmsRes.value.data;
      let inspections = inspectionsRes.value.data;
      let earTags = earTagsRes.value.data;

      if (since) {
        diseases = filterByUpdatedAt(diseases, since);
        vaccines = filterByUpdatedAt(vaccines, since);
        batches = filterByUpdatedAt(batches, since);
        vaccineDiseases = filterByUpdatedAt(vaccineDiseases, since);
        animals = filterByUpdatedAt(animals, since);
        farms = filterByUpdatedAt(farms, since);
        inspections = filterByUpdatedAt(inspections, since);
        earTags = filterByUpdatedAt(earTags, since);
        movementsFiltered = filterByUpdatedAt(movements, since);
      }

      return {
        animals,
        farms,
        movements: movementsFiltered,
        inspections,
        earTags,
        diseases,
        vaccines,
        batches,
        vaccineDiseases,
        syncedAt: new Date(),
        watermark: since ?? null,
      };
    }, toAppError)();
  }

  // ── Upload ────────────────────────────────────────────────────────

  async syncUpload(input: {
    records: SyncUploadItem[];
    createdBy: string;
  }): Promise<Result<SyncUploadResponse, Error>> {
    const results: SyncUploadResult[] = [];

    for (const record of input.records) {
      // 1. Idempotency — already processed on a prior attempt?
      if (await this.syncRepo.isProcessed(record.idempotencyKey)) {
        const prior = await this.syncRepo.getProcessed(record.idempotencyKey);
        results.push({
          idempotencyKey: record.idempotencyKey,
          success: true,
          recordId: prior?.recordId ?? null,
          error: null,
        });
        continue;
      }

      const data = record.data as Record<string, unknown>;
      const entityId = typeof data.id === "string" ? data.id : undefined;

      // 2. Version / conflict check — only when a base version is supplied.
      if (record.baseUpdatedAt && entityId) {
        const current = await this.getCurrentEntity(record.type, entityId);
        const currentUpdatedAt = current?.updatedAt ? new Date(current.updatedAt) : null;
        const base =
          record.baseUpdatedAt instanceof Date
            ? record.baseUpdatedAt
            : new Date(record.baseUpdatedAt);
        if (currentUpdatedAt && base.getTime() < currentUpdatedAt.getTime()) {
          const msg = "CONFLICT: entity modified by another device";
          results.push({ idempotencyKey: record.idempotencyKey, success: false, recordId: null, error: msg });
          if (this.correctionService) {
            await this.createSyncErrorCorrection(record, msg, input.createdBy);
          }
          await this.syncRepo.markProcessed({
            idempotencyKey: record.idempotencyKey,
            entityType: record.type,
            entityId,
            createdBy: input.createdBy,
            payload: record.data,
          });
          continue;
        }
      }

      // 3. Apply.
      try {
        const result = await this.applyRecord(record, entityId);
        if (result.isOk()) {
          const recordId = result.value.id ?? null;
          results.push({ idempotencyKey: record.idempotencyKey, success: true, recordId, error: null });
          await this.syncRepo.markProcessed({
            idempotencyKey: record.idempotencyKey,
            entityType: record.type,
            entityId: recordId,
            createdBy: input.createdBy,
            payload: record.data,
          });
        } else {
          const msg = result.error.message;
          results.push({ idempotencyKey: record.idempotencyKey, success: false, recordId: null, error: msg });
          await this.syncRepo.markProcessed({
            idempotencyKey: record.idempotencyKey,
            entityType: record.type,
            entityId: entityId ?? null,
            createdBy: input.createdBy,
            payload: record.data,
          });
          if (this.correctionService) {
            await this.createSyncErrorCorrection(record, msg, input.createdBy);
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        results.push({ idempotencyKey: record.idempotencyKey, success: false, recordId: null, error: msg });
        await this.syncRepo.markProcessed({
          idempotencyKey: record.idempotencyKey,
          entityType: record.type,
          entityId: entityId ?? null,
          createdBy: input.createdBy,
          payload: record.data,
        });
        if (this.correctionService) {
          await this.createSyncErrorCorrection(record, msg, input.createdBy);
        }
      }
    }

    return ok({
      results,
      processed: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    });
  }

  /** Dispatch a single upload record to its owning domain service. */
  private async applyRecord(
    record: SyncUploadItem,
    entityId: string | undefined,
  ): Promise<Result<{ id?: string }, Error>> {
    switch (record.type) {
      case "vaccination":
        return this.healthService.recordVaccination(record.data as never);
      case "treatment":
        return this.healthService.recordTreatment(record.data as never);
      case "labTest":
        return this.healthService.recordLabTest(record.data as never);
      case "animal":
        return entityId
          ? this.animalService.update(entityId, record.data as never)
          : this.animalService.create(record.data as never);
      case "farm":
        return entityId
          ? this.farmService.update(entityId, record.data as never)
          : this.farmService.create(record.data as never);
      case "movement":
        return this.movementService.create(record.data as never);
      case "inspection":
        return this.inspectionService.complete(record.data as never);
      case "earTag":
        return this.earTagService.createOrder(record.data as never);
      default: {
        // Unknown type — surface as a failed record rather than throwing.
        const msg = `Unknown sync type: ${String(record.type)}`;
        return err(new Error(msg));
      }
    }
  }

  /** Fetch the current persisted entity for an optimistic-concurrency check. */
  private async getCurrentEntity(
    type: SyncUploadItemType,
    id: string,
  ): Promise<{ updatedAt?: Date | string | null } | null> {
    let res: Result<{ updatedAt?: Date | string | null }, Error> | null = null;
    switch (type) {
      case "animal":
        res = await this.animalService.getById(id);
        break;
      case "farm":
        res = await this.farmService.getById(id);
        break;
      case "movement":
        res = await this.movementService.getById(id);
        break;
      case "inspection":
        res = await this.inspectionService.getById(id);
        break;
      case "earTag":
        res = await this.earTagService.getById(id);
        break;
      case "vaccination":
        // Health records DO have a getById (closes sync gap: the version/conflict
        // check for vaccination/treatment/labTest was previously skipped because
        // this branch fell through to `default: return null`).
        res = await this.healthService.getVaccination(id);
        break;
      case "treatment":
        res = await this.healthService.getTreatment(id);
        break;
      case "labTest":
        res = await this.healthService.getLabTest(id);
        break;
      default:
        // Unknown type — no current-entity lookup; conflict check is skipped.
        return null;
    }
    return res && res.isOk() ? res.value : null;
  }

  /** Best-effort correction-case creation for a failed sync record. */
  private async createSyncErrorCorrection(
    record: SyncUploadItem,
    errorMessage: string,
    createdBy: string,
  ): Promise<void> {
    if (!this.correctionService) return;
    try {
      await this.correctionService.create({
        detectionSource: "field",
        errorType: `sync_upload_${record.type}_failed`,
        errorDescription: `PDA sync failed: ${errorMessage}`,
        originalData: {
          idempotencyKey: record.idempotencyKey,
          type: record.type,
          data: record.data,
        },
        caseType: "TECHNICIAN_RESOLVABLE",
        createdBy,
      });
    } catch {
      // Correction creation is secondary — never fail the sync because of it.
    }
  }
}
