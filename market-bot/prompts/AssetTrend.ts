import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { getAPIConfig } from "../settings/settings";

export async function SummarizeTrends(data: any, read: IRead, http: IHttp, symbol: string) {
    const { LLMapiKey } = await getAPIConfig(read);
    const { LLMapiEndpoint } = await getAPIConfig(read);

    const prompt = `
        You are a financial analyst tasked with analyzing intraday stock data for ${symbol} (5-minute intervals) and providing a concise summary. Focus only on the following:
        1. Trend Identification: Identify the overall trend (uptrend, downtrend, or sideways) based on price movements.
        2. Volume Analysis: Highlight volume trends and correlations with price movements.

        **Instructions**:
        - Do not include any internal reasoning, tags, or explanations.
        - If the data is insufficient, state: "Insufficient data for analysis."
        - Provide only the final analysis in a structured format.

        **Data Provided**:
        ${data}
        `;

    const response = await http.post(LLMapiEndpoint, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LLMapiKey}`,
        },
        data: {
            model: "deepseek-r1-distill-qwen-32b",
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
    const cleanContent = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    console.log(cleanContent);


    return cleanContent
}