# Migration Plan: apps/website-api from Deno Deploy to Appwrite Functions

**Date:** November 2026  
**Status:** Deployed & Verified Live on Appwrite Cloud Functions (`deno-2.6`)  
**Target:** Appwrite Functions (`deno-2.6` runtime) + Appwrite Databases (TablesDB) + Atmosphere (AT Protocol)  
**Upstream Consumer:** Zensical-based static site (`https://gitlab.com/andreijiroh-dev/website`)
**AI tooling used**: Gemini 3.8 Flash via OpenCode

---

## 1. Context & Objectives

Following Deno's transition towards Cloudflare and the deprecation timeline for Deno Deploy, `apps/website-api/` is migrating to **Appwrite Functions** on Appwrite Cloud (leveraging GitHub Student Developer Pack perks) per [Appwrite's Deno Deploy Alternative](https://appwrite.io/blog/post/deno-deploy-alternative).

Key goals:
- Keep TypeScript and the Deno runtime intact using Appwrite's official `deno-2.6` Open Runtimes environment.
- Preserve the existing **Hono + Chanfana** OpenAPI routing, documentation (`/docs`), and schema validation.
- Transition off **Deno KV** by adopting **Appwrite Databases' TablesDB** (PostgreSQL-backed relational collections).
- Retire legacy/exploratory Spotify OAuth token and playback endpoints.
- Re-architect the Guestbook to be **native to the Atmosphere (AT Protocol)**:
  - Guestbook entries reside in the user's account repository on their own Personal Data Server (PDS).
  - The API receives and verifies the `at://` URI reference, storing indexed records in Appwrite TablesDB.
  - Moderation is tracked in TablesDB (`pending`, `approved`, `hidden`), supporting both programmatic moderation and client-side rendering for Andrei's Zensical static site.
- Keep secrets encrypted in git using **dotenvx**, decrypting with `DOTENV_PRIVATE_KEY` in production.

---

## 2. Architectural Design

### 2.1 Request / Response Bridge
Appwrite Functions use an event-driven signature:
```ts
export default async ({ req, res, log, error }) => { ... }
```
A lightweight adapter will bridge Appwrite's `req` object into a standard Web `Request`, pass it through `app.fetch(webReq)` (Hono + Chanfana), and translate the resulting `Response` back to `res.binary(...)` or `res.text(...)`.

Dual-mode local execution will be retained via:
```ts
if (import.meta.main) {
  Deno.serve({ port: Number(Deno.env.get("PORT")) || 3000 }, app.fetch);
}
```

### 2.2 Secrets Management (`dotenvx`)
- Local development: `dotenvx run -- deno task dev`
- Appwrite Cloud: Provide `DOTENV_PRIVATE_KEY` as an environment variable in Appwrite Function settings. At startup, the encrypted `.env` is decrypted into the runtime environment.

### 2.3 Storage: Appwrite TablesDB
Replacing Deno KV with Appwrite TablesDB for guestbook indexing:

**Table: `guestbook_entries`**
- `id` (string, PK)
- `at_uri` (string, unique): e.g. `at://did:plc:.../dev.andreijiroh.guestbook.message/3lb4abc`
- `author_did` (string): Author's decentralized identifier (`did:plc:...` or `did:web:...`)
- `author_handle` (string, optional): Cached handle (e.g. `user.bsky.social`)
- `rkey` (string): Record key in ATProto repo
- `cid` (string): Content ID commit hash
- `message_body` (string, optional): Cached copy of text content
- `status` (string): `pending` | `approved` | `flagged` | `hidden`
- `created_at` (datetime)
- `indexed_at` (datetime)

### 2.4 Atmosphere (AT Protocol) Integration & Lexicon Design

#### Supported Lexicons
The guestbook supports two collections for incoming signatures:
1. **Primary Lexicon**: `dev.andreijiroh.guestbook.entry` (custom namespace for Andrei Jiroh's ecosystem)
   - Subject points to: `at://<host-did>/dev.andreijiroh.guestbook/self` (or fallback `is.dame.guestbook/self`)
2. **Compatibility Lexicon**: `is.dame.guestbook.entry` (compatible with the wider `@dame.is` federated guestbook ecosystem)
   - Subject points to: `at://<host-did>/is.dame.guestbook/self`

Both lexicons share the same schema properties:
- `subject` (at-uri, required): The guestbook book singleton being signed.
- `text` (string, max 300 graphemes): Message to the host.
- `signature` (string, max 64 graphemes, optional): Display name override.
- `mark` (string, max 1 grapheme, optional): Emoji or glyph (e.g. `✨`, `🌱`).
- `location` (string, max 64 graphemes, optional): Free-text coarse location.
- `createdAt` (datetime, required): ISO-8601 timestamp.

#### Workflow & Moderation
1. **User Submission (`POST /guestbook/entry`)**:
   - The user creates the entry record in their own repository on their PDS (via ATProto OAuth or PDS client).
   - The client (e.g. Zensical static site `https://gitlab.com/andreijiroh-dev/website`) posts `{ at_uri }` to the API.
2. **Verification & Moderation**:
   - The API validates the AT-URI and ensures collection is either `dev.andreijiroh.guestbook.entry` or `is.dame.guestbook.entry`.
   - Resolves the author's DID document (via `https://plc.directory` or `https://<domain>/.well-known/did.json`) to find their PDS endpoint.
   - Fetches the record from their PDS via XRPC `com.atproto.repo.getRecord` (or Slingshot) to verify existence, signature, and matching subject.
   - Moderation checks:
     - Check author DID against the host's Bluesky block and mute lists (via AppView).
     - Check if author DID or `at_uri` is in the host's `hidden` list on the book record or database.
     - Auto-assign status: `approved` if clean, or `hidden`/`flagged` if muted/blocked.
   - Saves or updates indexed record metadata in Appwrite TablesDB.
3. **Public Display (`GET /guestbook`)**:
   - Fetches approved entries from Appwrite TablesDB (supports random entry or paginated list) for fast client-side rendering on Zensical without multi-hop PDS latency.
4. **Programmatic Moderation**:
   - Endpoints or Appwrite console actions allow the host to mark records as `approved` / `hidden`.

---

## 3. Implementation Steps

### Phase 1: Cleanup & Removal of Stale Code (Current Step)
- Remove `routes/music.ts`
- Remove `routes/internal/spotify.ts`
- Clean up Spotify-specific types in `lib/types.ts` (`OAuthTokenResponse`)
- Remove unused dependencies from `deno.json` (`@soundify/web-api`)
- Remove `kvApi` and `Deno.openKv` references from `lib/utils.ts` and `server.ts`
- Clean up legacy Spotify environment variable references

### Phase 2: Appwrite Client & TablesDB Setup
- Add Appwrite Server SDK (`npm:node-appwrite`) to `deno.json`
- Create `lib/appwrite.ts` with helper utilities to initialize Appwrite Client using ephemeral `x-appwrite-key` or `APPWRITE_FUNCTION_API_KEY`
- Define TablesDB query helpers for `guestbook_entries`

### Phase 3: AT Protocol / Atmosphere Guestbook Handler
- Create `lib/atproto.ts` for parsing `at://` URIs, resolving DIDs, and fetching records via XRPC `com.atproto.repo.getRecord`
- Update `routes/guestbook.ts`:
  - `POST /guestbook/entry`: Accepts and validates AT-URI, records to TablesDB
  - `GET /guestbook`: Returns random approved entry (or approved list for the static site)
  - Schema definitions for Chanfana OpenAPI documentation

### Phase 4: Appwrite Function Adapter & Server Configuration
- Refactor `server.ts` to implement the Appwrite Function default export handler wrapping `app.fetch`
- Verify OpenAPI documentation endpoint (`/docs`) works through the adapter
- Retain local execution capability (`deno task dev`)

### Phase 5: Configuration & Deployment (In Progress)
- **Database Created**: `website-api` (Appwrite Cloud `ajhalili2006-lairland` in `sfo`)
- **Table Created**: `guestbook_entries` in `website-api` with columns:
  - `at_uri` (varchar 512, unique index)
  - `author_did` (varchar 256, index)
  - `author_handle`, `author_name`, `author_avatar`
  - `collection`, `rkey`, `cid`, `subject`, `text`, `signature`, `mark`, `location`
  - `status` (varchar 32, index, default `approved`)
  - `signed_at`, `indexed_at`
- **Function Created**: `website-api`
  - Runtime: `deno-2.6`
  - Entrypoint: `server.ts`
  - Commands: `deno cache server.ts`
  - Execution permissions: `any`
  - Scopes: `databases.read`, `databases.write`, `tables.read`, `tables.write`, `rows.read`, `rows.write`
  - Variables configured: `APPWRITE_DATABASE_ID`, `APPWRITE_TABLE_GUESTBOOK`, `APPWRITE_ENDPOINT`
- Custom domain setup (`api.andreijiroh.dev`) via `proxy_create_function_rule` once deployed.
