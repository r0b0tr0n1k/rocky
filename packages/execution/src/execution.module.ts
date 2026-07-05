import { Global, Module } from "@nestjs/common";
import { ExecutionEventEmitter } from "./events/event-emitter.js";
import { ExecutionPipeline } from "./execution-pipeline.js";
import { RLSStage } from "./rls/rls.stage.js";
import { RuntimeBuilder } from "./runtime.builder.js";

/**
 * ExecutionModule provides the execution pipeline infrastructure.
 *
 * NOTE: Does NOT import ClsModule — the host app (apps/api) configures it
 * globally via ClsModule.forRoot(). This module only declares providers
 * that use the already-configured ClsService.
 */
@Global()
@Module({
  providers: [RuntimeBuilder, RLSStage, ExecutionEventEmitter, ExecutionPipeline],
  exports: [RuntimeBuilder, RLSStage, ExecutionPipeline, ExecutionEventEmitter],
})
export class ExecutionModule { }
