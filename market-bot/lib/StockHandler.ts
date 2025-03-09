import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { getAPIConfig } from "../settings/settings";

export async function StockHandler(
    http: IHttp,
    read: IRead,
    symbol: string
): Promise<any> { 
    const { apiKey } = await getAPIConfig(read)

    return await getStockPrices(http, apiKey, symbol)
}

async function getStockPrices(http: IHttp, apiKey: string, symbol: string) {
    const apiEndpoint = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${apiKey}`
    const response = await http.get(apiEndpoint, {
        headers: {
            "Content-Type": "application/json",
        }
    })

    if (response.statusCode !== 200) {
        throw new Error(`API error: ${response.statusCode}`);
    }
    const data = response['data']

    const timeSeries = data["Time Series (5min)"];
    const latestTime = data["Meta Data"]["3. Last Refreshed"];

    const latestData = timeSeries[latestTime];
    const formattedData = JSON.stringify(latestData)

    
    return formattedData
}