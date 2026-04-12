import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { type SnapixClient } from "@metalevel/snapix-sdk-core";
import { handleToolError } from "../errors.js";

export function registerListGalleriesTool(server: McpServer, client: SnapixClient): void {
  server.registerTool(
    "snapix_list_galleries",
    {
      title: "List galleries",
      description:
        "List all galleries for the authenticated user. Returns gallery names, IDs, visibility status, and image counts. Free — does not consume App credits.",
    },
    async () => {
      try {
        const result = await client.listGalleries();

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
