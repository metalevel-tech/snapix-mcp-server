# @metalevel/snapix-mcp-server

MCP server for [SnapiX](https://www.snapix.space) - image optimization, conversion, AI generation, and gallery management via the [Model Context Protocol](https://modelcontextprotocol.io). Get a free [API key](https://www.snapix.space/user/api-keys) and start using it with your AI clients today, no credits required!

Built on [`@metalevel/snapix-sdk-core`](https://www.npmjs.com/package/@metalevel/snapix-sdk-core) - the official typed TypeScript SDK for the SnapiX REST API.

## Quick Start — Local (stdio)

Add to your AI client configuration:

### VS Code (Copilot)

Add to `.vscode/mcp.json`:

```json
{
  "inputs": [
    {
      "id": "SNAPIX_API_KEY",
      "type": "promptString",
      "description": "SnapiX API key",
      "password": true
    },
    {
      "id": "SNAPIX_BUCKET_KEY",
      "type": "promptString",
      "description": "Default bucket key for SnapiX uploads and generates (optional)",
      "password": false
    }
  ],
  "servers": {
    "metalevel/snapix-mcp": {
      "command": "npx",
      "args": ["-y", "@metalevel/snapix-mcp-server"],
      "env": {
        "SNAPIX_API_KEY": "${input:SNAPIX_API_KEY}",
        "SNAPIX_BUCKET_KEY": "${input:SNAPIX_BUCKET_KEY}" // optional
      }
    }
  }
}
```

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "metalevel/snapix-mcp": {
      "command": "npx",
      "args": ["-y", "@metalevel/snapix-mcp-server"],
      "env": {
        "SNAPIX_API_KEY": "your-api-key-here",
        "SNAPIX_BUCKET_KEY": "your-optional-custom-bucket-key"
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `SNAPIX_API_KEY` | Yes | — | Your SnapiX API key |
| `SNAPIX_BUCKET_KEY` | No | primary bucket | Default storage bucket for uploads, generates, and gallery creation |
| `SNAPIX_LOG_LEVEL` | No | `warn` | SDK log verbosity: `debug` \| `info` \| `warn` \| `error` \| `silent` |

## Available Tools

| Tool | Description | Credits |
| --- | --- | --- |
| `snapix_get_docs` | Fetch SnapiX documentation (SDK, API, or MCP reference) | Free |
| `snapix_convert_image` | Guidance tool — explains how to convert images using the upload tool | Free |
| `snapix_upload_image` | Upload an image from URL, optionally convert format and resize | 1+ |
| `snapix_generate_image` | Generate an image from a text prompt (Gemini AI)* | 40+ |
| `snapix_list_images` | List images with pagination and filtering | Free |
| `snapix_get_image` | Get full details for a single image | Free |
| `snapix_update_image` | Update image metadata or gallery assignments | Free |
| `snapix_delete_image` | Permanently delete an image | Free |
| `snapix_create_gallery` | Create a new gallery, optionally with existing images | Free |
| `snapix_list_galleries` | List all galleries | Free |
| `snapix_get_gallery` | Get gallery details with all images | Free |
| `snapix_get_ungrouped_images` | Get all images not assigned to any gallery | Free |
| `snapix_update_gallery` | Update gallery name or visibility | Free |
| `snapix_delete_gallery` | Delete a gallery, optionally with all images | Free |

* `snapix_generate_image` the only option that requires a paid subscription, it accepts a text prompt and template image (or image URL) and generates an image using Gemini AI.

## Resources

MCP Resources provide passive context that AI clients can pre-load without making explicit tool calls.

| URI | Description |
| --- | --- |
| `snapix://galleries` | All galleries (name, id, visibility, image count) |
| `snapix://galleries/{galleryId}` | Gallery details with all images and CDN URLs |
| `snapix://images/ungrouped` | All images not assigned to any gallery |
| `snapix://images` | Recent images (first page) with metadata and CDN URLs |
| `snapix://images/{imageId}` | Full image metadata, variants, dimensions, and CDN URLs |

## Prompts

MCP Prompts are interactive workflow templates that AI clients can invoke on demand. Clients that support the MCP prompts capability (VS Code Copilot, Claude, and others) expose them as slash commands or selectable actions in the chat interface.

| Prompt | Description |
| --- | --- |
| `snapix_setup_sdk_core` | Guided setup of `@metalevel/snapix-sdk-core`: reads live docs, installs the package with the detected package manager, and appends `SNAPIX_*` environment variables to the correct `.env` file |

## Rate Limiting

The MCP server respects the same rate limits as the REST API. When a rate limit is hit (HTTP 429), the server returns an MCP error with a retryable flag, signaling to the AI client that it should wait and retry the request.

## Credits & Quotas

* **Free operations**: listing, getting, updating metadata, and deleting images/galleries
* **Credit-consuming operations**: uploading images (1+ credits), generating images (40+ credits)
* Credit costs follow the same rules as the [REST API](https://www.snapix.space/docs/api#app-credits)
* When credits are exhausted, the server returns a clear error message

## Programmatic Usage

```typescript
import { createSnapixMcpServer } from "@metalevel/snapix-mcp-server";

const server = createSnapixMcpServer({
  baseUrl: "https://www.snapix.space",
  apiKey: process.env.SNAPIX_API_KEY!,
  bucketKey: process.env.SNAPIX_BUCKET_KEY, // optional
});
```

## Documentation

* [Full MCP docs](https://www.snapix.space/docs/mcp)
* [REST API docs](https://www.snapix.space/docs/api)
* [Get API key](https://www.snapix.space/user/api-keys)

## License

MIT
