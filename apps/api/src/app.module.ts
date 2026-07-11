// biome-ignore assist/source/organizeImports: Biome sorting sucks
import { Inject, Module } from "@nestjs/common";
import type { OnModuleInit } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AuthorizationModule } from "@rocky/authorization/index.js";
import { DatabaseProvider } from "@rocky/database/index.js";
import crypto from "node:crypto";
// ── Repositories ─────────────────────────────────────────────────────
// ── Domain Services ─────────────────────────────────────────────────
import { AnimalRepository, AnimalService } from "@rocky/domains-animal";
import { AuditRepository, AuditService } from "@rocky/domains-audit";
import { ArchiveRepository, ArchiveService } from "@rocky/domains-archive";
import {
  CorrectionRepository,
  CorrectionService,
} from "@rocky/domains-correction";
import { OutboxEventPublisher } from "@rocky/execution";
import { DeviceRepository, DeviceService } from "@rocky/domains-device";
import { IotRepository, IotService } from "@rocky/domains-iot";
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
import { SyncRepository, SyncService } from "@rocky/domains-sync";
import {
  InspectionRepository,
  InspectionService,
  RiskAnalysisService,
} from "@rocky/domains-inspection";
import { MovementRepository, MovementService } from "@rocky/domains-movement";
import {
  NotificationRepository,
  NotificationService,
} from "@rocky/domains-notification/index.js";
import {
  OrganizationRepository,
  OrganizationService,
} from "@rocky/domains-organization/index.js";
import { PassportRepository, PassportService } from "@rocky/domains-passport";
import { RbacRepository, RbacService } from "@rocky/domains-rbac/index.js";
import { SubjectRepository, SubjectService } from "@rocky/domains-subject";
import { SystemRepository, SystemService } from "@rocky/domains-system";
import { UserRepository, UserService } from "@rocky/domains-user/index.js";
import { ExecutionModule } from "@rocky/execution/index.js";
import { LoggerModule } from "@rocky/logger/index.js";
import {
  PdfModule,
  DocumentRegistry,
  InspectionFormTemplate,
  PassportTemplate,
  MovementTemplate,
  ChedTemplate,
} from "@rocky/pdf/index.js";
import { ClsModule } from "nestjs-cls";
import { AuthCoreModule } from "./auth/auth-core.module.js";
// ── Scheduled Jobs ─────────────────────────────────────────────────
import { CorrectionConsistencyJob } from "./jobs/correction-consistency.job.js";
import { OutboxEventHandlers } from "./jobs/outbox-handlers.js";
import { OutboxProcessorJob } from "./jobs/outbox-processor.job.js";
import { RetentionJob } from "./jobs/retention.job.js";
import { RiskAnalysisJob } from "./jobs/risk-analysis.job.js";
import { BirthDeadlineJob } from "./jobs/birth-deadline.job.js";
import { VaccineReconciliationJob } from "./jobs/vaccine-reconciliation.job.js";
import { DbModule } from "./modules/db.module.js";
// ── tRPC Routers ────────────────────────────────────────────────────
import { AnimalRouter } from "./routers/animal.router.js";
import { AuditRouter } from "./routers/audit.router.js";
import { ModulesRouter } from "./routers/modules.router.js";
import { SystemParametersRouter } from "./routers/system-parameters.router.js";
import { ArchiveRouter } from "./routers/archive.router.js";
import { CorrectionRouter } from "./routers/correction.router.js";
import { DeviceRouter } from "./routers/device.router.js";
import { IotRouter } from "./routers/iot.router.js";
import { DocumentRouter } from "./routers/document.router.js";
import { EarTagRouter } from "./routers/eartag.router.js";
import { FarmBookRouter } from "./routers/farm-book.router.js";
import { FarmRouter } from "./routers/farm.router.js";
import { VsAssignmentRouter } from "./routers/vs-assignment.router.js";
import { VsContractRouter } from "./routers/vs-contract.router.js";
import { HealthRouter } from "./routers/health.router.js";
import { InspectionRouter } from "./routers/inspection.router.js";
import { MovementRouter } from "./routers/movement.router.js";
import { NotificationRouter } from "./routers/notification.router.js";
import { OrganizationRouter } from "./routers/organization.router.js";
import { PassportRouter } from "./routers/passport.router.js";
import { RbacRouter } from "./routers/rbac.router.js";
import { SubjectRouter } from "./routers/subject.router.js";
import { SyncRouter } from "./routers/sync.router.js";
import { UserRouter } from "./routers/user.router.js";
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
      useFactory: (repo: AnimalRepository, system: SystemService) => new AnimalService(repo, system),
      inject: [AnimalRepository, SystemService],
    },
    {
      provide: AuditService,
      useFactory: (repo: AuditRepository) => new AuditService(repo),
      inject: [AuditRepository],
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
      useFactory: (
        assignmentRepo: VsAssignmentRepository,
        contractRepo: VsContractRepository,
      ) => new VsAssignmentService(assignmentRepo, contractRepo),
      inject: [VsAssignmentRepository, VsContractRepository],
    },
    {
      provide: FarmService,
      useFactory: (repo: FarmRepository, auditService: AuditService) =>
        new FarmService(repo, auditService),
      inject: [FarmRepository, AuditService],
    },
    {
      provide: MovementService,
      useFactory: (
        movRepo: MovementRepository,
        animalRepo: AnimalRepository,
        system: SystemService,
        passportService?: PassportService,
        outboxPublisher?: import("@rocky/execution").OutboxEventPublisher,
      ) =>
        new MovementService(
          movRepo,
          animalRepo,
          system,
          passportService,
          outboxPublisher,
        ),
      inject: [
        MovementRepository,
        AnimalRepository,
        SystemService,
        { token: PassportService, optional: true },
        {
          token: OutboxEventPublisher,
          optional: true,
        },
      ],
    },
    {
      provide: SubjectService,
      useFactory: (
        repo: SubjectRepository,
        auditService: AuditService,
        farmBookService: FarmBookService,
      ) => new SubjectService(repo, auditService, farmBookService),
      inject: [
        SubjectRepository,
        AuditService,
        { token: FarmBookService, optional: true },
      ],
    },
    {
      provide: NotificationService,
      useFactory: (repo: NotificationRepository) =>
        new NotificationService(repo),
      inject: [NotificationRepository],
    },
    {
      provide: EarTagService,
      useFactory: (repo: EarTagRepository, system: SystemService) => new EarTagService(repo, system),
      inject: [EarTagRepository, SystemService],
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
      useFactory: (repo: OrganizationRepository) =>
        new OrganizationService(repo),
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
      ) =>
        new HealthService(
          repo,
          subjectRepo,
          animalRepo,
          system,
          outboxPublisher,
          correctionService,
        ),
      inject: [
        HealthRepository,
        SubjectRepository,
        AnimalRepository,
        SystemService,
        OutboxEventPublisher,
        CorrectionService,
      ],
    },
    {
      provide: InspectionService,
      useFactory: (
        repo: InspectionRepository,
        animalRepo: AnimalRepository,
        archiveService: ArchiveService,
        riskAnalysisService: RiskAnalysisService,
      ) =>
        new InspectionService(
          repo,
          animalRepo,
          archiveService,
          riskAnalysisService,
        ),
      inject: [
        InspectionRepository,
        AnimalRepository,
        ArchiveService,
        RiskAnalysisService,
      ],
    },
    {
      provide: ArchiveService,
      useFactory: (repo: ArchiveRepository, system: SystemService) => new ArchiveService(repo, system),
      inject: [ArchiveRepository, SystemService],
    },
    {
      provide: RiskAnalysisService,
      useFactory: (dbp: DatabaseProvider, system: SystemService) => new RiskAnalysisService(dbp, system),
      inject: [DatabaseProvider, SystemService],
    },
    {
      provide: PassportService,
      useFactory: (repo: PassportRepository, animalRepo: AnimalRepository) =>
        new PassportService(repo, animalRepo),
      inject: [PassportRepository, AnimalRepository],
    },
    {
      provide: CorrectionService,
      useFactory: (
        repo: CorrectionRepository,
        archiveService: ArchiveService,
        passportService: PassportService,
      ) => new CorrectionService(repo, archiveService, passportService),
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

    // ── Document Templates ──
    {
      provide: InspectionFormTemplate,
      useFactory: (inspectionService: InspectionService) =>
        new InspectionFormTemplate(inspectionService),
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
      ) =>
        new PassportTemplate(
          passportRepo,
          animalRepo,
          farmRepo,
          movementRepo,
          healthRepo,
        ),
      inject: [
        PassportRepository,
        AnimalRepository,
        FarmRepository,
        MovementRepository,
        HealthRepository,
      ],
    },
    {
      provide: MovementTemplate,
      useFactory: (
        movementRepo: MovementRepository,
        animalRepo: AnimalRepository,
        farmRepo: FarmRepository,
      ) => new MovementTemplate(movementRepo, animalRepo, farmRepo),
      inject: [MovementRepository, AnimalRepository, FarmRepository],
    },
    {
      provide: ChedTemplate,
      useFactory: (movementRepo: MovementRepository, animalRepo: AnimalRepository) =>
        new ChedTemplate(movementRepo, animalRepo),
      inject: [MovementRepository, AnimalRepository],
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
      ) => new SyncService(syncRepo, healthService, animalService, farmService, inspectionService, earTagService, movementService, correctionService),
      inject: [SyncRepository, HealthService, AnimalService, FarmService, InspectionService, EarTagService, MovementService, CorrectionService],
    },

    // ── tRPC Routers ──
    AnimalRouter,
    AuditRouter,
    ModulesRouter,
    SystemParametersRouter,
    DocumentRouter,
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
    SyncRouter,

    // ── Scheduled Jobs ──
    RetentionJob,
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
  ) {}

  onModuleInit() {
    const registry = DocumentRegistry.getInstance();
    registry.register(this.inspectionFormTemplate);
    registry.register(this.passportTemplate);
    registry.register(this.movementTemplate);
  }
}
