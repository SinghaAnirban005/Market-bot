export const calculatePriceMovementConfidence = (ohlcData: any) => {
    const priceChanges: any[] = [];
    let previousClose: any = null;
    for (const timestamp in ohlcData) {
        const closePrice = parseFloat(ohlcData[timestamp]['4. close']);
        if (previousClose !== null) {
            const priceChange = (closePrice - previousClose) / previousClose;
            priceChanges.push(priceChange);
        }
        previousClose = closePrice;
    }
    const averagePriceChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
    const priceMovementConfidence = Math.abs(averagePriceChange);
    return priceMovementConfidence;
};