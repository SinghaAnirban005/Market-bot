import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { getAPIConfig } from "../settings/settings";

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
            summary: item.summary.slice(0, 150),
            ticker_sentiment: item.ticker_sentiment.filter((t: any) => t.ticker === symbol),
        }))
        .slice(0, 3);

        console.log(reducedData)

        const prompt = `
        Summarize the following news data for ${symbol}:
        ${JSON.stringify(reducedData)}
        
        Provide a concise summary focusing on:
        1. Overall sentiment
        2. Top news highlights (title, summary, sentiment, relevance)
        3. Actionable insights
        `;

    const response = await http.post(LLMapiEndpoint, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LLMapiKey}`,
        },
        data: {
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: prompt,
                        },
                    ],
                },
            ],
            stream: false,
        },
    });

    const stringifiedResponse = JSON.stringify(response);
    const response_data = JSON.parse(stringifiedResponse)
    const content = response_data.data.choices[0].message.content

    return content
}