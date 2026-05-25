import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { type SnapixClientServer } from "@metalevel/snapix-sdk-core";
import { handleToolError } from "../errors.js";

export function registerGetUngroupedImagesTool(
  server: McpServer,
  client: SnapixClientServer
): void {
  server.registerTool(
    "snapix_get_ungrouped_images",
    {
      title: "Get ungrouped images",
      description:
        "Get all images that are not assigned to any gallery. Free — does not consume App credits.",
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: z.object({
        bucketKey: z
          .string()
          .optional()
          .describe(
            "Filter by storage bucket key. Defaults to the primary bucket if not provided."
          ),
      }),
    },
    async (params) => {
      try {
        const result = await client.getImagesWithoutGallery({ bucketKey: params.bucketKey });

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
