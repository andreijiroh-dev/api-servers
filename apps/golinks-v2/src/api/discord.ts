import { OpenAPIRoute, Num, Bool, Str, contentJson } from 'chanfana';
import { z } from 'zod';
import { Context } from 'hono';
import { DiscordInvites } from 'types';

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
				'application/json': {
					schema: z.object({
						slug: Str({ required: true }),
						inviteCode: Str({ default: 'exmaple' }),
						name: Str({ default: 'Example server' }),
						description: Str({ default: 'This is a example Discord server.' }),
						nsfw: z.boolean().default(false),
						is_active: z.boolean().default(true),
					}),
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
		const data = await this.getValidatedData<typeof this.schema>();
		const { body } = data;
		return body;
	}
}

export class DiscordInviteLinkList extends OpenAPIRoute {
	schema = {
		tags: ["discord-invites"]
	}
}
