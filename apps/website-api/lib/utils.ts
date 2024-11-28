import { pingMessageValues } from "./staticDataConstraints.ts";

export const kvApi = async(url?: string) => {
	if (!url || url == undefined || url == null) {
		return await Deno.openKv()
	}
	return await Deno.openKv(url)
}

export const randomPingPong = () => {
	var randomNumber = Math.floor(Math.random() * pingMessageValues.length);

	return pingMessageValues[randomNumber]
}
