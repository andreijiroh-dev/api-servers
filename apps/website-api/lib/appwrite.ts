/**
 * Appwrite TablesDB & Databases integration layer.
 * Manages indexed guestbook signatures with moderation state.
 */

import { Client, TablesDB, Databases, ID, Query } from "node-appwrite";

export interface GuestbookEntryRow {
	$id?: string;
	at_uri: string;
	author_did: string;
	author_handle?: string;
	author_name?: string;
	author_avatar?: string;
	collection: string;
	rkey: string;
	cid?: string;
	subject: string;
	text?: string;
	signature?: string;
	mark?: string;
	location?: string;
	status: "pending" | "approved" | "flagged" | "hidden";
	signed_at: string;
	indexed_at: string;
}

export function getAppwriteClient(apiKeyOverride?: string): Client {
	const client = new Client();

	const endpoint =
		Deno.env.get("APPWRITE_ENDPOINT") || "https://sfo.cloud.appwrite.io/v1";
	const projectId =
		Deno.env.get("APPWRITE_PROJECT_ID") ||
		Deno.env.get("APPWRITE_FUNCTION_PROJECT_ID") ||
		"";
	const apiKey =
		apiKeyOverride ||
		Deno.env.get("APPWRITE_API_KEY") ||
		Deno.env.get("APPWRITE_FUNCTION_API_KEY") ||
		"";

	client.setEndpoint(endpoint).setProject(projectId);

	if (apiKey) {
		client.setKey(apiKey);
	}

	return client;
}

export function getDatabaseConfig() {
	return {
		databaseId: Deno.env.get("APPWRITE_DATABASE_ID") || "default",
		tableId:
			Deno.env.get("APPWRITE_TABLE_GUESTBOOK") ||
			Deno.env.get("APPWRITE_COLLECTION_GUESTBOOK") ||
			"guestbook_entries",
	};
}

/**
 * Saves or updates a guestbook entry in Appwrite TablesDB (falling back to Databases if necessary).
 */
export async function upsertGuestbookEntry(
	entry: Omit<GuestbookEntryRow, "$id">,
	apiKeyOverride?: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
	const client = getAppwriteClient(apiKeyOverride);
	const { databaseId, tableId } = getDatabaseConfig();

	const dataPayload = {
		at_uri: entry.at_uri,
		author_did: entry.author_did,
		author_handle: entry.author_handle || "",
		author_name: entry.author_name || "",
		author_avatar: entry.author_avatar || "",
		collection: entry.collection,
		rkey: entry.rkey,
		cid: entry.cid || "",
		subject: entry.subject,
		text: entry.text || "",
		signature: entry.signature || "",
		mark: entry.mark || "",
		location: entry.location || "",
		status: entry.status,
		signed_at: entry.signed_at,
		indexed_at: entry.indexed_at,
	};

	// Try TablesDB first (Appwrite Relational Layer)
	try {
		const tables = new TablesDB(client);
		const existing = await tables.listRows({
			databaseId,
			tableId,
			queries: [Query.equal("at_uri", entry.at_uri), Query.limit(1)],
		});

		if (existing.total > 0 && existing.rows[0]) {
			const updated = await tables.updateRow({
				databaseId,
				tableId,
				rowId: existing.rows[0].$id,
				data: dataPayload,
			});
			return { ok: true, id: updated.$id };
		}

		const created = await tables.createRow({
			databaseId,
			tableId,
			rowId: ID.unique(),
			data: dataPayload,
		});
		return { ok: true, id: created.$id };
	} catch (tablesErr: any) {
		// Fallback to classic Databases if TablesDB is not configured or in transition
		try {
			const databases = new Databases(client);
			const existing = await databases.listDocuments(databaseId, tableId, [
				Query.equal("at_uri", entry.at_uri),
				Query.limit(1),
			]);

			if (existing.total > 0 && existing.documents[0]) {
				const updated = await databases.updateDocument(
					databaseId,
					tableId,
					existing.documents[0].$id,
					dataPayload,
				);
				return { ok: true, id: updated.$id };
			}

			const created = await databases.createDocument(
				databaseId,
				tableId,
				ID.unique(),
				dataPayload,
			);
			return { ok: true, id: created.$id };
		} catch (dbErr: any) {
			return {
				ok: false,
				error: dbErr?.message || tablesErr?.message || "Failed to persist to Appwrite database",
			};
		}
	}
}

/**
 * Retrieves approved guestbook entries for display on Zensical / website.
 */
export async function listApprovedGuestbookEntries(
	limit = 25,
	offset = 0,
	apiKeyOverride?: string,
): Promise<{ total: number; entries: GuestbookEntryRow[] }> {
	const client = getAppwriteClient(apiKeyOverride);
	const { databaseId, tableId } = getDatabaseConfig();
	const queries = [
		Query.equal("status", "approved"),
		Query.orderDesc("signed_at"),
		Query.limit(limit),
		Query.offset(offset),
	];

	try {
		const tables = new TablesDB(client);
		const res = await tables.listRows<any>({ databaseId, tableId, queries });
		return {
			total: res.total,
			entries: res.rows as unknown as GuestbookEntryRow[],
		};
	} catch {
		try {
			const databases = new Databases(client);
			const res = await databases.listDocuments<any>(databaseId, tableId, queries);
			return {
				total: res.total,
				entries: res.documents as unknown as GuestbookEntryRow[],
			};
		} catch {
			return { total: 0, entries: [] };
		}
	}
}

/**
 * Retrieves a single random approved guestbook entry.
 */
export async function getRandomApprovedGuestbookEntry(
	apiKeyOverride?: string,
): Promise<GuestbookEntryRow | null> {
	const { total, entries } = await listApprovedGuestbookEntries(50, 0, apiKeyOverride);
	if (total === 0 || entries.length === 0) return null;

	const randomIndex = Math.floor(Math.random() * entries.length);
	return entries[randomIndex];
}
