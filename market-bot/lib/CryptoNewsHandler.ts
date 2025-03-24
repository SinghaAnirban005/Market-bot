import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { getAPIConfig } from "../settings/settings";

export async function CryptoNewsHandler(
    http: IHttp,
    read: IRead,
    symbol: string
): Promise<any> {
    const { apiKey } = await getAPIConfig(read)

    return await getNews(http, apiKey, symbol)
}

async function getNews(http: IHttp, apiKey: string, symbol: string) {
    const apiEndpoint = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${apiKey}&sort=RELEVANCE`

    const response = await http.get(apiEndpoint, {
        headers: {
            "Content-Type": "application/json",
        }
    })

    if (response.statusCode !== 200) {
        throw new Error(`API error: ${response.statusCode}`);
    }
    const data = response['data']

    return data
}
