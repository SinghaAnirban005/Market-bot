// Add this to your relevant handler file (like ExecuteViewSubmitHandler.ts or create a new file)
import {
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IUIKitResponse, UIKitBlockInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { MarketBotApp } from "../MarketBotApp"; // Adjust this import to your app name
import { App } from "@rocket.chat/apps-engine/definition/App";

export class ButtonActionHandler {
    constructor(
        private readonly app: App,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly persistence: IPersistence,
        private readonly modify: IModify,
        private readonly context: UIKitBlockInteractionContext,
    ) {}

    public async executor(): Promise<IUIKitResponse> {
        const data = this.context.getInteractionData();
        console.log(data)
        // // Get the selected values from the dropdowns
        // const blockData = data.container.blocks;
        // let domainSelection = '';
        // let equitySelection = '';
        
        // // Find the select values from the state
        // for (const block of blockData) {
        //     if (block.blockId === 'action_block_1') {
        //         // Get domain selection value
        //         domainSelection = data.state?.[block.blockId]?.['select_action_1'];
        //     }
        //     if (block.blockId === 'action_block_2') {
        //         // Get equity selection value
        //         equitySelection = data.state?.[block.blockId]?.['select_action_2'];
        //     }
        // }
        
        // // Log the collected data
        // this.app.getLogger().info('Wishlist Save Button Clicked');
        // this.app.getLogger().info(`Selected Domain: ${domainSelection}`);
        // this.app.getLogger().info(`Selected Equity: ${equitySelection}`);
        
        // You can also save this data to persistence here
        // await MarketPersistence.storeUserWishlist(this.persistence, roomId, userId, domainSelection, {symbol: equitySelection, category: domainSelection});
        
        return this.context.getInteractionResponder().successResponse();
    }
}