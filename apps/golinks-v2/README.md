# `@andreijiroh-dev/golinks-rewrite`

[![Made with Prisma](http://made-with.prisma.io/dark.svg)](https://prisma.io)
[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/andreijiroh-dev/api-servers/tree/main/apps/golinks-v2)

Made as part of [Hack Club Arcade / Summer of Making 2024](https://hackclub.com/arcade) ([see the scrapbook][scrapbook] for all the deets).

A rewrite of [`golinks` Cloudflare Workers code](../golinks/), now with OpenAPI 3.1
powered by [chanfana](https://github.com/cloudflare/chanfana) and
[Hono](https://github.com/honojs/hono).

## Environments

- Staging: https://golinks-next-staging.ajhalili2006.workers.dev (see the docs below for testing in staging)
- Production: https://golinks-next.ajhalili2006.workers.dev

## Development

> Hack Hour/Arcade reviewer? [See the docs for testing the staging environment](./docs/hackclub-arcade.md) if you don't want to mess around prod.

1. Run `yarn` to install dependencies and generate Prisma client code with `yarn types:prisma-client`.
2. Sign in with Cloudflare for Wrangler CLI: `yarn wrangler login`
3. Run migrations to init things: `yarn migrations:apply --local`
4. Run local dev server: `yarn dev`
5. Once everything up, open the Swagger-generated API docs at <http://localhost:35120/api/docs>[^1] and happy hacking.

[^1]: Look for port `35120` on Ports if you're on a remote dev environment, especially for GitHub Codespaces and Gitpod users.
