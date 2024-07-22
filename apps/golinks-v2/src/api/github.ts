import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";
import { Context } from "hono";
import { generateSlug } from "lib/utils";

export async function githubAuth(context: Context) {
  const appId = context.env.GITHUB_OAUTH_ID;
  const appSecret = context.env.GITHUB_OAUTH_SECRET;
  const redirect_uri = `${context.env.BASE_URL}/auth/github/callback`;
  const adapter = new PrismaD1(context.env.golinks);
  const prisma = new PrismaClient({ adapter });
  const { slack_id, slack_team, state, client_id } = context.req.query();
  if (client_id == "slack") {
    const requestState = encodeURIComponent(
      JSON.stringify({
        slack_id,
        slack_team,
        state,
      }),
    );
    const github = await prisma.gitHubOAuthChallenge
      .create({
        data: {
          challenge: state,
          metadata: JSON.stringify({ slack_team, slack_id }),
        },
      })
      .catch((err) => {
        console.error(err);
        return context.newResponse("Something gone wrong on the backend");
      });
    console.log(`[db] ${github}`);
    return context.redirect(
      `https://github.com/login/oauth/authorize?client_id=${appId}&redirect_uri=${redirect_uri}&state=${requestState}&scope=read:user,user:email`,
    );
  }
}

export async function githubOAuthCallback(context: Context) {
  const appId = context.env.GITHUB_OAUTH_ID;
  const appSecret = context.env.GITHUB_OAUTH_SECRET;
  const redirect_uri = `${context.env.BASE_URL}/auth/github/callback`;
  const adapter = new PrismaD1(context.env.golinks);
  const prisma = new PrismaClient({ adapter });
  const { state, code, error, error_description, error_uri } = context.req.query();
  let payload = {
    code,
    client_id: context.env.GITHUB_OAUTH_ID,
    client_secret: context.env.GITHUB_OAUTH_SECRET,
    redirect_uri,
    state,
    grant_type: "authorization_code",
  };
  let formBody = Object.entries(payload)
    .map(([key, value]) => encodeURIComponent(key) + "=" + encodeURIComponent(value))
    .join("&");
  if (error) {
    const errorMsg = `OAuth flow was aborted with the following information:
  error: ${error}
  error_description: ${error_description}
  error_uri ${error_uri}.

Please try again authenicating. If you still having issues, please file a ticket at
https://go.andreijiroh.xyz/feedback/oauth-bug with the details above`;
    return context.newResponse(errorMsg, 400);
  }
  const authToken = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    body: formBody,
    headers: {
      Accept: "application/json",
    },
  });
  const { access_token } = await authToken.json();
  const stateJson = JSON.parse(state);

  if (!access_token) {
    return context.newResponse("OAuth flow was aborted because the auth code is invalid.", 400);
  }
  const ticket = generateSlug(12);
  fetch("https://api.github.com/user", {
    headers: {
      Authorization: `bearer ${access_token}`,
    },
  }).then((result) => {
    const { username, id } = result.json();
    const dbResult = prisma.gitHubOAuthChallenge.update({
      where: {
        challenge: stateJson.challenge,
      },
      data: {
        code: ticket,
        username,
        userId: id,
      },
    });
    console.log(`[prisma-client] ${JSON.stringify(dbResult)}`);
    const prompt = `Here's your ticket code for requesting your API key: ${ticket}

Present this back to the bot by pressing "Enter code" in the message`;
  });
}
