/**
 * AT Protocol / Atmosphere utilities for decentralized guestbook operations.
 * Supports both dev.andreijiroh.guestbook.entry and is.dame.guestbook.entry.
 */

export const SUPPORTED_COLLECTIONS = [
	"dev.andreijiroh.guestbook.entry",
	"is.dame.guestbook.entry",
] as const;

export type SupportedCollection = (typeof SUPPORTED_COLLECTIONS)[number];

export interface ParsedAtUri {
	raw: string;
	did: string;
	collection: string;
	rkey: string;
}

export interface GuestbookEntryRecord {
	$type?: string;
	subject: string;
	text?: string;
	signature?: string;
	mark?: string;
	location?: string;
	createdAt: string;
}

export interface SignerProfile {
	did: string;
	handle: string;
	displayName?: string;
	avatar?: string;
}

/**
 * Parses an at:// URI into its components.
 */
export function parseAtUri(uri: string): ParsedAtUri | null {
	const match = uri.match(/^at:\/\/(did:[a-z0-9]+:[a-zA-Z0-9._:%-]+)\/([a-zA-Z0-9._]+)\/([a-zA-Z0-9._~-]+)$/);
	if (!match) return null;

	return {
		raw: uri,
		did: match[1],
		collection: match[2],
		rkey: match[3],
	};
}

/**
 * Resolves a DID document to discover the user's Personal Data Server (PDS) endpoint.
 */
export async function resolveDidPds(did: string): Promise<string | null> {
	try {
		let docUrl: string;
		if (did.startsWith("did:plc:")) {
			docUrl = `https://plc.directory/${did}`;
		} else if (did.startsWith("did:web:")) {
			const host = did.replace("did:web:", "").replaceAll(":", "/");
			docUrl = `https://${host}/.well-known/did.json`;
		} else {
			return null;
		}

		const res = await fetch(docUrl, {
			headers: { "Accept": "application/json" },
			signal: AbortSignal.timeout(5000),
		});
		if (!res.ok) return null;

		const doc = await res.json();
		const pdsService = doc.service?.find(
			(s: { id?: string; type?: string }) =>
				s.id === "#atproto_pds" || s.type === "AtprotoPersonalDataServer",
		);

		return pdsService?.serviceEndpoint || null;
	} catch {
		return null;
	}
}

/**
 * Fetches an ATProto record, attempting Slingshot first with direct PDS fallback.
 */
export async function fetchRecord(
	did: string,
	collection: string,
	rkey: string,
	pdsUrl?: string | null,
): Promise<{ uri: string; cid?: string; value: GuestbookEntryRecord } | null> {
	// Attempt 1: Slingshot cache
	try {
		const slingshotUrl = `https://slingshot.microcosm.blue/xrpc/com.atproto.repo.getRecord?repo=${encodeURIComponent(did)}&collection=${encodeURIComponent(collection)}&rkey=${encodeURIComponent(rkey)}`;
		const res = await fetch(slingshotUrl, {
			headers: { "Accept": "application/json" },
			signal: AbortSignal.timeout(4000),
		});
		if (res.ok) {
			const data = await res.json();
			if (data?.value) {
				return { uri: data.uri, cid: data.cid, value: data.value as GuestbookEntryRecord };
			}
		}
	} catch {
		// Fall through to direct PDS
	}

	// Attempt 2: Direct PDS fetch
	const resolvedPds = pdsUrl || (await resolveDidPds(did));
	if (!resolvedPds) return null;

	try {
		const directUrl = `${resolvedPds.replace(/\/$/, "")}/xrpc/com.atproto.repo.getRecord?repo=${encodeURIComponent(did)}&collection=${encodeURIComponent(collection)}&rkey=${encodeURIComponent(rkey)}`;
		const res = await fetch(directUrl, {
			headers: { "Accept": "application/json" },
			signal: AbortSignal.timeout(5000),
		});
		if (res.ok) {
			const data = await res.json();
			if (data?.value) {
				return { uri: data.uri, cid: data.cid, value: data.value as GuestbookEntryRecord };
			}
		}
	} catch {
		return null;
	}

	return null;
}

/**
 * Hydrates public profile information for an actor from the public Bluesky AppView.
 */
export async function fetchActorProfile(actor: string): Promise<SignerProfile | null> {
	try {
		const url = `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(actor)}`;
		const res = await fetch(url, {
			headers: { "Accept": "application/json" },
			signal: AbortSignal.timeout(4000),
		});
		if (!res.ok) return null;

		const data = await res.json();
		return {
			did: data.did,
			handle: data.handle,
			displayName: data.displayName,
			avatar: data.avatar,
		};
	} catch {
		return null;
	}
}

/**
 * Checks if a signer is muted or blocked according to public viewer relationship
 * or the host's block list.
 */
export async function checkIsMutedOrBlocked(
	hostDid?: string,
	signerDid?: string,
): Promise<boolean> {
	if (!hostDid || !signerDid) return false;

	try {
		// Query public AppView for host's block records if available
		const url = `https://public.api.bsky.app/xrpc/app.bsky.graph.getBlocks?actor=${encodeURIComponent(hostDid)}&limit=100`;
		const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
		if (res.ok) {
			const data = await res.json();
			const isBlocked = data.blocks?.some((b: { did?: string }) => b.did === signerDid);
			if (isBlocked) return true;
		}
	} catch {
		// Ignore check failure, fall back to manual moderation
	}

	return false;
}
