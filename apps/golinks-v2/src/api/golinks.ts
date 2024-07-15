import { OpenAPIRoute, Num, Bool } from "chanfana"
import { z } from "zod"
import { GoLinks } from "types"
import { getGoLinks } from "lib/db";

export class GoLinkCreate extends OpenAPIRoute {
	schema = {
		tags: ["golinks"],
		summary: "Create a golink",
		request: {
			body: {
				content: {
					"application/json": {
						schema: GoLinks
					}
				}
			}
		},
		security: [
			{
				adminApiKey: []
			}
		],
		responses: {
			"200": {
				description: "Returns the generated golink"
			}
		}
	}

	async handle(c) {
		const data = await this.getValidatedData<typeof this.schema>();
		const linkToCreate = data.body

		return {
			success: true,
			data: linkToCreate
		}
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

		const links = await getGoLinks(c.env.golinks, page, isActive)

		return {
			success: true,
			links
		}
	}
}
