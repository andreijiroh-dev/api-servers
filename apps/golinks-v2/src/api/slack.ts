import fetch from "cross-fetch";
import { Context } from "hono";
import crypto from "node:crypto";
import { Buffer } from "node:buffer";
import { generateSlug } from "lib/utils";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";
import { addBotToken, lookupBotToken, slackAppInstaller, slackOAuthExchange, updateBotToken } from "lib/auth";
import { SignJWT } from "jose";
import URLSearchParams from "url-search-params";
import { Installation, InstallationQuery } from "@slack/oauth";
import { Bool, OpenAPIRoute, Str } from "chanfana";
import { adminApiKey, userApiKey } from "lib/constants";
import { z } from "zod";
import { EnvBindings } from "types";
import { addGoLink } from "lib/db";

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

type SlackInteractivityPayload = {
  type: string;
  user: {
    id: string;
    username: string;
    name: string;
    team_id: string;
  };
  api_app_id: string;
  token: string;
  container: {
    channel_id: string;
    is_epheral: boolean;
    message_ts: string;
    type: string;
  };
  trigger_id: string;
  team: {
    id: string;
    name: string;
  };
  enterprise: null | {
    id: string;
    name: string;
  };
  is_enterprise_install: boolean;
  channel: {
    values: object;
  };
  response_url: string;
  actions: SlackInteractivityActions[];
};

type SlackInteractivityActions = {
  block_id: string;
  action_id: string;
  type: string;
  text: {
    type: string;
    text: string;
    emoji: boolean;
  };
  value: string;
  action_ts: string;
};

async function helpMessage(context: Context, params: SlackSlashCommand) {
  const challenge = generateSlug(24);
  const availableCommands = `*Available commands (add \`-stg\` to slash command for staging or \`-dev\` for localdev)*:

* \`/go lookup </:golink>\` - look up a golink, Discord/Slack invite, or wikilink \
(just paste the full link and it handles the rest)
* \`/go help\` - this command (*you're here btw*)
* \`/go shorten <link>\` - shorten a link for you
* \`/ping\` or \`/go ping\` - check platform and API availability`;
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
          text: availableCommands,
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
          url: `${context.env.BASE_URL}/api/docs`,
        },
      },
      {
        type: "context",
        elements: [
          {
            text: "If something go wrong, <https://go.andreijiroh.xyz/feedback/slackbot|please file a new issue> or ping @ajhalili2006 on the fediverse (or here in the Slack if he's here).",
            type: "mrkdwn",
          },
        ],
      },
    ],
  };
  return context.json(templateJson);
}

async function authChallengePrompt(context: Context, params: SlackInteractivityPayload) {
  const secret = new TextEncoder().encode(context.env.JWT_SIGNING_KEY);
  const challenge = params.actions[0].value;
  const jwtState = await new SignJWT();
  const githubAuthUrl = `${context.env.BASE_URL}/auth/github?client_id=slack&state=${jwtState}`;
  const templateCallback = {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "First, authenicate with GitHub using the button below. Note that we included your Slack ID and the team you are currently in to help us monitor API key requests.",
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Sign in with GitHub",
              emoji: true,
            },
            url: githubAuthUrl,
            style: "primary",
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Once you copied the code, press the button below and paste the code in the popout.",
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Submit authenication ticket",
              emoji: true,
            },
            style: "primary",
            value: "ghAuthTicket_tbd",
            action_id: "github-auth-challenge",
          },
        ],
      },
    ],
  };
  return context.json(templateCallback, 200);
}

const sneakyWIPScreen = {
  type: "modal",
  close: {
    type: "plain_text",
    text: "Close",
    emoji: true,
  },
  title: {
    type: "plain_text",
    text: "You're a bit sneaky!",
    emoji: true,
  },
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "This feature is currently under development and working on stablizing this for you to use them soon.",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: ":speech_balloon: *Send feedback*\nWe want to know your experience with our Slack integration for Andrei Jiroh's golinks service.",
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "Open in GitHub",
          emoji: true,
        },
        url: "https://go.andreijiroh.xyz/feedback/slack-integration",
      },
    },
  ],
};
/**
 * Handle requests for OAuth-based app installation
 * @param context
 * @returns
 */
export async function slackOAuth(context: Context) {
  const appId = context.env.SLACK_OAUTH_ID || "5577525090644.7449518011266";
  const callback = `${context.env.BASE_URL}/auth/slack/callback`;
  const scopes = "commands,im:write";

  return context.redirect(`https://slack.com/oauth/v2/authorize?client_id=${appId}&scope=${scopes}&redirect_uri=${callback}`);
}
export async function slackOAuthCallback(context: Context) {
  const callback = `${context.env.BASE_URL}/auth/slack/callback`;
  const params = context.req.query();

  let payload = {
    code: params.code,
    client_id: context.env.SLACK_OAUTH_ID,
    client_secret: context.env.SLACK_OAUTH_SECRET,
    redirect_uri: callback,
    grant_type: "authorization_code",
  };

  try {
    const api = await slackOAuthExchange(payload);
    const result = await api.json();
		const testAuthData = await fetch("https://slakc.com/api/auth.test", {
			headers: {
				Authorization: `bearer ${result.access_token}`
			}
		})

    console.log(`[slack-oauth] result: ${JSON.stringify(result)} (${api.status})`);

    if (result.ok == false) {
      return context.json({ ok: false, error: result.error }, api.status);
    }

    const installation: Installation<"v2"> = {
      isEnterpriseInstall: result.is_enterprise_install,
      team: result.team,
      appId: result.appId,
      bot: {
        id: result.bot_user_id,
        token: result.access_token,
        scopes: ["commands", "im:write"],
        userId: result.bot_user_id,
      },
      authVersion: "v2",
      user: result.authed_user,
      enterprise: result.enterprise,
      enterpriseUrl: result.enterprise !== null ? `https://${result.enterprise.name}.enterprise.slack.com` : undefined,
      incomingWebhook: undefined,
      tokenType: "bot",
    };
    await slackAppInstaller(context.env).installationStore.storeInstallation(installation);
    return context.newResponse(`Installation success! Try it now with "/go help" command.`);
  } catch (err) {
    console.error(err);
    return context.json({ ok: false, error: "Something gone wrong, but we're looking onto it" }, 500);
  }
}

export function generateQRCodeImgUrl(context: Context, url?: string) {
	let base = "https://go.andreijiroh.xyz"
	if (context.env.DEPLOY_ENV == "staging") {
		base = context.env.BASE_URL || "https://staging.go-next.andreijiroh.xyz"
	} else if (context.env.DEPLOY_ENV == "development") {
		base = context.env.BASE_URL || "https://staging.go-next.andreijiroh.xyz";
	}
	return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${base}/${url}`;
}

type sendMesgParams = {
	teamId: string,
	enterpriseId?: string,
	channel: string,
	blocks: Array<null>
	text?: string
}

async function sendMessage(context: Context, params: sendMesgParams) {
	try {
		const { bot } = await slackAppInstaller(context.env).installationStore.fetchInstallation({
		teamId: params.teamId,
		isEnterpriseInstall: params.enterpriseId !== undefined ? true : false,
		enterpriseId: params.enterpriseId !== undefined ? params.enterpriseId : null
	})
		const result = fetch("https://slack.com/api/chat.postMessage", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `bearer ${bot.token}`
			},
			body: {
				channel: params.channel,
				blocks: params.blocks,
				text: params.text
			}
		});
		return [result, null]
	} catch (error) {
		return [null, error]
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

	const args = data.text.toString().split(" ")
	console.log(args)
  if (command === "go") {
    if (args[0] == "help" || data.text == "") {
      return await helpMessage(context, data);
		} else if (args[0] == "ping") {
			return context.json({
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: ":tw_white_check_mark: *golinks API is reachable at `https://go.andreijiroh.xyz/api` at the moment*\n\nIf the bot is up but still not reachable on your side, check your network or <https://go.andreijiroh.xyz/feedback/api-uptime|file a new issue>",
            },
          },
          {
            type: "context",
            elements: [
              {
                text: "Check <https://cloudflarestatus.com|Cloudflare Status> and <https://status.andreijiroh.xyz|our status page> for updates.",
                type: "mrkdwn",
              },
            ],
          },
        ],
      });
    } else if (args[0] == "shorten") {
			if (args[1]) {
				const linkToShorten = args[1].replace(/^<|>$/gm, '');
				const randomSlug = generateSlug(12)
				const result = await addGoLink(context.env.golinks, randomSlug, args[1], "golinks")
				return context.json({
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: ":link: *Here's your short link*: https://go.andreijiroh.xyz/tbd\n\n:point_down: *Your QR code is also provided below, powered by `api.qrserver.com`.* Save the image to your device or share as you do.",
              },
            },
            {
              type: "image",
              image_url: generateQRCodeImgUrl(context, randomSlug),
              alt_text: "QR code of the shortened link",
            },
            {
              type: "divider",
            },
            {
              type: "rich_text",
              elements: [
                {
                  type: "rich_text_section",
                  elements: [
                    {
                      type: "emoji",
                      name: "information_source",
                      unicode: "2139-fe0f",
                    },
                    {
                      type: "text",
                      text: " ",
                    },
                    {
                      type: "text",
                      text: "Here's the resulting data from the backend",
                      style: {
                        bold: true,
                      },
                    },
                    {
                      type: "text",
                      text: ":\n\n",
                    },
                  ],
                },
                {
                  type: "rich_text_preformatted",
                  border: 0,
                  elements: [
                    {
                      type: "text",
                      text: JSON.stringify(result),
                    },
                  ],
                },
              ],
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: "@ajhalili2006 is being notified about this for abuse monitoring via Worker logs and in Slack.",
                },
              ],
            },
          ],
        });
			}
		}
		return context.json({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: ":warning: Sorry, I don't understand that command. Have you tried `/go help`?",
          },
        },
        {
          type: "context",
          elements: [
            {
              text: "If something go wrong, <https://go.andreijiroh.xyz/feedback/slackbot|please file a new issue> or ping @ajhalili2006 on the fediverse (or here in the Slack if he's here).",
              type: "mrkdwn",
            },
          ],
        },
      ],
    });
  } else if (command == "ping") {
    return context.json({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: ":tw_white_check_mark: *golinks API is reachable at `https://go.andreijiroh.xyz/api` at the moment*\n\nIf the bot is up but still not reachable on your side, check your network or <https://go.andreijiroh.xyz/feedback/api-uptime|file a new issue>",
          },
        },
        {
          type: "context",
          elements: [
            {
              text: "Check <https://cloudflarestatus.com|Cloudflare Status> and <https://status.andreijiroh.xyz|our status page> for updates.",
              type: "mrkdwn",
            },
          ],
        },
      ],
    });
  }
  return context.newResponse("Unsupported command");
}

export async function handleSlackInteractivity(context: Context) {
  const authToken = await context.req.query("token");
  const { payload } = await context.req.parseBody();
  const parsedPayload: SlackInteractivityPayload = JSON.parse(payload);
  const headers = await context.req.header();
  await console.log(`[slack-interactivity] data:`, parsedPayload);
  await console.log(`[slack-interactivity] actions:`, parsedPayload.actions);
  await console.log(`[slack-interactivity] headers:`, headers);

  if (parsedPayload.actions[0].action_id == "github-auth-challenge") {
    return await authChallengePrompt(context, parsedPayload);
  } else {
    return await context.json(sneakyWIPScreen, 200);
  }
}

export class debugApiGetSlackBotToken extends OpenAPIRoute {
  schema = {
    tags: ["debug"],
    summary: "Get a Slack bot token for a installation for manual admin access to Slack APIs.",
    description: "Note that due to its nature, this is currently off-limits to public access and only documented here for convenience.",
    request: {
      query: z.object({
        teamId: Str({
          description: "Slack team ID",
          required: true,
        }),
        enterpriseInstall: Bool({
          description: "Set to `true` to enable queries to Enterprise Grid organization installs.",
          required: false,
        }),
        enterpriseId: Str({
          description: "Enterprise Grid organization ID",
          required: false,
        }),
      }),
    },
    security: [
      {
        userApiKey: [],
      },
    ],
  };

  async handle(context: Context) {
    const data = await this.getValidatedData<typeof this.schema>();
    const query = data.query;
    const params: InstallationQuery<typeof query.enterpriseInstall> = {
      teamId: query.teamId,
      enterpriseId: query.enterpriseInstall == true ? query.enterpriseId : undefined,
      isEnterpriseInstall: query.enterpriseInstall,
    };
    const installQuery = await slackAppInstaller(context.env).authorize(params);
    return context.json({
      ok: true,
      result: installQuery,
    });
  }
}

export class debugApiTestSlackBotToken extends OpenAPIRoute {
  schema = {
    tags: ["debug"],
    summary: "Calls `auth.test` Slack API method to test if the bot token is valid",
    request: {
      query: z.object({
        teamId: Str({
          description: "Slack team ID",
          required: true,
        }),
        enterpriseInstall: Bool({
          description: "Set to `true` to enable queries to Enterprise Grid organization installs.",
          required: false,
        }),
        enterpriseId: Str({
          description: "Enterprise Grid organization ID",
          required: false,
        }),
      }),
    },
    security: [
      {
        userApiKey: [],
      },
    ],
  };

  async handle(context: Context) {
    const data = await this.getValidatedData<typeof this.schema>();
    const query = data.query;
		const enterpriseInstall = query.enterpriseInstall || false
    const params: InstallationQuery<typeof enterpriseInstall> = {
      teamId: query.teamId,
      enterpriseId: query.enterpriseInstall == true ? query.enterpriseId : undefined,
      isEnterpriseInstall: enterpriseInstall,
    };
    const botToken = await slackAppInstaller(context.env).installationStore.fetchInstallation(params);
    if (!botToken) {
      return context.json({ ok: false, error: "Installation not found" }, 404);
    }
    try {
      const apiResult = await fetch("https://slack.com/api/auth.test", {
        headers: {
          Authorization: `Bearer ${botToken.bot.token}`,
        },
      });
      return context.json({
        ok: true,
        result: {
          installation: botToken,
          authTest: await apiResult.json(),
        },
      });
    } catch (error) {
      console.error(error);
      return context.json(
        {
          ok: false,
          error: "Something gone horribly wrong.",
        },
        500,
      );
    }
  }
}

export class debugApiListSlackAppInstalls extends OpenAPIRoute {
	schema = {
		tags: ["debug"],
		summary: "Get a list of Slack app installations recorded from KV storage for bot tokens",
		security: [{userApiKey: []}]
	}
	async handle(context: Context) {
		const env: EnvBindings = context.env
		const result = await env.slackBotTokens.list()

		return context.json({ok: true, result})
	}
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
