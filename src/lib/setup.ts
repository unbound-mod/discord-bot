// Unless explicitly defined, set NODE_ENV as development:
process.env.NODE_ENV ??= 'development';

import { ApplicationCommandRegistries, RegisterBehavior } from '@sapphire/framework';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { ButtonStyle, ComponentType } from 'discord.js';
import { setup } from '@skyra/env-utilities';
import * as colorette from 'colorette';
import { rootDir } from './constants';
import { join } from 'node:path';

import '@sapphire/plugin-subcommands/register';
import '@sapphire/plugin-i18next/register';
import '@sapphire/plugin-logger/register';

// Set default behavior to bulk overwrite
ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite);

// Set default paginated message actions
PaginatedMessage.defaultActions = [
	{
		customId: '@sapphire/paginated-messages.firstPage',
		style: ButtonStyle.Primary,
		label: '↞',
		type: ComponentType.Button,
		run: ({ handler }) => (handler.index = 0)
	},
	{
		customId: '@sapphire/paginated-messages.previousPage',
		style: ButtonStyle.Primary,
		label: '←',
		type: ComponentType.Button,
		run: ({ handler }) => {
			if (handler.index === 0) {
				handler.index = handler.pages.length - 1;
			} else {
				--handler.index;
			}
		}
	},
	{
		customId: '@sapphire/paginated-messages.nextPage',
		style: ButtonStyle.Primary,
		label: '→',
		type: ComponentType.Button,
		run: ({ handler }) => {
			if (handler.index === handler.pages.length - 1) {
				handler.index = 0;
			} else {
				++handler.index;
			}
		}
	},
	{
		customId: '@sapphire/paginated-messages.goToLastPage',
		style: ButtonStyle.Primary,
		label: '↠',
		type: ComponentType.Button,
		run: ({ handler }) => (handler.index = handler.pages.length - 1)
	},
	{
		customId: '@sapphire/paginated-messages.stop',
		style: ButtonStyle.Danger,
		label: 'x',
		type: ComponentType.Button,
		run: ({ collector }) => {
			collector.stop();
		}
	}
];

// Read env var
setup({ path: join(rootDir, '.env') });

// Enable colorette
colorette.createColors({ useColor: true });
