import { OpenAPIRoute, Num, Bool, Str, contentJson } from 'chanfana';
import { z } from 'zod';
import { Context } from 'hono';
import { DiscordInvites } from 'types';
import { addDiscordInvite } from 'lib/db';

export class DiscordInviteLinkCreate extends OpenAPIRoute {
	schema = {
		tags: ['discord-invites'],
		summary: 'Add Discord invite code',
		description: 'Add a Discord invite code into the DB for use in go/discord/<slug> route.',
		parameters: [
			{
				in: 'header',
				name: 'X-Golinks-Admin-Key',
				schema: {
					type: 'string',
				},
				required: true,
				description: 'Admin API key for golinks API',
			},
		],
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							slug: Str({ required: true }),
							inviteCode: Str({ default: 'exmaple' }),
							name: Str({ default: 'Example server' }),
							description: Str({ default: 'This is a example Discord server.' }),
							nsfw: z.boolean().default(false),
							is_active: z.boolean().default(true),
						}),
					}
				},
			},
		},
		security: [{ adminApiKey: [] }],
		responses: {
			'200': {
				description: 'Returns Discord invite code information',
				contentJson: {
					schema: z.object({
						success: z.boolean().default(true),
						result: DiscordInvites,
					}),
				},
			},
		},
	};
	async handle(c: Context) {
		try {
			const data = await this.getValidatedData<typeof this.schema>();
			const linkToCreate = data.body;
			console.log(`[golinks-api] received body for link creation ${JSON.stringify(linkToCreate)}`);
			const { slug, inviteCode, name, description, is_active, nsfw } = linkToCreate;

			const result = await addDiscordInvite(c.env.golinks, slug, inviteCode, name, description, is_active, nsfw)
			return c.newResponse(
				JSON.stringify({
					success: true,
					result: result,
				}),
				200,
				{ 'Content-Type': 'application/json' },
			);
		} catch (error) {
			console.error(error)
			return c.newResponse(
				JSON.stringify({
				  success: false,
				  error: `${error.name}:${error.code}` || "An unexpected error occurred while adding the invite code to database."
				}),
				500,
				{ 'Content-Type': 'application/json' },
			)
		}
	}
}

export class DiscordInviteLinkList extends OpenAPIRoute {
	schema = {
		tags: ["discord-invites"]
	}
}
