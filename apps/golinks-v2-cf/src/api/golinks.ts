import { OpenAPIRoute, Num, Bool, Str, contentJson, Obj } from "chanfana";
import { z } from "zod";
import { GoLinks } from "types";
import { addGoLink, deleteGoLink, getGoLinks, getLink, updateGoLink } from "lib/db";
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
              ok: Bool({ default: false }).default(false),
							result: Obj({}),
              error: Str({ default: "That slug exists on the backend." }),
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

    try {
      const result = await addGoLink(c.env.golinks, slug, linkToCreate.targetUrl, "golinks");
      return c.json({ ok: true, result });
    } catch ({ code, meta, message, clientVersion }) {
      Error(`[prisma] ${code} ${message} (${JSON.stringify(meta)})`);
      if (code == "P2002") {
        return c.json({ ok: false, result: {}, error: "That slug exists on the backend." });
      } else {
        return c.json({ ok: false, result: {}, error: "Something went wrong on our side." });
      }
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
    description: `\
Updating a golink's slug and/or its target URL requires admin level permissions.

If you generated a random slug or requested a new golink as a regular user, please contact Andrei Jiroh to get it sorted.`,
    tags: ["golinks"],
    parameters: [
      {
        name: "slug",
        in: "path",
        description: "Slug name of the golink to be changed. Forward-slashes must be URL-encoded before sending the request.",
      },
    ],
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              slug: Str({
                required: false,
                description: "The desired slug for the golinks.",
              }),
              targetUrl: Str({
                example: "https://example.com",
                description: "The target URL of the golink to redirect into",
              }),
            }),
          },
        },
      },
    },
    security: [
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
              ok: Bool({ default: true }),
              result: GoLinks,
            }),
          },
        },
      },
    },
  };
  async handle(c: Context) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { newSlug, targetUrl } = data.body;
    const { slug } = c.req.param();
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
        description: "Slug name of the golink. Forward-slashes must be URL-encoded before sending the request.",
      },
    ],
    responses: {
      "200": {
        description: "Shows a information about a golink",
        content: {
          "application/json": {
            schema: z.object({
              ok: Bool({ default: true }),
              result: GoLinks,
            }),
          },
        },
      },
    },
  };
  async handle(context: Context) {
    const { slug } = context.req.param();
    const result = await getLink(context.env.golinks, slug, "golinks");
    if (!result) {
      return context.json({ ok: false, result: {}, error: "Not found" }, 404);
    }
    return context.json({ ok: true, result });
  }
}

export class GoLinkDelete extends OpenAPIRoute {
  schema = {
    tags: ["golinks"],
    summary: "Deletes a existing golink",
		description: `\
This API endpoint is reserved to those with admin permissions due to abuse.

If you are requesting to delete a golink for legal reasons, please contact Andrei Jiroh to get it sorted.`,
    parameters: [
      {
        name: "slug",
        in: "path",
        description: "Slug name of the golink to be deleted. Forward-slashes must be URL-encoded before sending the request.",
      },
    ],
    security: [
      {
        userApiKey: [],
      },
    ],
  };

  async handle(c: Context) {
    const { slug } = c.req.param();
    try {
			await deleteGoLink(c.env.golinks, slug, "golinks");
			return c.json({ok: true, result: { deleted: true }})
		} catch({code}) {
			if (code == "P2025") {
				return c.json({ok: false, result: {}, error: "Either that slug is deleted on server-side or does not exist."}, 400)
			} else {
				return c.json({ok: false, result: {}, error: "Something went wrong on our side."}, 500)
			}
		}
  }
}
