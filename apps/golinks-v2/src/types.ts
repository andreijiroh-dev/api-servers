import { DateTime, Int, Str } from "chanfana";
import { z } from "zod";

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

export type Env = {
	golinks: D1Database;
}
