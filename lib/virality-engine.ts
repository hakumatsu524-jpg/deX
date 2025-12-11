/**
 * Tweet Virality Calculation Engine
 * Calculates engagement scores and viral momentum
 */

export interface TweetMetrics {
  likes: number
  retweets: number
  replies: number
  timestamp: Date
}

export interface ViralityScore {
  score: number
  momentum: number
  trend: "rising" | "falling" | "stable"
  multiplier: number
}

/**
 * Calculate engagement score using weighted formula
 * Retweets are worth more than likes as they indicate stronger engagement
 */
export function calculateEngagementScore(metrics: TweetMetrics): number {
  const LIKE_WEIGHT = 1
  const RETWEET_WEIGHT = 3
  const REPLY_WEIGHT = 2

  return metrics.likes * LIKE_WEIGHT + metrics.retweets * RETWEET_WEIGHT + metrics.replies * REPLY_WEIGHT
}

/**
 * Calculate virality momentum by comparing metrics over time
 */
export function calculateMomentum(current: TweetMetrics, previous: TweetMetrics): number {
  const currentScore = calculateEngagementScore(current)
  const previousScore = calculateEngagementScore(previous)

  if (previousScore === 0) return 0

  const growth = ((currentScore - previousScore) / previousScore) * 100
  return growth
}

/**
 * Get virality score and trend analysis
 */
export function analyzeVirality(current: TweetMetrics, history: TweetMetrics[]): ViralityScore {
  const currentScore = calculateEngagementScore(current)

  // Calculate momentum
  let momentum = 0
  if (history.length > 0) {
    const previous = history[history.length - 1]
    momentum = calculateMomentum(current, previous)
  }

  // Determine trend
  let trend: "rising" | "falling" | "stable" = "stable"
  if (momentum > 5) trend = "rising"
  else if (momentum < -5) trend = "falling"

  // Calculate price multiplier based on virality
  // More viral tweets have higher multipliers
  const baseMultiplier = 1
  const momentumMultiplier = Math.max(0, momentum / 100)
  const multiplier = baseMultiplier + momentumMultiplier

  return {
    score: currentScore,
    momentum,
    trend,
    multiplier,
  }
}

/**
 * Simulate tweet metrics growth (for demo purposes)
 */
export function simulateMetricsGrowth(current: TweetMetrics, volatility = 0.1): TweetMetrics {
  const randomFactor = 1 + (Math.random() - 0.5) * 2 * volatility

  return {
    likes: Math.floor(current.likes * (1 + Math.random() * 0.05)),
    retweets: Math.floor(current.retweets * (1 + Math.random() * 0.08)),
    replies: Math.floor(current.replies * (1 + Math.random() * 0.03)),
    timestamp: new Date(),
  }
}

/**
 * Calculate predicted virality based on early metrics
 */
export function predictVirality(metrics: TweetMetrics, ageInHours: number): number {
  const engagementScore = calculateEngagementScore(metrics)
  const engagementRate = engagementScore / Math.max(1, ageInHours)

  // Viral tweets typically have high early engagement
  if (engagementRate > 1000) return 0.9 // 90% chance of going viral
  if (engagementRate > 500) return 0.7 // 70% chance
  if (engagementRate > 100) return 0.5 // 50% chance
  return 0.2 // 20% chance
}
