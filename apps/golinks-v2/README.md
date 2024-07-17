# `@andreijiroh-dev/golinks-rewrite`

Made as part of [Hack Club Arcade / Summer of Making 2024](https://hackclub.com/arcade) ([see the scrapbook][scrapbook] or [the progress log])

A rewrite of [`golinks` Cloudflare Workers code](../golinks/), now with OpenAPI 3.1
powered by [chanfana](https://github.com/cloudflare/chanfana) and
[Hono](https://github.com/honojs/hono).

## Environments

* Staging: https://golinks-next-staging.ajhalili2006.workers.dev (use `gostg_4487705fd01888c0efeb78cf` as API key, might reset data)
* Production: https://golinks-next.ajhalili2006.workers.dev

## Development

1. Run `yarn` to install dependencies and generate Prisma client code with `yarn types:prisma-client`.
2. Sign in with Cloudflare for Wrangler CLI: `yarn wrangler login`
3. Run migrations to init things: `yarn migrations:apply --local`
4. Run local dev server: `yarn dev`
5. Once everything up, open the Swagger-generated API docs at <http://localhost:35120/api/docs>[^1] and happy hacking.

[^1]: Look for port `35120` on Ports if you're on a remote dev environment, especially for GitHub Codespaces and Gitpod users.
