import { GoLinkCreate, GoLinkList } from "api/golinks";
import { fromHono } from "chanfana";
import { Context, Hono } from "hono";
import { cors } from "hono/cors";
import { EnvBindings, Env } from "./types";
import { getDiscordInvite, getLink } from "lib/db";
import { adminApiKey, contact, getWorkersDashboardUrl, homepage, servers } from "lib/constants";
import { DiscordInviteLinkCreate, DiscordInviteLinkList } from "api/discord";
import { adminApiKeyAuth } from "lib/auth";

// Start a Hono app
const app = new Hono<{ Bindings: EnvBindings<Env> }>();
app.use("/openapi.json", cors());
app.use(
  "/api/*",
  cors({
    origin(origin, c) {
      if (origin.endsWith("andreijiroh.xyz") || origin.endsWith("ajhalili2006.workers.dev")) {
        return origin;
      }
    },
    allowHeaders: ["X-Golinks-Admin-Key", "E-Tag"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "HEAD"],
    credentials: true,
  }),
);
app.use("/api/*", adminApiKeyAuth)

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
  },
});

openapi.registry.registerComponent("securitySchema", "adminApiKey", adminApiKey);

// Register OpenAPI endpoints
openapi.get("/api/links", GoLinkList);
openapi.post("/api/links", GoLinkCreate);
openapi.get("/api/discord-invites", DiscordInviteLinkList);
openapi.post("/api/discord-invites", DiscordInviteLinkCreate);

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
    return c.newResponse(`404 Not Found`, 404);
  }
});
app.get("/discord/:inviteCode", async (c) => {
  try {
    const { inviteCode } = c.req.param();
    console.log(`[redirector]: incoming request with path - /discord/${inviteCode}`);
    const result = await getDiscordInvite(c.env.golinks, inviteCode);

    return c.redirect(`https://discord.gg/${result.inviteCode}`);
  } catch (error) {
    return c.newResponse("Either that server is not on our records or something went wrong on our side.", 404);
  }
});

// Export the Hono app
export default app;
