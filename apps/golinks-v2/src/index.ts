import { GoLinkCreate, GoLinkList } from "api/golinks";
import { fromHono } from "chanfana";
import { Hono } from "hono";
import { Env } from "./types"

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
	"securitySchemea",
	"adminApiKey",
	{
		type: "apiKey",
		name: "X-Golinks-Admin-Key",
		in: "header"
	}
)

// Export the Hono app
export default app;
