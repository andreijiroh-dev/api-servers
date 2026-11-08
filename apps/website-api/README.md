# `api.andreijiroh.dev`

Personal utility API server and decentralized guestbook, powered by **Hono**, **Chanfana** (OpenAPI), and deployed on **Appwrite Cloud Functions** (`deno-2.6` runtime).

- **Docs:** <https://api.andreijiroh.dev/docs>
- **Frontend / Zensical integration:** <https://gitlab.com/andreijiroh-dev/website>

---

## Features

- **Meta Endpoints:** Metadata about Andrei Jiroh, tech stack, and Linux setups (`/meta`, `/meta/me`, `/meta/tech-stack`, `/meta/linux`).
- **Atmosphere-Native Guestbook (`/guestbook`):**
  - Signatures live on the **visitor's own PDS** in the AT Protocol.
  - Supports primary lexicon `dev.andreijiroh.guestbook.entry` and compatibility lexicon `is.dame.guestbook.entry`.
  - Backend verifies record existence from the signer's PDS repository, runs moderation checks against host mutes/blocks, and indexes approved entries into **Appwrite TablesDB**.
  - Serves single random approved entries or paginated lists (`?all=true`) for client-side rendering on Zensical.
- **Dual Runtime Support:**
  - Deployed to Appwrite Functions via default export handler (`req, res`).
  - Runs locally with native `Deno.serve` (`deno task dev`).

---

## Guestbook Endpoints

- **`GET /guestbook`**: Returns a random approved guestbook signature.
  - Query parameters:
    - `all`: `true` to return an array of entries.
    - `limit`: Maximum entries (default 25, max 50).
    - `offset`: Pagination offset.
- **`POST /guestbook/entry`** (or `POST /guestbook`):
  - Submits an AT-URI to index.
  - Payload: `{ "at_uri": "at://did:plc:.../dev.andreijiroh.guestbook.entry/3lb..." }`

---

## Environment Variables

Encrypted via **`dotenvx`**:
```bash
dotenvx set VARIABLE_NAME "value"
```

In Appwrite Cloud Function settings:
- `DOTENV_PRIVATE_KEY` - Encryption key for runtime decryption.
- `APPWRITE_DATABASE_ID` - Target database ID (defaults to `default`).
- `APPWRITE_TABLE_GUESTBOOK` - Table name for indexed guestbook entries (default: `guestbook_entries`).
- `ATPROTO_HOST_DID` (or `HOST_DID`) - Andrei's DID (`did:plc:wcx4c3osbuzrwmxkqdfqygwv`) used for block/mute checks and backlink verification.
- `REQUIRE_MANUAL_APPROVAL` - Set to `true` to require manual approval before entries become public.

---

## Local Development

```bash
# Run with dotenvx decryption
dotenvx run -- deno task dev

# Or with raw Deno
deno task dev
```
Server starts on `http://localhost:3000` with Swagger/Scalar OpenAPI UI at `/docs`.
