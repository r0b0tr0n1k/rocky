export const IOT_ERRORS = {
  NOT_FOUND: "IOT_NOT_FOUND",
  DEVICE_NOT_FOUND: "IOT_DEVICE_NOT_FOUND",
  READING_NOT_FOUND: "IOT_READING_NOT_FOUND",
  INVALID_INPUT: "IOT_INVALID_INPUT",
  FORBIDDEN: "IOT_FORBIDDEN",
} as const;

export type IotErrorCode = (typeof IOT_ERRORS)[keyof typeof IOT_ERRORS];

export class IotError extends Error {
  constructor(
    public readonly code: IotErrorCode,
    public readonly context?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "IotError";
  }
}
