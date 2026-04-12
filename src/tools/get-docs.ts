import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { type SnapixClient } from "@metalevel/snapix-sdk-core";
import { handleToolError } from "../errors.js";

export function registerGetDocsTool(server: McpServer, client: SnapixClient): void {
  server.registerTool(
    "snapix_get_docs",
    {
      title: "Fetch SnapiX documentation",
      description:
        "Fetch SnapiX developer documentation as Markdown. Available sections: 'sdk' = TypeScript SDK integration guide, 'api' = REST API reference, 'mcp' = MCP server setup guide. 'about' = about the Snapix application. Only these four slugs are supported.",
      inputSchema: {
        slug: z
          .enum(["sdk", "api", "mcp", "about"])
          .describe(
            "Documentation section to fetch. 'sdk' = TypeScript SDK guide, 'api' = REST API reference, 'mcp' = MCP server setup guide, 'about' = about the Snapix application."
          ),
      },
    },
    async ({ slug }) => {
      try {
        const markdown = await client.getDocs(slug);

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
