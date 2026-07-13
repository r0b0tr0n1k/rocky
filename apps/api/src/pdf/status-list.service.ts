/**
 * Credential status-list publisher (ADR-0084 §4).
 *
 * Gathers revocation signals from the in-domain state machines (passport
 * ACTIVE → SEIZED → CANCELLED) and assembles a CRL-style credential status
 * list via the pure `buildCredentialStatusList` model in @rocky/pdf. The list
 * is published and fetched opportunistically by the offline verifier, which
 * surfaces its staleness ("status list last synced: X days ago").
 *
 * Movements carry no revocation state yet (ADR-0084 §4, future work), so they
 * are not enumerated here until a movement state machine exists.
 */

import { Inject, Injectable } from "@nestjs/common";
import { PassportRepository } from "@rocky/domains-passport";
import {
  buildCredentialStatusList,
  passportStatusToCredentialStatus,
  type CredentialStatusList,
  type CredentialStatusListEntry,
} from "@rocky/pdf";

/** Must match the credential `iss` (CredentialService default). */
export const CREDENTIAL_ISSUER = "rocky:cattle";
const PAGE = 500;

@Injectable()
export class CredentialStatusListService {
  constructor(
    @Inject(PassportRepository) private readonly passportRepo: PassportRepository,
  ) {}

  async buildStatusList(opts?: {
    publisher?: string;
    ttlSeconds?: number;
  }): Promise<CredentialStatusList> {
    const entries = await this.collectPassportEntries();
    return buildCredentialStatusList(entries, {
      publisher: opts?.publisher ?? CREDENTIAL_ISSUER,
      ttlSeconds: opts?.ttlSeconds,
    });
  }

  private async collectPassportEntries(): Promise<CredentialStatusListEntry[]> {
    const entries: CredentialStatusListEntry[] = [];
    let offset = 0;
    for (;;) {
      const { data, total } = await this.passportRepo.findAll({ limit: PAGE, offset });
      for (const p of data) {
        entries.push({
          sub: p.id,
          typ: "passport",
          status: passportStatusToCredentialStatus(p.status),
          updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
        });
      }
      offset += PAGE;
      if (data.length === 0 || offset >= total) break;
    }
    return entries;
  }
}
