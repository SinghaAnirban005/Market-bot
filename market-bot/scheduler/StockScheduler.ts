import { IHttp, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { IJobContext } from "@rocket.chat/apps-engine/definition/scheduler";
import { MarketPersistence } from "../persistence/persistence";
import { sendMessage } from "../utils/message";

export async function stockUpdateScheduler(
    jobData: IJobContext, 
    read: IRead, 
    modify: IModify, 
    http: IHttp, 
    persis: IPersistence,
): Promise<void> {
    const watchlists = await MarketPersistence.getAllUserWatchList(read.getPersistenceReader());

            const appUser = await read.getUserReader().getAppUser('f81b97e4-3f09-478d-b00f-08de3236ea37');
            
            if (appUser) {
                const room = await read.getRoomReader().getById('GENERAL');
                
                if (room) {
                    const updateMessage = `Sending stock data`;
                    await sendMessage(modify, appUser, room, updateMessage);
                }
    }
}