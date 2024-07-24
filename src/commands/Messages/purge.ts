import { ApplyOptions } from '@sapphire/decorators';
import { Command, type Args } from '@sapphire/framework';
import { ApplicationCommandOptionType, Message, type TextBasedChannel } from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'purge',
	description: 'Bulk deletes messages.',
	aliases: ['prune', 'delete-messages'],
	options: ['amount'],
	requiredClientPermissions: ['ManageMessages'],
	requiredUserPermissions: ['ManageMessages']
})

export class Purge extends Command {
	// Register Chat Input and Context Menu command
	public override registerApplicationCommands(registry: Command.Registry) {
		// Register Chat Input command
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description,
			options: [
				{
					type: ApplicationCommandOptionType.Integer,
					name: 'amount',
					required: true,
					description: 'The amount of messages to delete.',
					maxValue: 100
				}
			]
		});
	}

	// Message command
	public override async messageRun(message: Message, args: Args) {
		const amount = await args.pick('number');
		if (!amount) return message.reply('Please provide an amount.');

		await message.delete();

		try {
			const collection = await this.purge(message.channel, amount);
			return message.channel.send(`<@${message.author.id}>, ${collection.size} messages have been successfully purged.`);
		} catch (error) {
			this.container.logger.error(`Failed to purge messages in ${message.channelId}:`, error);
			return message.reply('An internal error occured while trying to purge messages.');
		}
	}

	// Chat Input (slash) command
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const amount = interaction.options.getInteger('amount')!;

		try {
			const collection = await this.purge(interaction.channel!, amount);
			return interaction.reply(`Successfully purged ${collection.size} messages.`);
		} catch (error) {
			this.container.logger.error(`Failed to purge messages in ${interaction.channelId}:`, error);
			return interaction.reply('An internal error occured while trying to purge messages.');
		}
	}

	private async purge(channel: TextBasedChannel, amount: number) {
		if (channel.isDMBased()) throw new Error('This command is not available in DMs.');

		return await channel.bulkDelete(amount);
	}
}
