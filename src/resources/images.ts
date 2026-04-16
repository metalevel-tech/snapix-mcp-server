import { type McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

import { type SnapixClientServer } from "@metalevel/snapix-sdk-core";

export function registerImageResources(server: McpServer, client: SnapixClientServer): void {
  server.registerResource(
    "image-list",
    "snapix://images",
    {
      description: "Recent images (first page, default sort) with metadata and CDN URLs",
      mimeType: "application/json",
    },
    async (uri) => {
      const data = await client.listImages({ page: 1 });

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  server.registerResource(
    "image-detail",
    new ResourceTemplate("snapix://images/{imageId}", { list: undefined }),
    {
      description: "Full image metadata, all variants, dimensions, and CDN URLs",
      mimeType: "application/json",
    },
    async (uri, variables) => {
      const imageId = String(variables.imageId);
      const data = await client.getImage(imageId);

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );
}
