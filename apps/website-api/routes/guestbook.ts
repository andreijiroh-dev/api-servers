import { OpenAPIRoute, OpenAPIRouteSchema } from "npm:chanfana";
import { Context } from "jsr:@hono/hono";
import { z } from "npm:zod";
import {
	parseAtUri,
	fetchRecord,
	fetchActorProfile,
	checkIsMutedOrBlocked,
	SUPPORTED_COLLECTIONS,
	type SupportedCollection,
} from "../lib/atproto.ts";
import {
	upsertGuestbookEntry,
	getRandomApprovedGuestbookEntry,
	listApprovedGuestbookEntries,
	type GuestbookEntryRow,
} from "../lib/appwrite.ts";

export class getGuestbookMessages extends OpenAPIRoute {
	override schema: OpenAPIRouteSchema = {
		tags: ["guestbook"],
		summary: "Get guestbook messages (random entry or paginated list of approved entries)",
		request: {
			query: z.object({
				all: z.coerce
					.boolean()
					.optional()
					.describe("Set true to fetch a list of entries rather than a single random entry"),
				limit: z.coerce
					.number()
					.optional()
					.describe("Maximum entries to return (when all=true, max 50)"),
				offset: z.coerce
					.number()
					.optional()
					.describe("Offset for pagination (when all=true)"),
			}),
		},
	};

	override async handle(c: Context) {
		const data = await this.getValidatedData<typeof this.schema>();
		const showAll = data.query?.all ?? false;
		const limit = Math.min(data.query?.limit || 25, 50);
		const offset = data.query?.offset || 0;
		const apiKeyOverride = c.req.header("x-appwrite-key");

		if (showAll) {
			const { total, entries } = await listApprovedGuestbookEntries(
				limit,
				offset,
				apiKeyOverride,
			);
			return c.json({
				ok: true,
				total,
				limit,
				offset,
				result: entries,
			});
		}

		const randomEntry = await getRandomApprovedGuestbookEntry(apiKeyOverride);
		if (!randomEntry) {
			return c.json({ ok: false, error: "No approved guestbook messages found yet" }, 404);
		}

		return c.json({
			ok: true,
			result: randomEntry,
		});
	}
}

export class indexGuestbookEntryRoute extends OpenAPIRoute {
	override schema: OpenAPIRouteSchema = {
		tags: ["guestbook"],
		summary: "Index an Atmosphere (AT Protocol) guestbook entry",
		description: `\
Registers an AT-URI from a visitor's Personal Data Server (PDS).
Supported collections: \`dev.andreijiroh.guestbook.entry\` (primary) and \`is.dame.guestbook.entry\` (compatibility).
The server validates the record from the signer's PDS, checks moderation status, and indexes it in Appwrite TablesDB.`,
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							at_uri: z
								.string()
								.describe("AT-URI of the guestbook signature record"),
						}),
					},
				},
			},
		},
	};

	override async handle(c: Context) {
		const data = await this.getValidatedData<typeof this.schema>();
		const atUriStr = data.body.at_uri.trim();

		const parsed = parseAtUri(atUriStr);
		if (!parsed) {
			return c.json(
				{
					ok: false,
					error: "Invalid AT-URI format. Expected at://<did>/<collection>/<rkey>",
				},
				400,
			);
		}

		if (
			!SUPPORTED_COLLECTIONS.includes(
				parsed.collection as SupportedCollection,
			)
		) {
			return c.json(
				{
					ok: false,
					error: `Unsupported collection: ${parsed.collection}. Supported: ${SUPPORTED_COLLECTIONS.join(", ")}`,
				},
				400,
			);
		}

		// 1. Fetch the record from signer's PDS / Slingshot
		const recordData = await fetchRecord(parsed.did, parsed.collection, parsed.rkey);
		if (!recordData || !recordData.value) {
			return c.json(
				{
					ok: false,
					error: "Could not resolve or verify record from the signer's PDS repository",
				},
				404,
			);
		}

		const record = recordData.value;

		// 2. Hydrate signer profile from public AppView
		const profile = await fetchActorProfile(parsed.did);

		// 3. Moderation checks (blocks, mutes, automated filtering)
		const hostDid =
			Deno.env.get("ATPROTO_HOST_DID") || Deno.env.get("HOST_DID");
		let isMutedOrBlocked = false;
		if (hostDid) {
			isMutedOrBlocked = await checkIsMutedOrBlocked(hostDid, parsed.did);
		}

		const status: GuestbookEntryRow["status"] = isMutedOrBlocked
			? "hidden"
			: Deno.env.get("REQUIRE_MANUAL_APPROVAL") === "true"
				? "pending"
				: "approved";

		// 4. Upsert entry into Appwrite TablesDB
		const apiKeyOverride = c.req.header("x-appwrite-key");
		const dbResult = await upsertGuestbookEntry(
			{
				at_uri: parsed.raw,
				author_did: parsed.did,
				author_handle: profile?.handle || "",
				author_name: profile?.displayName || record.signature || "",
				author_avatar: profile?.avatar || "",
				collection: parsed.collection,
				rkey: parsed.rkey,
				cid: recordData.cid || "",
				subject: record.subject,
				text: record.text || "",
				signature: record.signature || "",
				mark: record.mark || "",
				location: record.location || "",
				status,
				signed_at: record.createdAt || new Date().toISOString(),
				indexed_at: new Date().toISOString(),
			},
			apiKeyOverride,
		);

		if (!dbResult.ok) {
			return c.json(
				{
					ok: false,
					error: dbResult.error || "Failed to persist guestbook entry to Appwrite database",
				},
				500,
			);
		}

		return c.json({
			ok: true,
			result: {
				id: dbResult.id,
				status,
				at_uri: parsed.raw,
				author_did: parsed.did,
				author_handle: profile?.handle,
				signed_at: record.createdAt,
			},
		});
	}
}
