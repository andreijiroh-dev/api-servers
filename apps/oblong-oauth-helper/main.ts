import { Hono } from 'hono'
import { authCode, clientId, handleError, home, redirect_uri } from "./lib.ts";
import { exchangeCodeForToken } from "./lib.ts";
import { accessToken } from "./lib.ts";
import * as uuid from "uuid"

const app = new Hono()
const baseUrl = new URL("https://admin.obl.ong/oauth/authorize");
const scopes = "domains domains_records domains_records_write user";
const paramOps = baseUrl.searchParams

app.get("/", (c) => {
  return c.text(home)
})

app.get("/feedback", (c) => {
	return c.redirect(Deno.env.get("ISSUE_TRACKER_NEW_URL"))
})

app.get("/auth", (c) => {
  const {state} = c.req.query()
  paramOps.set("client_id", clientId);
  paramOps.set("redirect_uri", redirect_uri);
  paramOps.set("scope", scopes);
  paramOps.set("response_type", "code");

  if (state) {
	paramOps.set("state", state);
  } else {
	paramOps.set("state", crypto.randomUUID());
  }

  return c.redirect(baseUrl.toString())
})

app.get("/auth/callback", async(c) => {
	const { code, state } = c.req.query()

	if (!code || !state) {
		return c.text("Missing authenication code or state", 400)
	}

	if (state == "cli-access") {
		return c.text(authCode(code), 200)
	}

	if (uuid.v4.validate(state) == false) {
		return c.text(handleError("state_not_uuidV4"), 400)
	}

	const { token, error } = await exchangeCodeForToken(code, state)

	if (token) {
		return c.text(accessToken(token))
	} else {
		return c.text(handleError(error), 400)
	}
})

Deno.serve(app.fetch)
