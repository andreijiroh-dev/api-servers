# `go.andreijiroh.xyz` / `wiki.andreijiroh.xyz/go/`

The codebase behind my public golink server, a bit different from Go-based
golink server for tailnets by Tailscale.

## Implementation detail

This whole server is currently implemented as a Cloudflare Worker, with two seperate KV namespaces for presisting shortlinks, although using D2 would be also fun since `golang:github.com/tailscale/golink` use sqlite for presistence too.

## Deployment checklist

If you are going to deploy your own using this codebase, complete the
checklist to get things started.

- [ ] Create two KV namespaces, one for regular golinks and another for wikilinks-styled ones.
- [ ] Replace the KV namespace IDs with the ones you created in `wrangler.toml`.
- [ ] Update routes in `wrangler.toml` to use your own domain and adjust as needed.
- [ ] Sign in to CLI and deploy: `yarn wrangler login && yarn deploy`
