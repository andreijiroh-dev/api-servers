/*
 * SPDX-License-Identifier: MIT
 *
 * Dead-simple redirector service in Hono, hosted at Deno Deploy
 */
import { Hono, Context } from "jsr:@hono/hono";

const app = new Hono()

app.use(async (c: Context, next) => {
    const path = c.req.path
    console.debug(c.req)
    console.log(`handling redirect to https://andreijiroh.dev${path}`)
    return c.redirect(`https://andreijiroh.dev${path}`)
})

Deno.serve(app.fetch)
