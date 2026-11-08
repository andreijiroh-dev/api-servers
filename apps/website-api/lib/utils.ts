import { pingMessageValues } from "./staticDataConstraints.ts";

export const randomPingPong = () => {
	var randomNumber = Math.floor(Math.random() * pingMessageValues.length);

	return pingMessageValues[randomNumber]
}
