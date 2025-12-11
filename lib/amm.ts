/**
 * Automated Market Maker (AMM) Logic for deX
 * Uses constant product formula: x * y = k
 * Similar to Uniswap V2 bonding curve
 */

export interface LiquidityPool {
  reserveTokens: number
  reserveSOL: number
  k: number // Constant product
}

export interface TradeResult {
  outputAmount: number
  priceImpact: number
  slippage: number
  newPrice: number
  fee: number
}

const TRADING_FEE = 0.003 // 0.3% fee like Uniswap

/**
 * Calculate output amount for a trade using constant product formula
 * Formula: (x + Δx) * (y - Δy) = k
 * Where Δy = (y * Δx) / (x + Δx)
 */
export function calculateBuyAmount(pool: LiquidityPool, solAmount: number): TradeResult {
  // Apply trading fee
  const solAmountWithFee = solAmount * (1 - TRADING_FEE)
  const fee = solAmount * TRADING_FEE

  // Calculate output using constant product formula
  const numerator = pool.reserveTokens * solAmountWithFee
  const denominator = pool.reserveSOL + solAmountWithFee
  const tokensOut = numerator / denominator

  // Calculate price impact
  const oldPrice = pool.reserveSOL / pool.reserveTokens
  const newReserveTokens = pool.reserveTokens - tokensOut
  const newReserveSOL = pool.reserveSOL + solAmountWithFee
  const newPrice = newReserveSOL / newReserveTokens
  const priceImpact = ((newPrice - oldPrice) / oldPrice) * 100

  // Calculate slippage
  const expectedPrice = oldPrice
  const actualPrice = solAmount / tokensOut
  const slippage = ((actualPrice - expectedPrice) / expectedPrice) * 100

  return {
    outputAmount: tokensOut,
    priceImpact,
    slippage,
    newPrice,
    fee,
  }
}

/**
 * Calculate SOL output for selling tokens
 */
export function calculateSellAmount(pool: LiquidityPool, tokenAmount: number): TradeResult {
  // Calculate output using constant product formula
  const numerator = pool.reserveSOL * tokenAmount
  const denominator = pool.reserveTokens + tokenAmount
  const solOut = numerator / denominator

  // Apply trading fee
  const solOutWithFee = solOut * (1 - TRADING_FEE)
  const fee = solOut * TRADING_FEE

  // Calculate price impact
  const oldPrice = pool.reserveSOL / pool.reserveTokens
  const newReserveTokens = pool.reserveTokens + tokenAmount
  const newReserveSOL = pool.reserveSOL - solOut
  const newPrice = newReserveSOL / newReserveTokens
  const priceImpact = ((oldPrice - newPrice) / oldPrice) * 100

  // Calculate slippage
  const expectedPrice = oldPrice
  const actualPrice = solOutWithFee / tokenAmount
  const slippage = ((expectedPrice - actualPrice) / expectedPrice) * 100

  return {
    outputAmount: solOutWithFee,
    priceImpact,
    slippage,
    newPrice,
    fee,
  }
}

/**
 * Get current token price in SOL
 */
export function getCurrentPrice(pool: LiquidityPool): number {
  return pool.reserveSOL / pool.reserveTokens
}

/**
 * Calculate market cap
 */
export function calculateMarketCap(pool: LiquidityPool): number {
  const price = getCurrentPrice(pool)
  const totalSupply = 1000000 // Fixed supply
  return price * totalSupply
}

/**
 * Execute a buy trade and update pool state
 */
export function executeBuy(pool: LiquidityPool, solAmount: number): { result: TradeResult; newPool: LiquidityPool } {
  const result = calculateBuyAmount(pool, solAmount)

  const newPool: LiquidityPool = {
    reserveTokens: pool.reserveTokens - result.outputAmount,
    reserveSOL: pool.reserveSOL + solAmount * (1 - TRADING_FEE),
    k: 0,
  }
  newPool.k = newPool.reserveTokens * newPool.reserveSOL

  return { result, newPool }
}

/**
 * Execute a sell trade and update pool state
 */
export function executeSell(pool: LiquidityPool, tokenAmount: number): { result: TradeResult; newPool: LiquidityPool } {
  const result = calculateSellAmount(pool, tokenAmount)

  const newPool: LiquidityPool = {
    reserveTokens: pool.reserveTokens + tokenAmount,
    reserveSOL: pool.reserveSOL - result.outputAmount / (1 - TRADING_FEE),
    k: 0,
  }
  newPool.k = newPool.reserveTokens * newPool.reserveSOL

  return { result, newPool }
}
