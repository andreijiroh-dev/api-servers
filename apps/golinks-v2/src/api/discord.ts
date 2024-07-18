import { OpenAPIRoute, Num, Bool, Str, contentJson } from "chanfana";
import { z } from "zod";
import { Context } from "hono";
import { DiscordInvites, EnvBindings } from "types";
import { addDiscordInvite, getDiscordInvites } from "lib/db";

export class DiscordInviteLinkCreate extends OpenAPIRoute {
  schema = {
    tags: ["discord-invites"],
    summary: "Add Discord invite code",
    description: "Add a Discord invite code into the DB for use in go/discord/<slug> route.",
    parameters: [
      {
        in: "header",
        name: "X-Golinks-Admin-Key",
        schema: {
          type: "string",
        },
        required: true,
        description: "Admin API key for golinks API",
      },
    ],
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              slug: Str({ required: true }),
              inviteCode: Str({ default: "exmaple" }),
              name: Str({ default: "Example server" }),
              description: Str({ default: "This is a example Discord server." }),
              nsfw: z.boolean().default(false),
              is_active: z.boolean().default(true),
            }),
          },
        },
      },
    },
    security: [{ adminApiKey: [] }],
    responses: {
      "200": {
        description: "Returns Discord invite code information",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean().default(true),
              result: DiscordInvites,
            }),
          },
        },
      },
      "401": {
        description: "Missing or invalid admin token",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean().default(false),
              error: z.string().default("Unauthorized"),
            }),
          },
        },
      },
      "409": {
        description: "Returns a error when the slug is already in use.",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean().default(false),
              error: z.string().default("The provided slug already exists."),
            }),
          },
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

      const result = await addDiscordInvite(c.env.golinks, slug, inviteCode, name, description, is_active, nsfw);
      return c.newResponse(
        JSON.stringify({
          success: true,
          result: result,
        }),
        200,
        { "Content-Type": "application/json" },
      );
    } catch (error) {
      console.error(error);
      if (error.code === "P2002") {
        return c.newResponse(
          JSON.stringify({
            success: false,
            error: "The provided slug already exists.",
          }),
          409,
          { "Content-Type": "application/json" },
        );
      }
      return c.newResponse(
        JSON.stringify({
          success: false,
          error: `${error.name}:${error.code}` || "An unexpected error occurred while adding the invite code to database.",
        }),
        500,
        { "Content-Type": "application/json" },
      );
    }
  }
}

export class DiscordInviteLinkList extends OpenAPIRoute {
  schema = {
    tags: ["discord-invites"],
    summary: "Get a information about a custom invite link",
    description: "Resolves a custom invite link slug into a object of information about a Discord invite code.",
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
        nsfw: Bool({
          description: "Filter server list by NSFW status (NSFW servers are hidden by default).",
          required: false,
        }),
      }),
    },
    responses: {
      "200": {
        description: "Returns a list of Discord servers in the database.",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool(),
              result: DiscordInvites.array(),
            }),
          },
        },
      },
    },
  };

  async handle(c: Context) {
    try {
      const data = await this.getValidatedData<typeof this.schema>();
      console.log(`[api] query params: ${JSON.stringify(data.query)}`);
      const { page, isActive, nsfw } = data.query;
      const links = await getDiscordInvites(c.env.golinks, page !== undefined ? page : 0, isActive, nsfw);

      return {
        success: true,
        result: links,
      };
    } catch (err) {
      return c.newResponse(
        JSON.stringify({
          success: false,
          error: `${err.name}:${err.code} (${err.message})`,
        }),
        500,
        { "Content-Type": "application/json" },
      );
    }
  }
}
