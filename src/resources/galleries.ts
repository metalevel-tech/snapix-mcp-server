import { type McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

import { type SnapixClient } from "../client.js";

export function registerGalleryResources(server: McpServer, client: SnapixClient): void {
  server.resource(
    "gallery-list",
    "snapix://galleries",
    {
      description:
        "Lists all galleries for the authenticated user (name, id, visibility, image count)",
      mimeType: "application/json",
    },
    async (uri) => {
      const data = await client.listGalleries();

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

  server.resource(
    "gallery-detail",
    new ResourceTemplate("snapix://galleries/{galleryId}", { list: undefined }),
    {
      description: "Gallery details with all images, metadata, and CDN URLs",
      mimeType: "application/json",
    },
    async (uri, variables) => {
      const galleryId = String(variables.galleryId);
      const data = await client.getGallery(galleryId);

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
