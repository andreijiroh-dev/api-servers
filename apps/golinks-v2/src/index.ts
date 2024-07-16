import { GoLinkCreate, GoLinkList } from "api/golinks";
import { fromHono } from "chanfana";
import { Hono } from "hono";
import { Env } from "./types"
import { getLink } from "lib/db";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/api/docs",
});

// Register OpenAPI endpoints
openapi.get("/api/links", GoLinkList)
openapi.post("/api/links", GoLinkCreate)

openapi.registry.registerComponent(
	"securitySchema",
	"adminApiKey",
	{
		type: "apiKey",
		name: "X-Golinks-Admin-Key",
		in: "header"
	}
)

app.get("/", (c) => {
	return c.redirect("https://wiki.andreijiroh.xyz/golinks")
})

app.get("/favicon.ico", (c) => {
	return c.newResponse("404 Not Found", 404)
})

app.get('/:link', async (c) => {
	console.log(c.req);
	const {link} = c.req.param();
	const result = await getLink(c.env.golinks, link);
	if (result == null) {
		return c.newResponse(
			JSON.stringify({
				sucesss: false,
				error: "Not Found"
			}),
			404, {
				"Content-Type": "application/json"
			})
	}
	c.redirect(result.targetUrl);
});

// Export the Hono app
export default app;
