import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { type SnapixClient } from "../../../snapix-mcp-server/src/client.js";
import { handleToolError } from "../errors.js";

export function registerGetImageTool(server: McpServer, client: SnapixClient): void {
  server.registerTool(
    "snapix_get_image",
    {
      title: "Get an image",
      description:
        "Get details for a single image by ID. Returns full metadata, CDN URLs for all variants, and dimensions. Free — does not consume App credits.",
      inputSchema: z.object({
        imageId: z.uuid().describe("The UUID of the image to retrieve"),
      }),
    },
    async (params) => {
      try {
        const result = await client.getImage(params.imageId);

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
