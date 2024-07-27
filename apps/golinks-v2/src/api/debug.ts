import { OpenAPIRoute, Str } from "chanfana";
import { Context } from "hono";
import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";

export class debugApiGenerateJwt extends OpenAPIRoute {
  schema = {
    tags: ["debug"],
    summary: "Generate a example signed JWT or validate a JWT generated from this service.",
    request: {
      query: z.object({
        jwt: Str({
          description: "JWT to validate its signature against",
        }),
      }),
    },
    security: [{ userApiKey: [] }],
  };
  async handle(c) {
    const { token } = c.req.query();
    const secret = new TextEncoder().encode(c.env.JWT_SIGNING_KEY);
    const payload = {
      slack: {
        teamId: "T1234",
        userId: "U1234",
        enterpriseId: "E1234",
        isEnterpriseInstall: true,
      },
      example_jwt: true,
    };

    if (token == null) {
      const exampleToken = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setAudience("challenge_1234abcd")
        .setIssuer(c.env.BASE_URL)
        .setIssuedAt()
        .setExpirationTime("15 minutes")
        .sign(secret);
      return c.json({ ok: true, result: exampleToken });
    }

    const result = await jwtVerify(token, secret, {
      issuer: c.env.BASE_URL,
      clockTolerance: 30,
    });
    return c.json({ ok: true, result });
  }
}

export class debugApiGetBindings extends OpenAPIRoute {
	schema = {
		summary: "Show all Worker bindings associated with this instance, including secrets.",
		security: [
			{userApiKey: []}
		]
	}
	async handle(c: Context) {
		return c.json({ ok: true, result: c.env });
	}
}
