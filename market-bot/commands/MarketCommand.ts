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
import { CryptoHandler } from "../lib/CryptoHandler";
import { calculatePriceMovementConfidence } from "../utils/PriceConfidence";
import { calculateNewsSentimentConfidence } from "../utils/NewsConfidence";
import { calculateVolumeConfidence } from "../utils/VolumeConfidence";
import { PredictPrices } from "../lib/Predict";

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
                interval: '1 minute',
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
            const stocksData = await StockHandler(http, read, symbol)
            const newsData = await NewsHandler(http, read, symbol)
            const feed = newsData.feed
            // this.app.getLogger().log("Response -> ", response)
            // const summary = await SummarizeTrends(response, read, http, symbol)
            // res = summary
            const priceMovementConfidence = calculatePriceMovementConfidence(stocksData)
            const newsSentimentConfidence = calculateNewsSentimentConfidence(feed, symbol)
            const volumeConfidence = calculateVolumeConfidence(stocksData)
            const confidenceScore = (0.5 * priceMovementConfidence) + (0.3 * newsSentimentConfidence) + (0.2 * volumeConfidence);
            const now = new Date();

            // Subtract 7 days
            now.setUTCDate(now.getUTCDate() - 7);
        
            // Extract individual components
            const year = now.getUTCFullYear();
            const month = String(now.getUTCMonth() + 1).padStart(2, '0');
            const day = String(now.getUTCDate()).padStart(2, '0');
            const hours = String(now.getUTCHours()).padStart(2, '0');
            const minutes = String(now.getUTCMinutes()).padStart(2, '0');
        
            // Format it as YYYYMMDDTHHMM
            const timeFrom = `${year}${month}${day}T${hours}${minutes}`;

            const historicalNewsEP = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&time_from=${timeFrom}&apikey=LVG7919O1R681R1U&sort=RELEVANCE`
            const res2 = await http.get(historicalNewsEP, {
                headers: {
                    "Content-Type": "application/json",
                }
            })

            if (res2.statusCode !== 200) {
                throw new Error(`API error: ${res2.statusCode}`);
            }
            // console.log(res2)
            const info2 = res2["data"]
            const weeklyNews = info2["feed"]
            // const sentimentScores = weeklyNews.map((article) => article.overall_sentiment_score);
            // const averageSentiment = sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length;
            this.app.getLogger().log("WEEEKLY NEWS -> ", weeklyNews)
            this.app.getLogger().log("WEEEKLY NEWS -> ",typeof weeklyNews)
            // this.app.getLogger().log(averageSentiment)

            const sum = await SummarizeTrends(stocksData, read, http ,symbol, confidenceScore, feed, weeklyNews)
            res = sum
        } else if(category === "news") {
            const newsData = await NewsHandler(http, read, symbol)

            const newsSummary = await SummarizeNews(newsData, read, http, symbol)
            this.app.getLogger().log("News summary -> ", newsSummary)
            res = newsSummary

        } else if(category === "trends") {
            const cryptoData = await CryptoHandler(http, read, symbol)
            this.app.getLogger().log(cryptoData)
        }

        else if(category === "subscribe"){
            await modify.getUiController().openSurfaceView(
                {
                  type: UIKitSurfaceType.MODAL,
                  id: 'subscription_modal',
                  title: { 
                    text: 'Subscription Modal',
                    type: 'plain_text' 
                  },
                  blocks: [
                    {
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
                                text: 'Select asset type'
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
                {
                    type: 'divider',
                    blockId: 'divider_1',
                }, 
                {
                    type: 'actions',
                    blockId: 'action_block_2',
                      elements: [
                        {
                            type: 'multi_static_select',
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
                    type: 'actions',
                    blockId: 'action_block_3',
                      elements: [
                        {
                            type: 'static_select',
                            actionId: 'select_action_3',
                            blockId: 'select_block_3',
                            appId: this.app.getID(),
                            placeholder: {
                                type: 'plain_text',
                                text: 'Select polling time'
                            },
                            options: [
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: '1 minute'
                                    },
                                    value: '1 minute'
                                },
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: '5 minute'
                                    },
                                    value: '5 minute'
                                },
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: '10 minute'
                                    },
                                    value: '10 minute'
                                },
                            ]
                        }
                      ]
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
                        text: 'Subscribe'
                    },
                    style: 'primary'
               }
              },
                { triggerId: context.getTriggerId()! },
                context.getSender()
              )

        }

        else if(category === "predict"){
            const stocksPrices = await StockHandler(http, read, symbol)
            const data = stocksPrices["Meta Data"]
            const latestDate = data["3. Last Refreshed"]
            const latestPrice = stocksPrices["Time Series (5min)"]
            const ltsPrice = latestPrice[latestDate]["4. close"]
            const sum = await PredictPrices(stocksPrices, Number(ltsPrice), {days: 7, simulations: 10000}, http)
            res = sum
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

