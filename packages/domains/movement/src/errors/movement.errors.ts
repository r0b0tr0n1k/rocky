export const MOVEMENT_ERRORS = {
  NOT_FOUND: "MOVEMENT_NOT_FOUND",
  INVALID_DATES: "MOVEMENT_INVALID_DATES",
  INVALID_INPUT: "MOVEMENT_INVALID_INPUT",
  FORBIDDEN: "MOVEMENT_FORBIDDEN",
  SAME_FARM: "MOVEMENT_SAME_FARM_ERROR",
} as const;

export type MovementErrorCode =
  (typeof MOVEMENT_ERRORS)[keyof typeof MOVEMENT_ERRORS];

export class MovementError extends Error {
  constructor(
    public readonly code: MovementErrorCode,
    public readonly context?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "MovementError";
  }
}

export const movementErr = (
  code: MovementErrorCode,
  context?: Record<string, unknown>,
): MovementError => new MovementError(code, context);
