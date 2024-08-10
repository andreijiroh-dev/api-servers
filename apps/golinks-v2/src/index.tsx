import { GoLinkCreate, GoLinkDelete, GoLinkInfo, GoLinkList, GoLinkUpdate } from "api/golinks";
import { fromHono } from "chanfana";
import { Context, Hono } from "hono";
import { cors } from "hono/cors";
import { EnvBindings } from "./types";
import { getDiscordInvite, getLink } from "lib/db";
import {
  contact,
  getWorkersDashboardUrl,
  homepage,
  servers,
  discordServerNotFound,
  golinkNotFound,
  tags,
  userApiKey,
	wikilinkNotAvailable,
} from "lib/constants";
import { DiscordInviteLinkCreate, DiscordInviteLinkList } from "api/discord";
import { adminApiKeyAuth, slackAppInstaller } from "lib/auth";
import { DeprecatedGoLinkPage } from "pages/deprecated-link";
import { CommitHash, PingPong } from "api/meta";
import { prettyJSON } from "hono/pretty-json";
import { generateNewIssueUrl, handleOldUrls } from "lib/utils";
import {
  debugApiGetSlackBotToken,
  debugApiListSlackAppInstalls,
  debugApiTestSlackBotToken,
  handleSlackCommand,
  handleSlackInteractivity,
  slackOAuth,
  slackOAuthCallback,
} from "api/slack";
import { githubAuth } from "api/github";
import * as jose from "jose";
import { IncomingMessage, ServerResponse } from "node:http";
import { InstallationQuery } from "@slack/oauth";
import { WikiLinkCreate } from "api/wikilinks";
import { debugApiGetBindings } from "api/debug";
import { bearerAuth } from 'hono/bearer-auth'

// Start a Hono app
const app = new Hono<{ Bindings: EnvBindings }>();
app.use(prettyJSON());
app.use("/openapi.*", cors());
app.use(
  "/api/*",
  cors({
    origin(origin, c) {
      if (origin.endsWith("andreijiroh.xyz") || origin.endsWith("ajhalili2006.workers.dev") || origin.endsWith("fawn-cod.ts.net")) {
        return origin;
      }
    },
    allowHeaders: ["X-Golinks-Admin-Key", "E-Tag", "Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "HEAD"],
    credentials: true,
  }),
);

/**
 * Array of strings containing priviledged HTTP methods when calling the API.
 */
const privilegedMethods = ["POST", "PUT", "PATCH", "DELETE"]
/**
 * In addition to the values of `priviledgedMethods`, we also add `GET` requests
 * for debug API endpoints.
 */
const debugApiMethods = [ "GET", ...privilegedMethods ]
app.on(debugApiMethods, "/api/debug/*", async (c, next) => {
	const bearer = bearerAuth({
		verifyToken(token, c) {
			if (token == c.env.ADMIN_KEY) {
				return true
			}
		}
	})
	return bearer(c, next)
})
app.on("POST", "/api/slack/*", async (c, next) => {
	return await next()
})
app.on(privilegedMethods, "/api/*", async (c, next) => {
	const bearer = bearerAuth({
		verifyToken: async (token: string, context: Context) => {
			await console.log(`[auth]: received token - ${token}`)
			if (token == context.env.ADMIN_KEY) {
				return true
			}
		}
	})
	return bearer(c, next)
})
app.use("/*", async (c, next) => await handleOldUrls(c, next));

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: "/api/docs",
  schema: {
    info: {
      title: "Andrei Jiroh's golinks service",
      version: "0.1.0",
      contact,
      license: {
        name: "MPL-2.0",
        url: "https://github.com/andreijiroh-dev/api-servers/raw/main/LICENSE",
      },
    },
    servers,
    tags,
    externalDocs: {
      description: "Learn more about golinks and this service",
      url: homepage,
    },
  },
});

openapi.registry.registerComponent("securitySchemes", "userApiKey", userApiKey);

// Register OpenAPI endpoints in this section
openapi.get("/api/links", GoLinkList);
openapi.post("/api/links", GoLinkCreate);
openapi.get("/api/links/:slug", GoLinkInfo)
openapi.put("/api/links/:slug", GoLinkUpdate);
openapi.delete("/api/links/:slug", GoLinkDelete)
// category:wikilinks
openapi.post("/api/wikilinks", WikiLinkCreate)
// category:discord-invites
openapi.get("/api/discord-invites", DiscordInviteLinkList);
openapi.post("/api/discord-invites", DiscordInviteLinkCreate);
// category:meta
openapi.get("/api/ping", PingPong);
openapi.get("/api/commit", CommitHash);
// category: debug
openapi.get("/api/debug/slack/bot-token", debugApiGetSlackBotToken);
openapi.get("/api/debug/slack/auth-test", debugApiTestSlackBotToken);
openapi.get("/api/debug/slack/installs", debugApiListSlackAppInstalls)
openapi.get("/api/debug/bindings", debugApiGetBindings)

// Undocumented API endpoints: Slack integration
app.post("/api/slack/slash-commands/:command", async (c) => handleSlackCommand(c));
app.post("/api/slack/interactivity-feed", async (c) => handleSlackInteractivity(c));

// Slack bot and slash commands
app.get("/slack", async (c) => slackOAuth(c));
app.get("/auth/slack/callback", async (c) => slackOAuthCallback(c));
app.get("/auth/github", async (c) => githubAuth(c));
app.get("/auth/github/callback", async (c) => githubAuth(c));

app.get("/", (c) => {
  return c.redirect(homepage);
});

app.get("/favicon.ico", (c) => {
  return c.newResponse("404 Not Found", 404);
});

app.get("/workers/edit", (c) => {
  return c.redirect("https://github.dev/andreijiroh-dev/api-servers/blob/main/apps/golinks-v2/src/index.ts");
});
app.get("/workers/dashboard", (c) => {
  return c.redirect(getWorkersDashboardUrl(c.env.DEPLOY_ENV));
});
app.get("/workers", (c) => {
  const { origin } = new URL(c.req.url);
  return c.redirect(`${origin}/workers/dashboard`);
});

/* Old /edit/* stuff */
app.get("/edit", (c) => {
  return c.redirect("/workers/edit");
});

app.get("/landing/deprecated", (c) => {
  const params = c.req.query();

  if (!c.req.param()) {
    return c.newResponse("This is unexpected request for this route", 400);
  }

  return c.html(<DeprecatedGoLinkPage golink={params.golink} reason={params.reason} />);
});

app.get("/feedback/:type", (c) => {
  const { type } = c.req.param();
  const { url } = c.req.query();
  return c.redirect(generateNewIssueUrl(type, "golinks", url));
});

app.get("/:link", async (c) => {
  try {
    const { link } = c.req.param();
    console.log(`[redirector]: incoming request with path - ${link}`);
    const result = await getLink(c.env.golinks, link);
    console.log(`[redirector]: resulting data - ${JSON.stringify(result)}`);
    if (!result) {
      return c.newResponse(golinkNotFound(c.req.url), 404);
    }
    return c.redirect(result.targetUrl);
  } catch (error) {
    console.error(`[redirector]: error`, error);
    return c.newResponse(golinkNotFound(c.req.url), 500);
  }
});
app.get("/discord/:inviteCode", async (c) => {
  try {
    const { inviteCode } = c.req.param();
    console.log(`[redirector]: incoming request with path - /discord/${inviteCode}`);
    const result = await getDiscordInvite(c.env.golinks, inviteCode);
    if (!result) {
      return c.newResponse(discordServerNotFound(c.req.url), 404);
    }
    return c.redirect(`https://discord.gg/${result.inviteCode}`);
  } catch (error) {
    console.error(`[redirector]: error`, error);
    return c.newResponse(discordServerNotFound(c.req.url), 500);
  }
});
app.get("/go/:link", async (c) => {
	const url = new URL(c.req.url)
	const { hostname } = url

	if (c.env.DEPLOY_ENV != "production") {
		if (!hostname.endsWith("andreijiroh.xyz")) {
			return c.newResponse(wikilinkNotAvailable, 404)
		}
	}

  try {
    const { link } = c.req.param();
    console.log(`[redirector]: incoming request with path - ${link}`);
    const result = await getLink(c.env.golinks, link, "wikilinks");
    console.log(`[redirector]: resulting data - ${JSON.stringify(result)}`);
    if (!result) {
      return c.newResponse(golinkNotFound(c.req.url), 404);
    }
    return c.redirect(result.targetUrl);
  } catch (error) {
    console.error(`[redirector]: error`, error);
    return c.newResponse(golinkNotFound(c.req.url), 500);
  }
});

// Export the Hono app
export default app;
