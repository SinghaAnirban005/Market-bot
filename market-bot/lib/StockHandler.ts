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
    return data
    // const timeSeries = data["Time Series (5min)"];
    // const lastRefreshed = data["Meta Data"]["3. Last Refreshed"];

    // // Convert last refreshed time to Date object
    // const latestTime = new Date(lastRefreshed);

    // // Calculate timestamps for 5, 15, and 30 minutes before
    // const getFormattedTime = (date) => date.toISOString().replace("T", " ").substring(0, 19);

    // const fiveMinBefore = new Date(latestTime.getTime() - 5 * 60000);
    // const fifteenMinBefore = new Date(latestTime.getTime() - 15 * 60000);
    // const thirtyMinBefore = new Date(latestTime.getTime() - 30 * 60000);

    // // Extract data for each interval
    // const latestData = timeSeries[lastRefreshed];
    // const fiveMinData = timeSeries[getFormattedTime(fiveMinBefore)];
    // const fifteenMinData = timeSeries[getFormattedTime(fifteenMinBefore)];
    // const thirtyMinData = timeSeries[getFormattedTime(thirtyMinBefore)];

    // const imageReq = {
    //     chart: {
    //       type: "bar",
    //       data: {
    //         labels: ["Open", "High", "Low", "Close"],
    //         datasets: [
    //           {
    //             label: `Latest (${lastRefreshed})`,
    //             data: [
    //               parseFloat(latestData["1. open"]),
    //               parseFloat(latestData["2. high"]),
    //               parseFloat(latestData["3. low"]),
    //               parseFloat(latestData["4. close"])
    //             ],
    //             backgroundColor: "rgba(75, 192, 192, 0.6)"
    //           },
    //           {
    //             label: `5min Before (${getFormattedTime(fiveMinBefore)})`,
    //             data: [
    //               parseFloat(fiveMinData?.["1. open"] || 0),
    //               parseFloat(fiveMinData?.["2. high"] || 0),
    //               parseFloat(fiveMinData?.["3. low"] || 0),
    //               parseFloat(fiveMinData?.["4. close"] || 0)
    //             ],
    //             backgroundColor: "rgba(255, 159, 64, 0.6)"
    //           },
    //           {
    //             label: `15min Before (${getFormattedTime(fifteenMinBefore)})`,
    //             data: [
    //               parseFloat(fifteenMinData?.["1. open"] || 0),
    //               parseFloat(fifteenMinData?.["2. high"] || 0),
    //               parseFloat(fifteenMinData?.["3. low"] || 0),
    //               parseFloat(fifteenMinData?.["4. close"] || 0)
    //             ],
    //             backgroundColor: "rgba(153, 102, 255, 0.6)"
    //           },
    //           {
    //             label: `30min Before (${getFormattedTime(thirtyMinBefore)})`,
    //             data: [
    //               parseFloat(thirtyMinData?.["1. open"] || 0),
    //               parseFloat(thirtyMinData?.["2. high"] || 0),
    //               parseFloat(thirtyMinData?.["3. low"] || 0),
    //               parseFloat(thirtyMinData?.["4. close"] || 0)
    //             ],
    //             backgroundColor: "rgba(255, 99, 132, 0.6)"
    //           }
    //         ]
    //       },
    //       options: {
    //         scales: {
    //           y: {
    //             beginAtZero: false,
    //             title: {
    //               display: true,
    //               text: "Price (USD)"
    //             }
    //           }
    //         }
    //       }
    //     }
    //   };

    // const imageUrl = await http.post(imageEndpoint, {
    //     data: imageReq,
    //     headers: {
    //         "Content-Type": "application/json"
    //     }
    // })

    // if(imageUrl.statusCode !== 200){
    //     throw new Error(`Image API error: ${imageUrl.statusCode}`);
    // }

    // const formattedMarkdown = `\n# 📊 Stock Data for **${symbol}**\n\n## 🔥 Latest Price Data (${latestTime})\n\n- **🟢 Open:** $${latestData["1. open"]}\n- **📈 High:** $${latestData["2. high"]}\n- **📉 Low:** $${latestData["3. low"]}\n- **🔴 Close:** $${latestData["4. close"]}\n- **📊 Volume:** ${latestData["5. volume"]} shares\n\n![Stock Chart](${imageUrl.data.url})\n\n_Real-time stock data fetched using [Alpha Vantage](https://www.alphavantage.co)_ 🚀\n`;
    
    // return {
    //     formattedMarkdown
    // }
}
