import { /* EmbedBuilder, */ type Message } from 'discord.js';
import type { Events } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';
// import config from '@config';

export class MessageDelete extends Listener<typeof Events.MessageDelete> {
	public override async run(message: Message) {
		// if (!message.guild || message.author.bot) return;

		// const { client } = this.container;

		// const channelId = /* TODO: Add db fetch login */ '1265132879919317093';
		// const channel = client.channels.cache.get(channelId);
		// if (!channel || !channel.isTextBased()) return;

		// const embed = new EmbedBuilder()
		// 	.setTitle('Message Deleted')
		// 	.setColor(config.colours.danger)
		// 	.setURL(message.url)
		// 	.setFooter({
		// 		text: message.author.username,
		// 		iconURL: message.author.displayAvatarURL()
		// 	});

		// channel.send({ embeds: [embed] });
	}
}