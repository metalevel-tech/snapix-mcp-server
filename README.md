# @metalevel/snapix-mcp-server

MCP server for [SnapiX](https://www.snapix.space) — image optimization, conversion, AI generation, and gallery management via the [Model Context Protocol](https://modelcontextprotocol.io).

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
    }
  ],
  "servers": {
    "snapix": {
      "command": "npx",
      "args": ["-y", "@metalevel/snapix-mcp-server"],
      "env": {
        "SNAPIX_API_KEY": "${input:SNAPIX_API_KEY}"
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
    "snapix": {
      "command": "npx",
      "args": ["-y", "@metalevel/snapix-mcp-server"],
      "env": {
        "SNAPIX_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `SNAPIX_API_KEY` | Yes | — | Your SnapiX API key |

## Available Tools

| Tool | Description | Credits |
| --- | --- | --- |
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
| `snapix_update_gallery` | Update gallery name or visibility | Free |
| `snapix_delete_gallery` | Delete a gallery, optionally with all images | Free |

* `snapix_generate_image` the only option that requires a paid subscription, it accepts a text prompt and template image (or image URL) and generates an image using Gemini AI.

## Resources

MCP Resources provide passive context that AI clients can pre-load without making explicit tool calls.

| URI | Description |
| --- | --- |
| `snapix://galleries` | All galleries (name, id, visibility, image count) |
| `snapix://galleries/{galleryId}` | Gallery details with all images and CDN URLs |
| `snapix://images` | Recent images (first page) with metadata and CDN URLs |
| `snapix://images/{imageId}` | Full image metadata, variants, dimensions, and CDN URLs |

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
});
```

## Documentation

* [Full MCP docs](https://www.snapix.space/docs/mcp)
* [REST API docs](https://www.snapix.space/docs/api)
* [Get API key](https://www.snapix.space/user/api-keys)

## License

MIT
