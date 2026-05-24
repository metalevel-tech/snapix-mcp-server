# SnapiX & SnapiX MCP — LLM/AI Security Posture and Roadmap

> **Status:** Discussion document. Reflects the state of SnapiX and the SnapiX MCP server as of May 2026 and outlines a forward-looking roadmap for operating safely in the LLM/AI ecosystem.
>
> **Audience:** SnapiX maintainers, integrators evaluating SnapiX MCP for production use, and external developers asking due-diligence questions about how the service behaves under LLM-driven access.
>
> **Note on cross-repo placement:** The original request was to land this document under `docs/` in the **SnapiX** application repo (`pa4080/snapix`, currently private). Because the working environment is scoped to `metalevel-tech/snapix-mcp-server`, the document is being committed here first and can be ported to the SnapiX repo verbatim.

---

## 1. Context: where this document came from

We received the following question by email:

> Hi Spas,
> I read the Snapix MCP docs, especially the remote HTTP setup and the update and delete tool surface.
> I'm curious what are you doing for sandboxing and approvals right now?

The question targets the highest-risk corner of the MCP threat model: a **remote HTTP** MCP server (shared infrastructure rather than a per-user stdio process) exposing **destructive tools** (`snapix_update_image`, `snapix_delete_image`, `snapix_update_gallery`, `snapix_delete_gallery`). It is a security/due-diligence question rather than a usage question, and it deserves an honest answer rather than a marketing one.

The rest of this document is split into two parts:

1. **An honest snapshot of what SnapiX and SnapiX MCP do today** for isolation, authorization, and approvals.
2. **A roadmap** of concrete improvements we believe make sense for the LLM/AI era, with rough priorities.

---

## 2. Honest reply — what we do today

Short version: **SnapiX does not implement any LLM-specific sandboxing or approval mechanisms today.** The security posture of the MCP server is exactly the security posture of the underlying SnapiX REST API, with the same authentication and authorization model applied uniformly to human callers and LLM callers.

In more concrete terms:

### 2.1 Authentication and tenant isolation

- **API keys are per-user.** Every call to SnapiX — whether from a browser, a script, or an MCP client driven by an LLM — must carry a SnapiX API key. Keys are minted from the user's account page (`/user/api-keys`) and are bound to that user.
- **Each key has its own permission set per operation kind.** When a user creates a key they choose, per operation family (read, upload/generate, update, delete, gallery management, etc.), whether the key is allowed to perform that family. A "read-only" key cannot delete; a key without "generate" cannot spend credits on Gemini generations; and so on.
- **Tenant isolation is enforced server-side on every request.** The API resolves the key to a user and scopes every query/mutation to resources owned by that user. There is no shared-data path between users that an LLM (or anything else) could traverse via the MCP surface.
- **Buckets are also user-owned.** `SNAPIX_BUCKET_KEY` selects among the calling user's own buckets; it does not grant access to anyone else's storage.

### 2.2 Transport and runtime

- **Local (stdio) MCP server:** runs in the user's own process. The API key never leaves the user's machine other than in outbound HTTPS calls to `snapix.space`. Sandboxing is whatever the host (VS Code, Claude Desktop, etc.) provides.
- **Remote (HTTP) MCP server:** the hosted `/api/mcp` endpoint is **stateless** — no session persistence between requests, no shared in-memory state between callers, and the API key is taken from the `Authorization: Bearer …` header on every individual request. Each request is independently authenticated and authorized; one user's call cannot influence another user's call.

### 2.3 Rate limiting and quotas

- The MCP server inherits the **same rate limits** as the REST API and surfaces 429s back to the LLM client as retryable MCP errors.
- Credit-consuming operations (uploads, generates) are bounded by the user's credit balance. An LLM cannot run an unbounded billing attack against a user's wallet — once credits are exhausted the server returns a clear error and stops.

### 2.4 Approvals

- We **do not** implement server-side approval tokens, dry-run/preview modes, or two-phase commit for destructive tools.
- We rely on the **MCP client's built-in destructive-tool confirmation** UX (VS Code Copilot, Claude Desktop, etc. all prompt the user before invoking tools they consider destructive). Our tool metadata does not yet annotate destructiveness explicitly via the MCP `destructiveHint` / `readOnlyHint` annotations — the client decides based on tool naming and its own heuristics.
- We **do not** have user-visible audit logging for MCP-initiated mutations, nor an undo/restore path for deleted images or galleries.

### 2.5 What this means for the asker

> We don't do anything LLM-specific yet. The protections are the same protections the REST API has always had: every request needs an API key, keys are bound to a single user, keys carry per-operation permissions chosen by the user at creation time, and the remote HTTP endpoint is stateless and re-authenticates every call. Sandboxing of the LLM itself is delegated to the MCP client; approvals for destructive tools are delegated to whatever confirmation UX the client implements. Server-side approval tokens, dry-runs, audit trails, and explicit destructive-tool annotations are on the roadmap but not shipped.

That is the honest answer. The rest of this document is what we want to do about it.

---

## 3. Roadmap — making SnapiX and SnapiX MCP robust for the LLM/AI era

Items are grouped by theme. Within each theme, items are listed roughly in priority order, with a short "why it matters in an LLM context" rationale.

### 3.1 Authorization model

- **Scoped, short-lived MCP tokens derived from a long-lived API key.**
  Allow users to mint an ephemeral token from a parent API key with a narrower scope (e.g. "read-only", "no delete", "only this gallery", expires in 1 hour). LLM clients then use the ephemeral token. Compromise of the token has limited blast radius.
- **Resource-level ACLs (per-gallery, per-bucket).**
  Today, permissions are per operation family. The next step is per-resource: a key may be allowed to delete images in gallery A but not gallery B.
- **Allowed-origin / allowed-IP pinning for API keys.**
  Optional restriction so a stolen key only works from agreed origins.
- **Distinct annotation of MCP-issued keys.**
  Mark keys minted specifically for MCP use, separate from REST-only keys, so the user can revoke "AI access" in one click without breaking their other integrations.

### 3.2 Approval and confirmation surface

- **Honest MCP tool annotations.**
  Set the standard MCP tool annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`) on every tool so well-behaved clients can prompt appropriately. This is cheap and high-value.
- **Server-side two-phase commit for destructive tools.**
  Optional mode where `snapix_delete_image` / `snapix_delete_gallery` first return a confirmation token + a preview of what would be deleted, and require a second call with that token to actually execute. Token is single-use, time-bound, and bound to the original parameters.
- **Dry-run mode for `update`/`delete` tools.**
  A `dryRun: true` flag that returns exactly what the call *would* have changed without changing it. Lets agents reason about effects before committing.
- **Server-enforced "destructive operation budget".**
  Per-key configurable cap on destructive operations per minute/hour/day. Hitting the cap returns a retryable error; the user has time to notice if an LLM has gone wild.

### 3.3 Auditability and recovery

- **MCP audit log per user.**
  Every MCP-initiated call recorded with: tool name, parameters (redacted as appropriate), result status, source token id, client identifier (from `User-Agent` / MCP `clientInfo`). Surfaced in the SnapiX UI.
- **Soft-delete with restore window for images and galleries.**
  Default behaviour: deletions move to a recycle bin for N days (configurable per user). Hard-delete is a separate operation with its own permission flag. This is the single highest-leverage protection against LLM mistakes.
- **Webhooks / email notifications for destructive bursts.**
  "Your MCP key just deleted 47 images in 2 minutes — was that you?"
- **Versioning of image metadata.**
  Keep a short history of metadata changes so `snapix_update_image` is reversible without a full backup restore.

### 3.4 Input safety and prompt-injection hardening

- **Treat content fetched on the user's behalf as untrusted.**
  `snapix_get_docs`, image URLs fetched for uploads, generated image prompts, and any other content the server retrieves and returns to the LLM must be clearly framed as data, not instructions. We should review every tool response for stray text that could be interpreted as instructions by the model (classic indirect prompt injection vector through, e.g., image filenames, EXIF, or document content).
- **Cap response sizes and truncate aggressively.**
  Prevents a malicious or malformed remote document from filling the model's context and burying the user's actual intent.
- **Strict schema validation on inputs and outputs.**
  We already use Zod for inputs; extend the same rigor to anything we return to the LLM.

### 3.5 Operational robustness

- **Per-key observability.**
  Latency, error rate, credit burn per key, visible to the owning user. Anomalies (e.g. a sudden spike in `delete_image` from one key) should be easy to spot.
- **Graceful credit-exhaustion semantics for agents.**
  Today we return an error; we should also return a structured hint (`retryAfter`, `topUpUrl`) so agents can degrade gracefully instead of looping.
- **Idempotency keys for mutating tools.**
  Lets an agent safely retry an `upload` or `update` after a network blip without creating duplicates.
- **Pagination and result-set caps on `list_*` tools** to prevent context-window blowouts.

### 3.6 Transparency and documentation

- **Publish a Security & Trust page** that documents exactly the points in section 2 of this doc, plus the data lifecycle (where uploaded images are stored, retention policy, what we never train on).
- **Document the threat model for MCP usage** alongside the existing MCP docs. Make explicit what the user is trusting (the LLM, the MCP client, the network, SnapiX itself) at each transport mode.
- **Publish a recommended-key-scopes guide** ("for agentic use, mint a key with no `delete` permission unless you really need it").

### 3.7 SnapiX (application) — not MCP-specific but LLM-relevant

- **AI-content provenance metadata.**
  When an image is produced via `snapix_generate_image`, persist the prompt, model, and timestamp as image metadata, and (optionally) embed C2PA / IPTC `DigitalSourceType` markers indicating AI generation. Important for users who later publish these images.
- **Per-user opt-out of any future AI training on their content.**
  Document this commitment explicitly. Default: opt-out.
- **Bucket-level visibility flags** (public/private/unlisted) enforced consistently across the REST API, MCP, and CDN URLs, with clear surfacing in the MCP `get_*` responses so an LLM never gets confused about whether a URL is shareable.

---

## 4. Suggested next steps (small, concrete, near-term)

If we want to move the needle in the next iteration without a large refactor, the smallest high-value bundle is:

1. **Add MCP tool annotations** (`readOnlyHint` / `destructiveHint` / `idempotentHint`) to every tool in `src/tools/`. Pure metadata change, immediately improves client-side approval UX.
2. **Soft-delete for images and galleries** with a recycle bin window. Single biggest protection against LLM mistakes.
3. **MCP audit log surfaced in the user's SnapiX UI.** Even a read-only log dramatically improves trust.
4. **Publish a `/docs/security` page** mirroring section 2 of this document so questions like the one that triggered this work get a public, linkable answer.
5. **Ephemeral, scoped MCP tokens** as a follow-up once 1–4 are in.

Everything else in section 3 is worth doing but can be sequenced after these.

---

## 5. Appendix — original email and reasoning

Original message:

> Hi Spas,
> I read the Snapix MCP docs, especially the remote HTTP setup and the update and delete tool surface.
> I'm curious what are you doing for sandboxing and approvals right now?

Interpretation:

- **"Sandboxing"** here means: how is the blast radius of an LLM-driven call bounded? Tenant isolation, per-tool authorization, runtime isolation of the server, rate/credit limits, and what stops a prompt-injected agent from doing wide damage.
- **"Approvals"** here means: human-in-the-loop confirmation for destructive actions — MCP tool annotations, server-side confirmation tokens, dry-runs, audit trails, and undo paths.
- The combination "remote HTTP" + "update/delete" is deliberate: it's the shared-infrastructure + destructive-tools corner of the MCP threat model, which is the riskiest configuration and the one most worth probing.

The honest reply in section 2.5 is what should go back to the asker. The roadmap in section 3 is what we should do next.
