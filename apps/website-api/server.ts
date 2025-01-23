import { Context, Hono } from "hono";
import { fromHono } from 'chanfana'
import { rootRouter } from "./routes/index.ts";
import { getTechStack, getLinuxSetup, getMe } from "./routes/seperatedStacks.ts";
import { pingServer } from "./routes/ping.ts";
import { authorizeRedirect, handleSpotifyCallback } from "./routes/internal/spotify.ts";
import { kvApi } from "./lib/utils.ts";
import { nowPlayingSpotify } from "./routes/music.ts";
import { showRandomGuestbookMessage, writeToGuestbook_gh } from "./routes/guestbook.ts";
export const kv = await kvApi(Deno.env.get("DENO_KV_URL"))

const app = new Hono()
const openapi = fromHono(app, {
	docs_url: "/docs",
	schema: {
		info: {
			title: "~ajhalili2006's personal API",
			summary: "Andrei Jiroh's API server for utility, webhooks and then some. (Warning: API docs in progress and you may be poking around internal APIs then)",
			description: `\
This personal API server is built as part of [High Seas](https://highseas.hackclub.com) and \
[RaspAPI](https://raspapi.hackclub.com). Poke around to learn more about Andrei Jiroh and his \
projects in general.`,
			version: "0.1.0",
			contact: {
				name: "Andrei Jiroh Halili",
				url: "https://andreijiroh.dev",
				email: "ajhalili2006@andreijiroh.dev"
			}
		},
		externalDocs: {
			url: "https://github.com/andreijiroh-dev/api-servers/tree/main/apps/website-api",
			description: "Backend source code"
		},
		tags: [
			{
				name: "meta",
				description: "Metadata about Andrei Jiroh, in good ol' JSON."
			}
		]
	}
});

openapi.get("/meta", rootRouter);
openapi.get("/meta/me", getMe);
openapi.get("/meta/tech-stack", getTechStack);
openapi.get("/meta/linux", getLinuxSetup)
openapi.get("/ping", pingServer);
openapi.get("/spotify/now-playing", nowPlayingSpotify);
openapi.get("/guestbook", showRandomGuestbookMessage);
openapi.post("/guestbook/github", writeToGuestbook_gh);

/** redirects and stuff */
app.get("/", (c: Context) => { return c.redirect("/docs") })

/** internals */
app.get("/internal/spotify/authenticate", (c: Context) => authorizeRedirect(c))
app.get("/internal/spotify/callback", async (c: Context) => await handleSpotifyCallback(c))

Deno.serve({port: Number(Deno.env.get("PORT")) || 3000}, app.fetch)
