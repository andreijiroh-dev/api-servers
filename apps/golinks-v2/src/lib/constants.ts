import { EnvBindings } from "types";
import { Env } from "../../worker-configuration";

export const adminApiKey = {
		type: 'apiKey',
		name: 'X-Golinks-Admin-Key',
		in: 'header',
};

export const homepage = "https://wiki.andreijiroh.xyz/golinks"

export const contact = {
	name: "Andrei Jiroh Halili",
	url: homepage,
	email: "ajhalili2006@andreijiroh.xyz"
}

export function getWorkersDashboardUrl(env: EnvBindings<Env>['DEPLOY_ENV']) {
	if (env == "production") {
		return 'https://dash.cloudflare.com/cf0bd808c6a294fd8c4d8f6d2cdeca05/workers/services/view/golinks-next/production';
	} else {
		return 'https://dash.cloudflare.com/cf0bd808c6a294fd8c4d8f6d2cdeca05/workers/services/view/golinks-next-staging/production';
	}
};

export const servers = [
	{
		url: 'https://go.andreijiroh.xyz',
		description: 'Production Deployment',
	},
	{
		url: 'https://golinks-next.ajhalili2006.workers.dev',
		description: 'Production Deployment (workers.dev)',
	},
	{
		url: 'https://golinks-next-staging.ajhalili2006.workers.dev',
		description: 'Staging Deployment',
	},
	{
		url: 'http://localhost:35120',
		description: 'Local dev instance via miniflare',
	},
];
