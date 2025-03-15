import { ISlashCommand } from "@rocket.chat/apps-engine/definition/slashcommands";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { IModify, IRead, IPersistence, IHttp } from "@rocket.chat/apps-engine/definition/accessors"
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { sendMessage } from "../utils/message";
import { StockHandler } from "../lib/StockHandler";
import { MarketPersistence } from "../persistence/persistence";
import { WatchlistHandler } from "../lib/WatchlistHandler";
import { SummarizeTrends } from "../prompts/AssetTrend";
import { UIKitSurfaceType } from "@rocket.chat/apps-engine/definition/uikit";
import { NewsHandler } from "../lib/NewsHandler";
import { SummarizeNews } from "../prompts/NewsAnalysis";

class MarketCommand implements ISlashCommand {
    public command = "market"
    public i18nParamsExample = '';
    public i18nDescription = '';
    public providesPreview: boolean = false
    private readonly app: App

    constructor(app: App){
        this.app = app
    }

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {

        const params = context.getArguments()

        const room: IRoom = context.getRoom()
        const user: IUser = context.getSender()
        const appUser = await this.app.getAccessors().reader.getUserReader().getAppUser(this.app.getID());

        if (!params || params.length == 0) {
            return this.notifyMessage(room, read, user, "At least one status argument is mandatory. A second argument can be passed as status text.");
        }

        const category = params[0]
        const symbol = params[1]
        const market = params[2]
        let res: string = ''
        if(category === "price"){
            const response = await StockHandler(http, read, symbol)
            res = response.formattedMarkdown
        }
        else if(category === "stock"){
            // Store the name of the equity in persistence
            const stored = await MarketPersistence.storeUserWishlist(persis, room.id, user.id, category, {symbol: symbol, category: category})

            const storedData = await MarketPersistence.getAllUserWatchList(read.getPersistenceReader())
            // Below i am demonstrating the modal view instead of manually typing in command
            await modify.getUiController().openSurfaceView(
                {
                  type: UIKitSurfaceType.MODAL,
                  id: 'wishlist_modal',
                  title: { 
                    text: 'Configure Wishlist',
                    type: 'plain_text' 
                  },
                  blocks: [{
                  type: 'actions',
                  blockId: 'action_block_1',
                    elements: [
                        {
                            type: 'static_select',
                            actionId: 'select_action_1',
                            blockId: 'select_block_1',
                            appId: this.app.getID(),
                            placeholder: {
                                type: 'plain_text',
                                text: 'Select domain'
                            },
                            options: [
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: 'Stock'
                                    },
                                    value: 'stock'
                                },
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: 'Forex'
                                    },
                                    value: 'forex'
                                },
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: 'Crypto Currency'
                                    },
                                    value: 'crypto'
                                },
                            ]
                        },
                    ]
                }, 
                { // content of the modal
                    type: 'actions',
                    blockId: 'action_block_2',
                      elements: [
                        {
                            type: 'static_select',
                            actionId: 'select_action_2',
                            blockId: 'select_block_2',
                            appId: this.app.getID(),
                            placeholder: {
                                type: 'plain_text',
                                text: 'Select equity'
                            },
                            options: [
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: 'IBM'
                                    },
                                    value: 'IBM'
                                },
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: 'Microsoft'
                                    },
                                    value: 'MSFT'
                                },
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: 'Apple'
                                    },
                                    value: 'AAPL'
                                },
                            ]
                        }
                      ]
                  }, 
                  {
                    type: 'divider',
                    blockId: 'divider_1',
                  },
                //   {
                //     type: 'actions', // the action block
                //     appId: this.app.getID(),
                //     blockId: 'action_block_3',
                //     elements: [ // the elements parameter contains the action element details, in this case, a button element
                //         {
                //             type: 'button',
                //             actionId: 'save_wishlist_action',
                //             appId: this.app.getID(),
                //             blockId: 'button_action_block_3',
                //             text: {
                //                 type: 'plain_text',
                //                 text: 'Save'
                //             },
                //             style: 'primary',
                //             value: 'Button element'
                //         }
                //     ]
                // },
               ],
               //@ts-ignore
               submit: {
                    type: 'button',
                    text: {
                        type: 'plain_text',
                        text: 'Save'
                    },
                    style: 'primary'
               }
              },
                { triggerId: context.getTriggerId()! },
                context.getSender()
              )
        }

        else if(category === "crypto"){
            const stored = await MarketPersistence.storeUserWishlist(persis, room.id, user.id, category, {symbol: symbol, market: market, category: category})
        }

        else if(category === "watch"){
            // For now i shall return the real-time prices of the saved equities
           const results = await WatchlistHandler(read, room, user.id, http)
        //    if(results.stocks.length > 0 && appUser){
        //         await sendMessage(modify, appUser, room, results.stocks) Here msg expects a string but is getting an object 
        //    }

           // Similar needs to be done for forex and crypto currencies
        }

        else if(category === "schedule") {
            await modify.getScheduler().scheduleRecurring({
                id: 'stock-update-processor',
                interval: '5 seconds',
                data: {app: this.app}
            })
            res = `Started stock updates every 0.1 minutes.`;
        }
        else if(category === "stop") {
            await modify.getScheduler().cancelJob('stock-update-processor');
            res = 'Stopped stock updates.';
        }
        else if(category === "remove"){
            await MarketPersistence.deleteAllUserWatchlist(persis)
        }
        else if(category === "trend"){
            const response = await StockHandler(http, read, symbol)
            this.app.getLogger().log("Response -> ", response)
            const summary = await SummarizeTrends(response, read, http, symbol)
            res = summary
        } else if(category === "news") {
            const newsData = await NewsHandler(http, read, symbol)

            const newsSummary = await SummarizeNews(newsData, read, http, symbol)
            this.app.getLogger().log("News summary -> ", newsSummary)
            res = newsSummary
        }

        
        if(appUser){
            await sendMessage(modify, appUser, room, res)
        }else {
            this.app.getLogger().warn("App user not found. Message not sent.");
        }
    }

    private async notifyMessage(room: IRoom, read: IRead, sender: IUser, message: string): Promise<void> {
        const notifier = read.getNotifier();
        const messageBuilder = notifier.getMessageBuilder();
        messageBuilder.setText(message);
        messageBuilder.setRoom(room);
        return notifier.notifyUser(sender, messageBuilder.getMessage());
     }
}

export { MarketCommand }

