import fetch from "cross-fetch";
import { Context } from "hono";
import crypto from "node:crypto";
import { Buffer } from "node:buffer";

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
      console.log(`[slack-oauth] result: ${JSON.stringify(result)} (${api.status})`);
      if (result.ok == false) {
        return context.json({ ok: false, error: result.error }, api.status);
      }
      return context.json({ ok: true, result: "Successfully installed." });
    } catch (err) {
      console.error(err);
      return context.json({ ok: false, error: "Something gone wrong" });
    }
  }
}

/**
 * Function handler for `/api/slack/slash-commands/:command` POST requests
 * on Hono.
 * @param context The `context` object from Hono.
 * @returns
 */
export async function handleSlackCommand(context: Context) {
  // 1. Get Signing Secret and Request Body
  const signingSecret = context.env.SLACK_SIGNING_SECRET; // Access signing secret from env
  const body = await context.req.arrayBuffer();
  const start = Date.now()

  // 2. Get Request Headers
  const timestamp = context.req.header("X-Slack-Request-Timestamp");
  const signature = context.req.header("X-Slack-Signature");

  const { command } = await context.req.param();
  const authToken = await context.req.query("token")
  const data = context.req.parseBody(); // Parse body as JSON

  await console.log(`[slack-slash-commands] params: ${JSON.stringify(data)}`);
  await console.log(`[slack-slash-commands] headers: ${JSON.stringify({ timestamp, command })}`);

  // 3. Validate Request Timestamp (optional)
  /*if (!validateTimestamp(timestamp)) {
    return new Response("Request is too old.", { status: 403 });
  }*/

  /* temporarily disabled for now

  // 4. Calculate Base String
  const baseString = `v0:${timestamp}:${await createHashedBody(body)}`;

  // 5. Calculate Expected Signature
  const expectedSignature = `sha256=${crypto.createHmac("sha256", signingSecret).update(baseString).digest("hex")}`;

  // 6. Validate Signature
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    await console.log(`[slack-slash-commands]: expected ${expectedSignature} but received ${signature}`);
  }
  */

  if (command === "go") {
    return context.newResponse("Still working in it.", 200, { "Content-Type": "text/plain" });
  } else if (command == "ping") {
    const end = Date.now() - start
    await console.log(`Pong with ${end}ms`)
    return context.newResponse(`Pong with ${end}ms response time in backend`)
  }
  return context.newResponse("Unsupported command");
}

/**
 * Validate request timestamps to ensure that we don't received forged requests
 * within 3-5 minutes
 * @param timestamp The request timestamp in string form
 * @returns
 */
function validateTimestamp(timestamp: string): boolean {
  if (!timestamp) {
    return false;
  }
  const currentTimestamp = Date.now()
  const requestTimestamp = new Date(timestamp).getMilliseconds()
  const delta = Math.abs(currentTimestamp - requestTimestamp) / (1000 * 60);
  console.log(`[slack-slash-commands] current: ${currentTimestamp}, request: ${requestTimestamp}, delta: ${delta}`)
  return delta >= 3 && delta <= 5;
}

async function createHashedBody(body: ArrayBuffer): Promise<String> {
  const buffer = Buffer.from(body)
  const hash = crypto.createHash("sha256");
  hash.update(buffer);
  return hash.digest("hex");
}
