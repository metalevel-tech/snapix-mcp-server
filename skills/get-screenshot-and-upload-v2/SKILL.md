---
name: get-screenshot-and-upload
description: 'Capture a screenshot of a web page using VS Code integrated browser tools (primary) or chrome-devtools-mcp (fallback), save it temporarily to the project folder, upload it to Snapix via snapix-mcp, then remove the local copy. Use when: screenshot a URL and upload to Snapix, capture web page image and store in cloud, screenshot-to-snapix workflow, take browser screenshot and upload.'
argument-hint: 'URL to screenshot and optional destination gallery or image name'
---

# Get Screenshot & Upload to Snapix

Captures a live browser screenshot using VS Code's integrated browser tools (primary method) or chrome-devtools-mcp (fallback), temporarily saves the image, uploads it to Snapix via `snapix-mcp`, then cleans up the local file.

## When to Use

- "Take a screenshot of `<url>` and upload to Snapix"
- "Capture `<url>` and store the image in Snapix"
- Any screenshot-to-cloud workflow targeting Snapix

## Prerequisites

### Primary Method (Recommended)
- **VS Code with browser tools enabled**: Ensure `workbench.browser.enableChatTools` setting is `true`
- **Integrated browser access**: The agent must have permission to use browser tools
- **Snapix MCP configured and authenticated** (`mcp_metalevel_sna_snapix_*` tools available)

### Fallback Method
- **Chrome with remote debugging**: Running on `http://127.0.0.1:9222` (only needed if integrated browser is unavailable)
  See [chrome-devtools-mcp instructions](../../.github/instructions/chrome-devtools-mcp.instructions.md) for setup details.

## Procedure

### Step 1 — Navigate to the URL

Open or navigate to the target URL using `mcp_io_github_chr_new_page` (opens in a new tab) or `mcp_io_github_chr_navigate_page` (reuses current tab):

```
mcp_io_github_chr_new_page  url="<target-url>"
```

Wait a few seconds for the page to load (`run_in_terminal`: `sleep 3`).

### Step 2 — Dismiss Dialogs (if any)

Use the snapshot (`mcp_io_github_chr_take_snapshot`) to check for overlays. Dismiss consent dialogs or popups via `mcp_io_github_chr_evaluate_script`:

```js
() => {
  const buttons = document.querySelectorAll('button');
  for (const btn of buttons) {
    if (btn.textContent.trim() === 'Reject all' || btn.textContent.trim() === 'Accept') {
      btn.click();
      return 'dismissed';
    }
  }
  return 'no dialog';
}
```

Wait 1–2 seconds after dismissal before proceeding.

### Step 3 — Save Screenshot to Filesystem

Use `mcp_io_github_chr_take_screenshot` with the `filePath` parameter to save the screenshot directly to disk:

```json
{
  "tool": "take_screenshot",
  "arguments": {
    "format": "png",
    "filePath": "/tmp/snapix-upload.png"
  }
}
```

Optional parameters:
- `fullPage: true` — capture the entire scrollable page instead of just the viewport
- `uid: "<element-uid>"` — capture a specific element (get UIDs from `take_snapshot`)
- `format: "jpeg" | "webp"` — alternative formats (with optional `quality: 0-100`)

### Step 4 — Upload to Snapix

```
mcp_metalevel_sna_snapix_upload_image
  imageFilePath="/tmp/snapix-upload.png"
  name="<descriptive name>"
  contentType="image/png"
```

Record the returned `id` and `variants.webp` URL from the response.

### Step 5 — Clean Up

Remove the temporary file from `/tmp/` (and the project folder if a copy was made there):

```bash
rm /tmp/snapix-upload.png
```

## Decision Points

| Situation | Action |
|-----------|--------|
| Chrome not connected | Follow [chrome-devtools-mcp.instructions.md](../../.github/instructions/chrome-devtools-mcp.instructions.md) recovery steps |
| Page has cookie/consent dialog | Use `mcp_io_github_chr_evaluate_script` to click dismiss button (Step 2) |
| Screenshot file is empty/missing | Verify the page is fully loaded; try adding a short `sleep` before capture |
| Multiple tabs open | Use `mcp_io_github_chr_list_pages` and `mcp_io_github_chr_select_page` to pick the right tab |
| Upload fails validation | Ensure `imageFilePath` param is used (not `filePath`) with `contentType` |

## Completion Criteria

- [ ] Screenshot file verified (`ls -la /tmp/snapix-upload.png` shows non-zero size)
- [ ] Upload response contains `id` and `variants.webp` URL
- [ ] Temp file removed from filesystem
- [ ] Snapix image URL shared with user
