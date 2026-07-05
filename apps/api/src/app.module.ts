import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import type { DB } from "@rocky/database";
import { LoggerModule } from "@rocky/logger";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { ClsModule } from "nestjs-cls";
import crypto from "node:crypto";
import { AuthCoreModule } from "./auth/auth-core.module.js";
import { auth } from "./auth/auth.js";
import { DB_TOKEN, DbModule } from "./modules/db.module.js";
import { TrpcModule } from "./trpc/trpc.module.js";

// ── Repositories ─────────────────────────────────────────────────────
import { AnimalRepository } from "@rocky/domains-animal";
import { ArchiveRepository } from "@rocky/domains-archive";
import { CorrectionRepository } from "@rocky/domains-correction";
import { EarTagRepository } from "@rocky/domains-eartag";
import { FarmRepository } from "@rocky/domains-farm";
import { HealthRepository } from "@rocky/domains-health";
import { InspectionRepository } from "@rocky/domains-inspection";
import { MovementRepository } from "@rocky/domains-movement";
import { NotificationRepository } from "@rocky/domains-notification";
import { OrganizationRepository } from "@rocky/domains-organization";
import { PassportRepository } from "@rocky/domains-passport";
import { RbacRepository } from "@rocky/domains-rbac";
import { SubjectRepository } from "@rocky/domains-subject";
import { UserRepository } from "@rocky/domains-user";

// ── Domain Services ─────────────────────────────────────────────────
import { AnimalService } from "@rocky/domains-animal";
import { ArchiveService } from "@rocky/domains-archive";
import { CorrectionService } from "@rocky/domains-correction";
import { EarTagService } from "@rocky/domains-eartag";
import { FarmService } from "@rocky/domains-farm";
import { HealthService } from "@rocky/domains-health";
import { InspectionService, RiskAnalysisService } from "@rocky/domains-inspection";
import { MovementService } from "@rocky/domains-movement";
import { NotificationService } from "@rocky/domains-notification";
import { OrganizationService } from "@rocky/domains-organization";
import { PassportService } from "@rocky/domains-passport";
import { RbacService } from "@rocky/domains-rbac";
import { SubjectService } from "@rocky/domains-subject";
import { TodoService } from "@rocky/domains-todo";
import { UserService } from "@rocky/domains-user";

// ── tRPC Routers ────────────────────────────────────────────────────
import { AnimalRouter } from "./routers/animal.router.js";
import { ArchiveRouter } from "./routers/archive.router.js";
import { CorrectionRouter } from "./routers/correction.router.js";
import { EarTagRouter } from "./routers/eartag.router.js";
import { FarmRouter } from "./routers/farm.router.js";
import { HealthRouter } from "./routers/health.router.js";
import { InspectionRouter } from "./routers/inspection.router.js";
import { MovementRouter } from "./routers/movement.router.js";
import { NotificationRouter } from "./routers/notification.router.js";
import { OrganizationRouter } from "./routers/organization.router.js";
import { PassportRouter } from "./routers/passport.router.js";
import { RbacRouter } from "./routers/rbac.router.js";
import { SubjectRouter } from "./routers/subject.router.js";
import { UserRouter } from "./routers/user.router.js";

// ── Scheduled Jobs ─────────────────────────────────────────────────
import { CorrectionConsistencyJob } from "./jobs/correction-consistency.job.js";
import { RetentionJob } from "./jobs/retention.job.js";
import { RiskAnalysisJob } from "./jobs/risk-analysis.job.js";

@Module({
  imports: [
    LoggerModule,
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: any) =>
          req.headers?.["x-correlation-id"] || crypto.randomUUID(),
      },
    }),
    ScheduleModule.forRoot(),
    AuthCoreModule,
    AuthModule.forRoot({ auth }),
    TrpcModule,
    DbModule,
  ],
  providers: [
    // ── Repositories (thin DB wrappers) ──
    {
      provide: AnimalRepository,
      useFactory: (d: DB) => new AnimalRepository(d),
      inject: [DB_TOKEN],
    },
    {
      provide: FarmRepository,
      useFactory: (d: DB) => new FarmRepository(d),
      inject: [DB_TOKEN],
    },
    {
      provide: MovementRepository,
      useFactory: (d: DB) => new MovementRepository(d),
      inject: [DB_TOKEN],
    },
    {
      provide: SubjectRepository,
      useFactory: (d: DB) => new SubjectRepository(d),
      inject: [DB_TOKEN],
    },
    {
      provide: EarTagRepository,
      useFactory: (d: DB) => new EarTagRepository(d),
      inject: [DB_TOKEN],
    },
    {
      provide: NotificationRepository,
      useFactory: (d: DB) => new NotificationRepository(d),
      inject: [DB_TOKEN],
    },
    {
      provide: UserRepository,
      useFactory: (d: DB) => new UserRepository(d),
      inject: [DB_TOKEN],
    },
    {
      provide: RbacRepository,
      useFactory: (d: DB) => new RbacRepository(d),
      inject: [DB_TOKEN],
    },
    {
      provide: OrganizationRepository,
      useFactory: (d: DB) => new OrganizationRepository(d),
      inject: [DB_TOKEN],
    },
    {
      provide: HealthRepository,
      useFactory: (d: DB) => new HealthRepository(d),
      inject: [DB_TOKEN],
    },
    {
      provide: InspectionRepository,
      useFactory: (d: DB) => new InspectionRepository(d),
      inject: [DB_TOKEN],
    },
    {
      provide: ArchiveRepository,
      useFactory: (d: DB) => new ArchiveRepository(d),
      inject: [DB_TOKEN],
    },
    {
      provide: PassportRepository,
      useFactory: (d: DB) => new PassportRepository(d),
      inject: [DB_TOKEN],
    },
    {
      provide: CorrectionRepository,
      useFactory: (d: DB) => new CorrectionRepository(d),
      inject: [DB_TOKEN],
    },

    // ── Domain Services (orchestrate repos, no direct DB) ──
    {
      provide: AnimalService,
      useFactory: (repo: AnimalRepository) => new AnimalService(repo),
      inject: [AnimalRepository],
    },
    {
      provide: FarmService,
      useFactory: (repo: FarmRepository) => new FarmService(repo),
      inject: [FarmRepository],
    },
    {
      provide: MovementService,
      useFactory: (movRepo: MovementRepository, animalRepo: AnimalRepository) =>
        new MovementService(movRepo, animalRepo),
      inject: [MovementRepository, AnimalRepository],
    },
    {
      provide: SubjectService,
      useFactory: (repo: SubjectRepository) => new SubjectService(repo),
      inject: [SubjectRepository],
    },
    // Todo still uses direct DB (legacy - pending migration)
    {
      provide: TodoService,
      useFactory: (d: DB) => new TodoService(d),
      inject: [DB_TOKEN],
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
      useFactory: (repo: HealthRepository, subjectRepo: SubjectRepository, inspectionRepo: InspectionRepository) =>
        new HealthService(repo, subjectRepo, inspectionRepo),
      inject: [HealthRepository, SubjectRepository, InspectionRepository],
    },
    {
      provide: InspectionService,
      useFactory: (repo: InspectionRepository, animalRepo: AnimalRepository, archiveService: ArchiveService, riskAnalysisService: RiskAnalysisService) =>
        new InspectionService(repo, animalRepo, archiveService, riskAnalysisService),
      inject: [InspectionRepository, AnimalRepository, ArchiveService, RiskAnalysisService],
    },
    {
      provide: ArchiveService,
      useFactory: (repo: ArchiveRepository) => new ArchiveService(repo),
      inject: [ArchiveRepository],
    },
    {
      provide: RiskAnalysisService,
      useFactory: (d: DB) => new RiskAnalysisService(d),
      inject: [DB_TOKEN],
    },
    {
      provide: PassportService,
      useFactory: (repo: PassportRepository, animalRepo: AnimalRepository) =>
        new PassportService(repo, animalRepo),
      inject: [PassportRepository, AnimalRepository],
    },
    {
      provide: CorrectionService,
      useFactory: (repo: CorrectionRepository) => new CorrectionService(repo),
      inject: [CorrectionRepository],
    },

    // ── tRPC Routers ──
    AnimalRouter,
    FarmRouter,
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

    // ── Scheduled Jobs ──
    RetentionJob,
    RiskAnalysisJob,
    CorrectionConsistencyJob,
  ],
})
export class AppModule { }
