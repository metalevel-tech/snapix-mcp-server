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

### Decision Flow
The skill follows this priority order:
1. **Integrated Browser** (VS Code built-in tools) - Primary method
2. **Chrome DevTools MCP** - Fallback if integrated browser unavailable
3. **Python CDP Script** - Last resort fallback

### Step 1 — Check Available Methods & Navigate

#### Option A: Integrated Browser (Recommended)
Use VS Code's built-in browser tools:

```javascript
// Open a new browser page
open_browser_page url="<target-url>"

// Wait for page to load
run_in_terminal command="sleep 3" explanation="Wait for page load" goal="Allow page to fully render"
```

#### Option B: Chrome DevTools MCP (Fallback)
Use chrome-devtools-mcp if integrated browser is unavailable:

```
mcp_io_github_chr_new_page url="<target-url>"
```

Wait a few seconds for the page to load (`run_in_terminal`: `sleep 3`).

### Step 2 — Dismiss Dialogs (if any)

#### For Integrated Browser:
Use `read_page` to check content, then `click_element` to dismiss dialogs:

```javascript
// Read page to see if dialogs exist
read_page pageId="<page-id>"

// If dialog found, click dismiss button
click_element pageId="<page-id>" element="dismiss button" selector="button[aria-label='Reject all'], button:has-text('Accept')"
```

#### For Chrome DevTools MCP:
Use the snapshot and evaluate script as before:

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

### Step 3 — Capture Screenshot

#### For Integrated Browser:
Use `screenshot_page` to capture the viewport:

```javascript
screenshot_page pageId="<page-id>" element="viewport"
```

The screenshot will be saved automatically. For full-page screenshots or element-specific captures, additional tools may be needed.

#### For Chrome DevTools MCP:
Use `mcp_io_github_chr_take_screenshot` with the `filePath` parameter:

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

### Step 4 — Prepare Screenshot for Upload

#### For Integrated Browser:
The `screenshot_page` tool returns an image URI. You need to:
1. Save the screenshot to a temporary file
2. Use that file for upload

Example workflow:
```javascript
// Take screenshot (returns image URI)
screenshot_page pageId="<page-id>" element="viewport"

// The image is automatically saved. For programmatic access,
// you may need to use additional tools to save the URI to a file.
// In practice, the agent handles this automatically.
```

#### For Chrome DevTools MCP:
The screenshot is already saved to `/tmp/snapix-upload.png`.

### Step 5 — Upload to Snapix

```
mcp_metalevel_sna_snapix_upload_image
  imageFilePath="/tmp/snapix-upload.png"
  name="<descriptive name>"
  contentType="image/png"
```

Record the returned `id` and `variants.webp` URL from the response.

### Step 6 — Clean Up

Remove the temporary file from `/tmp/` (and the project folder if a copy was made there):

```bash
rm /tmp/snapix-upload.png
```

## Complete Examples

### Example 1: Integrated Browser Workflow
```javascript
// 1. Open the target URL in integrated browser
open_browser_page url="https://example.com"

// 2. Wait for page to load
run_in_terminal command="sleep 3" explanation="Wait for page load" goal="Allow page to fully render"

// 3. Check for and dismiss dialogs (if any)
read_page pageId="<page-id>"
// If dialog found:
click_element pageId="<page-id>" element="reject button" selector="button:has-text('Reject all')"

// 4. Take screenshot
screenshot_page pageId="<page-id>" element="viewport"

// 5. Upload to Snapix (agent handles file conversion)
mcp_metalevel_sna_snapix_upload_image
  imageFilePath="/tmp/snapix-upload.png"
  name="Example.com homepage"
  contentType="image/png"

// 6. Clean up
run_in_terminal command="rm /tmp/snapix-upload.png" explanation="Remove temporary file" goal="Clean up after upload"
```

### Example 2: Chrome DevTools MCP Fallback
```javascript
// 1. Try integrated browser first (if fails, fall back)
// 2. Navigate with chrome-devtools-mcp
mcp_io_github_chr_new_page url="https://example.com"

// 3. Wait for load
run_in_terminal command="sleep 3" explanation="Wait for page load" goal="Allow page to fully render"

// 4. Dismiss dialogs
mcp_io_github_chr_evaluate_script script="() => {
  const buttons = document.querySelectorAll('button');
  for (const btn of buttons) {
    if (btn.textContent.trim() === 'Reject all' || btn.textContent.trim() === 'Accept') {
      btn.click();
      return 'dismissed';
    }
  }
  return 'no dialog';
}"

// 5. Take screenshot
mcp_io_github_chr_take_screenshot arguments='{"format": "png", "filePath": "/tmp/snapix-upload.png"}'

// 6. Upload to Snapix
mcp_metalevel_sna_snapix_upload_image
  imageFilePath="/tmp/snapix-upload.png"
  name="Example.com via Chrome DevTools"
  contentType="image/png"

// 7. Clean up
run_in_terminal command="rm /tmp/snapix-upload.png" explanation="Remove temporary file" goal="Clean up after upload"
```

## Decision Points

### Method Selection
| Situation | Action |
|-----------|--------|
| **Integrated browser tools available** | **Use as primary method** - Most reliable, no external dependencies |
| **Integrated browser not available** | Fall back to chrome-devtools-mcp |
| **Chrome not connected** | Follow [chrome-devtools-mcp.instructions.md](../../.github/instructions/chrome-devtools-mcp.instructions.md) recovery steps |
| **All browser methods fail** | Use Python CDP script (v1 fallback) or ask user for manual screenshot |

### Integrated Browser Specific
| Situation | Action |
|-----------|--------|
| Page has cookie/consent dialog | Use `read_page` to inspect, then `click_element` to dismiss |
| Screenshot returns URI instead of file | Agent automatically handles file conversion for upload |
| Multiple browser pages open | Use page ID from `open_browser_page` response |
| Page not loading properly | Add `sleep` before screenshot, check console errors |

### Chrome DevTools MCP Specific
| Situation | Action |
|-----------|--------|
| Page has cookie/consent dialog | Use `mcp_io_github_chr_evaluate_script` to click dismiss button |
| Screenshot file is empty/missing | Verify page is fully loaded; add `sleep` before capture |
| Multiple tabs open | Use `mcp_io_github_chr_list_pages` and `mcp_io_github_chr_select_page` |
| Upload fails validation | Ensure `imageFilePath` param is used (not `filePath`) with `contentType` |

## Completion Criteria

### For All Methods
- [ ] Screenshot successfully captured (viewport or specified element)
- [ ] Screenshot saved to temporary file (`/tmp/snapix-upload.png`)
- [ ] Upload response contains `id` and `variants.webp` URL
- [ ] Temp file removed from filesystem
- [ ] Snapix image URL shared with user

### Method-Specific Verification
- **Integrated Browser**: Page loaded successfully, screenshot captured without errors
- **Chrome DevTools MCP**: Chrome connection established, CDP commands executed
- **Python CDP Script**: Chrome running with remote debugging, script executed successfully
