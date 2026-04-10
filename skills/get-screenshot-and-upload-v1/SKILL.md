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
- **Snapix MCP configured and authenticated** (`mcp_snapix_*` tools available)

### Fallback Method
- **Chrome with remote debugging**: Running on `http://127.0.0.1:9222` (only needed if integrated browser is unavailable)
  See [chrome-devtools-mcp instructions](../../.github/instructions/chrome-devtools-mcp.instructions.md) for setup details.

## Procedure

### Decision Flow (Priority Order)
1. **Integrated Browser** (VS Code built-in tools) - Primary method
2. **Chrome DevTools MCP** - Secondary method
3. **Python CDP Script** - Fallback method (v1 legacy)

### Step 1 — Choose Method & Navigate

#### Option A: Integrated Browser (Recommended)
```javascript
open_browser_page url="<target-url>"
run_in_terminal command="sleep 3" explanation="Wait for page load" goal="Allow page to fully render"
```

#### Option B: Chrome DevTools MCP (Fallback)
```
mcp_io_github_chr_new_page url="<target-url>"
run_in_terminal command="sleep 3" explanation="Wait for page load" goal="Allow page to fully render"
```

#### Option C: Python CDP Script (Legacy Fallback)
Only use if both integrated browser and chrome-devtools-mcp fail.

### Step 2 — Dismiss Dialogs (if any)

#### For Integrated Browser:
```javascript
read_page pageId="<page-id>"
click_element pageId="<page-id>" element="dismiss button" selector="button[aria-label='Reject all'], button:has-text('Accept')"
```

#### For Chrome DevTools MCP:
```js
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
```

Wait 1–2 seconds after dismissal before proceeding.

### Step 3 — Capture Screenshot

#### For Integrated Browser:
```javascript
screenshot_page pageId="<page-id>" element="viewport"
```

#### For Chrome DevTools MCP:
```json
mcp_io_github_chr_take_screenshot arguments='{"format": "png", "filePath": "/tmp/snapix-upload.png"}'
```

#### For Python CDP Script (Legacy):
**3a.** Get the target tab ID:
```bash
node -e "
const http = require('http');
http.get('http://127.0.0.1:9222/json', (res) => {
  let d = ''; res.on('data', c => d += c);
  res.on('end', () => console.log(d));
}).on('error', e => console.error(e));
"
```

**3b.** Capture and save using the [CDP screenshot script](./scripts/cdp-screenshot.py):
```bash
python3 .agents/skills/get-screenshot-and-upload/scripts/cdp-screenshot.py \
  <PAGE_ID> /tmp/snapix-upload.png
```

### Step 4 — Upload to Snapix (All Methods)

All methods should save the screenshot to `/tmp/snapix-upload.png` for consistent upload:

```
mcp_snapix_snapix_upload_image
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

### Method Selection
| Situation | Action |
|-----------|--------|
| **Integrated browser tools available** | **Use as primary method** - Most reliable, no external dependencies |
| **Integrated browser not available** | Fall back to chrome-devtools-mcp |
| **Chrome not connected** | Follow [chrome-devtools-mcp.instructions.md](../../.github/instructions/chrome-devtools-mcp.instructions.md) recovery steps |
| **All browser methods fail** | Use Python CDP script (v1 legacy fallback) |

### Integrated Browser Specific
| Situation | Action |
|-----------|--------|
| Page has cookie/consent dialog | Use `read_page` to inspect, then `click_element` to dismiss |
| Screenshot returns URI instead of file | Agent automatically handles file conversion for upload |
| Multiple browser pages open | Use page ID from `open_browser_page` response |

### Chrome DevTools MCP Specific
| Situation | Action |
|-----------|--------|
| Page has cookie/consent dialog | Use `mcp_io_github_chr_evaluate_script` to click dismiss button |
| `ws` Node module missing | Use the Python CDP script instead |
| Multiple tabs open | Get tab list via `/json` endpoint and match by URL |
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
