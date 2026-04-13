import { SnapixApiError } from "@metalevel/snapix-sdk-core";

export function handleToolError(error: unknown): {
  content: { type: "text"; text: string }[];
  isError: true;
  _meta?: { retryable: boolean };
} {
  if (error instanceof SnapixApiError) {
    const retryable = error.isRetryable;
    let message = error.message;

    if (error.status === 403) {
      message = "Access denied: this API key lacks the required permission for this operation.";
    }

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
