import { Bool, DateTime, Int, Str } from "chanfana";
import { z } from "zod";

export const GoLinks = z.object({
  id: Int({ required: false }),
  slug: Str({ required: true }),
  targetUrl: Str({ example: "https://example.com" }),
  is_active: z.boolean().default(true),
  deactivation_reason: Str({ required: false }),
  created_on: DateTime({ default: Date.now() }),
  updated_on: DateTime({ default: Date.now() }),
});

export const DiscordInvites = z.object({
  id: Int({ required: false }),
  slug: Str(),
  inviteCode: Str(),
  name: Str(),
  description: Str(),
  nsfw: z.boolean().default(false),
  is_active: z.boolean().default(true),
  deactivation_reason: Str({ required: false }),
  created_on: DateTime({ default: Date.now() }),
  updated_on: DateTime({ default: Date.now() }),
});

/**
 * Just export WikiLinks as same schema as golinks
 */
export const WikiLinks = GoLinks;

export interface EnvBindings {
  DEPLOY_ENV: "production" | "staging" | "development";
  GIT_DEPLOY_COMMIT: string;
  SLACK_OAUTH_ID: string;
  SLACK_OAUTH_SECRET: string;
  SLACK_OAUTH_CALLBACK_URL: string;
  SLACK_SIGNING_SECRET: string;
  GITHUB_OAUTH_ID: string;
  GITHUB_OAUTH_SECRET: string;
  golinks: D1Database;
  ADMIN_KEY: string;
  BASE_URL: string;
	JWT_SIGNING_KEY: string
}

/*type EnvBindings = {
  golinks: D1Database;
  BASE_URL: string;
  DEPLOY_ENV: "production" | "staging" | "development";
  ADMIN_KEY: string;
  GIT_DEPLOY_COMMIT: string;
  SLACK_OAUTH_ID: string;
  SLACK_OAUTH_SECRET: string;
  SLACK_OAUTH_CALLBACK_URL: string;
  SLACK_SIGNING_SECRET: string;
  GITHUB_OAUTH_ID: string;
  GITHUB_OAUTH_SECRET: string;
	JWT_SIGNING_KEY: string
};*/
