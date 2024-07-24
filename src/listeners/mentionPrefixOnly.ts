import type { Events } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';

export class UserEvent extends Listener<typeof Events.MentionPrefixOnly> {
	public override async run(message: Message) {
		const { defaultPrefix } = this.container.client.options;

		return message.channel.send(defaultPrefix ?
			`My prefix in this guild is: \`${defaultPrefix}\`` :
			'Cannot find any Prefix for Message Commands.'
		);
	}
}
