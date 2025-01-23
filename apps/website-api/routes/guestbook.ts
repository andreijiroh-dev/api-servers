import {OpenAPIRoute, OpenAPIRouteSchema, Str} from "chanfana";
import { Context } from "@hono/hono";
import {z} from "zod";
import {Octokit} from "npm:@octokit/rest";
import * as uuid from "@std/uuid";
import { kv } from "../server.ts";

type GuestbookUserGitHub = {
    username: string,
    name?: string | null,
    email?: string | null,
    node_id: string,
    banned?: boolean,
    ban_reason?: string
}

async function lookupGuestbookUser_github(user: string) {
    const data = kv.get<GuestbookUserGitHub>(["guestbook", "github_users", user])

    return data
}

async function saveGuestbookUserData_github(user: string, data: GuestbookUserGitHub) {
    return await kv.set(["guestbook", "github_users", user], data)
}

async function banGitHubUser(user: string, reason: GuestbookUserGitHub["ban_reason"]) {
    const current = await lookupGuestbookUser_github(user)
    return await kv.set(current.key, {
        ...current.value,
        banned: true,
        ban_reason: reason
    })
}

async function unbanGitHubUser(user: string) {
    const current = await lookupGuestbookUser_github(user)
    return await kv.set(current.key, {
        ...current.value,
        banned: false,
        ban_reason: null
    })
}

async function storeGuestbookMessage(userKey: Array<string>, body: string) {
    const id = ["guestbook", "messages", crypto.randomUUID()]
    const db = await kv.set(id, {
        userKey,
        body,
        date: (new Date).toISOString()
    })
    return {
        ...db,
        id: id[2]
    }
}

export class showRandomGuestbookMessage extends OpenAPIRoute {
    override schema = {
        tags: ["guestbook"],
        summary: "Get a random guestbook message"
    }
    override async handle (c: Context) {
        const getDb = await kv.list({prefix: ["guestbook", "messages"]})
        const db = [];

        for await (const message of getDb) {
            db.push(message)
        };

        if (db.length === 0) return c.json({ok: false, error: "Nothing to see here yet"}, 404);

        const randomIndex = Math.floor(Math.random() * db.length);
        const randomMessage = db[randomIndex]

        return c.json({
            ok: true,
            result: {
                id: randomMessage.key[2],
                message: randomMessage.value.body,
                userKey: randomMessage.value.userKey,
                date: randomMessage.value.date
            }
        })
    }
}

export class writeToGuestbook_gh extends OpenAPIRoute {
    override schema: OpenAPIRouteSchema = {
        tags: ["guestbook"],
        summary: "Write a message to my public guestbook by authenicating with your GitHub token.",
        description: `\
This API endpoint requires you to authenicate with your GitHub PAT, which will \
only used to get your GitHub user ID (and GraphQL node ID) and to check if you're \
banned from using the Guestbook APIs.`,
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            message: Str().describe("The message body itself").max(128)
                        }),
                    }
                }
            },
            headers: z.object({
                GITHUB_TOKEN: Str().describe("GitHub token")
            })
        }
    }

    override async handle(c: Context) {
        const data = await this.getValidatedData<typeof this.schema>()
        
        const github = new Octokit({
            auth: data.headers.GITHUB_TOKEN
        })

        try {
            const whoami = await github.users.getAuthenticated()
            const db_user = await lookupGuestbookUser_github(whoami.data.id.toString())
            let db_user_key: Array<string> = db_user.key as Array<string>

            if (db_user.value == null) {
                await saveGuestbookUserData_github(whoami.data.id.toString(), {
                    name: whoami.data.name,
                    username: whoami.data.login,
                    email: whoami.data.email,
                    node_id: whoami.data.node_id
                })
                db_user_key = ["guestbook", "github_users", whoami.data.id.toString()]
            }
            const result = await storeGuestbookMessage(db_user_key, data.body?.message)

            return c.json({ok: true, result})
        } catch (error) {
            return c.json({
                ok: false,
                error
            }, 500)
        }
    }
}
