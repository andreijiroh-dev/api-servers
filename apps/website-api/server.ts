import { Context, Hono } from "hono";
import { fromHono } from "chanfana";
import { rootRouter } from "./routes/index.ts";
import { getTechStack, getLinuxSetup, getMe } from "./routes/seperatedStacks.ts";
import { pingServer } from "./routes/ping.ts";
import {
	getGuestbookMessages,
	indexGuestbookEntryRoute,
} from "./routes/guestbook.ts";

export const app = new Hono();

const openapi = fromHono(app, {
	docs_url: "/docs",
	schema: {
		info: {
			title: "~ajhalili2006's personal API",
			summary:
				"Andrei Jiroh's API server for utility, Atmosphere-native guestbook, and webhooks.",
			description: `\
This personal API server is built as part of [High Seas](https://highseas.hackclub.com) and \
[RaspAPI](https://raspapi.hackclub.com), deployed on Appwrite Cloud Functions. Poke around to learn \
more about Andrei Jiroh and sign the Atmosphere guestbook.`,
			version: "0.2.0",
			contact: {
				name: "Andrei Jiroh Halili",
				url: "https://andreijiroh.dev",
				email: "ajhalili2006@andreijiroh.dev",
			},
		},
		externalDocs: {
			url: "https://github.com/andreijiroh-dev/api-servers/tree/main/apps/website-api",
			description: "Backend source code",
		},
		tags: [
			{
				name: "meta",
				description: "Metadata about Andrei Jiroh, in good ol' JSON.",
			},
			{
				name: "guestbook",
				description:
					"Decentralized Atmosphere (AT Protocol) guestbook powered by Appwrite TablesDB.",
			},
		],
	},
});

// Meta routes
openapi.get("/meta", rootRouter);
openapi.get("/meta/me", getMe);
openapi.get("/meta/tech-stack", getTechStack);
openapi.get("/meta/linux", getLinuxSetup);
openapi.get("/ping", pingServer);

// Atmosphere-native Guestbook routes
openapi.get("/guestbook", getGuestbookMessages);
openapi.post("/guestbook/entry", indexGuestbookEntryRoute);
openapi.post("/guestbook", indexGuestbookEntryRoute);

/** Redirects */
app.get("/", (c: Context) => c.redirect("/docs"));

/**
 * Appwrite Function Entrypoint Handler
 * Bridges Appwrite's Open Runtimes { req, res, log, error } into standard Web Request/Response for Hono.
 */
export default async function ({ req, res, log, error }: any) {
	try {
		const scheme = req.scheme || "https";
		const host = req.host || "localhost";
		const path = req.path || "/";
		const queryString = req.queryString ? `?${req.queryString}` : "";
		const url = req.url || `${scheme}://${host}${path}${queryString}`;

		const headers = new Headers();
		if (req.headers && typeof req.headers === "object") {
			for (const [k, v] of Object.entries(req.headers)) {
				if (v !== undefined && v !== null) {
					headers.set(k, String(v));
				}
			}
		}

		const method = (req.method || "GET").toUpperCase();
		let body: BodyInit | undefined = undefined;
		if (!["GET", "HEAD"].includes(method)) {
			if (req.bodyBinary) {
				body = req.bodyBinary;
			} else if (req.bodyText) {
				body = req.bodyText;
			} else if (req.bodyJson) {
				body = JSON.stringify(req.bodyJson);
				if (!headers.has("content-type")) {
					headers.set("content-type", "application/json");
				}
			}
		}

		const webRequest = new Request(url, {
			method,
			headers,
			body,
		});

		const webResponse = await app.fetch(webRequest);

		const resHeaders: Record<string, string> = {};
		webResponse.headers.forEach((val, key) => {
			resHeaders[key] = val;
		});

		const bodyBytes = new Uint8Array(await webResponse.arrayBuffer());
		return res.binary(bodyBytes, webResponse.status, resHeaders);
	} catch (err: any) {
		const msg = err?.message || String(err);
		error?.(`[website-api] Function error: ${msg}`);
		return res.json({ ok: false, error: msg }, 500);
	}
}

/** Local development fallback */
if (import.meta.main) {
	const port = Number(Deno.env.get("PORT")) || 3000;
	console.log(`[website-api] Server listening locally on http://localhost:${port}`);
	Deno.serve({ port }, app.fetch);
}
