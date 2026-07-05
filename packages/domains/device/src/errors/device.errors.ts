export const DEVICE_ERRORS = {
  NOT_FOUND: "DEVICE_NOT_FOUND",
  DEVICE_BLOCKED: "DEVICE_BLOCKED",
  INVALID_INPUT: "DEVICE_INVALID_INPUT",
  FORBIDDEN: "DEVICE_FORBIDDEN",
} as const;

export type DeviceErrorCode = (typeof DEVICE_ERRORS)[keyof typeof DEVICE_ERRORS];

export class DeviceError extends Error {
  constructor(
    public readonly code: DeviceErrorCode,
    public readonly context?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "DeviceError";
  }
}
