import { OpenAPIRoute, Num, Bool, Str, contentJson } from "chanfana";
import { z } from "zod";
import { GoLinks } from "types";
import { addGoLink, getGoLinks, getLink, updateGoLink } from "lib/db";
import { Context } from "hono";
import { generateSlug } from "lib/utils";

export class GoLinkCreate extends OpenAPIRoute {
  schema = {
    tags: ["golinks"],
    summary: "Create a golink",
    description:
      "Creating a golink or a short link requires authenication, and access may varies on authenicated user. When `slug` left blank, it will generate a 12-character random text ([see the function in git sources](https://github.com/andreijiroh-dev/api-servers/blob/main/apps/golinks-v2/src/lib/utils.ts#L9) for how it is implemented behind the scenes).\n\n## API limits and required scopes\n* **Admin API token and users with `admin` role** - Can create both custom golinks and short links for 25 times per minute\n* **Regular users** - Can only create short links, submiting custom golinks will soft-deprecated after creation for review",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              slug: Str({ required: false }),
              targetUrl: Str({ example: "https://example.com" }),
            }),
          },
        },
      },
    },
    security: [
      {
        adminApiKey: [],
      },
      {
        userApiKey: [],
      },
    ],
    responses: {
      "200": {
        description: "Returns the generated golink information",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool(),
              result: GoLinks,
            }),
          },
        },
      },
      "400": {
        description: "Existing entry found",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool({ default: false }).default(false),
              error: Str({ default: "Existing entry found (error code: PrismaClientKnownRequestError:P2002)" }),
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

    const result = await addGoLink(c.env.golinks, slug, linkToCreate.targetUrl, "golinks");

    if (result) {
      return c.newResponse(
        JSON.stringify({
          success: true,
          result: result,
        }),
        200,
        { "Content-Type": "application/json" },
      );
    } else {
      return c.newResponse("Something went wrong", 400);
    }
  }
}

export class GoLinkList extends OpenAPIRoute {
  schema = {
    tags: ["golinks"],
    summary: "List all golinks",
    description: "Accessing this API route does not require authenication, although we also added it for higher API limits.",
    request: {
      query: z.object({
        page: Num({
          description: "Page number",
          default: 0,
          required: false,
        }),
        isActive: Bool({
          description: "Filter by is_active status",
          required: false,
        }),
      }),
    },
    security: [
      {
        adminApiKey: [],
      },
      {
        userApiKey: [],
      },
    ],
    responses: {
      "200": {
        description: "Returns a list of golinks",
        content: {
          "application/json": {
            schema: z.object({
              series: z.object({
                success: Bool(),
                result: GoLinks.array(),
              }),
            }),
          },
        },
      },
    },
  };

  async handle(c) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { page, isActive } = data.query;

    const links = await getGoLinks(c.env.golinks, page !== undefined ? page : 0, isActive);

    return {
      success: true,
      result: links,
    };
  }
}

export class GoLinkUpdate extends OpenAPIRoute {
  schema = {
    summary: "Update a golink",
    tags: ["golinks"],
    parameters: [
      {
        name: "slug",
        in: "path",
				description: "Slug name of the golink"
      },
    ],
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              slug: Str({ required: false }),
              targetUrl: Str({ example: "https://example.com" }),
            }),
          },
        },
      },
    },
    security: [
      {
        adminApiKey: [],
      },
      {
        userApiKey: [],
      },
    ],
    responses: {
      "200": {
        description: "Shows the updated information about a golink",
        content: {
          "application/json": {
            schema: z.object({
							ok: Bool({default: true}),
							result: GoLinks
						}),
          },
        },
      },
    },
  };
  async handle(c: Context) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { newSlug, targetUrl } = data.body;
		const { slug } = c.req.param()
    try {
      const result = await updateGoLink(c.env.golinks, slug, targetUrl, "golinks", newSlug);
      return c.json({
        ok: true,
        result,
      });
    } catch (error) {
      return c.json({
        ok: false,
        error,
      });
    }
  }
}

export class GoLinkInfo extends OpenAPIRoute {
  schema = {
    tags: ["golinks"],
    summary: "Get an information about a golink",
    parameters: [
      {
        name: "slug",
        in: "path",
        description: "Slug name of the golink",
      },
    ],
		responses: {
			"200": {

			}
		}
  };
  async handle(context: Context) {
    const { slug } = context.req.param();
    const result = await getLink(context.env.golinks, slug, "golinks");
    if (!result) {
      return context.json({ ok: false, error: "Not found" }, 404);
    }
    return context.json({ ok: true, result });
  }
}
