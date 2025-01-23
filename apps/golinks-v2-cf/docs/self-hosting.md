# Running your own instance

## Alternatives to this

If you prefer not to use Cloudflare's developer platform for any reasons, you can technically

## Prep work

- Update the `account_id` by pointing to your own Cloudflare account ID.

```diff
name = "golinks-next"
main = "src/index.tsx"
compatibility_date = "2024-07-12"
-account_id = "cf0bd808c6a294fd8c4d8f6d2cdeca05"
+account_id = "your-cloudflare-account-id-here"
```

* Create two KV namespaces for Slack bot tokens with one for both `wrangler dev` and stagingm another for production, and change `kv_namespaces[0].id` into the ID values of these created via CLI. See the diff after the wrangler commands on how you should replace them.

```bash
yarn wrangler kv namespace create slack-bot-token --env staging
yarn wrangler kv namespace create slack-bot-token --env production
```

```diff
kv_namespaces = [
-	{ binding = "slackBotTokens", id = "24a1f8bb9d434e97a490c43b74435e64" }
+	{ binding = "slackBotTokens", id = "stg-env-namespace-id-here" }
]

# snip...

[env.staging]
kv_namespaces = [
-	{ binding = "slackBotTokens", id = "24a1f8bb9d434e97a490c43b74435e64" }
+	{ binding = "slackBotTokens", id = "stg-env-namespace-id-here" }
]

# snip...

[env.production]
kv_namespaces = [
-	{ binding = "slackBotTokens", id = "21b6d6aaacbf4f04b52a66a9ed11fcd3" }
+	{ binding = "slackBotTokens", id = "production-env-namespace-id-here" }
]
```

- For the D1 database, repeat but replace `kv namespace create` with `d1 create`.

```bash
yarn wrangler d1 create golinks-db-preview
yarn wrangler d1 create golinks-db
```

```diff
d1_databases = [
-    { binding = "golinks", database_name = "golinks-db-preview", database_id = "0b415a64-cc61-4c2b-a7c8-2d223f18e996", migrations_dir = "migrations" },
-    { binding = "golinks", database_name = "golinks-db-preview", database_id = "0b415a64-cc61-4c2b-a7c8-2d223f18e996", migrations_dir = "migrations" },
]

[env.staging]
d1_databases = [
-    { binding = "golinks", database_name = "golinks-db-preview", database_id = "0b415a64-cc61-4c2b-a7c8-2d223f18e996", migrations_dir = "migrations" },
+    { binding = "golinks", database_name = "golinks-db-preview", database_id = "stg-d1-id-here", migrations_dir = "migrations" },
]

[env.production]
d1_databases = [
-    { binding = "golinks", database_name = "golinks-db-preview", database_id = "0b415a64-cc61-4c2b-a7c8-2d223f18e996", migrations_dir = "migrations" },
+    { binding = "golinks", database_name = "golinks-db-preview", database_id = "prod-d1-id-here", migrations_dir = "migrations" },
]
```

## Secret names and variables

- `BASE_URL` - Used as a prefix for URLs, especially in OAuth callback URLs.
- `GITHUB_OAUTH_ID` and `GITHUB_OAUTH_SECRET` - GitHub OAuth client ID and secret for token generation service
- `SLACK_OAUTH_ID` and `SLACK_OAUTH_SECRET` - Slack app OAuth client ID and secret for app installs to work, stored on KV via `@slack/oauth`'s `installationStore`.

### Setup

- Add the secrets first.

```bash
# first, rotate the keys by resetting dotenv files
rm .env.staging .env.production && touch .env.staging .env.production

# add them via dotenvx
yarn dotenvx set -f .env.production -- SLACK_OAUTH_ID
yarn dotenvx set -f .env.production -- SLACK_OAUTH_SECRET
yarn dotenvx set -f .env.production -- GITHUB_OAUTH_ID
yarn dotenvx set -f .env.production -- GITHUB_OAUTH_SECRET

# ..and then pipe to wrangler secret put command
yarn dotenvx get -f .env.production -- SLACK_OAUTH_ID | yarn wrangler secret put SLACK_OAUTH_ID --env production
```
