import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { type SnapixClientServer } from "@metalevel/snapix-sdk-core";
import { handleToolError } from "../errors.js";

export function registerGetDocsTool(server: McpServer, client: SnapixClientServer): void {
  server.registerTool(
    "snapix_get_docs",
    {
      title: "Fetch SnapiX documentation",
      description:
        "Fetch SnapiX developer documentation as Markdown. Available sections: 'sdk' = TypeScript SDK integration guide, 'api' = REST API reference, 'mcp' = MCP server setup guide. 'about' = about the Snapix application. Supported docType values: sdk, api, mcp, about.",
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: {
        docType: z
          .enum(["sdk", "api", "mcp", "about"])
          .describe(
            "Documentation section to fetch. 'sdk' = TypeScript SDK guide, 'api' = REST API reference, 'mcp' = MCP server setup guide, 'about' = about the Snapix application."
          ),
      },
    },
    async ({ docType }) => {
      try {
        const markdown = await client.getDocs({ docType });

        return {
          content: [
            {
              type: "text" as const,
              text: markdown,
            },
          ],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
