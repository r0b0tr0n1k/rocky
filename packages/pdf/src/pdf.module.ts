/**
 * NestJS Module for Document Generation
 *
 * Provides DocumentService for injection into tRPC routers.
 * Templates are registered by the consuming module (AppModule) via OnModuleInit.
 */

import { Module } from "@nestjs/common";
import { DocumentService } from "./services/document.service.js";
import { CredentialService } from "./services/credential.service.js";

@Module({
  providers: [CredentialService, DocumentService],
  exports: [CredentialService, DocumentService],
})
export class PdfModule {}
