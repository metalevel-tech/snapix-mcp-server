import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { type SnapixClient } from "../client.js";
import { handleToolError } from "../errors.js";

export function registerUploadImageTool(server: McpServer, client: SnapixClient): void {
  server.registerTool(
    "snapix_upload_image",
    {
      title: "Upload an image",
      description:
        "Upload an image to SnapiX cloud storage either from a remote URL (imageUrl) or as a base64-encoded binary (imageBase64). Exactly one of the two must be provided. Optionally convert to different formats (JPEG, PNG, WebP, AVIF), resize, and assign to galleries. Returns CDN URLs for all generated variants. Costs 1+ App credits.",
      inputSchema: z
        .object({
          imageUrl: z
            .url()
            .optional()
            .describe("URL of the image to upload (mutually exclusive with imageBase64)"),
          imageBase64: z
            .string()
            .optional()
            .describe("Base64-encoded image binary (mutually exclusive with imageUrl)"),
          contentType: z
            .string()
            .optional()
            .describe(
              "MIME type of the image (e.g. 'image/png', 'image/jpeg'). Recommended when using imageBase64."
            ),
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
            .describe(
              "Array of resize options. Each creates a variant. Empty object keeps original size."
            ),
          ratio: z
            .number()
            .positive()
            .optional()
            .describe("Aspect ratio as a number (e.g., 1.777 for 16:9, 1.333 for 4:3)"),
          galleries: z
            .array(z.uuid())
            .optional()
            .describe("Array of gallery IDs to add the image to"),
          bucketKey: z
            .string()
            .optional()
            .describe("Storage bucket key (defaults to primary bucket)"),
        })
        .refine((data) => !!(data.imageUrl ?? data.imageBase64), {
          message: "Either imageUrl or imageBase64 must be provided",
        })
        .refine((data) => !(data.imageUrl && data.imageBase64), {
          message: "imageUrl and imageBase64 are mutually exclusive — provide only one",
        }),
    },
    async (params) => {
      try {
        const result = await client.uploadImage(params);

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
