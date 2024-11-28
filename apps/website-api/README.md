# `api.andreijiroh.dev`

Hono server for my utility API server, deployed on Deno Deploy. Basically used
for webhooks and calling different APIs without the pain of managing and finding
API keys by hand. Also hosts the JSON version of <https://andreijiroh.dev/humans.txt>,
with more verbose metadata and additional things.

Docs: <https://api.andreijiroh.dev/docs>

## Redirects

Currently, routes at `https://andreijiroh.dev/api/*` are redirected to
`api.andreijiroh.dev` via 3XX HTTP code to preserve the HTTP method when
redirecting requests.

## Internal endpoints

Some endpoints are for internal use only and often left undocumented from the
OpenAPI spec.

## Environment variables for self-hosting

You may need to reset the `DOTENV_PUBLIC_KEY` by blanking the `.env` file and using `dotenvx set`
to encrypt secrets as you add them.

### Spotify

- `SPOTIFY_OAUTH_CLIENT_[ID|SECRET]` - for exchanging OAuth authorization code into access tokens and
refreshing things behind the scenes.
- `SPOTIFY_USER_ID` - for checking if it is the admin user itself on callback URL
