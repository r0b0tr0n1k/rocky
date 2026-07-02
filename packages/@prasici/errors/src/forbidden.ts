export class ForbiddenError extends Error {
  constructor(entity?: string, action?: string) {
    super(
      entity && action
        ? `Forbidden: ${action} on ${entity}`
        : "Forbidden"
    );
    this.name = "ForbiddenError";
  }
}
