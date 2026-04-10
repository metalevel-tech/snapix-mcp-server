#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { APP_MCP_BASE_URL } from "./constants.js";
import { createSnapixMcpServer } from "./server.js";

const apiKey = process.env.SNAPIX_API_KEY;
const bucketKey = process.env.SNAPIX_BUCKET_KEY;

if (!apiKey) {
  console.error("Error: SNAPIX_API_KEY environment variable is required.");
  console.error(`Get your API key at ${APP_MCP_BASE_URL}/user/api-keys`);
  process.exit(1);
}

const server = createSnapixMcpServer({ apiKey, bucketKey, transport: "stdio" });
const transport = new StdioServerTransport();
await server.connect(transport);
