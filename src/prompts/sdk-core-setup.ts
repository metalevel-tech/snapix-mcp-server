import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const PROMPT_BODY = `Set up **Snapix SDK Core** (\`@metalevel/snapix-sdk-core\`) in this project by following these steps exactly:

## Step 1 — Read the live documentation

Call \`snapix_get_docs\` with slug \`sdk\` to read the Snapix SDK Core integration guide.
Call \`snapix_get_docs\` with slug \`mcp\` to read the MCP setup reference.
Use both documents as the authoritative source for installation and configuration details.

## Step 2 — Install the package

Detect the package manager in use (check for \`pnpm-lock.yaml\`, \`yarn.lock\`, or \`package-lock.json\`, in that order).
Install the package with the appropriate command:

- pnpm: \`pnpm add @metalevel/snapix-sdk-core\`
- yarn: \`yarn add @metalevel/snapix-sdk-core\`
- npm: \`npm install @metalevel/snapix-sdk-core\`

## Step 3 — Configure environment variables

Determine the correct \`.env\` file by checking in this priority order:
1. \`.env.local\` — use if it exists
2. \`.env\` — use if it exists
3. None found — create \`.env.local\`

**Append** the following lines to the chosen file. Do NOT overwrite or delete any existing content.
Leave values blank so the developer can fill them in:

\`\`\`
# Snapix SDK Core — https://www.snapix.space/docs/sdk
SNAPIX_API_KEY=
SNAPIX_BASE_URL=
SNAPIX_BUCKET_KEY=
SNAPIX_LOG_LEVEL=
\`\`\`

## Step 4 — Confirm

Report back which package manager was used, which \`.env\` file was modified (or created), and remind the developer to fill in \`SNAPIX_API_KEY\` — a free key can be obtained at https://www.snapix.space/user/api-keys.`;

export function registerSdkCoreSetupPrompt(server: McpServer): void {
  server.registerPrompt(
    "snapix_setup_sdk_core",
    {
      title: "Setup Snapix SDK Core",
      description:
        "Guided setup of @metalevel/snapix-sdk-core: reads live docs, installs the package with the detected package manager, and appends SNAPIX_* environment variables to the correct .env file.",
    },
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: PROMPT_BODY,
          },
        },
      ],
    })
  );
}
