import type { CommandInteraction, ContextMenuCommandInteraction, Guild, Message } from 'discord.js';
import { Precondition } from '@sapphire/framework';
import config from '@config';

export class UnboundCondition extends Precondition {
	public override async messageRun(message: Message) {
		// For Message Commands
		return this.checkEligibility(message.guild);
	}

	public override async chatInputRun(interaction: CommandInteraction) {
		// For Slash Commands
		return this.checkEligibility(interaction.guild);
	}

	public override async contextMenuRun(interaction: ContextMenuCommandInteraction) {
		// For Context Menu Command
		return this.checkEligibility(interaction.guild);
	}

	private async checkEligibility(guild: Guild | null) {
		if (!guild) {
			return this.error({ message: 'I am not available in DMs.' });
		}

		if (guild.id !== config.server) {
			return this.error({ message: 'I am not available in this server.' });
		}

		return this.ok();
	}
}