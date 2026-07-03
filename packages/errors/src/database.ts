export class DbError extends Error {
  constructor(operation: string, details?: unknown) {
    super(
      details
        ? `Database error on ${operation}: ${JSON.stringify(details)}`
        : `Database error on ${operation}`
    );
    this.name = "DbError";
  }
}
