import { Context } from "hono";
import { OpenAPIRoute } from "chanfana";
import { randomPingPong } from "../lib/utils.ts";

export class pingServer extends OpenAPIRoute {
  override schema = {
		summary: "Ping the API server if it is up.",
		description: `\
When the server responds with a 200 OK with a JSON response body, a random quote or message inside the \`result\` object\
will show up.`
	}

	override handle(c: Context) {
		return c.json({
			ok: true,
			result: {
				message: randomPingPong()
			}
		})
	}
}
