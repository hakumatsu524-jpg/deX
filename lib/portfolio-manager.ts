/**
 * Portfolio Management System
 * Tracks user positions, P&L, and trade history
 */

export interface Position {
  tweetId: string
  tokenBalance: number
  averageBuyPrice: number
  totalInvested: number
  currentValue: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
}

export interface Trade {
  id: string
  tweetId: string
  type: "buy" | "sell"
  tokenAmount: number
  solAmount: number
  price: number
  timestamp: Date
  slippage: number
}

export interface PortfolioStats {
  totalValue: number
  totalInvested: number
  totalPnL: number
  totalPnLPercent: number
  bestPerformer: Position | null
  worstPerformer: Position | null
}

/**
 * Calculate position P&L
 */
export function calculatePositionPnL(position: Position, currentPrice: number): Position {
  const currentValue = position.tokenBalance * currentPrice
  const unrealizedPnL = currentValue - position.totalInvested
  const unrealizedPnLPercent = position.totalInvested > 0 ? (unrealizedPnL / position.totalInvested) * 100 : 0

  return {
    ...position,
    currentValue,
    unrealizedPnL,
    unrealizedPnLPercent,
  }
}

/**
 * Update position after a buy trade
 */
export function updatePositionAfterBuy(
  position: Position | null,
  tokenAmount: number,
  solAmount: number,
  price: number,
): Position {
  if (!position) {
    return {
      tweetId: "",
      tokenBalance: tokenAmount,
      averageBuyPrice: price,
      totalInvested: solAmount,
      currentValue: tokenAmount * price,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
    }
  }

  const newTotalInvested = position.totalInvested + solAmount
  const newTokenBalance = position.tokenBalance + tokenAmount
  const newAverageBuyPrice = newTotalInvested / newTokenBalance

  return {
    ...position,
    tokenBalance: newTokenBalance,
    averageBuyPrice: newAverageBuyPrice,
    totalInvested: newTotalInvested,
  }
}

/**
 * Update position after a sell trade
 */
export function updatePositionAfterSell(position: Position, tokenAmount: number, solAmount: number): Position {
  const soldPortion = tokenAmount / position.tokenBalance
  const costBasis = position.totalInvested * soldPortion

  return {
    ...position,
    tokenBalance: position.tokenBalance - tokenAmount,
    totalInvested: position.totalInvested - costBasis,
  }
}

/**
 * Calculate overall portfolio statistics
 */
export function calculatePortfolioStats(positions: Position[]): PortfolioStats {
  if (positions.length === 0) {
    return {
      totalValue: 0,
      totalInvested: 0,
      totalPnL: 0,
      totalPnLPercent: 0,
      bestPerformer: null,
      worstPerformer: null,
    }
  }

  const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0)
  const totalInvested = positions.reduce((sum, p) => sum + p.totalInvested, 0)
  const totalPnL = totalValue - totalInvested
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0

  const sorted = [...positions].sort((a, b) => b.unrealizedPnLPercent - a.unrealizedPnLPercent)

  return {
    totalValue,
    totalInvested,
    totalPnL,
    totalPnLPercent,
    bestPerformer: sorted[0] || null,
    worstPerformer: sorted[sorted.length - 1] || null,
  }
}
