export const FARM_ERRORS = {
  NOT_FOUND: "FARM_NOT_FOUND",
  DUPLICATE_FARM_ID: "FARM_DUPLICATE_ID",
  INVALID_INPUT: "FARM_INVALID_INPUT",
  FORBIDDEN: "FARM_FORBIDDEN",
} as const;

export type FarmErrorCode = (typeof FARM_ERRORS)[keyof typeof FARM_ERRORS];

export class FarmError extends Error {
  constructor(
    public readonly code: FarmErrorCode,
    public readonly context?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "FarmError";
  }
}

export const farmErr = (
  code: FarmErrorCode,
  context?: Record<string, unknown>,
): FarmError => new FarmError(code, context);
