import { Global, Module } from "@nestjs/common";
import { ClsService } from "nestjs-cls";
import { ExecutionEventEmitter } from "./events/event-emitter.js";
import { ExecutionPipeline } from "./execution-pipeline.js";
import { OutboxEventPublisher } from "./outbox/outbox-publisher.js";
import { RLSStage } from "./rls/rls.stage.js";
import { RuntimeBuilder } from "./runtime.builder.js";

/**
 * ExecutionModule provides the execution pipeline infrastructure.
 *
 * NOTE: Does NOT import ClsModule — the host app (apps/api) configures it
 * globally via ClsModule.forRoot(). This module only declares providers
 * that use the already-configured ClsService.
 *
 * ExecutionPipeline, RLSStage, and OutboxEventPublisher require ClsService
 * from the global ClsModule. They are constructed via useFactory because
 * esbuild (tsx) does not emit design:paramtypes metadata needed for
 * implicit constructor injection.
 */
@Global()
@Module({
  providers: [
    RuntimeBuilder,
    ExecutionEventEmitter,
    {
      provide: RLSStage,
      useFactory: (cls: ClsService) => new RLSStage(cls),
      inject: [ClsService],
    },
    {
      provide: ExecutionPipeline,
      useFactory: (
        cls: ClsService,
        runtimeBuilder: RuntimeBuilder,
        rlsStage: RLSStage,
        eventEmitter: ExecutionEventEmitter,
      ) => new ExecutionPipeline(cls, runtimeBuilder, rlsStage, eventEmitter),
      inject: [ClsService, RuntimeBuilder, RLSStage, ExecutionEventEmitter],
    },
    {
      provide: OutboxEventPublisher,
      useFactory: (cls: ClsService) => new OutboxEventPublisher(cls),
      inject: [ClsService],
    },
  ],
  exports: [RuntimeBuilder, RLSStage, ExecutionPipeline, ExecutionEventEmitter, OutboxEventPublisher],
})
export class ExecutionModule {}
