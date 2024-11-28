import { Context } from "jsr:@hono/hono";
import { OpenAPIRoute } from "npm:chanfana";
import { me, techStack } from "../lib/staticDataConstraints.ts";
import { pingServer } from "./ping.ts";
import { object } from "npm:zod";
import { boolean } from "npm:zod";
import { meSchema } from "../lib/types.ts";
import { getMe, getTechStack } from "./seperatedStacks.ts";

export class rootRouter extends OpenAPIRoute {
	override schema = {
    summary: "Get information about the website tech stack and Andrei Jiroh himself.",
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

export {
	pingServer,
	getMe,
	getTechStack
}
