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
			{ key: 'llama-3.3-70b-versatile', i18nLabel: 'llama-3.3-70b-versatile' },
			{ key: 'deepseek-r1-distill-qwen-32b', i18nLabel: 'deepseek-r1-distill-qwen-32b' },
		],
		required: true,
		public: true,
		packageValue: 'deepseek-r1-distill-qwen-32b',
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
	{
		id: 'LLM-api-key',
		i18nLabel: 'LLM Api Key',
		i18nDescription: 'Must be filled to get LLM output',
		type: SettingType.STRING,
		required: true,
		public: true,
		packageValue: '',
	},
	{
		id: 'LLM-api-endpoint',
		i18nLabel: 'LLM endpoint',
		i18nDescription: 'Must be filled to get LLM output',
		type: SettingType.STRING,
		required: true,
		public: true,
		packageValue: '',
	},
];

export async function getAPIConfig(read: IRead) {
    const envReader = read.getEnvironmentReader().getSettings();
    return {
		model: await envReader.getValueById("model"),
        apiKey: await envReader.getValueById("stock-api-key"),
		LLMapiKey: await envReader.getValueById("LLM-api-key"),
		LLMapiEndpoint: await envReader.getValueById('LLM-api-endpoint')
    };
}