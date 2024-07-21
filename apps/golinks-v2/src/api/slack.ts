import fetch from "cross-fetch";
import { Context } from "hono";

/**
 * Handle requests for OAuth-based app installation
 * @param context
 * @returns
 */
export async function slackOAuth(context: Context) {
  const appId = context.env.SLACK_OAUTH_ID || "5577525090644.7449518011266";
  const callback = context.env.SLACK_OAUTH_CALLBACK_URL || `${context.req.url}/callback`;
  const scopes = "commands";

  if (context.req.path == "/slack") {
    return context.redirect(`https://slack.com/oauth/v2/authorize?client_id=${appId}&scope=${scopes}&redirect_uri=${callback}`);
  } else if (context.req.path == "/slack/callback") {
    const params = context.req.query();
    let payload = {
      code: params.code,
      client_id: context.env.SLACK_OAUTH_ID,
      client_secret: context.env.SLACK_OAUTH_SECRET,
      redirect_uri: callback,
      grant_type: "authorization_code",
    };
    let formBody = Object.entries(payload)
      .map(([key, value]) => encodeURIComponent(key) + "=" + encodeURIComponent(value))
      .join("&");
    try {
      const api = await fetch("https://slack.com/api/oauth.v2.access", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody,
      });
	  const result = await api.json()
      return context.json({ ok: true, result: result });
    } catch (err) {
      console.error(err);
      return context.json({ ok: false, error: "Something gone wrong" });
    }
  }
}

export function handleSlackCommand(context: Context) {
	const headers = context.req.header()
	const data = context.req.parseBody()
	console.log(JSON.stringify(data))
	return context.newResponse("Still working in it.")
}
