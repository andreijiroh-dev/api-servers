import { OpenAPIRoute, Num, Bool, Str, contentJson } from "chanfana";
import { z } from "zod";
import { GoLinks } from "types";
import { addGoLink, getGoLinks, updateGoLink } from "lib/db";
import { Context } from "hono";

export class WikiLinkCreate extends OpenAPIRoute {
  schema = {
    tags: ["wikilinks"],
    summary: "Create a golink-styled wikilink for `wiki.andreijiroh.xyz/go/*` and `andreijiroh.xyz/go/*`",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              slug: Str({ required: true }),
              targetUrl: Str({ required: true, example: "https://github.com/integrations/slack" }),
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
  };
  async handle(context) {
    const data = await this.getValidatedData<typeof this.schema>();
    const linkToCreate = data.body;
    console.log(`[golinks-api] received body for link creation ${JSON.stringify(linkToCreate)}`);
    try {
      const result = await addGoLink(context.env.golink, linkToCreate.slug, linkToCreate.targetUrl, "wikilinks");
      if (result) {
        return context.json({
          ok: true,
          result,
        });
      } else {
        return context.json(
          {
            ok: false,
            error: "Something gone wrong while handling this request.",
          },
          400,
        );
      }
    } catch (error) {
      console.error(error);
      return context.json(
        {
          ok: false,
          error: "Internal server error",
        },
        500,
      );
    }
  }
}

export class WikiLinkList extends OpenAPIRoute {
  schema = {
    tags: ["wikilinks"],
    summary: "List all golink-styled wikilinks",
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

    const links = await getGoLinks(c.env.golinks, page !== undefined ? page : 0, isActive, "wikilinks");

    return {
      success: true,
      result: links,
    };
  }
}

export class WikiLinkUpdate extends OpenAPIRoute {
  schema = {
    tags: ["wikilinks"],
    summary: "Update a wikilink",
    parameters: [
      {
        name: "slug",
        in: "path",
        description: "Slug name of the wikilink to be changed",
      },
    ],
    security: [{ userApiKey: [] }],
  };
}
