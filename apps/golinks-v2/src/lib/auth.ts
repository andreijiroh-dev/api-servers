import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";
import { Context, Next } from "hono";
import { EnvBindings, Env } from "types";
import { generateSlug } from "./utils";
import { error } from "console";

export async function adminApiKeyAuth(c: Context, next: Next) {
  if (c.req.method == "GET" || c.req.method == "HEAD") {
    return await next();
  }

  if (c.req.path.startsWith("/api/slack")) {
    return await next();
  }

  const adminApiKey = c.env.ADMIN_KEY;
  const apiKeyHeader = c.req.header("X-Golinks-Admin-Key");
  console.debug(`[auth] ${adminApiKey}:${apiKeyHeader}`);

  if (!apiKeyHeader || apiKeyHeader !== adminApiKey) {
    return c.json(
      {
        success: false,
        error: "Unauthorized",
      },
      401,
    );
  }
  return await next();
}

export async function slackOAuthExchange(payload: object) {
  let formBody = Object.entries(payload)
    .map(([key, value]) => encodeURIComponent(key) + "=" + encodeURIComponent(value))
    .join("&");
  const api = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody,
  });
  return api;
}

export async function lookupBotToken(db: EnvBindings<Env>["golinks"], teamId: string, is_enterprise_install?: boolean) {
  const adapter = new PrismaD1(db);
  const prisma = new PrismaClient({ adapter });
  try {
    const team = await prisma.slackBotToken.findFirst({
      where: {
        teamId,
        enterprise_install: is_enterprise_install,
      },
    });
    return team;
  } catch (error) {
    return Promise.reject(Error(`${error}`));
  }
}

export async function addBotToken(db: EnvBindings<Env>["golinks"], teamId: string, token: string, enterprise_install?: boolean) {
  const adapter = new PrismaD1(db);
  const prisma = new PrismaClient({ adapter });
  try {
    const result = await prisma.slackBotToken.create({
      data: {
        teamId,
        enterprise_install,
        token,
      },
    });
    return result;
  } catch (error) {
    return Promise.reject(Error(`${error}`));
  }
}

export async function updateBotToken(db: EnvBindings<Env>["golinks"], teamId: string, token: string, enterprise_install?: boolean) {
  const adapter = new PrismaD1(db);
  const prisma = new PrismaClient({ adapter });
  try {
    const result = await prisma.slackBotToken.update({
      where: {
        teamId,
      },
      data: {
        teamId,
        enterprise_install,
        token,
      },
    });
    return result;
  } catch (error) {
    return Promise.reject(Error(`${error}`));
  }
}

export async function githubOAuthExchange(payload: object) {
  let formBody = Object.entries(payload)
    .map(([key, value]) => encodeURIComponent(key) + "=" + encodeURIComponent(value))
    .join("&");
  return await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    body: formBody,
    headers: {
      Accept: "application/json",
    },
  });
}

export async function getUserInfoAndGenerateTicket(token: string, context: Context) {
  try {
    const profile = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `bearer ${token}`,
      },
    });
    const { username, id, email } = profile.json();
  } catch (error) {
    return Promise.reject(Error(error));
  }
}

export async function generateChallenge(db: EnvBindings<Env>["golinks"], metadata) {
  const adapter = new PrismaD1(db);
  const prisma = new PrismaClient({ adapter });
  const newchallenge = generateSlug(24);
  try {
    const result = await prisma.gitHubOAuthChallenge.create({
      data: {
        challenge: newchallenge,
        metadata,
      },
    });
  } catch (error) {
    console.error(error);
    return Promise.reject(Error(error));
  }
}
