import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { getAPIConfig } from "../settings/settings";

// Function to summarize trends using the LLM API
export async function SummarizeTrends(data: any, read: IRead, http: IHttp, symbol: string) {
    // Fetch API configuration (key and endpoint)
    const { LLMapiKey } = await getAPIConfig(read);
    const { LLMapiEndpoint } = await getAPIConfig(read);

    const prompt = `
You are a financial analyst tasked with analyzing intraday stock data for ${symbol} to identify trends, patterns, and potential trading opportunities. The data includes 5-minute intervals with open, high, low, close prices, and volume.

**Data Provided**:
${data}

Analyze the provided intraday stock data for ${symbol} and provide a concise summary of the following:
1. Trend Identification
2. Volume Analysis
3. Support and Resistance Levels
4. Pattern Recognition
5. Predictive Analysis
6. Actionable Insights

Do not include headers, explanations, or additional context. Provide only the analysis in a structured format.
`;
    // Send the prompt to the LLM API
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