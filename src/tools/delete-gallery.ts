import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { type SnapixClient } from "../../../snapix-mcp-server/src/client.js";
import { handleToolError } from "../errors.js";

export function registerDeleteGalleryTool(server: McpServer, client: SnapixClient): void {
  server.registerTool(
    "snapix_delete_gallery",
    {
      title: "Delete a gallery",
      description:
        "Permanently delete a gallery. Optionally delete all images in the gallery as well. This action cannot be undone. Free — does not consume App credits.",
      inputSchema: z.object({
        galleryId: z.uuid().describe("The UUID of the gallery to delete"),
        deleteImages: z
          .boolean()
          .optional()
          .describe(
            "If true, also deletes all images in the gallery. If false or omitted, images are kept but removed from the gallery."
          ),
      }),
    },
    async (params) => {
      try {
        const result = await client.deleteGallery(params.galleryId, params.deleteImages);

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
