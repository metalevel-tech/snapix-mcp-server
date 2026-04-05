import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { type SnapixClient } from "../../../snapix-mcp-server/src/client.js";
import { handleToolError } from "../errors.js";

export function registerGenerateImageTool(server: McpServer, client: SnapixClient): void {
  server.registerTool(
    "snapix_generate_image",
    {
      title: "Generate an image using AI (Gemini API)",
      description:
        "Generate an image using AI (Gemini API) from a text prompt, optionally guided by a template image URL. The generated image is automatically processed, converted, and uploaded to cloud storage. Returns CDN URLs and generation metadata. Costs 40+ App credits.",
      inputSchema: z.object({
        promptText: z.string().describe("Text prompt describing the image to generate"),
        imageUrl: z
          .url()
          .optional()
          .describe("Optional template image URL to guide style/layout of the generated image"),
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
        galleries: z
          .array(z.uuid())
          .optional()
          .describe("Array of gallery IDs to add the image to"),
        bucketKey: z.string().optional().describe("Storage bucket key"),
      }),
    },
    async (params) => {
      try {
        const result = await client.generateImage({
          promptText: params.promptText,
          imageUrl: params.imageUrl,
          name: params.name,
          description: params.description,
          formatOptions: params.formatOptions,
          resizeOptions: params.resizeOptions,
          ratio: params.ratio,
          galleries: params.galleries,
          bucketKey: params.bucketKey,
        });

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
