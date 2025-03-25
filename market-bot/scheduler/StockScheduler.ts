import { IHttp, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { IJobContext } from "@rocket.chat/apps-engine/definition/scheduler";
import { MarketPersistence } from "../persistence/persistence";
import { sendMessage } from "../utils/message";

const priceCache = new Map<string, number>();
const SYMBOLS: string[] = []

export async function pollAllEquity(
    jobData: IJobContext, 
    read: IRead, 
    modify: IModify, 
    http: IHttp, 
    persis: IPersistence,
): Promise<void> {
    console.log(`\nPolling at ${new Date().toISOString()}`);
    const tokens = await MarketPersistence.getAllSubscriptions(read.getPersistenceReader())
    tokens.map((token) => SYMBOLS.push(token.symbol))
    const appUser = await read.getUserReader().getAppUser('f81b97e4-3f09-478d-b00f-08de3236ea37');
    const room = await read.getRoomReader().getById('GENERAL');
    const BATCH_SIZE = 2;
    const BATCH_DELAY_MS = 500;

    for (let i = 0; i < SYMBOLS.length; i += BATCH_SIZE) {
        const batch = SYMBOLS.slice(i, i + BATCH_SIZE).map(symbol => fetchStockData(symbol, http, modify, room, appUser));

        await Promise.all(batch);

        if (i + BATCH_SIZE < SYMBOLS.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
        }
    }
}

const fetchStockData = async (symbol: string, http: IHttp, modify: IModify, room, appUser): Promise<void> => {
    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=cvhblo1r01qrtb3nk57gcvhblo1r01qrtb3nk580`;
      const response = await http.get(url, {
        headers: {
            "Content-Type": "application/json"
        }
      })

      const latestData = response["data"];
      if (!latestData) {
        console.warn(`[WARNING] No data for ${symbol}`);
        return;
      }

      const { c: currentPrice, o: open, h: high, l: low, pc: prevClose, t: timestamp } = latestData;

      console.log(`[INFO] ${symbol} @ ${new Date(timestamp * 1000).toISOString()}`);
      console.log(`- Open: $${open}, High: $${high}, Low: $${low}, Prev Close: $${prevClose}, Current: $${currentPrice}`);
  
    //   const latestTimestamp = Object.keys(latestData)[0];
    //   const currentPrice = parseFloat(latestData[latestTimestamp]['4. close']);

      // Detect significant price change (>0.5%)
      if (priceCache.has(symbol)) {
      const prevPrice = priceCache.get(symbol)!;
      const change = Math.abs((currentPrice - prevPrice) / prevPrice * 100);
      if (change > 0 || change < 0) {
        await sendMessage(modify, appUser, room, `[ALERT] ${symbol} changed ${change.toFixed(2)}%: $${currentPrice}`)
      }
      else {
        await sendMessage(modify, appUser, room, `[ALERT] ${symbol} changed ${change.toFixed(2)}%: $${currentPrice}`)
      }
    }
      priceCache.set(symbol, currentPrice);
  
    } catch (error) {
      console.error(`[ERROR] Failed to fetch ${symbol}:`, error.message);
    }
  };