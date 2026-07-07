/**
 * Inspection Domain Errors
 *
 * Following the Error Sovereignty Doctrine:
 * - Domain services return Result<T, Error>
 * - Errors are defined here for domain-specific failures
 * - tRPC layer maps these to TRPCError
 */

export const INSPECTION_ERRORS = {
  NOT_FOUND: "INSPECTION_NOT_FOUND",
  FORBIDDEN: "INSPECTION_FORBIDDEN",
  FARM_ALREADY_INSPECTED: "INSPECTION_FARM_ALREADY_INSPECTED",
  INVALID_STATUS_TRANSITION: "INSPECTION_INVALID_STATUS_TRANSITION",
  INVALID_INPUT: "INSPECTION_INVALID_INPUT",
  INVALID_DATE_ORDER: "INSPECTION_INVALID_DATE_ORDER",
} as const;

export type InspectionErrorCode = (typeof INSPECTION_ERRORS)[keyof typeof INSPECTION_ERRORS];

export class InspectionError extends Error {
  constructor(
    public readonly code: InspectionErrorCode,
    public readonly context?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "InspectionError";
  }
}

export const inspectionErr = (
  code: InspectionErrorCode,
  context?: Record<string, unknown>,
): InspectionError => new InspectionError(code, context);
