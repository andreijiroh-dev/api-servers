# `@andreijiroh-dev/api-servers`

![Hack Club](https://badges.api.lorebooks.wiki/badges/hackclub/hackclub)

Monorepo for different Cloudflare Workers and Deno Deploy hosted APIs I build
for personal projects.

## Currently maintained

- [`go.andreijiroh.dev`](https://github.com/andreijiroh-dev/golinks) - personal golinks and link shortener
([see the initial version](./apps/golinks-v1/), also the [Cloudflare Workers one](./apps/golinks-v2-cf/))
- [`api.andreijiroh.dev`](./apps/website-api/) - website and personal utility API

## Experimential

- [`oauth.libdns.obl.ong`](./apps/oblong-oauth-helper/) - OAuth flow callback server
for the upcoming API support on obl.ong subdomain service.

## CI

- [Dependabot Updates](https://github.com/andreijiroh-dev/api-servers/actions/workflows/dependabot/dependabot-updates)
  on GitHub Actions, although I do the updates myself via `yarn-upgrade-all` command.
