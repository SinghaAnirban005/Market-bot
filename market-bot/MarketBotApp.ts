import {
    IAppAccessors,
    ILogger,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { MarketCommand } from './commands/MarketCommand';
import { IConfigurationExtend } from '@rocket.chat/apps-engine/definition/accessors';
import { settings } from './settings/settings';
import { pollAllEquity } from './scheduler/StockScheduler';
import { IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IHttp } from '@rocket.chat/apps-engine/definition/accessors';
import { IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import { IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { UIKitViewSubmitInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
// import { ExecuteViewSubmitHandler } from './handlers/ExecuteViewSubmitHandler';
import { UIKitBlockInteractionContext, IUIKitResponse } from '@rocket.chat/apps-engine/definition/uikit';
import { ButtonActionHandler } from './handlers/ExecuteBlockSubmitHandler';
import { WishlistViewSubmitHandler } from './handlers/ExecuteViewSubmitHandler';
// import { UIActionButtonContext } from '@rocket.chat/apps-engine/definition/ui';
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
                processor: pollAllEquity,
                // Optional: automatically start the processor during app startup
                // startupSetting: {
                //     type: StartupType.RECURRING,
                //     interval: '10 seconds',
                //     data: { app: this }
                // }
            },
        ]);
        // configuration.ui.registerButton({
        //     actionId: 'my-action-id', // this identifies your button in the interaction event
        //     labelI18n: 'Save', // key of the i18n string containing the name of the button
        //     context: UIActionButtonContext.MESSAGE_ACTION, // the context in which the action button will be displayed on the UI. You can also try using another context to see where the button will be displayed.
        // });
    }
    // public async executeViewSubmitHandler(
    //     context: UIKitViewSubmitInteractionContext,
    //     read: IRead,
    //     http: IHttp,
    //     persistence: IPersistence,
    //     modify: IModify,
    // ) {
    //     return new ExecuteViewSubmitHandler(
    //         this,
    //         read,
    //         http,
    //         persistence,
    //         modify,
    //         context,
    //     ).executor();
    // }

    public async executeBlockActionHandler(context: UIKitBlockInteractionContext, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<IUIKitResponse> {
        const data = context.getInteractionData();
        
        // Handle the button click
        if (data.actionId === 'save_wishlist_action') {
            const handler = new ButtonActionHandler(this, read, http, persistence, modify, context);
            return await handler.executor();
        }
        
        return context.getInteractionResponder().successResponse();
    }

    public async executeViewSubmitHandler(context: UIKitViewSubmitInteractionContext, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<IUIKitResponse> {
        const data = context.getInteractionData();
        
        if (data.view.id === 'subscription_modal') {
            const handler = new WishlistViewSubmitHandler(this, read, http, persistence, modify, context);
            return await handler.executor();
        }
        
        return context.getInteractionResponder().successResponse();
    }
}
