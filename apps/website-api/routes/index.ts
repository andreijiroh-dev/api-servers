import { Context } from "hono";
import { OpenAPIRoute } from "chanfana";
import { me, techStack } from "../lib/staticDataConstraints.ts";
import { pingServer } from "./ping.ts";
import { object } from "zod";
import { boolean } from "zod";
import { meSchema } from "../lib/types.ts";
import { getMe, getTechStack } from "./seperatedStacks.ts";

export class rootRouter extends OpenAPIRoute {
	override schema = {
    summary: "Get information about the website tech stack and Andrei Jiroh himself.",
	tags: ["meta"],
	responses: {
		200: {
			description: "Get full data",
			content: {
				"application/json": {
					schema: object({
						ok: boolean().default(true),
						result: meSchema
					})
				}
			}
		}
		}
	};

	override handle(c: Context) {
		return c.json({
			ok: true,
			result: {
				...me,
				...techStack
			}
		})
	}
}
