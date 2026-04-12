import { SnapixApiError } from "@metalevel/snapix-sdk-core";

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
