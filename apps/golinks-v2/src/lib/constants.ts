import { EnvBindings, Env } from "types";

export const adminApiKey = {
  type: "apiKey",
  name: "X-Golinks-Admin-Key",
  in: "header",
  description: "Superadmin API key. This is temporary while we're working on support for managing API tokens in the database.",
};

export const homepage = "https://wiki.andreijiroh.xyz/golinks";
export const sources = "https://github.com/andreijiroh-dev/api-servers/tree/main/apps/golinks-v2";

export const contact = {
  name: "Andrei Jiroh Halili",
  url: sources,
  email: "ajhalili2006@andreijiroh.xyz",
};

export function getWorkersDashboardUrl(env: EnvBindings<Env>["DEPLOY_ENV"]) {
  if (env == "production") {
    return "https://dash.cloudflare.com/cf0bd808c6a294fd8c4d8f6d2cdeca05/workers/services/view/golinks-next/production";
  } else {
    return "https://dash.cloudflare.com/cf0bd808c6a294fd8c4d8f6d2cdeca05/workers/services/view/golinks-next-staging/production";
  }
}

export const servers = [
  {
    url: "https://go.andreijiroh.xyz",
    description: "Production envrionment",
  },
  {
    url: "https://staging.go-next.andreijiroh.xyz",
    description: "Staging environment",
  },
  {
    url: "https://stellapent-cier.fawn-cod.ts.net",
    description: "Development environment (proxied by Tailscale funnel, limited availability)",
  },
  {
    url: "http://localhost:35120",
    description: "Local development environment via miniflare",
  },
];

export const tags = [
  {
    name: "golinks",
    description: "Personal golinks and link shortener",
    externalDocs: {
      description: "Learn more about golinks",
      url: homepage,
    },
  },
  {
    name: "discord-invites",
    description: "Custom Discord invite links at `go/discord/<code>`",
    externalDocs: {
      description: "Add your Discord invite code",
      url: "https://go.andreijiroh.xyz/feedback/add-discord-invite",
    },
  },
];

export const discordServerNotFound = (url?: string) => `
Either that server is not on our records or something went wrong on our side.

If you are still seeing this, please file a issue at https://go.andreijiroh.xyz/feedback/broken-link${url !== undefined ? `?url=${url}` : ""}`;
export const golinkNotFound = (url?: string) => `\
Either that golink is not on our records or has been changed.

Still seeing this? File a issue at https://go.andreijiroh.xyz/feedback/broken-link${url !== undefined ? `?url=${url}` : ""}`;
