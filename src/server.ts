import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { SnapixClient } from "./client.js";
import { APP_MCP_BASE_URL, APP_MCP_PACKAGE_NAME, APP_MCP_PACKAGE_VERSION } from "./constants.js";
import { registerGalleryResources } from "./resources/galleries.js";
import { registerImageResources } from "./resources/images.js";
import { registerConvertTool } from "./tools/convert.js";
import { registerCreateGalleryTool } from "./tools/create-gallery.js";
import { registerDeleteGalleryTool } from "./tools/delete-gallery.js";
import { registerDeleteImageTool } from "./tools/delete-image.js";
import { registerGenerateImageTool } from "./tools/generate.js";
import { registerGetDocsTool } from "./tools/get-docs.js";
import { registerGetGalleryTool } from "./tools/get-gallery.js";
import { registerGetImageTool } from "./tools/get-image.js";
import { registerListGalleriesTool } from "./tools/list-galleries.js";
import { registerListImagesTool } from "./tools/list-images.js";
import { registerUpdateGalleryTool } from "./tools/update-gallery.js";
import { registerUpdateImageTool } from "./tools/update-image.js";
import { registerUploadImageTool } from "./tools/upload-image.js";
import { type CreateServerOptions } from "./types.js";

export function createSnapixMcpServer({
  apiKey,
  baseUrl = APP_MCP_BASE_URL,
  bucketKey,
  transport = "stdio",
}: CreateServerOptions): McpServer {
  const server = new McpServer({
    name: APP_MCP_PACKAGE_NAME,
    version: APP_MCP_PACKAGE_VERSION,
  });
  const client = new SnapixClient({ baseUrl, apiKey, bucketKey });

  // Register tools
  registerConvertTool(server, client);
  registerGetDocsTool(server);
  registerUploadImageTool(server, client, transport);
  registerGenerateImageTool(server, client, transport);
  registerListImagesTool(server, client);
  registerGetImageTool(server, client);
  registerUpdateImageTool(server, client);
  registerDeleteImageTool(server, client);
  registerCreateGalleryTool(server, client);
  registerListGalleriesTool(server, client);
  registerGetGalleryTool(server, client);
  registerUpdateGalleryTool(server, client);
  registerDeleteGalleryTool(server, client);

  // Register resources
  registerGalleryResources(server, client);
  registerImageResources(server, client);

  return server;
}

/**
 * Creates a stateless request handler for use in web frameworks (Next.js, Hono, etc.).
 * Each incoming request creates a fresh server + transport - no session state is maintained.
 */
export async function handleStatelessRequest(
  request: Request,
  options: CreateServerOptions
): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  const server = createSnapixMcpServer({ ...options, transport: "http" });
  await server.connect(transport);

  return transport.handleRequest(request);
}
