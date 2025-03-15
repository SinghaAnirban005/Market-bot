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
    const imageEndpoint = 'https://quickchart.io/chart/create'
    
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

    const imageReq = {
        chart: {
          type: "bar",
          data: {
            labels: ["Open", "High", "Low", "Close"],
            datasets: [{
              label: "Stock Price",
              data: [
                parseFloat(latestData["1. open"]),
                parseFloat(latestData["2. high"]),
                parseFloat(latestData["3. low"]),
                parseFloat(latestData["4. close"])
              ],
              backgroundColor: ["#4caf50", "#ff9800", "#f44336", "#2196f3"]
            }]
          }
        }
    };

    const imageUrl = await http.post(imageEndpoint, {
        data: imageReq,
        headers: {
            "Content-Type": "application/json"
        }
    })

    if(imageUrl.statusCode !== 200){
        throw new Error(`Image API error: ${imageUrl.statusCode}`);
    }

    const formattedMarkdown = `\n# 📊 Stock Data for **${symbol}**\n\n## 🔥 Latest Price Data (${latestTime})\n\n- **🟢 Open:** $${latestData["1. open"]}\n- **📈 High:** $${latestData["2. high"]}\n- **📉 Low:** $${latestData["3. low"]}\n- **🔴 Close:** $${latestData["4. close"]}\n- **📊 Volume:** ${latestData["5. volume"]} shares\n\n![Stock Chart](${imageUrl.data.url})\n\n_Real-time stock data fetched using [Alpha Vantage](https://www.alphavantage.co)_ 🚀\n`;
    
    return {
        formattedMarkdown
    }
}
