import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { ApplicationCommandType, ComponentType, Message } from 'discord.js';
import { resolveKey } from '@sapphire/plugin-i18next';
import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import config from '@config';

export interface HelpPages {
	[category: string]: Command[];
}

@ApplyOptions<Command.Options>({
	name: 'help',
	description: 'Displays a detailed list of commands.'
})

export class UserCommand extends Command {
	// Register Chat Input and Context Menu command
	public override registerApplicationCommands(registry: Command.Registry) {
		// Register Chat Input command
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description
		});

		// Register Context Menu command available from any message
		registry.registerContextMenuCommand({
			name: this.name,
			type: ApplicationCommandType.Message
		});

		// Register Context Menu command available from any user
		registry.registerContextMenuCommand({
			name: this.name,
			type: ApplicationCommandType.User
		});
	}

	// Message command
	public override async messageRun(message: Message) {
		return this.sendHelp(message);
	}

	// Chat Input (slash) command
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.sendHelp(interaction);
	}

	private async sendHelp(interactionOrMessage: Message | Command.ChatInputCommandInteraction) {
		const entries = this.container.stores.get('commands');
		const pages: HelpPages = {};
		const pager = new PaginatedMessage({
			actions: [
				...PaginatedMessage.defaultActions,
				{
					customId: '@sapphire/paginated-messages.goToPage',
					type: ComponentType.StringSelect,
					options: [],
					run: ({ handler, interaction }) => interaction.isStringSelectMenu() && (handler.index = parseInt(interaction.values[0], 10))
				}
			]

		});

		const Strings = {
			NO_CATEGORY: await resolveKey(interactionOrMessage, 'commands/help:no-category'),
			CATEGORY: await resolveKey(interactionOrMessage, 'commands/help:category'),
			NO_PAGINATION_OWNERSHIP: await resolveKey(interactionOrMessage, 'commands/help:no-pagination-ownership'),
		};

		for (const entry of entries.values()) {
			const category = entry.fullCategory.join(' → ') || Strings.NO_CATEGORY;
			pages[category] ??= [];
			pages[category].push(entry);
		}

		const categories = Object.keys(pages);

		for (const category of categories) {
			const commands = pages[category];

			pager.addPageEmbed((embed) => {
				const list = commands.map(c => [
					`**${[c.name, ...(c.aliases ?? [])].join(' | ')}**`,
					`_${c.description}_`,
					''
				].join('\n'));

				return embed.setTitle(category).setColor(config.colours.brand).setDescription(list.join('\n'));
			});
		}

		pager.setWrongUserInteractionReply(() => ({
			ephemeral: true,
			content: Strings.NO_PAGINATION_OWNERSHIP,
		}));

		pager.setSelectMenuPlaceholder(Strings.CATEGORY);
		pager.setSelectMenuOptions((page) => {
			const idx = page - 1;
			const label = categories[idx] ?? Strings.NO_CATEGORY;

			return { label };
		});

		pager.run(interactionOrMessage);
	}
}
