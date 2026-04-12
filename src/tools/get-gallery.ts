import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { type SnapixClient } from "@metalevel/snapix-sdk-core";
import { handleToolError } from "../errors.js";

export function registerGetGalleryTool(server: McpServer, client: SnapixClient): void {
  server.registerTool(
    "snapix_get_gallery",
    {
      title: "Get a gallery",
      description:
        "Get details for a single gallery by ID, including all images in the gallery with their CDN URLs. Free — does not consume App credits.",
      inputSchema: z.object({
        galleryId: z.uuid().describe("The UUID of the gallery to retrieve"),
      }),
    },
    async (params) => {
      try {
        const result = await client.getGallery(params.galleryId);

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
