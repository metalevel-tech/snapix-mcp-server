import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { type SnapixClient } from "../../../snapix-mcp-server/src/client.js";
import { handleToolError } from "../errors.js";

export function registerDeleteImageTool(server: McpServer, client: SnapixClient): void {
  server.registerTool(
    "snapix_delete_image",
    {
      title: "Delete an image",
      description:
        "Permanently delete an image and all its variants from SnapiX storage. This action cannot be undone. Free — does not consume App credits.",
      inputSchema: z.object({
        imageId: z.uuid().describe("The UUID of the image to delete"),
      }),
    },
    async (params) => {
      try {
        const result = await client.deleteImage(params.imageId);

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
