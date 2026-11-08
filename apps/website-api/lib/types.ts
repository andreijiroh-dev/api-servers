import { z, string, object, array } from "npm:zod";

export const meSchema = z.object({
	city: string(),
	state: string(),
	country: string({
		description: "ISO XXXX country code"
	}).default("PH"),
	slack: array(object({
		team_id: string(),
		team: string(),
		user_id: string()
	})).default([
		{
			team_id: "T0266FRGM",
			team: "hackclub",
			user_id: "U07CAPBB9B5"
		}
	])
})

export const metaSchema = z.object({
	city: string(),
	state: string(),
	country: string({
		description: "ISO XXXX country code"
	}).default("PH"),
	slack: array(object({
		team_id: string(),
		team: string(),
		user_id: string()
	})).default([
		{
			team_id: "T0266FRGM",
			team: "hackclub",
			user_id: "U07CAPBB9B5"
		}
	])
})
