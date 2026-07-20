import crypto from "node:crypto";
import type { OnModuleInit } from "@nestjs/common";
import { Inject, Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AuthorizationModule } from "@rocky/authorization/index.js";
import { DatabaseProvider } from "@rocky/database/index.js";
// ── Repositories ─────────────────────────────────────────────────────
// ── Domain Services ─────────────────────────────────────────────────
import { AnimalRepository, AnimalService } from "@rocky/domains-animal";
import { ArchiveRepository, ArchiveService } from "@rocky/domains-archive";
import { AuditRepository, AuditService } from "@rocky/domains-audit";
import { CorrectionRepository, CorrectionService } from "@rocky/domains-correction";
import { DeviceRepository, DeviceService } from "@rocky/domains-device";
import { EarTagRepository, EarTagService } from "@rocky/domains-eartag";
import {
  FarmBookRepository,
  FarmBookService,
  FarmRepository,
  FarmService,
  VsAssignmentRepository,
  VsAssignmentService,
  VsContractRepository,
  VsContractService,
} from "@rocky/domains-farm";
import { HealthRepository, HealthService } from "@rocky/domains-health";
import {
  InspectionRepository,
  InspectionService,
  RiskAnalysisRepository,
  RiskAnalysisService,
} from "@rocky/domains-inspection";
import { IotRepository, IotService } from "@rocky/domains-iot";
import { MovementRepository, MovementService } from "@rocky/domains-movement";
import {
  NotificationRepository,
  NotificationService,
  SubscriptionResolver,
} from "@rocky/domains-notification/index.js";
import { OrganizationRepository, OrganizationService } from "@rocky/domains-organization/index.js";
import { PassportRepository, PassportService } from "@rocky/domains-passport";
import { RbacRepository, RbacService } from "@rocky/domains-rbac/index.js";
import { SubjectRepository, SubjectService } from "@rocky/domains-subject";
import { SyncRepository, SyncService } from "@rocky/domains-sync";
import { SystemRepository, SystemService } from "@rocky/domains-system";
import { UserRepository, UserService } from "@rocky/domains-user/index.js";
import { OutboxEventPublisher } from "@rocky/execution";
import { ExecutionModule } from "@rocky/execution/index.js";
import {
  DeforestationMonitor,
  GeoRepository,
  GeoService,
  MapTilerMapService,
  NoDataRasterSource,
  PolygonService,
} from "@rocky/geo";
import { LoggerModule } from "@rocky/logger/index.js";
import {
  ChedTemplate,
  CredentialService,
  DocumentRegistry,
  DocumentService,
  EarTagTemplate,
  EudrTemplate,
  InspectionFormTemplate,
  MovementTemplate,
  PassportTemplate,
  PdfModule,
} from "@rocky/pdf/index.js";
import { ClsModule, ClsService } from "nestjs-cls";
import { AuthCoreModule } from "./auth/auth-core.module.js";
import { AuditRetentionJob } from "./jobs/audit-retention.job.js";
import { BirthDeadlineJob } from "./jobs/birth-deadline.job.js";
// ── Scheduled Jobs ─────────────────────────────────────────────────
import { CorrectionConsistencyJob } from "./jobs/correction-consistency.job.js";
import { OutboxEventHandlers } from "./jobs/outbox-handlers.js";
import { OutboxProcessorJob } from "./jobs/outbox-processor.job.js";
import { RetentionJob } from "./jobs/retention.job.js";
import { RiskAnalysisJob } from "./jobs/risk-analysis.job.js";
import { VaccineReconciliationJob } from "./jobs/vaccine-reconciliation.job.js";
import { DbModule } from "./modules/db.module.js";
import { createConfiguredCredentialKey, createConfiguredSigner } from "./pdf/signer-bootstrap.js";
import { CredentialStatusListService } from "./pdf/status-list.service.js";
// ── tRPC Routers ────────────────────────────────────────────────────
import { AnimalRouter } from "./routers/animal.router.js";
import { ArchiveRouter } from "./routers/archive.router.js";
import { AuditRouter } from "./routers/audit.router.js";
import { CorrectionRouter } from "./routers/correction.router.js";
import { DeviceRouter } from "./routers/device.router.js";
import { DocumentRouter } from "./routers/document.router.js";
import { EarTagRouter } from "./routers/eartag.router.js";
import { FarmRouter } from "./routers/farm.router.js";
import { FarmBookRouter } from "./routers/farm-book.router.js";
import { GeoRouter } from "./routers/geo.router.js";
import { HealthRouter } from "./routers/health.router.js";
import { InspectionRouter } from "./routers/inspection.router.js";
import { IotRouter } from "./routers/iot.router.js";
import { ModulesRouter } from "./routers/modules.router.js";
import { MovementRouter } from "./routers/movement.router.js";
import { NotificationRouter } from "./routers/notification.router.js";
import { OrganizationRouter } from "./routers/organization.router.js";
import { PassportRouter } from "./routers/passport.router.js";
import { RbacRouter } from "./routers/rbac.router.js";
import { SubjectRouter } from "./routers/subject.router.js";
import { SyncRouter } from "./routers/sync.router.js";
import { SystemParametersRouter } from "./routers/system-parameters.router.js";
import { UserRouter } from "./routers/user.router.js";
import { VsAssignmentRouter } from "./routers/vs-assignment.router.js";
import { VsContractRouter } from "./routers/vs-contract.router.js";
import { TrpcModule } from "./trpc/trpc.module.js";

@Module({
  imports: [
    LoggerModule,
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: Request) =>
          (req.headers as unknown as Record<string, string | undefined>)?.["x-correlation-id"] || crypto.randomUUID(),
      },
    }),
    ScheduleModule.forRoot(),
    AuthCoreModule,
    AuthorizationModule,
    ExecutionModule,
    TrpcModule,
    DbModule,
    PdfModule,
  ],
  providers: [
    // ── Repositories (thin DB wrappers) ──
    {
      provide: AnimalRepository,
      useFactory: (dbp) => new AnimalRepository(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: FarmRepository,
      useFactory: (dbp) => new FarmRepository(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: MovementRepository,
      useFactory: (dbp) => new MovementRepository(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: SubjectRepository,
      useFactory: (dbp) => new SubjectRepository(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: EarTagRepository,
      useFactory: (dbp) => new EarTagRepository(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: NotificationRepository,
      useFactory: (dbp) => new NotificationRepository(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: SubscriptionResolver,
      useFactory: (ns: NotificationService, repo: NotificationRepository, userRepo: UserRepository) =>
        new SubscriptionResolver(ns, repo, userRepo),
      inject: [NotificationService, NotificationRepository, UserRepository],
    },
    {
      provide: UserRepository,
      useFactory: (dbp) => new UserRepository(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: RbacRepository,
      useFactory: (dbp) => new RbacRepository(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: OrganizationRepository,
      useFactory: (dbp) => new OrganizationRepository(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: HealthRepository,
      useFactory: (dbp) => new HealthRepository(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: InspectionRepository,
      useFactory: (dbp) => new InspectionRepository(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: ArchiveRepository,
      useFactory: (dbp) => new ArchiveRepository(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: PassportRepository,
      useFactory: (dbp) => new PassportRepository(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: CorrectionRepository,
      useFactory: (dbp) => new CorrectionRepository(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: AuditRepository,
      useFactory: (dbp) => new AuditRepository(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: DeviceRepository,
      useFactory: (dbp) => new DeviceRepository(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: IotRepository,
      useFactory: (dbp) => new IotRepository(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: FarmBookRepository,
      useFactory: (dbp) => new FarmBookRepository(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: VsContractRepository,
      useFactory: (dbp) => new VsContractRepository(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: VsAssignmentRepository,
      useFactory: (dbp) => new VsAssignmentRepository(dbp),
      inject: [DatabaseProvider],
    },

    // ── Domain Services (orchestrate repos, no direct DB) ──
    {
      provide: AnimalService,
      useFactory: (repo: AnimalRepository, system: SystemService, auditService: AuditService) =>
        new AnimalService(repo, system, undefined, auditService),
      inject: [AnimalRepository, SystemService, AuditService],
    },
    {
      provide: AuditService,
      useFactory: (repo: AuditRepository, cls: ClsService) => new AuditService(repo, cls),
      inject: [AuditRepository, ClsService],
    },
    {
      provide: SystemRepository,
      useFactory: (dbp) => new SystemRepository(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: SystemService,
      useFactory: (repo: SystemRepository) => new SystemService(repo),
      inject: [SystemRepository],
    },
    {
      provide: FarmBookService,
      useFactory: (repo: FarmBookRepository) => new FarmBookService(repo),
      inject: [FarmBookRepository],
    },
    {
      provide: VsContractService,
      useFactory: (repo: VsContractRepository) => new VsContractService(repo),
      inject: [VsContractRepository],
    },
    {
      provide: VsAssignmentService,
      useFactory: (assignmentRepo: VsAssignmentRepository, contractRepo: VsContractRepository) =>
        new VsAssignmentService(assignmentRepo, contractRepo),
      inject: [VsAssignmentRepository, VsContractRepository],
    },
    {
      provide: FarmService,
      useFactory: (repo: FarmRepository, auditService: AuditService) => new FarmService(repo, auditService),
      inject: [FarmRepository, AuditService],
    },
    {
      provide: MovementService,
      useFactory: (
        movRepo: MovementRepository,
        animalRepo: AnimalRepository,
        system: SystemService,
        geoRepo: GeoRepository,
        geoService: GeoService,
        passportService?: PassportService,
        outboxPublisher?: import("@rocky/execution").OutboxEventPublisher,
        auditService?: AuditService,
      ) =>
        new MovementService(
          movRepo,
          animalRepo,
          system,
          geoRepo,
          geoService,
          passportService,
          outboxPublisher,
          auditService,
        ),
      inject: [
        MovementRepository,
        AnimalRepository,
        SystemService,
        GeoRepository,
        GeoService,
        { token: PassportService, optional: true },
        {
          token: OutboxEventPublisher,
          optional: true,
        },
        AuditService,
      ],
    },
    {
      provide: SubjectService,
      useFactory: (repo: SubjectRepository, auditService: AuditService, farmBookService: FarmBookService) =>
        new SubjectService(repo, auditService, farmBookService),
      inject: [SubjectRepository, AuditService, { token: FarmBookService, optional: true }],
    },
    {
      provide: NotificationService,
      useFactory: (repo: NotificationRepository) => new NotificationService(repo),
      inject: [NotificationRepository],
    },
    {
      provide: EarTagService,
      useFactory: (repo: EarTagRepository, system: SystemService, auditService: AuditService) =>
        new EarTagService(repo, system, auditService),
      inject: [EarTagRepository, SystemService, AuditService],
    },
    {
      provide: UserService,
      useFactory: (repo: UserRepository) => new UserService(repo),
      inject: [UserRepository],
    },
    {
      provide: RbacService,
      useFactory: (repo: RbacRepository) => new RbacService(repo),
      inject: [RbacRepository],
    },
    {
      provide: OrganizationService,
      useFactory: (repo: OrganizationRepository) => new OrganizationService(repo),
      inject: [OrganizationRepository],
    },
    {
      provide: HealthService,
      useFactory: (
        repo: HealthRepository,
        subjectRepo: SubjectRepository,
        animalRepo: AnimalRepository,
        system: SystemService,
        outboxPublisher: OutboxEventPublisher,
        correctionService: CorrectionService,
        auditService: AuditService,
      ) => new HealthService(repo, subjectRepo, animalRepo, system, outboxPublisher, correctionService, auditService),
      inject: [
        HealthRepository,
        SubjectRepository,
        AnimalRepository,
        SystemService,
        OutboxEventPublisher,
        CorrectionService,
        AuditService,
      ],
    },
    {
      provide: InspectionService,
      useFactory: (
        repo: InspectionRepository,
        animalRepo: AnimalRepository,
        archiveService: ArchiveService,
        riskAnalysisService: RiskAnalysisService,
      ) => new InspectionService(repo, animalRepo, archiveService, riskAnalysisService),
      inject: [InspectionRepository, AnimalRepository, ArchiveService, RiskAnalysisService],
    },
    {
      provide: ArchiveService,
      useFactory: (repo: ArchiveRepository, system: SystemService) => new ArchiveService(repo, system),
      inject: [ArchiveRepository, SystemService],
    },
    {
      provide: RiskAnalysisRepository,
      useFactory: (dbp: DatabaseProvider) => new RiskAnalysisRepository(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: RiskAnalysisService,
      useFactory: (riskRepo: RiskAnalysisRepository, farmRepo: FarmRepository, system: SystemService) =>
        new RiskAnalysisService(riskRepo, farmRepo, system),
      inject: [RiskAnalysisRepository, FarmRepository, SystemService],
    },
    {
      provide: PassportService,
      useFactory: (repo: PassportRepository, animalRepo: AnimalRepository, auditService: AuditService) =>
        new PassportService(repo, animalRepo, auditService),
      inject: [PassportRepository, AnimalRepository, AuditService],
    },
    {
      provide: CorrectionService,
      useFactory: (repo: CorrectionRepository, archiveService: ArchiveService, passportService: PassportService) =>
        new CorrectionService(repo, archiveService, passportService),
      inject: [CorrectionRepository, ArchiveService, PassportService],
    },
    {
      provide: DeviceService,
      useFactory: (repo: DeviceRepository) => new DeviceService(repo),
      inject: [DeviceRepository],
    },
    {
      provide: IotService,
      useFactory: (repo: IotRepository) => new IotService(repo),
      inject: [IotRepository],
    },
    // ── Geo foundation (packages/geo): ADR-0053 / ADR-0054 R1 / ADR-0063 ──
    {
      provide: GeoRepository,
      useFactory: (dbp) => new GeoRepository(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: GeoService,
      useFactory: (repo: GeoRepository) => new GeoService(repo),
      inject: [GeoRepository],
    },
    {
      provide: PolygonService,
      useFactory: () => new PolygonService(),
    },
    {
      provide: MapTilerMapService,
      useFactory: () =>
        new MapTilerMapService({
          apiKey: process.env.MAPTILER_API_KEY ?? "",
          defaultLanguage: process.env.MAPTILER_DEFAULT_LANGUAGE,
        }),
    },
    {
      provide: DeforestationMonitor,
      useFactory: (repo: GeoRepository) => new DeforestationMonitor(repo, new NoDataRasterSource()),
      inject: [GeoRepository],
    },

    // ── Document Templates ──
    {
      provide: InspectionFormTemplate,
      useFactory: (inspectionService: InspectionService) => new InspectionFormTemplate(inspectionService),
      inject: [InspectionService],
    },
    {
      provide: PassportTemplate,
      useFactory: (
        passportRepo: PassportRepository,
        animalRepo: AnimalRepository,
        farmRepo: FarmRepository,
        movementRepo: MovementRepository,
        healthRepo: HealthRepository,
      ) => new PassportTemplate(passportRepo, animalRepo, farmRepo, movementRepo, healthRepo),
      inject: [PassportRepository, AnimalRepository, FarmRepository, MovementRepository, HealthRepository],
    },
    {
      provide: MovementTemplate,
      useFactory: (movementRepo: MovementRepository, animalRepo: AnimalRepository, farmRepo: FarmRepository) =>
        new MovementTemplate(movementRepo, animalRepo, farmRepo),
      inject: [MovementRepository, AnimalRepository, FarmRepository],
    },
    {
      provide: ChedTemplate,
      useFactory: (
        movementRepo: MovementRepository,
        animalRepo: AnimalRepository,
        farmRepo: FarmRepository,
        healthRepo: HealthRepository,
        passportRepo: PassportRepository,
        system: SystemService,
      ) => new ChedTemplate(movementRepo, animalRepo, farmRepo, healthRepo, passportRepo, system),
      inject: [
        MovementRepository,
        AnimalRepository,
        FarmRepository,
        HealthRepository,
        PassportRepository,
        SystemService,
      ],
    },
    {
      provide: EudrTemplate,
      useFactory: (
        movementRepo: MovementRepository,
        geoRepo: GeoRepository,
        animalRepo: AnimalRepository,
        farmRepo: FarmRepository,
        system: SystemService,
        passportRepo: PassportRepository,
        credentialService: CredentialService,
      ) => new EudrTemplate(movementRepo, geoRepo, animalRepo, farmRepo, system, passportRepo, credentialService),
      inject: [
        MovementRepository,
        GeoRepository,
        AnimalRepository,
        FarmRepository,
        SystemService,
        PassportRepository,
        CredentialService,
      ],
    },
    {
      provide: EarTagTemplate,
      useFactory: (earTagRepo: EarTagRepository, animalRepo: AnimalRepository, farmRepo: FarmRepository) =>
        new EarTagTemplate(earTagRepo, animalRepo, farmRepo),
      inject: [EarTagRepository, AnimalRepository, FarmRepository],
    },

    {
      provide: SyncRepository,
      useFactory: (dbp) => new SyncRepository(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: SyncService,
      useFactory: (
        syncRepo: SyncRepository,
        healthService: HealthService,
        animalService: AnimalService,
        farmService: FarmService,
        inspectionService: InspectionService,
        earTagService: EarTagService,
        movementService: MovementService,
        correctionService: CorrectionService,
      ) =>
        new SyncService(
          syncRepo,
          healthService,
          animalService,
          farmService,
          inspectionService,
          earTagService,
          movementService,
          correctionService,
        ),
      inject: [
        SyncRepository,
        HealthService,
        AnimalService,
        FarmService,
        InspectionService,
        EarTagService,
        MovementService,
        CorrectionService,
      ],
    },

    // ── tRPC Routers ──
    AnimalRouter,
    AuditRouter,
    ModulesRouter,
    SystemParametersRouter,
    DocumentRouter,
    CredentialStatusListService,
    FarmBookRouter,
    FarmRouter,
    VsAssignmentRouter,
    VsContractRouter,
    MovementRouter,
    SubjectRouter,
    NotificationRouter,
    EarTagRouter,
    UserRouter,
    RbacRouter,
    OrganizationRouter,
    HealthRouter,
    InspectionRouter,
    ArchiveRouter,
    PassportRouter,
    CorrectionRouter,
    DeviceRouter,
    IotRouter,
    GeoRouter,
    SyncRouter,

    // ── Scheduled Jobs ──
    RetentionJob,
    AuditRetentionJob,
    RiskAnalysisJob,
    CorrectionConsistencyJob,
    BirthDeadlineJob,
    VaccineReconciliationJob,
    OutboxEventHandlers,
    OutboxProcessorJob,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    @Inject(InspectionFormTemplate)
    private readonly inspectionFormTemplate: InspectionFormTemplate,
    @Inject(PassportTemplate)
    private readonly passportTemplate: PassportTemplate,
    @Inject(MovementTemplate)
    private readonly movementTemplate: MovementTemplate,
    @Inject(ChedTemplate)
    private readonly chedTemplate: ChedTemplate,
    @Inject(EudrTemplate)
    private readonly eudrTemplate: EudrTemplate,
    @Inject(EarTagTemplate)
    private readonly earTagTemplate: EarTagTemplate,
    @Inject(DocumentService)
    private readonly documentService: DocumentService,
    @Inject(CredentialService)
    private readonly credentialService: CredentialService,
  ) {}

  onModuleInit() {
    const registry = DocumentRegistry.getInstance();
    registry.register(this.inspectionFormTemplate);
    registry.register(this.passportTemplate);
    registry.register(this.movementTemplate);
    registry.register(this.chedTemplate);
    registry.register(this.eudrTemplate);
    registry.register(this.earTagTemplate);
    // Wire the cryptographic seal (ADR-0082 §2): HSM / P12+TSA from env, or
    // NoOpSigner (unsigned) when none is configured. The ExecutionPipeline
    // already scopes the generation queries by RLS, so cross-farm documents
    // cannot be produced.
    this.documentService.useSigner(createConfiguredSigner());

    // Wire the offline-verifiable signed-QR credential key (ADR-0084): Ed25519
    // keypair from env / dev key file. Null when unconfigured — credentials
    // are then disabled but the PAdES path above is unaffected.
    const credKey = createConfiguredCredentialKey();
    if (credKey) this.credentialService.useKeyConfig(credKey);
  }
}
