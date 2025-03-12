import {
    IAppAccessors,
    ILogger,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { MarketCommand } from './commands/MarketCommand';
import { IConfigurationExtend } from '@rocket.chat/apps-engine/definition/accessors';
import { settings } from './settings/settings';
import { stockUpdateScheduler } from './scheduler/StockScheduler';
import { StartupType } from '@rocket.chat/apps-engine/definition/scheduler';

export class MarketBotApp extends App {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        await Promise.all(
            settings.map((setting) =>
                configuration.settings.provideSetting(setting)
            )
        );
        configuration.slashCommands.provideSlashCommand(new MarketCommand(this));

        configuration.scheduler.registerProcessors([
            {
                id: 'stock-update-processor',
                processor: stockUpdateScheduler,
                // Optional: automatically start the processor during app startup
                // startupSetting: {
                //     type: StartupType.RECURRING,
                //     interval: '0.1 minutes', // Adjust as needed
                //     data: { app: this }
                // }
            },
        ]);
    }
}
