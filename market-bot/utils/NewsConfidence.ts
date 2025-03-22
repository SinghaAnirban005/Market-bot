export const calculateNewsSentimentConfidence = (newsData: any[], symbol: string) => {
    const relevantNews = newsData.filter((article) =>
        article.ticker_sentiment.some((ticker: any) => ticker.ticker === symbol)
    );

    const sentimentScores = relevantNews.map((article) => {
        const tickerSentiment = article.ticker_sentiment.find((ticker: any) => ticker.ticker === symbol);
        return parseFloat(tickerSentiment.ticker_sentiment_score);
    });

    const averageSentiment = sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length;
    const newsSentimentConfidence = Math.abs(averageSentiment); // Confidence based on sentiment strength
    return newsSentimentConfidence;
};