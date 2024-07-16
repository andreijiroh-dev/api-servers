import { OpenAPIRoute, Num, Bool, Str, contentJson } from "chanfana"
import { z } from "zod"
import { GoLinks } from "types"
import { addGoLink, generateSlug, getGoLinks } from "lib/db";
import { adminApiKey } from "lib/constants";
import { Context } from "hono";

export class GoLinkCreate extends OpenAPIRoute {
	schema = {
		tags: ['golinks'],
		summary: 'Create a golink',
		parameters: [
			{
				in: 'header',
				name: 'X-Golinks-Admin-Key',
				schema: {
					type: 'string',
				},
				required: true,
				description: 'Admin API key',
			},
		],
		request: {
			body: {
				content: {
					'application/json': {
						schema: z.object({
							slug: Str({ required: false }),
							targetUrl: Str({ example: 'https://example.com' }),
							is_active: z.boolean().default(true),
						}),
					},
				},
			},
		},
		security: [
			{
				adminApiKey: [],
			},
		],
		responses: {
			'200': {
				description: 'Returns the generated golink information',
				contentJson: {
					schema: z.object({
						success: Bool(),
						result: GoLinks
					})
				}
			},
			'400': {
				description: 'Existing entry found',
				content: {
					'application/json': {
						schema: z.object({
							success: Bool({ default: false }).default(false),
							error: Str({ default: 'Existing entry found (error code: PrismaClientKnownRequestError:P2002)' }),
						}),
					},
				},
			},
		},
	};

	async handle(c: Context) {
		const data = await this.getValidatedData<typeof this.schema>();
		const linkToCreate = data.body;
		console.log(`[golinks-api] received body for link creation ${JSON.stringify(linkToCreate)}`);
		const slug = linkToCreate.slug !== undefined ? linkToCreate.slug : generateSlug(12);

		const result = addGoLink(c.env.golinks, slug, linkToCreate.targetUrl, linkToCreate.is_active)
			.then((value) => {
				return {
					success: true,
					result: value,
				};
			})
			.catch((err) => {
				if (err.code == 'P2002') {
					return c.newResponse(
						JSON.stringify({
							success: false,
							error: `Existing entry found (error code: ${err.name}:${err.code})`,
						}),
						400,
						{ 'Content-Type': 'application/json' },
					);
				} else {
					return c.newResponse(
						JSON.stringify({
							success: false,
							error: 'Something went wrong on the backend. The devDebug object should provide hints for devs on where to fix.',
							devDebug: err,
						}),
						500,
						{ 'Content-Type': 'application/json' },
					);
				}
			});

		return result;
	}
}

export class GoLinkList extends OpenAPIRoute {
	schema = {
		tags: ["golinks"],
		summary: "List all golinks",
		request: {
			query: z.object({
				page: Num({
					description: "Page number",
					default: 0,
					required: false
				}),
				isActive: Bool({
					description: "Filter by is_active status",
					required: false
				})
			})
		},
		responses: {
			"200": {
				description: "Returns a list of golinks",
				content: {
					"application/json": {
						schema: z.object({
							series: z.object({
								success: Bool(),
								result: z.object({
									links: GoLinks.array()
								})
							})
						})
					}
				}
			}
		}
	};

	async handle(c) {
		const data = await this.getValidatedData<typeof this.schema>()
		const { page, isActive } = data.query

		const links = await getGoLinks(c.env.golinks, page !== undefined ? page : 0, isActive)

		return {
			success: true,
			result: links,
		};
	}
}
