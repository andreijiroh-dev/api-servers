import { OpenAPIRoute, Num, Bool, Str } from "chanfana"
import { z } from "zod"
import { GoLinks } from "types"
import { addGoLink, generateSlug, getGoLinks } from "lib/db";

export class GoLinkCreate extends OpenAPIRoute {
	schema = {

		tags: ['golinks'],
		summary: 'Create a golink',
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
				description: 'Returns the generated golink',
			},
		},
	};

	async handle(c) {
		const data = await this.getValidatedData<typeof this.schema>();
		const linkToCreate = data.body;
		const slug = data.body.slug !== null ? data.body.slug : generateSlug(12);

		const result = await addGoLink(c.env.golinks, slug, linkToCreate.targetUrl, linkToCreate.is_active);

		return {
			success: true,
			data: linkToCreate,
		};
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
			links
		}
	}
}
