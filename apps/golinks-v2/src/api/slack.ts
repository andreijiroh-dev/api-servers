import fetch from "cross-fetch";
import { Context } from "hono";
import crypto from "node:crypto";
import { Buffer } from "node:buffer";
import { generateSlug } from "lib/utils";
import { PrismaD1 } from "@prisma/adapter-d1";
import { Prisma, PrismaClient } from "@prisma/client";

type SlackSlashCommand = {
  token?: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text?: string;
  is_enterprise_install: "true" | "false";
  response_url: string;
  trigger_id: string;
};

function helpMessage(context: Context, params: SlackSlashCommand) {
  const challenge = `challenge_${generateSlug(24)}`;
  const githubAuthUrl = `${context.env.BASE_URL}/auth/github?client_id=slack&slack_team=${params.team_id}&slack_id=${params.user_id}&state=${challenge}`;
  const templateJson = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "slack.go.andreijiroh.xyz - @ajhalili2006's golinks service in Slack",
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "I am the bot that <https://andreijiroh.xyz|@ajhalili2006> uses to manage his golinks in Slack, although you can use me as a link shortener and to request custom golinks for approval.",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Need to shorten a link, add a Discord or wikilink? Submit a request and you'll be notified via DMs if it's added.",
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Request a link",
            emoji: true,
          },
          value: "request-link",
          action_id: "golinks-bot-action",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Want to use me programmatically? You can request a API token using your GitHub account through the OAuth prompt.",
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Sign in to get token",
            emoji: true,
          },
          value: challenge,
          action_id: "github-auth-challenge",
          url: githubAuthUrl,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Want to see the API docs and experiment with it? You can take a sneak peek.",
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Open API docs",
            emoji: true,
          },
          value: "api-docs",
          action_id: "golinks-bot-help",
          url: `${context.env.BASE_URL}/api/docs`,
        },
      },
      {
        type: "context",
        elements: [
          {
            text: "If something go wrong, <https://go.andreijiroh.xyz/feedback/slackbot|please file a new issue> or ping @ajhalili2006 on the fediverse.",
            type: "mrkdwn",
          },
        ],
      },
    ],
  };
  return context.json(templateJson);
}

/**
 * Handle requests for OAuth-based app installation
 * @param context
 * @returns
 */
export async function slackOAuth(context: Context) {
  const appId = context.env.SLACK_OAUTH_ID || "5577525090644.7449518011266";
  const callback = `${context.env.BASE_URL}/auth/slack/callback`;
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
      const result = await api.json();
      console.log(`[slack-oauth] result: ${JSON.stringify(result)} (${api.status})`);
      if (result.ok == false) {
        return context.json({ ok: false, error: result.error }, api.status);
      }
      return context.json({ ok: true, result: "Successfully installed, run `/go help` in a channel or DM." });
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
  //const body = await context.req.arrayBuffer();
  const start = Date.now();

  // 2. Get Request Headers
  //const timestamp = context.req.header("X-Slack-Request-Timestamp");
  //const signature = context.req.header("X-Slack-Signature");

  const { command } = await context.req.param();
  const authToken = await context.req.query("token");
  const data = await context.req.parseBody(); // Parse body as JSON

  await console.log(`[slack-slash-commands] params: ${JSON.stringify(data)}`);
  await console.log(`[slack-slash-commands] headers: ${context.req.header()}`);

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
    if (data.text == "" || data.text == "help") {
      return helpMessage(context, data);
    }
  } else if (command == "ping") {
    const end = Date.now() - start;
    await console.log(`Pong with ${end}ms`);
    return context.newResponse(`Pong with ${end}ms response time in backend`);
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
  const currentTimestamp = Date.now();
  const requestTimestamp = new Date(timestamp).getMilliseconds();
  const delta = Math.abs(currentTimestamp - requestTimestamp) / (1000 * 60);
  console.log(`[slack-slash-commands] current: ${currentTimestamp}, request: ${requestTimestamp}, delta: ${delta}`);
  return delta >= 3 && delta <= 5;
}

export async function handleInteractions(context: Context) {
  const adapter = new PrismaD1(context.env.golinks);
  const prisma = new PrismaClient({ adapter });
}

async function createHashedBody(body: ArrayBuffer): Promise<String> {
  const buffer = Buffer.from(body);
  const hash = crypto.createHash("sha256");
  hash.update(buffer);
  return hash.digest("hex");
}
