export class LedgrError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string | null;

  constructor(status: number, code: string, message: string, requestId: string | null) {
    super(message);
    this.name = 'LedgrError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}
