import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { type SnapixClientServer } from "@metalevel/snapix-sdk-core";
import { handleToolError } from "../errors.js";

export function registerUpdateGalleryTool(server: McpServer, client: SnapixClientServer): void {
  server.registerTool(
    "snapix_update_gallery",
    {
      title: "Update a gallery",
      description:
        "Update an existing gallery's name or visibility. Free — does not consume App credits.",
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: z.object({
        galleryId: z.uuid().describe("The UUID of the gallery to update"),
        name: z.string().min(1).max(256).optional().describe("New name for the gallery"),
        isPublic: z.boolean().optional().describe("Whether the gallery is publicly accessible"),
      }),
    },
    async (params) => {
      try {
        const result = await client.updateGallery({
          galleryId: params.galleryId,
          name: params.name,
          isPublic: params.isPublic,
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
