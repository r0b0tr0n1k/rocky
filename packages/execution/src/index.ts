// ── @rocky/execution ──
/** biome-ignore-all assist/source/organizeImports: OK Biome > */
// Execution package — ExecutionContext, pipeline, RLS, runtime, events.

// Re-export TX_KEY from @rocky/database for convenience
export { TX_KEY } from "@rocky/database";
export {
  ExecutionEventEmitter,
  type ExecutionEventHandler,
} from "./events/event-emitter.js";
export type {
  ExecutionCompleted,
  ExecutionEvent,
  ExecutionFailed,
  ExecutionStarted,
} from "./events/execution-events.js";
export type {
  ExecutionContext,
  RequestContext,
  RuntimeContext,
  TransportProtocol,
} from "./execution-context.js";
export {
  ExecutionPipeline,
  type ExecutionStage,
  type PipelineOptions,
} from "./execution-pipeline.js";
export { ExecutionModule } from "./execution.module.js";
export {
  RLSStage,
  type RlsStageConfig,
} from "./rls/rls.stage.js";
export { RuntimeBuilder } from "./runtime.builder.js";

export { OutboxEventPublisher } from "./outbox/outbox-publisher.js";
export type { PublishOutboxEventInput } from "./outbox/outbox-publisher.js";
export { BusinessRuleRepository } from "./repositories/business-rule.repository.js";
export { ExecutionService } from "./services/execution.service.js";
