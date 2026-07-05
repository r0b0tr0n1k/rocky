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
import { CorrectionRepository, CorrectionService } from "@rocky/domains-correction";
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
import { InspectionRepository, InspectionService, RiskAnalysisService } from "@rocky/domains-inspection";
import { MovementRepository, MovementService } from "@rocky/domains-movement";
import { NotificationRepository, NotificationService } from "@rocky/domains-notification/index.js";
import { OrganizationRepository, OrganizationService } from "@rocky/domains-organization/index.js";
import { PassportRepository, PassportService } from "@rocky/domains-passport";
import { RbacRepository, RbacService } from "@rocky/domains-rbac/index.js";
import { SubjectRepository, SubjectService } from "@rocky/domains-subject";
import { TodoService } from "@rocky/domains-todo/index.js";
import { UserRepository, UserService } from "@rocky/domains-user/index.js";
import { ExecutionModule } from "@rocky/execution/index.js";
import { LoggerModule } from "@rocky/logger/index.js";
import { PdfModule, DocumentRegistry, InspectionFormTemplate, PassportTemplate, MovementTemplate } from "@rocky/pdf/index.js";
import { ClsModule } from "nestjs-cls";
import { AuthCoreModule } from "./auth/auth-core.module.js";
// ── Scheduled Jobs ─────────────────────────────────────────────────
import { CorrectionConsistencyJob } from "./jobs/correction-consistency.job.js";
import { RetentionJob } from "./jobs/retention.job.js";
import { RiskAnalysisJob } from "./jobs/risk-analysis.job.js";
import { DbModule } from "./modules/db.module.js";
// ── tRPC Routers ────────────────────────────────────────────────────
import { AnimalRouter } from "./routers/animal.router.js";
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
        idGenerator: (req: Request) => req.headers?.["x-correlation-id"] || crypto.randomUUID(),
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
      useFactory: (repo: AnimalRepository) => new AnimalService(repo),
      inject: [AnimalRepository],
    },
    {
      provide: AuditService,
      useFactory: (repo: AuditRepository) => new AuditService(repo),
      inject: [AuditRepository],
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
      useFactory: (movRepo: MovementRepository, animalRepo: AnimalRepository, passportService?: PassportService) =>
        new MovementService(movRepo, animalRepo, passportService),
      inject: [MovementRepository, AnimalRepository, { token: PassportService, optional: true }],
    },
    {
      provide: SubjectService,
      useFactory: (repo: SubjectRepository, auditService: AuditService, farmBookService: FarmBookService) =>
        new SubjectService(repo, auditService, farmBookService),
      inject: [SubjectRepository, AuditService, { token: FarmBookService, optional: true }],
    },
    // Todo still uses direct DB (legacy - pending migration)
    {
      provide: TodoService,
      useFactory: (dbp) => new TodoService(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: NotificationService,
      useFactory: (repo: NotificationRepository) => new NotificationService(repo),
      inject: [NotificationRepository],
    },
    {
      provide: EarTagService,
      useFactory: (repo: EarTagRepository) => new EarTagService(repo),
      inject: [EarTagRepository],
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
        inspectionRepo: InspectionRepository,
      ) => new HealthService(repo, subjectRepo, animalRepo, inspectionRepo),
      inject: [HealthRepository, SubjectRepository, AnimalRepository, InspectionRepository],
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
      useFactory: (repo: ArchiveRepository) => new ArchiveService(repo),
      inject: [ArchiveRepository],
    },
    {
      provide: RiskAnalysisService,
      useFactory: (dbp) => new RiskAnalysisService(dbp),
      inject: [DatabaseProvider],
    },
    {
      provide: PassportService,
      useFactory: (repo: PassportRepository, animalRepo: AnimalRepository) => new PassportService(repo, animalRepo),
      inject: [PassportRepository, AnimalRepository],
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
      useFactory: (
        movementRepo: MovementRepository,
        animalRepo: AnimalRepository,
        farmRepo: FarmRepository,
      ) => new MovementTemplate(movementRepo, animalRepo, farmRepo),
      inject: [MovementRepository, AnimalRepository, FarmRepository],
    },

    // ── tRPC Routers ──
    AnimalRouter,
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

    // ── Scheduled Jobs ──
    RetentionJob,
    RiskAnalysisJob,
    CorrectionConsistencyJob,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    @Inject(InspectionFormTemplate) private readonly inspectionFormTemplate: InspectionFormTemplate,
    @Inject(PassportTemplate) private readonly passportTemplate: PassportTemplate,
    @Inject(MovementTemplate) private readonly movementTemplate: MovementTemplate,
  ) {}

  onModuleInit() {
    const registry = DocumentRegistry.getInstance();
    registry.register(this.inspectionFormTemplate);
    registry.register(this.passportTemplate);
    registry.register(this.movementTemplate);
  }
}
