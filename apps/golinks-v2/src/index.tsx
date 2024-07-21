import { GoLinkCreate, GoLinkList } from "api/golinks";
import { fromHono } from "chanfana";
import { Context, Hono } from "hono";
import { cors } from "hono/cors";
import { EnvBindings, Env } from "./types";
import { getDiscordInvite, getLink } from "lib/db";
import {
  adminApiKey,
  contact,
  getWorkersDashboardUrl,
  homepage,
  servers,
  discordServerNotFound,
  golinkNotFound,
  tags,
} from "lib/constants";
import { DiscordInviteLinkCreate, DiscordInviteLinkList } from "api/discord";
import { adminApiKeyAuth } from "lib/auth";
import { DeprecatedGoLinkPage } from "pages/deprecated-link";
import { CommitHash, PingPong } from "api/meta";
import { prettyJSON } from "hono/pretty-json";
import { generateNewIssueUrl, handleOldUrls } from "lib/utils";
import { handleSlackCommand, slackOAuth } from "api/slack";

// Start a Hono app
const app = new Hono<{ Bindings: EnvBindings<Env> }>();
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
app.use("/api/*", adminApiKeyAuth);
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

openapi.registry.registerComponent("securitySchemes", "adminApiKey", adminApiKey);

// Register OpenAPI endpoints
openapi.get("/api/links", GoLinkList);
openapi.post("/api/links", GoLinkCreate);
openapi.get("/api/discord-invites", DiscordInviteLinkList);
openapi.post("/api/discord-invites", DiscordInviteLinkCreate);
openapi.get("/api/ping", PingPong);
openapi.get("/api/commit", CommitHash);
app.post("/api/slack/slash-commands/:command", async (c) => handleSlackCommand(c))

// Slack bot and slash commands
app.get("/slack", async (c) => slackOAuth(c));
app.get("/slack/callback", async (c) => slackOAuth(c));

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

app.get("/:link", async (c) => {
  try {
    const { link } = c.req.param();
    console.log(`[redirector]: incoming request with path - ${link}`);
    const result = await getLink(c.env.golinks, link);
    console.log(`[redirector]: resulting data - ${JSON.stringify(result)}`);
    if (!result.targetUrl) {
      return c.newResponse(
        JSON.stringify({
          sucesss: false,
          error: "Not Found",
        }),
        404,
        {
          "Content-Type": "application/json",
        },
      );
    }
    return c.redirect(result.targetUrl);
  } catch {
    return c.newResponse(golinkNotFound(c.req.url), 404);
  }
});
app.get("/discord/:inviteCode", async (c) => {
  try {
    const { inviteCode } = c.req.param();
    console.log(`[redirector]: incoming request with path - /discord/${inviteCode}`);
    const result = await getDiscordInvite(c.env.golinks, inviteCode);

    return c.redirect(`https://discord.gg/${result.inviteCode}`);
  } catch (error) {
    console.error(`[prisma-client]`, error);
    return c.newResponse(discordServerNotFound(c.req.url), 404);
  }
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

// Export the Hono app
export default app;
