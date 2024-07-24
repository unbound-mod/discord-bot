import type { Args, ChatInputCommand, Command, ContextMenuCommand } from '@sapphire/framework';
import { EmbedBuilder, Message, type AutocompleteInteraction } from 'discord.js';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { ApplyOptions } from '@sapphire/decorators';
import prisma from '~/lib/prisma';
import config from '@config';

@ApplyOptions<Subcommand.Options>({
	name: 'tag',
	description: 'Get, list, create and delete re-usable tags.',
	options: ['name'],
	subcommands: [
		{
			name: 'create',
			requiredUserPermissions: ['ManageMessages'],
			messageRun: 'messageCreate',
			chatInputRun: 'chatInputCreate'
		},
		{
			name: 'delete',
			requiredUserPermissions: ['ManageMessages'],
			messageRun: 'messageDelete',
			chatInputRun: 'chatInputDelete'
		},
		{
			name: 'list',
			messageRun: 'messageList',
			chatInputRun: 'chatInputList'
		},
		{
			name: 'get',
			messageRun: 'messageGet',
			chatInputRun: 'chatInputGet',
			default: true
		}
	]
})

export class TagManagementCommand extends Subcommand {
	public override registerApplicationCommands(registry: ChatInputCommand.Registry) {

		// Register Chat Input command
		registry.registerChatInputCommand((builder) => builder
			.setName(this.name)
			.setDescription(this.description)
			.addSubcommand((create) => create
				.setName('create')
				.setDescription('Create a tag.')
				.addStringOption((name) => name
					.setName('name')
					.setRequired(true)
					.setDescription('The tag\'s re-usable identifier.')
				)
				.addStringOption((content) => content
					.setName('content')
					.setRequired(true)
					.setDescription('The content of the tag.')
				)
			)
			.addSubcommand((get) => get
				.setName('get')
				.setDescription('Get a tag by its name.')
				.addStringOption((name) => name
					.setName('name')
					.setRequired(true)
					.setDescription('The tag\'s name.')
					.setAutocomplete(true)
				)
				.addBooleanOption((send) => send
					.setName('send')
					.setDescription('Whether to send the message in chat.')
				)
			)
			.addSubcommand((list) => list
				.setName('list')
				.setDescription('List all tags.')
			)
			.addSubcommand((del) => del
				.setName('delete')
				.setDescription('Deletes the provided tag.')
				.addStringOption((name) => name
					.setName('name')
					.setRequired(true)
					.setDescription('The tag\'s name.')
					.setAutocomplete(true)
				)
			)
		);
	}

	public override async contextMenuRun(interaction: ContextMenuCommand.Interaction, context: ContextMenuCommand.RunContext) {

	}

	public async messageGet(message: Message, args: Args) {
		const name = args.next();

		if (!name) {
			return message.reply({ content: 'Please provide a tag name.' });
		}

		const result = await prisma.tag.findFirst({ where: { name } });

		if (!result) {
			return message.reply({ content: 'The tag you requested does not exist.' });
		}

		const embed = new EmbedBuilder()
			.setTitle('Tag')
			.setDescription(result.content);

		message.reply({ embeds: [embed] });
	}

	public async chatInputGet(interaction: Command.ChatInputCommandInteraction) {
		const name = interaction.options.getString('name')!;
		const send = interaction.options.getString('send');

		const result = await prisma.tag.findFirst({ where: { name } });

		if (!result) {
			return interaction.reply({ ephemeral: true, content: 'The tag you requested does not exist.' });
		}

		interaction.reply({ ephemeral: !send, content: result.content });
	}

	public async messageCreate(message: Message, args: Args) {
		const name = args.next();
		if (!name) return message.reply('Please provide a tag name.');

		const content = await args.rest('string');
		if (!content) return message.reply('Please provide content for this tag.');

		const exists = await this.getTag(name);

		if (exists) {
			return message.reply('This tag already exists. Please use /tag update if you would like to update it.');
		}

		await this.createTag(name, content);

		return message.reply(`The tag "${name}" has been successfully created.`);
	}

	public async chatInputCreate(interaction: Subcommand.ChatInputCommandInteraction) {
		const name = interaction.options.getString('name')!;
		const content = interaction.options.getString('content')!;

		const exists = await this.getTag(name);

		if (exists) {
			return interaction.reply({ ephemeral: true, content: 'This tag already exists. Please use /tag update if you would like to update it.' });
		}

		await this.createTag(name, content);

		return interaction.reply({ content: `The tag "${name}" has been successfully created.` });
	}

	public async messageDelete(message: Message, args: Args) {
		const name = args.next();
		if (!name) return message.reply('Please provide a tag name.');

		const exists = await this.getTag(name);

		if (!exists) {
			return message.reply({ content: 'The tag you are attempting to delete does not exist.' });
		}

		await this.deleteTag(name);

		return message.reply({ content: `The tag "${name}" has been successfully deleted.` });
	}

	public async chatInputDelete(interaction: Subcommand.ChatInputCommandInteraction) {
		const name = interaction.options.getString('name')!;
		const exists = await this.getTag(name);

		if (!exists) {
			return interaction.reply({ ephemeral: true, content: 'The tag you are attempting to delete does not exist.' });
		}

		await this.deleteTag(name);

		return interaction.reply({ content: `The tag "${name}" has been successfully deleted.` });
	}


	public async messageList(message: Message) {
		const tags = await this.getTags();

		if (!tags.length) {
			return message.reply('There are no tags. You can create tags with `/tag create`.');
		}

		const pager = new PaginatedMessage();

		for (let i = 0, page = 1; tags.length > i; i += 5, page++) {
			const items = tags.slice(i, i + 5);
			const embed = new EmbedBuilder()
				.setTitle(`Tags  |  Page ${page}`)
				.setColor(config.colours.brand)
				.addFields(items.map(({ name, content }) => ({ name, value: content })));

			pager.addPage({ embeds: [embed] });
		}

		pager.run(message);
	}

	public async chatInputList(interaction: Subcommand.ChatInputCommandInteraction) {
		const tags = await this.getTags();

		if (!tags.length) {
			return interaction.reply({ ephemeral: true, content: 'There are no tags. You can create tags with `/tag create`.' });
		}

		const pager = new PaginatedMessage();

		for (let i = 0, page = 1; tags.length > i; i += 5, page++) {
			const items = tags.slice(i, i + 5);
			const embed = new EmbedBuilder()
				.setTitle(`Tags  |  Page ${page}`)
				.setColor(config.colours.brand)
				.addFields(items.map(({ name, content }) => ({ name, value: content })));

			pager.addPage({ embeds: [embed] });
		}

		pager.run(interaction);
	}

	public async autocompleteRun(interaction: AutocompleteInteraction) {
		const query = interaction.options.getString('query') ?? '';

		const tags = await this.getTags();
		const names = tags
			.filter((({ name }) => name.toLowerCase().includes(query.toLowerCase())))
			.map(({ name }) => ({ name, value: name }));

		interaction.respond(names);
	}

	private getTag(name: string) {
		return prisma.tag.findFirst({ where: { name } });
	}

	private getTags() {
		return prisma.tag.findMany();
	}

	private createTag(name: string, content: string) {
		return prisma.tag.create({
			data: {
				name,
				content
			}
		});
	}

	private deleteTag(name: string) {
		return prisma.tag.delete({ where: { name } });
	}
}