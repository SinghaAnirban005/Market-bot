import {
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { UIKitViewSubmitInteractionContext } from "@rocket.chat/apps-engine/definition/uikit";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { IUIKitResponse } from "@rocket.chat/apps-engine/definition/uikit";
import { MarketPersistence } from "../persistence/persistence";

export class WishlistViewSubmitHandler {
    constructor(
        private readonly app: App,
        private readonly read: IRead,
        private readonly http: IHttp,
        private readonly persistence: IPersistence,
        private readonly modify: IModify,
        private readonly context: UIKitViewSubmitInteractionContext,
    ) {}

    public async executor(): Promise<IUIKitResponse> {
        const data = this.context.getInteractionData();
        this.app.getLogger().info('View Submit Data:', data);
        const { user, room, view } = data;
        const domainSelection = view.state?.['select_block_1']?.['select_action_1'];
        const equitySelection = view.state?.['select_block_2']?.['select_action_2'];
        const pollingTime = view.state?.['select_block_3']?.['select_action_3']
        
        this.app.getLogger().info('Selected Domain:', domainSelection);
        this.app.getLogger().info('Selected Equity:', equitySelection);

        const stored = await MarketPersistence.storeUserSubscription(this.persistence, room?.id as string, user.id, domainSelection, equitySelection)
        const show = await MarketPersistence.getAllUserWatchList(this.read.getPersistenceReader())
        this.app.getLogger().log(show)

        await this.modify.getScheduler().scheduleRecurring({
            id: 'stock-update-processor',
            interval: `${pollingTime}`,
            data: {app: this.app}
        })
        // if (domainSelection && equitySelection) {
        //     await MarketPersistence.storeUserWishlist(
        //         this.persistence, 
        //         room.id, 
        //         user.id, 
        //         domainSelection, 
        //         {
        //             symbol: equitySelection, 
        //             category: domainSelection
        //         }
        //     );
            
        //     this.app.getLogger().info('Wishlist saved successfully');
        // }
        
        return this.context.getInteractionResponder().successResponse();
    }
}