import { debug } from '../../../packages/lib/logging';

export default {
	async email(message, env, ctx) {
		const block = [
			// tests via CF Dashboard
			'example-blocked@recaptime.dev',
			'spammer@example.com',

			// real spammer addresses here
			'rafiezadehmahmoudhamid@gmail.com',
		];

		const regex = /@[a-zA-Z0-9-_.]+/gm;
		const subst = ``;
		const emailUsername = message.headers.get('to').replace(regex, subst);

		if (block.indexOf(message.headers.get('from')) == -1) {
			debug(`handling ${message.from}'s message with subject "${message.headers.get('subject')}"`, `incoming-email`);
			debug(`parsed email username:${emailUsername}`, `email-parser`);
			switch (emailUsername) {
				case 'ajhalili2006':
					await message.forward(env.MAIN_ADDRESS);
					break;
				case 'halili':
					await message.forward(env.MAIN_ADDRESS);
					break;
				case 'andreijiroh.halili23':
					await message.forward(env.MAIN_ADDRESS);
					break;
				case 'multifandom-hellscapes':
					await message.forward(env.MULTIFANDOM_ADDRESS);
					break;
				case 'multifandom-multiverse':
					await message.forward(env.MULTIFANDOM_ADDRESS);
					break;
				case 'multifandom-buffoonery':
					await message.forward(env.MULTIFANDOM_ADDRESS);
					break;
				case 'mfhellscapes':
					await message.forward(env.MULTIFANDOM_ADDRESS);
					break;
				case 'fromthebshq':
					await message.forward(env.MAIN_ADDRESS);
					await message.forward(env.MULTIFANDOM_ADDRESS);
					break;
				default:
					message.setReject('Email username part does not exist');
			}
		} else {
			message.setReject('Address is blockedlisted behind the scenes. See https://go.andreijiroh.xyz/workers/email-blocklisted');
		}
	},
};
