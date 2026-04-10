import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { API_URI_DOCS, APP_MCP_BASE_URL } from "../constants.js";

export function registerGetDocsTool(server: McpServer): void {
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
        const url = `${APP_MCP_BASE_URL}/${API_URI_DOCS}/${slug}?format=md`;
        const response = await fetch(url);

        if (!response.ok) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Failed to fetch documentation for '${slug}': HTTP ${response.status}`,
              },
            ],
            isError: true,
          };
        }

        const markdown = await response.text();

        return {
          content: [
            {
              type: "text" as const,
              text: markdown,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred.";

        return {
          content: [{ type: "text" as const, text: message }],
          isError: true,
        };
      }
    }
  );
}
