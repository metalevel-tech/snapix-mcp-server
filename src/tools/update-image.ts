import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { type SnapixClient } from "@metalevel/snapix-sdk-core";
import { handleToolError } from "../errors.js";

export function registerUpdateImageTool(server: McpServer, client: SnapixClient): void {
  server.registerTool(
    "snapix_update_image",
    {
      title: "Update an image",
      description:
        "Update an existing image's metadata (name, description) or gallery assignments. Can also re-convert the image with new format/resize options. May consume App credits if image processing is involved.",
      inputSchema: z.object({
        imageId: z.uuid().describe("The UUID of the image to update"),
        name: z.string().max(256).optional().describe("New name for the image"),
        description: z.string().max(4096).optional().describe("New description"),
        galleries: z
          .array(z.uuid())
          .optional()
          .describe(
            "New gallery IDs to assign (replaces existing). Pass empty array to remove from all galleries."
          ),
      }),
    },
    async (params) => {
      try {
        const result = await client.updateImage(params.imageId, {
          name: params.name,
          description: params.description,
          galleries: params.galleries,
        });

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
