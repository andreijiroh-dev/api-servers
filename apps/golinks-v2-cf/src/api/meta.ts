import { OpenAPIRoute, Num, Bool, Str, contentJson } from "chanfana";
import { Context, Env } from "hono";
import { generateSlug } from "lib/utils";
import { EnvBindings } from "types";
import { z } from "zod";

export class CommitHash extends OpenAPIRoute {
  schema = {
    tags: ["meta"],
    description: "Get the latest commit hash",
    responses: {
      "200": {
        description: "Returns a commit hash",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean().default(true),
              result: z.string(),
            }),
          },
        },
      },
    },
  };
  async handle(c: Context) {
    return c.json(
      {
        success: true,
        result: c.env.GIT_DEPLOY_COMMIT,
      },
      200,
    );
  }
}

export class PingPong extends OpenAPIRoute {
  schema = {
    tags: ["meta"],
    description: "Ping the API service if it's up.",
    responses: {
      "200": {
        description: "Returns a `success: true`",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
            }),
          },
        },
      },
    },
  };
  async handle(c) {
    return c.json({
      success: true,
      result: `Pong!`,
    });
  }
}
