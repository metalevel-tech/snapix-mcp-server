import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { type SnapixClientServer, type UpdateImageParams } from "@metalevel/snapix-sdk-core";
import { handleToolError } from "../errors.js";
import { type TransportType } from "../types.js";

const sharedFields = {
  imageId: z.uuid().describe("The UUID of the image to update"),
  name: z.string().max(256).optional().describe("New name for the image"),
  description: z.string().max(4096).optional().describe("New description"),
  galleries: z
    .array(z.uuid())
    .optional()
    .describe(
      "New gallery IDs to assign (replaces existing). Pass empty array to remove from all galleries."
    ),
  imageUrl: z.url().optional().describe("URL of a new source image to replace the existing one"),
  formatOptions: z
    .object({
      format: z.enum(["jpeg", "png", "webp", "avif"]).describe("Output image format"),
    })
    .optional()
    .describe("Re-convert the image to a different format. Costs 1 App credit."),
  resizeOptions: z
    .object({
      width: z.number().positive().optional().describe("Target width in pixels"),
      height: z.number().positive().optional().describe("Target height in pixels"),
    })
    .optional()
    .describe("Resize the image. Can be combined with formatOptions."),
};

const stdioSchema = z.object({
  ...sharedFields,
  imageFilePath: z
    .string()
    .optional()
    .describe(
      "Absolute path to a local image file to replace the existing one. The MCP server reads the file from disk — no base64 encoding needed."
    ),
});

const httpSchema = z.object({
  ...sharedFields,
  imageBase64: z
    .string()
    .optional()
    .describe("Base64-encoded image binary to replace the existing one"),
  imageContentType: z
    .string()
    .optional()
    .describe(
      "MIME type of the replacement image (e.g. 'image/png'). Recommended when using imageBase64."
    ),
});

const descriptions: Record<TransportType, string> = {
  stdio:
    "Update an existing image's metadata (name, description), gallery assignments, or replace the image content with a new file path (imageFilePath) or URL (imageUrl). Can also re-convert to a different format or resize. Free for metadata-only updates; costs 1+ App credits when image processing is involved.",
  http: "Update an existing image's metadata (name, description), gallery assignments, or replace the image content with a new URL (imageUrl) or base64-encoded binary (imageBase64). Can also re-convert to a different format or resize. Free for metadata-only updates; costs 1+ App credits when image processing is involved.",
};

export function registerUpdateImageTool(
  server: McpServer,
  client: SnapixClientServer,
  transport: TransportType = "stdio"
): void {
  server.registerTool(
    "snapix_update_image",
    {
      title: "Update an image",
      description: descriptions[transport],
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
      inputSchema: transport === "stdio" ? stdioSchema : httpSchema,
    },
    async (params: UpdateImageParams) => {
      try {
        const result = await client.updateImage(params);

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
