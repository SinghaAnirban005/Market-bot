// I shall be using the Monte-Carlo approach since i am thinking of just predicting prices (not the timings of when user should buy or sell)

import { IHttp } from "@rocket.chat/apps-engine/definition/accessors";

export async function PredictPrices(response: any, latestPrice: number, config: any, http: IHttp) {
    const imageEndpoint = 'https://quickchart.io/chart/create'
    const timeSeries = response["Time Series (5min)"];
    const historicalPrices: number[] = Object.values(timeSeries).map((entry: any) => parseFloat(entry["4. close"]));
    console.log(typeof latestPrice)
    historicalPrices.reverse();
  
    const { drift, volatility } = calculateStats(historicalPrices);
    const results: number[][] = [];
    console.log("Drift ",typeof drift)
    console.log("Volatillity ",typeof volatility)

    for (let i = 0; i < config.simulations; i++) {
        const path = [latestPrice];
        for (let day = 1; day <= config.days; day++) {
          const shock = volatility * gaussianRandom();
          const price = path[day - 1] * Math.exp(drift + shock);
          path.push(price);
        }
        results.push(path.slice(1));
    }

    const predictions = Array.from({ length: config.days }, (_, day) => {
        const dailyPrices = results.map(path => path[day]);
        dailyPrices.sort((a, b) => a - b);
        return {
          date: new Date(Date.now() + (day + 1) * 86400000).toISOString().split('T')[0],
          medianPrice: dailyPrices[Math.floor(config.simulations * 0.5)],
          upper95: dailyPrices[Math.floor(config.simulations * 0.975)],
          lower95: dailyPrices[Math.floor(config.simulations * 0.025)],
        };
    });

    const chartConfig = {
        type: 'bar',
        data: {
            labels: predictions.map(p => p.date),
            datasets: [
                {
                    label: 'Lower Bound (95%)',
                    data: predictions.map(p => p.lower95),
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                },
                {
                    label: 'Median Price',
                    data: predictions.map(p => p.medianPrice),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                },
                {
                    label: 'Upper Bound (95%)',
                    data: predictions.map(p => p.upper95),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Price (USD)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Stock Price Forecast (Next ${config.days} Days)`
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const pred = predictions[context.dataIndex];
                            if (context.datasetIndex === 0) {
                                return `Lower Bound: $${pred.lower95.toFixed(2)}`;
                            } else if (context.datasetIndex === 1) {
                                return `Median: $${pred.medianPrice.toFixed(2)}`;
                            } else {
                                return `Upper Bound: $${pred.upper95.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        }
    };

    const imageResponse = await http.post(imageEndpoint, {
        data: {
            chart: chartConfig,
            width: 800,
            height: 400,
            backgroundColor: '#ffffff'
        },
        headers: {
            "Content-Type": "application/json",
        }
    });

    const imageUrl = imageResponse.data?.url || '';

    return `
        ### 📊 Stock Price Predictions (Next ${config.days} Days)

        **Latest Price:** $${latestPrice.toFixed(2)}  
        **Volatility:** ${(volatility * 100).toFixed(2)}% (historical)  
        **Model:** Monte Carlo Simulation (${config.simulations.toLocaleString()} runs) 
        
        ![Price Forecast Chart](${imageUrl})

        #### Daily Forecasts:
        ${predictions.map(pred => `
        - **${pred.date}:**  
        - **Median Price:** $${pred.medianPrice.toFixed(2)}  
        - **95% Confidence Range:** $${pred.lower95.toFixed(2)}   $${pred.upper95.toFixed(2)}  
        `).join('')}
    `
}


const calculateStats = (prices: number[]) => {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    const drift = mean - 0.5 * variance; 
    return { drift, volatility };
  };

const gaussianRandom = (): number => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};