import packageJson from "../package.json" with { type: "json" };

// This is for testing purposes only - this is why it is not in the documentation.
const PROCESS_MCP_BASE_URL = process.env.MCP_BASE_URL;
const PACKAGE_MCP_BASE_URL = (packageJson.mcpBaseUrl as string) || "https://www.snapix.space";

export const APP_MCP_BASE_URL = PROCESS_MCP_BASE_URL ?? PACKAGE_MCP_BASE_URL;
export const APP_MCP_PACKAGE_VERSION = packageJson.version;
export const APP_MCP_PACKAGE_NAME = packageJson.name;

export const API_URI_IMAGES = "api/v1/images";
export const API_URI_GENERATE = "api/v1/generate";
export const API_URI_GALLERIES = "api/v1/galleries";
