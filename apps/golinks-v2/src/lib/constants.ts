import { EnvBindings } from "types";
export const homepage = "https://wiki.andreijiroh.xyz/golinks";
export const sources = "https://github.com/andreijiroh-dev/api-servers/tree/main/apps/golinks-v2";

export const userApiKey = {
  type: "http",
  scheme: "bearer",
  format: "JWT",
  description:
    "User bearer token in JWT format. The token will be checked server-side for expiration status and if it is revoked manually.",
  externalDocs: {
    description: "Request API access",
    url: "https://go.andreijiroh.xyz/request-api-access",
  },
};

export const contact = {
  name: "Andrei Jiroh Halili",
  url: sources,
  email: "ajhalili2006@andreijiroh.xyz",
};

export function getWorkersDashboardUrl(env: EnvBindings["DEPLOY_ENV"]) {
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
		name: "wikilinks",
		description: "golink-styled wikilinks"
	},
  {
    name: "discord-invites",
    description: "Custom Discord invite links at `go/discord/<code>`",
    externalDocs: {
      description: "Add your Discord invite code",
      url: "https://go.andreijiroh.xyz/feedback/add-discord-invite",
    },
  },
  {
    name: "meta",
    description: "Utility API endpoints to check API availability and get the commit hash of latest deploy",
  },
  {
    name: "debug",
    description: "Requires admin API key (aka the `ADMIN_KEY` secret) to access them.",
  },
];

export const discordServerNotFound = (url?: string) => `\
Either that server is not on our records (perhaps the slug is just renamed) or \
something went wrong on our side.

Still seeing this? Submit a ticket in our issue tracker using the following URL:

	https://go.andreijiroh.xyz/feedback/broken-link${url !== undefined ? `?url=${url}` : ""}`;

export const golinkNotFound = (url?: string) => `\
Either that golink is not on our records (perhaps the slug is just renamed) or something \
went wrong on our side.

Still seeing this? Submit a ticket in our issue tracker using the following URL:

	https://go.andreijiroh.xyz/feedback/broken-link${url !== undefined ? `?url=${url}` : ""}`;

export const wikilinkNotAvailable = `\
Golink-styled wikilinks are available in andreijiroh.xyz subdomains (and friends \
at the moment, especially in the main website and digital garden.`
