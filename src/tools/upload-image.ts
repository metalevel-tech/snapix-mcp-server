import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { type SnapixClient, type UploadImageParams } from "@metalevel/snapix-sdk-core";
import { handleToolError } from "../errors.js";
import { type TransportType } from "../types.js";

const sharedFields = {
  contentType: z
    .string()
    .optional()
    .describe("MIME type of the image (e.g. 'image/png', 'image/jpeg')."),
  name: z.string().max(256).optional().describe("Name for the uploaded image"),
  description: z.string().max(4096).optional().describe("Description of the image"),
  formatOptions: z
    .array(
      z.object({
        format: z.enum(["jpeg", "png", "webp", "avif"]).describe("Output image format"),
      })
    )
    .optional()
    .describe("Array of output format options. Each creates a variant."),
  resizeOptions: z
    .array(
      z.object({
        width: z.number().positive().optional().describe("Target width in pixels"),
        height: z.number().positive().optional().describe("Target height in pixels"),
      })
    )
    .optional()
    .describe("Array of resize options. Each creates a variant. Empty object keeps original size."),
  ratio: z
    .number()
    .positive()
    .optional()
    .describe("Aspect ratio as a number (e.g., 1.777 for 16:9, 1.333 for 4:3)"),
  galleries: z.array(z.uuid()).optional().describe("Array of gallery IDs to add the image to"),
  bucketKey: z.string().optional().describe("Storage bucket key (defaults to primary bucket)"),
};

const stdioSchema = z
  .object({
    imageUrl: z
      .url()
      .optional()
      .describe("URL of the image to upload (mutually exclusive with imageFilePath)"),
    imageFilePath: z
      .string()
      .optional()
      .describe(
        "Absolute path to a local image file (mutually exclusive with imageUrl). The MCP server reads the file from disk — no base64 encoding needed."
      ),
    ...sharedFields,
  })
  .refine((data) => !!(data.imageUrl ?? data.imageFilePath), {
    message: "Either imageUrl or imageFilePath must be provided",
  })
  .refine((data) => !(data.imageUrl && data.imageFilePath), {
    message: "imageUrl and imageFilePath are mutually exclusive — provide only one",
  });

const httpSchema = z
  .object({
    imageUrl: z
      .url()
      .optional()
      .describe("URL of the image to upload (mutually exclusive with imageBase64)"),
    imageBase64: z
      .string()
      .optional()
      .describe("Base64-encoded image binary (mutually exclusive with imageUrl)"),
    ...sharedFields,
  })
  .refine((data) => !!(data.imageUrl ?? data.imageBase64), {
    message: "Either imageUrl or imageBase64 must be provided",
  })
  .refine((data) => !(data.imageUrl && data.imageBase64), {
    message: "imageUrl and imageBase64 are mutually exclusive — provide only one",
  });

const descriptions: Record<TransportType, string> = {
  stdio:
    "Upload an image to SnapiX cloud storage from a remote URL (imageUrl) or a local file path (imageFilePath). Exactly one must be provided. The server reads local files from disk directly — no base64 encoding needed. Optionally convert to different formats (JPEG, PNG, WebP, AVIF), resize, and assign to galleries. Returns CDN URLs for all generated variants. Costs 1+ App credits.",
  http: "Upload an image to SnapiX cloud storage from a remote URL (imageUrl) or as a base64-encoded binary (imageBase64). Exactly one must be provided. Optionally convert to different formats (JPEG, PNG, WebP, AVIF), resize, and assign to galleries. Returns CDN URLs for all generated variants. Costs 1+ App credits.",
};

export function registerUploadImageTool(
  server: McpServer,
  client: SnapixClient,
  transport: TransportType = "stdio"
): void {
  server.registerTool(
    "snapix_upload_image",
    {
      title: "Upload an image",
      description: descriptions[transport],
      inputSchema: transport === "stdio" ? stdioSchema : httpSchema,
    },
    async (params: Record<string, unknown>) => {
      try {
        const result = await client.uploadImage(params as UploadImageParams);

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
