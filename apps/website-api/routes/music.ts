import { getCurrentPlayingTrack, SpotifyClient } from "jsr:@soundify/web-api";
import { Context } from "jsr:@hono/hono";
import { OpenAPIRoute } from "npm:chanfana";
import { kv } from "../server.ts";
import { kvApi } from "../lib/utils.ts";
import { OAuthTokenResponse } from "../lib/types.ts";
import { Buffer } from "node:buffer"

let tokenStore
let tokenStoreBase

const client = new SpotifyClient(null, {
	refresher: async () => {
		tokenStoreBase = (await (await kvApi(Deno.env.get("DENO_KV_URL"))).get<OAuthTokenResponse>(["oauthTokenStore", "spotify"])).value;
		console.log(tokenStoreBase);
		tokenStore = tokenStoreBase;

		const refresherOpts = {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"Authorization": `Basic ${new Buffer.from(Deno.env.get("SPOTIFY_OAUTH_CLIENT_ID") + ':' + Deno.env.get("SPOTIFY_OAUTH_CLIENT_SECRET")).toString('base64') }`
			},
			body: new URLSearchParams({
				grant_type: 'refresh_token',
				refresh_token: tokenStore?.refresh_token,
				//client_id: Deno.env.get("SPOTIFY_OAUTH_CLIENT_ID")
			})
		}
		console.log("[oauth-redirector]", `parsed fetch options for token refresh:`, refresherOpts)
		const refreshTokenApi = await fetch("https://accounts.spotify.com/api/token", refresherOpts)
		const tokenStoreStg = await refreshTokenApi.json()

		console.log("[oauth-redirector]", `refreshed token response with code ${refreshTokenApi.status}`)
		console.log("[oauth-redirector]", `token refresher API response: ${JSON.stringify(tokenStoreStg)}`)

		tokenStore = tokenStoreStg
		if (tokenStoreStg.refresh_token == null) {
			tokenStore.refresh_token = tokenStoreBase?.refresh_token
		}

		if (refreshTokenApi.status !== 200) {
			throw new Error("check logs")
		}

		await kv.set(["oauthTokenStore", "spotify"], tokenStore)
		return tokenStore.access_token
	}
})

export class nowPlayingSpotify extends OpenAPIRoute {
	override schema = {
		summary: "Get current track Andrei Jiroh listening to from Spotify",
		description: `\
Behind the scenes, the backend will regnerates an Spotify API token using a Deno KV-stored refresh token first
and then calling \`getCurrentPlayingTrack\` function from [\`jsr:@soundify/web-api\`](https://jsr.io/@soundify/web-api).
`
	};

	override async handle(c: Context) {
		const nowPlaying = await getCurrentPlayingTrack(client, {
			additional_types: ["track", "episode"],
			market: "PH"
		})

		console.log("[spotify-web-api]", "current track:", nowPlaying)

		return c.json({
			ok: true,
			result: {
				is_playing: nowPlaying?.is_playing || false,
				timestamp: nowPlaying?.timestamp || Date.now(),
				type: nowPlaying?.currently_playing_type || null,
				context: nowPlaying?.context,
				item: nowPlaying?.item,
				progress: nowPlaying?.progress_ms,
				on_repeat: nowPlaying?.repeat_state,
				shuffle: nowPlaying?.shuffle_state,
			}
		})
	}
}
