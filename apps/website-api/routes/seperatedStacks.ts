import { Context } from "jsr:@hono/hono";
import { OpenAPIRoute } from "npm:chanfana";
import { linuxSetup, me, techStack } from "../lib/staticDataConstraints.ts";
import { object } from "npm:zod";
import { boolean } from "npm:zod";
import { meSchema } from "../lib/types.ts";

export class getMe extends OpenAPIRoute {
	override schema = {
		summary: "Get Andrei Jiroh's socials and more in a JSON object.",
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
			}
		})
	}
}

export class getTechStack extends OpenAPIRoute {
	override schema = {
		summary: "Get technology stack for Andrei Jiroh's website and API server.",
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
				...techStack,
			}
		})
	}
}

export class getLinuxSetup extends OpenAPIRoute {
	override schema = {
		tags: ["meta"],
	}
	override handle(c: Context) {
		return c.json({
			ok: true,
			result: linuxSetup
		})
	}
}