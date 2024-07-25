import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";
import { Context } from "hono";
import { githubOAuthExchange } from "lib/auth";
import { generateSlug } from "lib/utils";

export async function githubAuth(context: Context) {
  const appId = context.env.GITHUB_OAUTH_ID;
  const appSecret = context.env.GITHUB_OAUTH_SECRET;
  const redirect_uri = `${context.env.BASE_URL}/auth/github/callback`;
  const { state, client_id } = context.req.query();
  if (client_id == "slack") {
    return context.redirect(
      `https://github.com/login/oauth/authorize?client_id=${appId}&redirect_uri=${redirect_uri}&state=${state}&scope=read:user,user:email`,
    );
  }
}

export async function githubOAuthCallback(context: Context) {
  const appId = context.env.GITHUB_OAUTH_ID;
  const appSecret = context.env.GITHUB_OAUTH_SECRET;
  const redirect_uri = `${context.env.BASE_URL}/auth/github/callback`;

  const { state, code, error, error_description, error_uri } = context.req.query();
  let payload = {
    code,
    client_id: appId,
    client_secret: appSecret,
    redirect_uri,
    state,
    grant_type: "authorization_code",
  };
  if (error) {
    const errorMsg = `OAuth flow was aborted with the following information:
  error: ${error}
  error_description: ${error_description}
  error_uri ${error_uri}.

Please try again authenicating. If you still having issues, please file a ticket at
https://go.andreijiroh.xyz/feedback/oauth-bug with the details above`;
    return context.newResponse(errorMsg, 400);
  }
  const authToken = await githubOAuthExchange(payload);
  const { access_token } = await authToken.json();
  const stateJson = JSON.parse(state);

  if (!access_token) {
    return context.newResponse("OAuth flow was aborted because the auth code is invalid.", 400);
  }
  const ticket = generateSlug(12);

  console.log(`[prisma-client] ${JSON.stringify(dbResult)}`);
  const prompt = `Here's your ticket code for requesting your API key: ${ticket}

Present this back to the bot by pressing "Enter code" in the message`;
}
