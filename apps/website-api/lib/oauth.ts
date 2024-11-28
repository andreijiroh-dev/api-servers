export function generateOauthUrl(
	authorize_url: string,
	client_id: string,
	scopes: string,
	redirect_uri: string,
	state?: string,
	response_type?: "code" | "pkce",
	additionalParams?: {
		prompt?: boolean
	}
) {
	const baseUrl = new URL(authorize_url)
	baseUrl.searchParams.append("client_id", client_id)
	baseUrl.searchParams.append("redirect_uri", redirect_uri)
	baseUrl.searchParams.append("scope", scopes)

	if (!state || state == "") {
		baseUrl.searchParams.append("state", crypto.randomUUID())
	} else {
		baseUrl.searchParams.append("state", state)
	}

	if (!response_type) {
		baseUrl.searchParams.append("response_type", "code")
	} else {
		baseUrl.searchParams.append("response_type", response_type)
	}

	if (additionalParams) {
		if (additionalParams.prompt == true) {
			if (baseUrl.hostname == "accounts.spotify.com") {
				baseUrl.searchParams.append("show_dialog", Boolean(true).toString())
			}
		}
	}

	return baseUrl.toString()
}
