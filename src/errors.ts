export class SnapixApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public responseBody?: unknown
  ) {
    super(message);
    this.name = "SnapixApiError";
  }

  get isRetryable(): boolean {
    return this.status === 429;
  }

  get message(): string {
    let message: string;

    switch (this.status) {
      case 401:
        message = "Invalid or missing API key.";
        break;
      case 402:
        message = "Insufficient credits or quota exceeded.";
        break;
      case 429:
        message = "Rate limit exceeded. Please wait before retrying.";
        break;
      default:
        message = super.message || `API error (HTTP ${this.status})`;
      // We use super.message because our getter overrides the default this.message property
    }

    return message;
  }
}

export function handleToolError(error: unknown): {
  content: { type: "text"; text: string }[];
  isError: true;
  _meta?: { retryable: boolean };
} {
  if (error instanceof SnapixApiError) {
    const retryable = error.isRetryable;
    const message = error.message;

    return {
      content: [{ type: "text" as const, text: message }],
      isError: true,
      ...(retryable ? { _meta: { retryable: true } } : {}),
    };
  }

  const message = error instanceof Error ? error.message : "An unexpected error occurred.";

  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}
