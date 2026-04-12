import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { type SnapixClient } from "@metalevel/snapix-sdk-core";

export function registerConvertTool(server: McpServer, _client: SnapixClient): void {
  server.registerTool(
    "snapix_convert_image",
    {
      title: "Image format conversion guidance",
      description:
        "The SnapiX convert API streams binary data without storing it, which is not useful in an MCP/LLM context. This tool explains how to achieve image conversion using the upload tool instead.",
    },
    async () => {
      return {
        content: [
          {
            type: "text" as const,
            text: [
              "The SnapiX convert API (`POST /api/v1/convert`) streams converted binary data directly back to the caller without storing it.",
              "This is not practical in an MCP context where you need a URL or stored result.",
              "",
              "Instead, use `snapix_upload_image` with the `formatOptions` parameter to convert AND store images:",
              "",
              '- To convert to WebP: set formatOptions to [{"format": "webp"}]',
              '- To convert to AVIF: set formatOptions to [{"format": "avif"}]',
              '- To convert to multiple formats: set formatOptions to [{"format": "webp"}, {"format": "avif"}]',
              "",
              "The upload tool will convert the image, store all variants in cloud storage, and return CDN URLs you can use immediately.",
              "You can also combine format conversion with resizing using the `resizeOptions` parameter.",
            ].join("\n"),
          },
        ],
      };
    }
  );
}
