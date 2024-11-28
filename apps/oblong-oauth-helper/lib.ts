type resultingData = {
    access_token: string,
    token_type: "Bearer",
    expires_in: 7200,
    scope: string,
    created_at: number,
    id_token?: string,
    error: string,
    error_description: string
}

export const clientId = Deno.env.get("OBLONG_API_CLIENT_ID");
export const clientSecret = Deno.env.get("OBLONG_API_CLIENT_SECRET");
export const redirect_uri = `${Deno.env.get("OBLONG_API_BASE_URL")}/auth/callback`;

export const home = `\
Howdy, this is a Hono server for helping obl.ong domain holders to generate their
own tokens for API access, hosted on Deno Deploy by ~ajhalili2006 (ajhalili2006.obl.ong).

To get started, navigate to ${Deno.env.get("OBLONG_API_BASE_URL")}/auth,
approve and copy the API token after the auth code exchange.

This server is open-source under the MPL-2.0 license at
https://github.com/andreijiroh-dev/api-servers/blob/main/apps/oblong-oauth-helper.
Consider supporting ~ajhalili2006 at https://github.com/sponsors/ajhalili2006 or
https://sponsors.andreijiroh.xyz to keep this service maintained.
`;

export const authCode = (code: string) => `\
We've received the authenication code, but it is intended for another OAuth client \
on obl.ong admin API. Copy the following code into the application requesting it to \
exchange for an access token:

	${code}

Do not share it with anyone, even to the domain holder behind libdns.obl.ong.
`

export const accessToken = (token: string) => `\
Here's your access token for obl.ong admin API, which is valid for 2 hours:

	${token}

Do not share it with anyone, even to the domain holder behind libdns.obl.ong.
Keep the access token in a safe place, since you'll be no longer able to
retrieve this again once you navigate away from or refresh this page.
`

export const handleError = (error: string) => `\
Something went wrong while exchanging your authenication code for a token.
The error code from the obl.ong backend was ${error}.

Not expected to see this? Please report this as bug at
${Deno.env.get("OBLONG_API_BASE_URL")}/feedback and we'll looking
into it.
`

export async function exchangeCodeForToken(code: string, state: string) {

	const data = await fetch("https://admin.obl.ong/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri,
      state,
      grant_type: "authorization_code",
    }),
  })
  const resultJson: resultingData = await data.json()

  if (resultJson.access_token) {
	return {
		ok: true,
		token: resultJson.access_token
	};
  } else {
	return {
		ok: false,
		token: null,
		error: resultJson.error
	}
  }
}
