import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { getAPIConfig } from "../settings/settings";
// import { rankArticles } from "../utils/ArticleRanker";

export async function SummarizeNews(data: any, read: IRead, http: IHttp, symbol: string) {
    const { LLMapiKey } = await getAPIConfig(read);
    const { LLMapiEndpoint } = await getAPIConfig(read);
    const feed = data.feed || []

    const reducedData = feed
        .filter((item: any) =>
            item.ticker_sentiment?.some((ticker: any) => ticker.ticker === symbol)
        )
        .map((item: any) => ({
            title: item.title,
            summary: item.summary.slice(0, 300),
            ticker_sentiment: item.ticker_sentiment.filter((t: any) => t.ticker === symbol),
        }))
        .slice(0, 3);

        console.log(reducedData)
        
        // const prompt = `
        // Summarize the following news data for ${symbol}:
        // ${JSON.stringify(reducedData)}
        
        // Provide a concise summary focusing on:
        // 1. Overall sentiment
        // 2. Top news highlights (title, summary, sentiment, relevance)
        // `;

    // const response = await http.post(LLMapiEndpoint, {
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${LLMapiKey}`,
    //     },
    //     data: {
    //         model: "llama-3.3-70b-versatile",
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
    // console.log(response)
    // const stringifiedResponse = JSON.stringify(response);
    // const response_data = JSON.parse(stringifiedResponse)
    // const content = response_data.data.choices[0].message.content
    const content = await generateNewsSummary(symbol, reducedData)

    return content
}

function generateNewsSummary(symbol, newsData) {

    const sentimentScores = newsData.flatMap(item => 
        item.ticker_sentiment
            .filter(s => s.ticker === symbol)
            .map(s => parseFloat(s.ticker_sentiment_score))
    )

    const avgSentiment = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
    const sentimentLabel = getSentimentLabel(avgSentiment)
    
    const summaryParts = [
        `Summary for ${symbol}:`,
        '',
        `Overall Sentiment: The overall sentiment for ${symbol} is ${sentimentLabel}, ` +
        `with an average sentiment score of ${avgSentiment.toFixed(4)}.`,
        '',
        'Top News Highlights:'
    ];
    
    newsData.forEach((item, index) => {
        const ibmSentiment = item.ticker_sentiment.find(s => s.ticker === symbol);
        
        summaryParts.push(
            `- Article ${index + 1}:`,
            `  Title: ${item.title}`,
            `  Summary: ${truncateSummary(item.summary, 150)}`,
            `  Sentiment: ${ibmSentiment.ticker_sentiment_label}`,
            `  Relevance: ${ibmSentiment.relevance_score}`,
            ''
        );
    });

    summaryParts.push(
        'These highlights showcase recent developments for the company.'
    );
    
    return summaryParts.join('\n');
}

function getSentimentLabel(score) {
    if (score > 0.35) return 'Bullish';
    if (score > 0.15) return 'Somewhat-Bullish';
    if (score > -0.15) return 'Neutral';
    if (score > -0.35) return 'Somewhat-Bearish';
    return 'Bearish';
}

function truncateSummary(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}