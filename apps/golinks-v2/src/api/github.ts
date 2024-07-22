import { Context } from "hono";

export async function githubAuth(context: Context) {
	const appId = context.env.GITHUB_OAUTH_ID
	const redirect_uri = `${context.env.BASE_URL}/auth/github/callback`
	const {
		slack_id,
		slack_team,
		state,
		client_id,
		code
	} = context.req.query()

	if (client_id == "slack" && context.req.path == "/auth/github") {
		const requestState = encodeURIComponent(JSON.stringify({
			slack_id,
			slack_team,
			state
		}))
		return context.redirect(`https://github.com/login/oauth?client_id=${appId}&redirect_uri=${redirect_uri}&state=${requestState}`)
	}
}
