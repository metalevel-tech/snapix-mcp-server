import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { type SnapixClient } from "@metalevel/snapix-sdk-core";
import { handleToolError } from "../errors.js";

export function registerListImagesTool(server: McpServer, client: SnapixClient): void {
  server.registerTool(
    "snapix_list_images",
    {
      title: "List images",
      description:
        "List images in the user's SnapiX account with pagination. Returns image metadata, CDN URLs, and account statistics. Free — does not consume App credits.",
      inputSchema: z.object({
        page: z.number().int().positive().optional().describe("Page number (default: 1)"),
        limit: z
          .number()
          .int()
          .positive()
          .max(100)
          .optional()
          .describe("Images per page (default: 10, max: 100)"),
        sort: z
          .enum(["asc", "desc"])
          .optional()
          .describe("Sort order by creation date (default: asc, newer first)"),
        bucketKey: z.string().optional().describe("Filter by storage bucket key"),
      }),
    },
    async (params) => {
      try {
        const result = await client.listImages(params);

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
