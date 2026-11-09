# `@andreijiroh-dev/api-servers`

![Hack Club](https://badges.api.lorebooks.wiki/badges/hackclub/hackclub)

Monorepo for different API servers I build for personal projects/infra and
as a way to practice backend dev outside of school hours.

## Gen AI disclosure

Coding agents, primarily OpenCode, are being used here both as force-multipler
and to help debugging issues, among other things a open-source dev would do with
AI tools. This is a personal monorepo project after all, so fork at your own risk.

## Directory

| Service | API endpoint | Source directory/repo | Description | Status |
| --- | --- | --- | --- | --- |
| API service for website | `https://api.andreijiroh.dev` | [`./apps/website-api`](./apps/website-api) | Website and personal utility API | Active development |
| golinks | `https://go.andreijiroh.dev` | TBD | personal golinks and link shortener outside of tailnet | Probably in backburner, may reuse OpenShort.link instead for maintability reasons. |
| golinks-v2-cf | `https://golinks.ajhalili2006.workers.dev` | [`./apps/golinks-v2-cf`](./apps/golinks-v2-cf/) | personal golinks and link shortener, powered by Workers + KV | Currently unused 
| golinks-v1 | N/A | [`./apps/golinks-v1`](./apps/golinks-v1/) | The initial version itself | Diabolically deprecated
| OAuth helper for obl.ong | `https://oauth.libdns.obl.ong` | [`./apps/oblong-oauth-helper`](./apps/oblong-oauth-helper/) | OAuth flow callback server for the upcoming API support on obl.ong subdomain service. | Experimental but the service's own selfhosted nameservers are kinda non-existent now |

## CI

- [Dependabot Updates](https://github.com/andreijiroh-dev/api-servers/actions/workflows/dependabot/dependabot-updates)
  on GitHub Actions, although I do the updates myself via `yarn-upgrade-all` command.

## License

[MPL-2.0](./LICENSE)
