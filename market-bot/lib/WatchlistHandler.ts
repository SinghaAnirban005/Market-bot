// First fetch all those objects having category "stock"
// Similarly do for forex and crypto
// Then form a queue of each of these 
// Process the queue objects in batch to the particular handlers
import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { MarketPersistence } from "../persistence/persistence";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { StocksProcessor } from "./StocksProcessor";

export async function WatchlistHandler(read: IRead, room: IRoom, userId: string, http: IHttp): Promise<any> {
    // let stocks = [];
    // let crypto = [];
    // let forex = [];

    const stks = await MarketPersistence.getUserWatchListByCategory("stock", read.getPersistenceReader(), room.id, userId)
    
    const crypto = await MarketPersistence.getUserWatchListByCategory("crypto", read.getPersistenceReader(), room.id, userId)
    
    let stockResults: any[] = []
    if(stks.length !== 0){
       stockResults = await StocksProcessor(stks, 2, http, read)
    } 


    // i shall do similar for crypto  and forex
    console.log(stockResults)

    return {
        stocks: stockResults
    }

}