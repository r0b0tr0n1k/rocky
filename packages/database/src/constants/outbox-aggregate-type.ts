import { createEnumValues } from "./_brand.js"

/**
 * Outbox Aggregate Type — the entity an outbox event is about.
 *
 * Canonical SSOT for `OutboxEventPublisher.publish({ aggregateType })`.
 * Values are deliberately a closed set of the entities that currently emit
 * domain events; never quote them inline.
 */
export const OUTBOX_AGGREGATE_TYPE = {
	ANIMAL: "animal",
	FARM: "farm",
	MOVEMENT: "movement",
	TREATMENT: "treatment",
	LAB_TEST: "lab_test",
} as const;

export const OUTBOX_AGGREGATE_TYPE_VALUES = createEnumValues([
	OUTBOX_AGGREGATE_TYPE.ANIMAL,
	OUTBOX_AGGREGATE_TYPE.FARM,
	OUTBOX_AGGREGATE_TYPE.MOVEMENT,
	OUTBOX_AGGREGATE_TYPE.TREATMENT,
	OUTBOX_AGGREGATE_TYPE.LAB_TEST,
] as const);
