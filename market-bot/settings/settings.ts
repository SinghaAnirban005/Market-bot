import {
	ISetting,
	SettingType,
} from '@rocket.chat/apps-engine/definition/settings';
import { IRead } from '@rocket.chat/apps-engine/definition/accessors';

export const settings: ISetting[] = [
	{
		id: 'model',
		i18nLabel: 'Model selection',
		i18nDescription: 'AI model to use summary.',
		type: SettingType.SELECT,
		values: [
			{ key: 'GPT-4o', i18nLabel: 'GPT-4o' },
			{ key: 'mistral-7b', i18nLabel: 'Mistral 7B' },
		],
		required: true,
		public: true,
		packageValue: 'GPT-4o',
	},
	{
		id: 'stock-api-key',
		i18nLabel: 'Api Key',
		i18nDescription: 'Must be filled to get stock market prices',
		type: SettingType.STRING,
		required: true,
		public: true,
		packageValue: '',
	},
];

export async function getAPIConfig(read: IRead) {
    const envReader = read.getEnvironmentReader().getSettings();
    return {
        apiKey: await envReader.getValueById("stock-api-key"),
    };
}