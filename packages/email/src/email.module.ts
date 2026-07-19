import { Module } from "@nestjs/common";
import { EmailService } from "./services/email.service.js";

/**
 * NestJS module exposing EmailService for DI in apps/api.
 * Import with `imports: [EmailModule]` and inject `EmailService`.
 */
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
