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
            res = await StockHandler(http, read, symbol)
        }

        else if(category === "stock"){
            // Store the name of the equity in persistence
            const stored = await MarketPersistence.storeUserWishlist(persis, room.id, user.id, category, {symbol: symbol, category: category})

            const storedData = await MarketPersistence.getAllUserWatchList(read.getPersistenceReader())
            console.log(storedData)
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