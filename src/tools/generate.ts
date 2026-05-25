import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { type GenerateImageParams, type SnapixClientServer } from "@metalevel/snapix-sdk-core";
import { handleToolError } from "../errors.js";
import { type TransportType } from "../types.js";

const sharedFields = {
  promptText: z.string().describe("Text prompt describing the image to generate"),
  name: z.string().max(256).optional().describe("Name for the generated image"),
  description: z.string().max(4096).optional().describe("Description of the image"),
  formatOptions: z
    .array(
      z.object({
        format: z.enum(["jpeg", "png", "webp", "avif"]).describe("Output image format"),
      })
    )
    .optional()
    .describe("Array of output format options"),
  resizeOptions: z
    .array(
      z.object({
        width: z.number().positive().optional().describe("Target width in pixels"),
        height: z.number().positive().optional().describe("Target height in pixels"),
      })
    )
    .optional()
    .describe("Array of resize options"),
  ratio: z
    .number()
    .positive()
    .optional()
    .describe("Aspect ratio as a number (e.g., 1.777 for 16:9)"),
  galleries: z.array(z.uuid()).optional().describe("Array of gallery IDs to add the image to"),
  bucketKey: z.string().optional().describe("Storage bucket key"),
};

const stdioSchema = z.object({
  ...sharedFields,
  imageUrl: z
    .url()
    .optional()
    .describe("Optional template image URL to guide style/layout of the generated image"),
  imageFilePath: z
    .string()
    .optional()
    .describe(
      "Absolute path to a local template image file to guide style/layout. The MCP server reads the file from disk — no base64 encoding needed."
    ),
});

const httpSchema = z.object({
  ...sharedFields,
  imageUrl: z
    .url()
    .optional()
    .describe("Optional template image URL to guide style/layout of the generated image"),
  imageBase64: z
    .string()
    .optional()
    .describe("Base64-encoded template image binary to guide style/layout"),
  contentType: z
    .string()
    .optional()
    .describe(
      "MIME type of the template image (e.g. 'image/png'). Recommended when using imageBase64."
    ),
});

const descriptions: Record<TransportType, string> = {
  stdio:
    "Generate an image using AI (Gemini API) from a text prompt, optionally guided by a template image URL or local file path. The generated image is automatically processed, converted, and uploaded to cloud storage. Returns CDN URLs and generation metadata. Costs 40+ App credits.",
  http: "Generate an image using AI (Gemini API) from a text prompt, optionally guided by a template image URL or base64-encoded image. The generated image is automatically processed, converted, and uploaded to cloud storage. Returns CDN URLs and generation metadata. Costs 40+ App credits.",
};

export function registerGenerateImageTool(
  server: McpServer,
  client: SnapixClientServer,
  transport: TransportType = "stdio"
): void {
  server.registerTool(
    "snapix_generate_image",
    {
      title: "Generate an image using AI (Gemini API)",
      description: descriptions[transport],
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
      inputSchema: transport === "stdio" ? stdioSchema : httpSchema,
    },
    async (params: Record<string, unknown>) => {
      try {
        const result = await client.generateImage(params as unknown as GenerateImageParams);

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
