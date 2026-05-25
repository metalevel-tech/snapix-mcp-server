import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { type SnapixClientServer } from "@metalevel/snapix-sdk-core";
import { handleToolError } from "../errors.js";

export function registerGetGalleryTool(server: McpServer, client: SnapixClientServer): void {
  server.registerTool(
    "snapix_get_gallery",
    {
      title: "Get a gallery",
      description:
        "Get details for a single gallery by ID, including all images in the gallery with their CDN URLs. Free — does not consume App credits.",
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: z.object({
        galleryId: z.uuid().describe("The UUID of the gallery to retrieve"),
      }),
    },
    async (params) => {
      try {
        const result = await client.getGallery({ galleryId: params.galleryId });

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
