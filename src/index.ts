import './lib/setup';

import { LogLevel, SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';
import prisma from '~/lib/prisma';

const client = new SapphireClient({
	defaultPrefix: '!',
	caseInsensitiveCommands: true,
	logger: {
		level: LogLevel.Debug
	},
	intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
	loadMessageCommandListeners: true
});

async function main() {
	try {
		client.logger.info('Initializing Prisma...');
		await prisma.$connect();
		client.logger.info('Database initialized.');

		client.logger.info('Logging in...');
		await client.login();
		client.logger.info(`Logged in as ${client.user!.username}`);
	} catch (error) {
		client.logger.fatal(error);
		await client.destroy();
		process.exit(1);
	}
}

void main();