import { Context, Next } from "hono";

export async function adminApiKeyAuth(c: Context, next: Next) {
	if (c.req.method == "GET" || c.req.method == "HEAD") {
		return await next()
	}

	const adminApiKey = c.env.ADMIN_TOKEN;
	const apiKeyHeader = c.req.header("X-Golinks-Admin-Key")
	console.debug(`[auth] ${adminApiKey}:${apiKeyHeader}`)

	if (!apiKeyHeader || apiKeyHeader !== adminApiKey) {
		return c.json({
			success: true,
			error: "Unauthorized"
		}, 401)
	}
	return await next()
}
