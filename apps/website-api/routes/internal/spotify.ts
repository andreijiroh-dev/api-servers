/**
 * @module
 *
 * This module contains the logic behind Spotify-specific internal API endpoints,
 * used internally for the OAuth flow.
 */

import { Context } from "jsr:@hono/hono";
import { generateOauthUrl } from "../../lib/oauth.ts";
import { Buffer } from "node:buffer"
import { kvApi } from "../../lib/utils.ts";
import { kv } from "../../server.ts";
import { SpotifyClient, getCurrentUser } from "jsr:@soundify/web-api"

const scopes = "user-read-private user-read-email user-read-currently-playing user-read-playback-position user-top-read playlist-modify-public playlist-modify-private playlist-read-collaborative playlist-read-private user-library-read user-library-modify"

export function authorizeRedirect(c: Context) {
  const origin = new URL(c.req.url)
  let redirect_url
  if (origin.host.startsWith("localhost") || origin.host.startsWith("127") || origin.host.startsWith("100")) {
    redirect_url = `http://${origin.host}/internal/spotify/callback`
  } else {
    redirect_url = `https://${origin.host}/internal/spotify/callback`
  }


  const urlRedirect = generateOauthUrl(
    "https://accounts.spotify.com/authorize",
    Deno.env.get("SPOTIFY_OAUTH_CLIENT_ID"),
    scopes,
    redirect_url
  )
  console.log("[oauth-redirector]", `redirecting user to ${urlRedirect}`)
  return c.redirect(urlRedirect)
}

export async function handleSpotifyCallback(c: Context) {
  const {state, code} = c.req.query()
	const origin = new URL(c.req.url)
	let redirect_url
	if (origin.host.startsWith("localhost") || origin.host.startsWith("127") || origin.host.startsWith("100")) {
		redirect_url = `http://${origin.host}/internal/spotify/callback`
	} else {
		redirect_url = `https://${origin.host}/internal/spotify/callback`
	}

  const encodedBasicAuth = new Buffer.from(Deno.env.get("SPOTIFY_OAUTH_CLIENT_ID") + ':' + Deno.env.get("SPOTIFY_OAUTH_CLIENT_SECRET")).toString('base64')
  const paramsOps = new URLSearchParams({
    code,
		redirect_uri: redirect_url,
		grant_type: "authorization_code"
  })

  if (!code && !state) {
    return c.text("Missing state or authentication code", 400)
  }

  try {
		const apiResult = await fetch("https://accounts.spotify.com/api/token", {
			headers: {
				"Authorization": `Basic ${encodedBasicAuth}`,
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: paramsOps,
			method: "POST"
		})

		const jsonResult = await apiResult.json()

		console.log("[oauth-redirector]", `Token exchange API returned status code ${apiResult.status}`)
		console.log("[oauth-redirector]", `API response: ${JSON.stringify(jsonResult)}`)
		if (apiResult.status !== 200) {
			return c.text("Something gone wrong, check logs for details.", apiResult.status)
		}

		// check if user ID matches the envvar
		const client = new SpotifyClient(jsonResult.access_token)
		const me = await getCurrentUser(client)

		console.log("[oauth-redirector]", "getCurrentUser:", JSON.stringify(me))
		if (me.id !== Deno.env.get("SPOTIFY_USER_ID")) {
			return c.text("Looks like you are not ~ajhalili2006 to do this (or you might forget to set SPOTIFY_USER_ID).", 400)
		}

		await kv.set(["oauthTokenStore", "spotify"], jsonResult)
		return c.text("We're so cooked! You can now use the API endpoints without doing the Spotify Web API OAuth flow by hand.")
	} catch (error) {
		console.error(error)
		return c.text("Something gone wrong, check logs for details.", 400)
	}
}
