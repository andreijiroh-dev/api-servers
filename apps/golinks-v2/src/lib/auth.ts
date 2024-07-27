import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";
import { Context, Next } from "hono";
import { EnvBindings } from "types";
import { generateSlug } from "./utils";
import { add } from "date-fns";
import { error } from "console";
import { InstallProvider } from "@slack/oauth";
import { SignJWT } from "jose";

export const slackAppInstaller = (env: EnvBindings) =>
  new InstallProvider({
    clientId: env.SLACK_OAUTH_ID,
    clientSecret: env.SLACK_OAUTH_SECRET,
    stateSecret: env.SLACK_OAUTH_STATE_SECRET,
    installationStore: {
      storeInstallation: async (installation) => {
        if (installation.isEnterpriseInstall) {
          // support for org wide app installation
          return await env.slackBotTokens.put(installation.enterprise.id, JSON.stringify(installation));
        } else {
          // single team app installation
          return await env.slackBotTokens.put(installation.team.id, JSON.stringify(installation));
        }
        throw new Error("Failed saving installation data to installationStore");
      },
      fetchInstallation: async (query) => {
        if (query.isEnterpriseInstall && query.enterpriseId !== undefined) {
          return await env.slackBotTokens.get(query.enterpriseId, "json");
        }
        if (query.teamId !== undefined) {
          return await env.slackBotTokens.get(query.teamId, "json");
        }
        throw new Error("Failed fetching installation");
      },
      deleteInstallation: async (query) => {
        if (query.isEnterpriseInstall && query.enterpriseId !== undefined) {
          // org wide app installation deletion
          return await env.slackBotTokens.delete(query.enterpriseId);
        }
        if (query.teamId !== undefined) {
          // single team app installation deletion
          return await env.slackBotTokens.delete(query.teamId);
        }
        throw new Error("Failed to delete installation");
      },
    },
  });

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

export async function lookupBotToken(db: EnvBindings["golinks"], teamId: string, is_enterprise_install?: boolean) {
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

export async function addBotToken(db: EnvBindings["golinks"], teamId: string, token: string, enterprise_install?: boolean) {
  const adapter = new PrismaD1(db);
  const prisma = new PrismaClient({ adapter });
  try {
    const result = await prisma.slackBotToken.create({
      data: {
        teamId,
        enterprise_install: enterprise_install !== undefined ? enterprise_install : false,
        token,
      },
    });
    return result;
  } catch (error) {
    return Promise.reject(Error(`${error}`));
  }
}

export async function updateBotToken(db: EnvBindings["golinks"], teamId: string, token: string, enterprise_install?: boolean) {
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

export async function addNewChallenge(db: EnvBindings["golinks"], challenge, metadata) {
  const adapter = new PrismaD1(db);
  const prisma = new PrismaClient({ adapter });
  try {
    const result = await prisma.gitHubOAuthChallenge.create({
      data: {
        challenge,
        metadata,
        expires_on: add(Date(), {
          minutes: 15,
        }),
      },
    });
    console.log(`[dbops] ${result}`);
    return result;
  } catch (error) {
    console.error(error);
    return Promise.reject(Error(error));
  }
}

/**
 *
 * @param env The `context.env` object from Hono
 * @param aud User ID from the database
 * @param clientSecret The `jwtKeypass_stuff` string as client secret from ApiToken Prisma model.
 * @returns
 */
export async function generateJwt(env: EnvBindings, aud: string, clientSecret: string) {
	const secret = new TextEncoder().encode(env.JWT_SIGNING_KEY);
	const signature = new SignJWT()
		.setIssuer(env.BASE_URL)
		.setExpirationTime("90d")
		.setSubject(clientSecret)
		.setAudience(aud)
		.sign(secret)
	return signature
}

export async function handleApiKeyGeneration(env: EnvBindings, username: string) {
	const adapter = new PrismaD1(env.golinks);
  const prisma = new PrismaClient({ adapter });
	const client_secret = `jwtKeypass_${generateSlug(64)}`
	try {
		const userData = await prisma.user.findFirst({
			where: {
				username
			}
		})
		const jwt = await generateJwt(env, userData.id, client_secret)
		const dbResult = await prisma.apiToken.create({
			data: {
				token: client_secret,
				userId: userData.id
			}
		})
		return {
			jwt, dbResult
		}
	} catch (error) {
		console.error(error)
		return Promise.reject(new Error(error))
	}
}
