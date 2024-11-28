import { Context, Hono } from "jsr:@hono/hono";
import { fromHono } from 'npm:chanfana'
import { getMe, getTechStack, pingServer, rootRouter } from "./routes/index.ts";
import { authorizeRedirect, handleSpotifyCallback } from "./routes/internal/spotify.ts";
import { kvApi } from "./lib/utils.ts";
import { nowPlayingSpotify } from "./routes/music.ts";
export const kv = await kvApi(Deno.env.get("DENO_KV_URL"))

const app = new Hono()
const openapi = fromHono(app, {
	docs_url: "/docs",
	schema: {
		info: {
			title: "~ajhalili2006's personal API",
			version: "0.1.0",
			contact: {
				name: "Andrei Jiroh Halili",
				url: "https://andreijiroh.dev",
				email: "ajhalili2006@andreijiroh.dev"
			}
		}
	}
});

openapi.get("/", rootRouter);
openapi.get("/me", getMe)
openapi.get("/tech-stack", getTechStack)
openapi.get("/ping", pingServer);
openapi.get("/now-playing/spotify", nowPlayingSpotify);

app.get("/internal/spotify/authenticate", (c: Context) => authorizeRedirect(c))
app.get("/internal/spotify/callback", async (c: Context) => await handleSpotifyCallback(c))

Deno.serve(app.fetch)
