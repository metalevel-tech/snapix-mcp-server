import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { type SnapixClient } from "../client.js";
import { handleToolError } from "../errors.js";

export function registerCreateGalleryTool(server: McpServer, client: SnapixClient): void {
  server.registerTool(
    "snapix_create_gallery",
    {
      title: "Create a gallery",
      description:
        "Create a new gallery to organize images. Optionally assign existing images by ID. Galleries can be public (shareable) or private. Free — does not consume App credits.",
      inputSchema: z.object({
        name: z.string().min(1).max(256).describe("Name of the gallery"),
        isPublic: z
          .boolean()
          .optional()
          .describe("Whether the gallery is publicly accessible (defaults to false)"),
        bucketKey: z
          .string()
          .optional()
          .describe("Storage bucket key (defaults to primary bucket)"),
        imageIds: z
          .array(z.uuid())
          .optional()
          .describe("Array of existing image IDs to add to the gallery"),
      }),
    },
    async (params) => {
      try {
        const result = await client.createGallery(params);

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
