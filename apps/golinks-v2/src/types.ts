import { Bool, DateTime, Int, Str } from "chanfana";
import { z } from "zod";
import { Env } from "../worker-configuration";

export const Task = z.object({
	name: Str({ example: "lorem" }),
	slug: Str(),
	description: Str({ required: false }),
	completed: z.boolean().default(false),
	due_date: DateTime(),
});

export const GoLinks = z.object({
	id: Int({ required: false }),
	slug: Str({ required: true }),
	targetUrl: Str({ example: "https://example.com" }),
	is_active: z.boolean().default(true),
	created_on: DateTime({ default: Date.now() }),
	updated_on: DateTime({ default: Date.now() })
})

export const DiscordInvites = z.object({
	id: Int({ required: false }),
	slug: Str(),
	inviteCode: Str(),
	name: Str(),
	description: Str(),
	nsfw: z.boolean().default(false),
	is_active: z.boolean().default(true),
	created_on: DateTime({ default: Date.now() }),
	updated_on: DateTime({ default: Date.now() }),
});

export type EnvBindings<Env> = {
	golinks: D1Database;
	DEPLOY_ENV: "production" | "staging" | "development"
}
