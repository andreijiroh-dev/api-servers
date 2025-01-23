export const me = {
	city: "Marilao",
	state: "Bulacan",
	country: "PH",

	// contact
	contact: "https://andreijiroh.dev/contact",

	// mainly for debugging stuff
	slack_id: "U07CAPBB9B5", //compat
	slack: [
		{
			team_id: "T0266FRGM",
			team: "hackclub",
			user_id: "U07CAPBB9B5"
		}
	],

	// a bit more verbose here
	socials: [
		{
			type: "fediverse",
			protocol: "activitypub",
			platform: "mastodon",
			handle: {
				full: "@ajhalili2006:tilde.zone",
				localpart: "ajhalili2006",
				homeserver: "tilde.zone"
			},
			url: "https://tilde.zone/@ajhalili2006",
			homeserver_details: {
				open_registrations: false,
				requires_approval: true,
				invite_only: true
			}
		},
		{
			type: "fediverse",
			protocol: "matrix",
			platform: "selfhosted/dendrite",
			handle: {
				full: "@ajhalili2006:andreijiroh.dev",
				localpart: "ajhalili2006",
				homeserver: "andreijiroh.dev"
			},
			url: "https://matrix.to/#/@ajhalili2006:andreijiroh.dev",
			homeserver_details: {
        		host: "uberspace.de",
				open_registrations: false,
				invite_only: false
			}
		},
		{
			type: "fediverse",
			protocol: "atproto",
			platform: "bluesky",
			handle: {
				domain: "andreijiroh.dev",
				did: "did:plc:wcx4c3osbuzrwmxkqdfqygwv"
			},
			url: "https://bsky.app/profile/andreijiroh.dev",
			permalink: "https://bsky.app/profile/did:plc:wcx4c3osbuzrwmxkqdfqygwv"
		},
		{
     		type: "centralized",
			platform: "substack",
			handle: {
				primary_publication: "ajhalili2006",
				username: "ajhalili2006"
			}
		},
		{
			type: "centralized",
			platform: "medium",
			handle: {
				username: "ajhalili2006"
			}
		}
	]
}

export const techStack = {
	sources: {
		website: "https://github.com/andreijiroh-dev/website",
		api: "https://github.com/andreijiroh-dev/api-servers/tree/main/apps/website-api"
	},
	version: {
		is_versioned: false,
		reason: "Rolling release"
	},
	languages: ["en_US"],
	doctype: "HTML5",
	ide: [
		{
			name: "GNU nano",
			website: "https://www.nano-editor.org/",
			sources: "https://github.com/gnu-mirror-unofficial/nano", // we'll just use the mirror here.
			is_stable: true,
			license: "GPL-3.0"
		},
		{
			name: "VS Code",
			website: "https://vscode.dev",
			sources: "https://github.com/microsoft/vscode",
			is_stable: true,
			license: "MIT AND MICROSOFT-EULA" // https://github.com/Microsoft/vscode/issues/60#issuecomment-161792005
		},
		{
			name: "VS Code - Insiders",
			website: "https://insiders.vscode.dev",
			sources: "https://github.com/microsoft/vscode",
			is_stable: false,
			license: "MIT AND MICROSOFT-EULA" // https://github.com/Microsoft/vscode/issues/60#issuecomment-161792005
		}
	],
	technologies: [
		{
			name: "Mkdocs",
			ecosystem: "pip",
			website: "https://mkdocs.org"
		},
		{
			name: "Material for Mkdocs",
			ecosystem: "pip",
			website: "https://squidfunk.github.io/mkdocs-material"
		},
		{
			name: "Hono",
			ecosystem: "jsr",
			website: "https://hono.dev"
		},
		{
			name: "Chanfana",
			ecosystem: "npm",
			website: "https://chanfana.pages.dev"
		}
	],
	hosted_on: [
		{
			name: "Cloudflare Pages",
			website: "https://pages.cloudflare.com"
		},
		{
			name: "Deno Deploy",
			website: "https://deno.com/deploy"
		},
		{
			name: "Uberspace",
			website: "https://uberspace.de"
		},
		{
			name: "Hack Club Nest",
			website: "https://hackclub.app"
		}
	]
}

export const linuxSetup = {
	distros: [
		{
			name: "NixOS",
			website: "https://nixos.org",
			primary: true,
			sources: [
				"https://github.com/NixOS/nixpkgs",
				"https://github.com/NixOS/nix"
			]
		},
		{
			name: "Alpine Linux",
			website: "https://alpinelinux.org",
			primary: false,
			docker: true
		}
	]
}

/**
 * This is chaos indeed.
 */
export const pingMessageValues = [
	// me ooc
	"Do you have any thoughts about abandoning the children? (Andrei Jiroh on Hack Club Slack)",

	"We are so back. (Jet Lag: The Game)",

	// Hermits out of context
	"What could possibly go wrong? (GoodTimesWithScar, Hermitcraft Season 8)",
	"The slap is how you get hard (GoodTimesWithScar)",
	"100 percent fully sus(tainable) (Mumbo Jumbo, Hermitcraft Season 9)",
	"I am gonna milk you dry (Rendog)",

	// every single Life Series SMP / Hermitcraft episode
	"SCAR NO! (Grian)",

	// Story 6 Pre-Premiere April's Fools Special
	"Gildedguy (Michael Moy): how do i abandon the children? (from a Twitch chat screenshot, taken out of context)",

	// iykyk
	"The more you fuck around, the more you find out. And also, if you never fucked around, you will never find out.",

	// lyrics?
	// Imagine if Yoopia said this in an alternate universe (hint: Gildedguy Automatica fan animation?)
	"Have you ever wondered if you were dead? (obviously from the lyrics of NERVE DAMAGE by MUST DIE!)",
	"Are you a lion in the guise of the lamb? (from the lyrics of CONQUEST by Pick Up Goliath)",

	// copious amount of spoilers
	"Five become four become three become two become one become nothing. (Cult of The Lamb)",
	"Long story short, this is my grave. (Hunter, The Owl House S02EP09)"
	// TODO: Find "summoning a demon" quote from YGO ARC-V
]
