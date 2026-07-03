import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { TrpcModule } from "./trpc/trpc.module.js";
import { AuthCoreModule } from "./auth/auth-core.module.js";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { auth } from "./auth/auth.js";
import { DbModule, DB_TOKEN } from "./modules/db.module.js";
import type { DB } from "@rocky/database";

// ── Repositories ─────────────────────────────────────────────────────
import { AnimalRepository } from "@rocky/domains-animal";
import { FarmRepository } from "@rocky/domains-farm";
import { MovementRepository } from "@rocky/domains-movement";
import { SubjectRepository } from "@rocky/domains-subject";
import { EarTagRepository } from "@rocky/domains-eartag";
import { NotificationRepository } from "@rocky/domains-notification";
import { UserRepository } from "@rocky/domains-user";
import { RbacRepository } from "@rocky/domains-rbac";
import { OrganizationRepository } from "@rocky/domains-organization";

// ── Domain Services ─────────────────────────────────────────────────
import { AnimalService } from "@rocky/domains-animal";
import { FarmService } from "@rocky/domains-farm";
import { MovementService } from "@rocky/domains-movement";
import { SubjectService } from "@rocky/domains-subject";
import { NotificationService } from "@rocky/domains-notification";
import { TodoService } from "@rocky/domains-todo";
import { EarTagService } from "@rocky/domains-eartag";
import { UserService } from "@rocky/domains-user";
import { RbacService } from "@rocky/domains-rbac";
import { OrganizationService } from "@rocky/domains-organization";

// ── tRPC Routers ────────────────────────────────────────────────────
import { AnimalRouter } from "./routers/animal.router.js";
import { FarmRouter } from "./routers/farm.router.js";
import { MovementRouter } from "./routers/movement.router.js";
import { SubjectRouter } from "./routers/subject.router.js";
import { NotificationRouter } from "./routers/notification.router.js";
import { EarTagRouter } from "./routers/eartag.router.js";
import { UserRouter } from "./routers/user.router.js";
import { RbacRouter } from "./routers/rbac.router.js";
import { OrganizationRouter } from "./routers/organization.router.js";

@Module({
  imports: [ScheduleModule.forRoot(), AuthCoreModule, AuthModule.forRoot({ auth }), TrpcModule, DbModule],
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
    // Todo still uses direct DB (legacy — pending migration)
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
  ],
})
export class AppModule {}
