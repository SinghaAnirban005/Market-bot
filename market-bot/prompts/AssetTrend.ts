import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { getAPIConfig } from "../settings/settings";

export async function SummarizeTrends(data: any, read: IRead, http: IHttp, symbol: string, confidenceScore, news, weeklyNews) {
    const { LLMapiKey } = await getAPIConfig(read);
    const { LLMapiEndpoint } = await getAPIConfig(read);

    const now = new Date();

    // Subtract 7 days
    now.setUTCDate(now.getUTCDate() - 7);

    // Extract individual components
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');

    // Format it as YYYYMMDDTHHMM
    const timeFrom = `${year}${month}${day}T${hours}${minutes}`;

    const weeklyEndpoint = `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=${symbol}&apikey=${LLMapiKey}`
    const res = await http.get(weeklyEndpoint, {
        headers: {
            "Content-Type": "application/json",
        }
    })

    if (res.statusCode !== 200) {
        throw new Error(`API error: ${res.statusCode}`);
    }
    const info = res['data']
    const weeklyOHLCdata = info['Weekly Time Series']

    // const historicalNewsEP = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&time_from=${timeFrom}&apikey=${LLMapiKey}&sort=RELEVANCE`
    // const res2 = await http.get(historicalNewsEP, {
    //     headers: {
    //         "Content-Type": "application/json",
    //     }
    // })

    // if (res2.statusCode !== 200) {
    //     throw new Error(`API error: ${res2.statusCode}`);
    // }
    // console.log(res2)
    // const info2 = res2["data"]
    // const weeklyNews = info2["feed"]
    
    // console.log("info2 --> ", info2)
    // console.log("weeklyNews -->", weeklyNews)

    
    const comparisionData = compareWithHistoricalTrends(data, weeklyOHLCdata, news, weeklyNews)
    // const prompt = `
    //     You are a financial analyst tasked with analyzing intraday stock data for ${symbol} (5-minute intervals) and providing a concise summary. Focus only on the following:
    //     1. Trend Identification: Identify the overall trend (uptrend, downtrend, or sideways) based on price movements.
    //     2. Volume Analysis: Highlight volume trends and correlations with price movements.

    //     **Instructions**:
    //     - Do not include any internal reasoning, tags, or explanations.
    //     - If the data is insufficient, state: "Insufficient data for analysis."
    //     - Provide only the final analysis in a structured format.

    //     **Data Provided**:
    //     ${data}
    //     `;

    const prompt = `
        You are a financial analyst tasked with summarizing stock trends for ${symbol}. Focus on the following:
        1. Current Trend: ${comparisionData.currentTrend}
        2. Historical Trend: ${comparisionData.historicalTrend}
        3. Trend Comparison: ${comparisionData.trendComparison}
        4. Confidence Score: ${confidenceScore} (based on OHLC data, volume data, and news sentiment data)

        **Instructions**:
        - Provide a concise summary of the current trend and how it compares to historical trends.
        - Include the confidence score and explain its implications (e.g., high confidence means the analysis is reliable).
        - Do not include any internal reasoning, tags, or explanations.
        - If the data is insufficient, state: "Insufficient data for analysis."

        **Example Output**:
        "The current trend is a strong uptrend, which is consistent with the historical uptrend observed over the past weeks.
         The confidence score is 0.85 (High Confidence), indicating that the analysis is highly reliable."
    `;


    // const response = await http.post(LLMapiEndpoint, {
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${LLMapiKey}`,
    //     },
    //     data: {
    //         model: "deepseek-r1-distill-qwen-32b",
    //         messages: [
    //             {
    //                 role: "user",
    //                 content: [
    //                     {
    //                         type: "text",
    //                         text: prompt,
    //                     },
    //                 ],
    //             },
    //         ],
    //         stream: false,
    //     },
    // });


    // Case of summary template when users dont use LLM (Approach 2)


    // const stringifiedResponse = JSON.stringify(response);
    // const response_data = JSON.parse(stringifiedResponse)
    // const content = response_data.data.choices[0].message.content
    // const cleanContent = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();


    // return cleanContent

    const response = generateTrendSummary(symbol, comparisionData, confidenceScore)
    return response
}

const identifyTrend = (ohlcData: any, newsData: any[]) => {
    const prices = Object.values(ohlcData).map((data: any) => parseFloat(data['4. close']));
    const priceChanges: any[] = [];
    for (let i = 1; i < prices.length; i++) {
        const change = (prices[i] - prices[i - 1]) / prices[i - 1];
        priceChanges.push(change);
    }
    const averagePriceChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
    const sentimentScores = newsData.map((article) => article.overall_sentiment_score);
    const averageSentiment = sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length;
    if (averagePriceChange > 0.01 && averageSentiment > 0.1) return 'Strong Uptrend';
    if (averagePriceChange > 0.01 && averageSentiment <= 0.1) return 'Weak Uptrend';
    if (averagePriceChange < -0.01 && averageSentiment < -0.1) return 'Strong Downtrend';
    if (averagePriceChange < -0.01 && averageSentiment >= -0.1) return 'Weak Downtrend';
    return 'Sideways Trend';
};

const compareWithHistoricalTrends = (currentOHLC: any, historicalOHLC: any, currentNews: any[], historicalNews: any[]) => {
    const currentTrend = identifyTrend(currentOHLC, currentNews);
    const historicalTrend = identifyTrend(historicalOHLC, historicalNews);
    const trendComparison = currentTrend === historicalTrend ? 'Consistent with historical trend' : 'Diverging from historical trend';
    return {
        currentTrend,
        historicalTrend,
        trendComparison,
    };
};

function generateTrendSummary(
    symbol: string,
    comparisonData: {
        currentTrend: string;
        historicalTrend: string;
        trendComparison: string;
    },
    confidenceScore: number
): string {

    let confidenceLevel: string;
    if (confidenceScore >= 0.8) {
        confidenceLevel = "High Confidence";
    } else if (confidenceScore >= 0.5) {
        confidenceLevel = "Moderate Confidence";
    } else {
        confidenceLevel = "Low Confidence";
    }

    const trendStrength = comparisonData.currentTrend.includes("Strong") 
        ? "strong" 
        : comparisonData.currentTrend.includes("Weak") 
            ? "weak" 
            : "";

    let summary = `The current trend for ${symbol} is ${trendStrength ? trendStrength + " " : ""}${comparisonData.currentTrend.toLowerCase()}`;

    if (comparisonData.trendComparison === "Consistent with historical trend") {
        summary += `, which is consistent with the historical ${comparisonData.historicalTrend.toLowerCase()}`;
    } else {
        summary += `, which diverges from the historical ${comparisonData.historicalTrend.toLowerCase()}`;
    }
    summary += `. The confidence score is ${confidenceScore.toFixed(2)} (${confidenceLevel}), `;
    if (confidenceScore >= 0.8) {
        summary += "indicating that the analysis is highly reliable.";
    } else if (confidenceScore >= 0.5) {
        summary += "suggesting the analysis is moderately reliable.";
    } else {
        summary += "meaning the analysis should be treated with caution.";
    }

    return summary;
}