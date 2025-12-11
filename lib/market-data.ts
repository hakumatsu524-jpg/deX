/**
 * Market Data Provider
 * Manages tweet markets, liquidity pools, and price feeds
 */

import type { LiquidityPool } from "./amm"
import type { TweetMetrics } from "./virality-engine"

export interface TweetMarket {
  id: string
  tweetUrl: string
  tweetText: string
  authorHandle: string
  authorName: string
  pool: LiquidityPool
  metrics: TweetMetrics
  volume24h: number
  priceChange24h: number
  holders: number
  createdAt: Date
}

export interface PricePoint {
  timestamp: number
  price: number
  volume: number
}

/**
 * Initialize a new tweet market with liquidity pool
 */
export function initializeMarket(
  tweetId: string,
  tweetUrl: string,
  tweetText: string,
  authorHandle: string,
  authorName: string,
  initialMetrics: TweetMetrics,
): TweetMarket {
  // Initialize with virtual liquidity
  const pool: LiquidityPool = {
    reserveTokens: 1000000, // 1M tokens
    reserveSOL: 1000, // 1000 SOL
    k: 1000000 * 1000,
  }

  return {
    id: tweetId,
    tweetUrl,
    tweetText,
    authorHandle,
    authorName,
    pool,
    metrics: initialMetrics,
    volume24h: 0,
    priceChange24h: 0,
    holders: 0,
    createdAt: new Date(),
  }
}

/**
 * Generate mock trending tweet markets
 */
export function generateTrendingMarkets(): TweetMarket[] {
  const mockTweets = [
    {
      text: "Just shipped the biggest update to our platform. This changes everything. 🚀",
      author: "sama",
      name: "Sam Altman",
      likes: 45000,
      retweets: 8500,
      replies: 2300,
    },
    {
      text: "Breaking: New AI model just dropped. It's actually insane what it can do.",
      author: "elonmusk",
      name: "Elon Musk",
      likes: 230000,
      retweets: 52000,
      replies: 12000,
    },
    {
      text: "Market prediction: We're going to see major moves in the next 24h. Screenshot this.",
      author: "APompliano",
      name: "Anthony Pompliano",
      likes: 12000,
      retweets: 3200,
      replies: 890,
    },
    {
      text: "Unpopular opinion: Most people are sleeping on this opportunity right now.",
      author: "naval",
      name: "Naval",
      likes: 34000,
      retweets: 7800,
      replies: 1900,
    },
    {
      text: "This is the most bullish thing I've seen all year. Let that sink in.",
      author: "VitalikButerin",
      name: "Vitalik Buterin",
      likes: 67000,
      retweets: 14500,
      replies: 3400,
    },
  ]

  return mockTweets.map((tweet, index) => {
    const metrics: TweetMetrics = {
      likes: tweet.likes,
      retweets: tweet.retweets,
      replies: tweet.replies,
      timestamp: new Date(),
    }

    const market = initializeMarket(
      `tweet-${index}`,
      `https://twitter.com/${tweet.author}/status/123456789${index}`,
      tweet.text,
      tweet.author,
      tweet.name,
      metrics,
    )

    // Add some randomness to volume and price change
    market.volume24h = Math.random() * 50000 + 10000
    market.priceChange24h = (Math.random() - 0.5) * 60 // -30% to +30%
    market.holders = Math.floor(Math.random() * 1000) + 100

    return market
  })
}

/**
 * Generate historical price data for charts
 */
export function generatePriceHistory(initialPrice: number, volatility = 0.05, points = 100): PricePoint[] {
  const history: PricePoint[] = []
  let price = initialPrice
  const now = Date.now()
  const interval = (24 * 60 * 60 * 1000) / points // 24 hours divided into points

  for (let i = 0; i < points; i++) {
    // Random walk with trend
    const change = (Math.random() - 0.48) * volatility // Slight upward bias
    price = price * (1 + change)

    history.push({
      timestamp: now - (points - i) * interval,
      price: Math.max(0.0001, price), // Prevent negative prices
      volume: Math.random() * 1000 + 100,
    })
  }

  return history
}
