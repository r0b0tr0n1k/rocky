/**
 * NestJS Module for Document Generation
 *
 * Provides DocumentService for injection into tRPC routers.
 * Templates are registered by the consuming module (AppModule) via OnModuleInit.
 */

import { Module } from "@nestjs/common";
import { DocumentService } from "./services/document.service.js";

@Module({
  providers: [DocumentService],
  exports: [DocumentService],
})
export class PdfModule {}
