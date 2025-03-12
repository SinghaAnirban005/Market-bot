// In a new file, e.g., schedulers/StockUpdateScheduler.ts
import { IHttp, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { IJobContext } from "@rocket.chat/apps-engine/definition/scheduler";
import { StockHandler } from "../lib/StockHandler";
import { MarketPersistence } from "../persistence/persistence";
import { sendMessage } from "../utils/message";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";

export async function stockUpdateScheduler(
    jobData: IJobContext, 
    read: IRead, 
    modify: IModify, 
    http: IHttp, 
    persis: IPersistence,
): Promise<void> {
    const watchlists = await MarketPersistence.getAllUserWatchList(read.getPersistenceReader());
    // for (const entry of watchlists) {
    //     if (entry.category === 'stock' && entry.symbol) {

            // const latestData = await StockHandler(http, read, entry.symbol);
            const appUser = await read.getUserReader().getAppUser('f81b97e4-3f09-478d-b00f-08de3236ea37');
            
            if (appUser) {
                const room = await read.getRoomReader().getById('GENERAL');
                
                if (room) {
                    const updateMessage = `Sending stock data`;
                    await sendMessage(modify, appUser, room, updateMessage);
                }
        //     }
        // }
    }
}