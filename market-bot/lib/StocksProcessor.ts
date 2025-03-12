import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors"
import { getAPIConfig } from "../settings/settings"

export async function StocksProcessor(stocks: any[], stockSize: number, http: IHttp, read: IRead) {
    const { apiKey } = await getAPIConfig(read)
    const results: any[] = []
    // const apiEndpoint = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${apiKey}`

    for(let i = 0; i < stocks.length; i += stockSize){
        const batch = stocks.slice(i, i + stockSize)

        const res = await Promise.all(batch.map(item => 
            http.get(`https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${item.symbol}&interval=5min&apikey=${apiKey}`, {
                headers: {
                    "Content-Type": "application/json",
                }
            })
        ))

        res.forEach((response, index) => {
            if(response.statusCode === 200) {
                const data = response['data']

                const timeSeries = data["Time Series (5min)"];
                const latestTime = data["Meta Data"]["3. Last Refreshed"];

                const latestData = timeSeries[latestTime];
                const formattedData = JSON.stringify(latestData)

                results.push(formattedData)
            }
            else {
                console.error(`Failed to fetch data `, response.content);
            }
        })
    }

    return results
}