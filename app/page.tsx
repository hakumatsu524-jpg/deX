"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TweetCard } from "@/components/tweet-card"
import { TradeModal } from "@/components/trade-modal"
import { TradingChart } from "@/components/trading-chart"
import { generateTrendingMarkets, generatePriceHistory, type TweetMarket } from "@/lib/market-data"
import {
  updatePositionAfterBuy,
  updatePositionAfterSell,
  calculatePositionPnL,
  calculatePortfolioStats,
  type Position,
  type Trade,
} from "@/lib/portfolio-manager"
import { executeBuy, executeSell, getCurrentPrice } from "@/lib/amm"
import { Flame, TrendingUp, Wallet, BarChart3, Search, Activity } from "lucide-react"
import Image from "next/image"

export default function DeXPage() {
  const [markets, setMarkets] = useState<TweetMarket[]>([])
  const [selectedMarket, setSelectedMarket] = useState<TweetMarket | null>(null)
  const [tradeModalOpen, setTradeModalOpen] = useState(false)
  const [userBalance, setUserBalance] = useState(10000) // Starting with 10k SOL
  const [positions, setPositions] = useState<Map<string, Position>>(new Map())
  const [trades, setTrades] = useState<Trade[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [view, setView] = useState<"markets" | "portfolio">("markets")

  // Initialize markets
  useEffect(() => {
    const initialMarkets = generateTrendingMarkets()
    setMarkets(initialMarkets)
  }, [])

  // Update chart data when market selected
  useEffect(() => {
    if (selectedMarket) {
      const price = getCurrentPrice(selectedMarket.pool)
      const history = generatePriceHistory(price, 0.08, 100)
      setChartData(history)
    }
  }, [selectedMarket])

  const handleTrade = (market: TweetMarket, type: "buy" | "sell", amount: number) => {
    const marketIndex = markets.findIndex((m) => m.id === market.id)
    if (marketIndex === -1) return

    const currentMarket = markets[marketIndex]

    if (type === "buy") {
      if (amount > userBalance) return

      const { result, newPool } = executeBuy(currentMarket.pool, amount)

      // Update market
      const updatedMarket = {
        ...currentMarket,
        pool: newPool,
        volume24h: currentMarket.volume24h + amount,
      }

      // Update user position
      const currentPosition = positions.get(market.id) || null
      const newPosition = updatePositionAfterBuy(
        currentPosition,
        result.outputAmount,
        amount,
        getCurrentPrice(currentMarket.pool),
      )
      newPosition.tweetId = market.id

      // Update state
      const newPositions = new Map(positions)
      newPositions.set(market.id, newPosition)
      setPositions(newPositions)
      setUserBalance(userBalance - amount)

      // Record trade
      const trade: Trade = {
        id: `trade-${Date.now()}`,
        tweetId: market.id,
        type: "buy",
        tokenAmount: result.outputAmount,
        solAmount: amount,
        price: getCurrentPrice(currentMarket.pool),
        timestamp: new Date(),
        slippage: result.slippage,
      }
      setTrades([trade, ...trades])

      // Update markets
      const newMarkets = [...markets]
      newMarkets[marketIndex] = updatedMarket
      setMarkets(newMarkets)
    } else {
      const currentPosition = positions.get(market.id)
      if (!currentPosition || amount > currentPosition.tokenBalance) return

      const { result, newPool } = executeSell(currentMarket.pool, amount)

      // Update market
      const updatedMarket = {
        ...currentMarket,
        pool: newPool,
        volume24h: currentMarket.volume24h + result.outputAmount,
      }

      // Update user position
      const newPosition = updatePositionAfterSell(currentPosition, amount, result.outputAmount)

      // Update state
      const newPositions = new Map(positions)
      if (newPosition.tokenBalance > 0.0001) {
        newPositions.set(market.id, newPosition)
      } else {
        newPositions.delete(market.id)
      }
      setPositions(newPositions)
      setUserBalance(userBalance + result.outputAmount)

      // Record trade
      const trade: Trade = {
        id: `trade-${Date.now()}`,
        tweetId: market.id,
        type: "sell",
        tokenAmount: amount,
        solAmount: result.outputAmount,
        price: getCurrentPrice(currentMarket.pool),
        timestamp: new Date(),
        slippage: result.slippage,
      }
      setTrades([trade, ...trades])

      // Update markets
      const newMarkets = [...markets]
      newMarkets[marketIndex] = updatedMarket
      setMarkets(newMarkets)
    }
  }

  const positionsArray = Array.from(positions.values()).map((pos) => {
    const market = markets.find((m) => m.id === pos.tweetId)
    if (!market) return pos
    const price = getCurrentPrice(market.pool)
    return calculatePositionPnL(pos, price)
  })

  const portfolioStats = calculatePortfolioStats(positionsArray)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/dex-logo.png" alt="deX Logo" width={120} height={40} className="h-10 w-auto" priority />
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("markets")}
                className={view === "markets" ? "bg-muted" : ""}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Markets
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("portfolio")}
                className={view === "portfolio" ? "bg-muted" : ""}
              >
                <Wallet className="w-4 h-4 mr-2" />
                Portfolio
              </Button>
              <Card className="px-4 py-2 bg-muted/50">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  <span className="font-mono font-semibold">{userBalance.toFixed(2)} SOL</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {view === "markets" ? (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Markets</div>
                    <div className="text-2xl font-bold">{markets.length}</div>
                  </div>
                  <Flame className="w-8 h-8 text-orange-500" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">24h Volume</div>
                    <div className="text-2xl font-bold">
                      ${(markets.reduce((sum, m) => sum + m.volume24h, 0) / 1000).toFixed(0)}K
                    </div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Your Positions</div>
                    <div className="text-2xl font-bold">{positions.size}</div>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Trades</div>
                    <div className="text-2xl font-bold">{trades.length}</div>
                  </div>
                  <Activity className="w-8 h-8 text-purple-500" />
                </div>
              </Card>
            </div>

            {/* Featured Market with Chart */}
            {markets[0] && (
              <Card className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">
                        <Flame className="w-3 h-3 mr-1" />
                        Hottest
                      </Badge>
                      <h3 className="text-xl font-bold">Featured Market</h3>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border border-primary/30">
                          <span className="text-lg font-bold">{markets[0].authorName.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-semibold">{markets[0].authorName}</div>
                          <div className="text-sm text-muted-foreground">@{markets[0].authorHandle}</div>
                        </div>
                      </div>

                      <p className="text-sm leading-relaxed">{markets[0].tweetText}</p>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground">Price</div>
                          <div className="font-mono text-lg font-semibold text-primary">
                            ${getCurrentPrice(markets[0].pool).toFixed(6)}
                          </div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground">24h Change</div>
                          <div
                            className={`font-mono text-lg font-semibold ${
                              markets[0].priceChange24h >= 0 ? "text-primary" : "text-red-500"
                            }`}
                          >
                            {markets[0].priceChange24h >= 0 ? "+" : ""}
                            {markets[0].priceChange24h.toFixed(2)}%
                          </div>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => {
                          setSelectedMarket(markets[0])
                          setTradeModalOpen(true)
                        }}
                      >
                        Trade Now
                      </Button>
                    </div>
                  </div>

                  <div className="h-[300px]">
                    <TradingChart
                      data={generatePriceHistory(getCurrentPrice(markets[0].pool), 0.08, 100)}
                      currentPrice={getCurrentPrice(markets[0].pool)}
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Trending Markets */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Trending Markets</h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search tweets..." className="pl-9 w-64" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {markets.map((market) => (
                  <TweetCard
                    key={market.id}
                    market={market}
                    onTrade={(m) => {
                      setSelectedMarket(m)
                      setTradeModalOpen(true)
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Portfolio Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Total Value</div>
                <div className="text-2xl font-bold font-mono">
                  ${(portfolioStats.totalValue + userBalance).toFixed(2)}
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Total Invested</div>
                <div className="text-2xl font-bold font-mono">${portfolioStats.totalInvested.toFixed(2)}</div>
              </Card>

              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Unrealized P&L</div>
                <div
                  className={`text-2xl font-bold font-mono ${
                    portfolioStats.totalPnL >= 0 ? "text-primary" : "text-red-500"
                  }`}
                >
                  {portfolioStats.totalPnL >= 0 ? "+" : ""}${portfolioStats.totalPnL.toFixed(2)}
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-sm text-muted-foreground">ROI</div>
                <div
                  className={`text-2xl font-bold font-mono ${
                    portfolioStats.totalPnLPercent >= 0 ? "text-primary" : "text-red-500"
                  }`}
                >
                  {portfolioStats.totalPnLPercent >= 0 ? "+" : ""}
                  {portfolioStats.totalPnLPercent.toFixed(2)}%
                </div>
              </Card>
            </div>

            {/* Positions */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Your Positions</h3>
              {positionsArray.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No positions yet</p>
                  <p className="text-sm">Start trading to build your portfolio</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {positionsArray.map((position) => {
                    const market = markets.find((m) => m.id === position.tweetId)
                    if (!market) return null

                    return (
                      <div
                        key={position.tweetId}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border border-primary/30">
                            <span className="font-bold">{market.authorName.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="font-semibold">{market.authorHandle}</div>
                            <div className="text-sm text-muted-foreground">
                              {position.tokenBalance.toFixed(4)} tokens
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 text-right">
                          <div>
                            <div className="text-xs text-muted-foreground">Avg. Buy</div>
                            <div className="font-mono text-sm">${position.averageBuyPrice.toFixed(6)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Current</div>
                            <div className="font-mono text-sm">${getCurrentPrice(market.pool).toFixed(6)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">P&L</div>
                            <div
                              className={`font-mono text-sm font-semibold ${
                                position.unrealizedPnL >= 0 ? "text-primary" : "text-red-500"
                              }`}
                            >
                              {position.unrealizedPnL >= 0 ? "+" : ""}${position.unrealizedPnL.toFixed(2)} (
                              {position.unrealizedPnLPercent.toFixed(1)}%)
                            </div>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedMarket(market)
                            setTradeModalOpen(true)
                          }}
                        >
                          Trade
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Recent Trades */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Recent Trades</h3>
              {trades.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No trades yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {trades.slice(0, 10).map((trade) => {
                    const market = markets.find((m) => m.id === trade.tweetId)
                    if (!market) return null

                    return (
                      <div
                        key={trade.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant={trade.type === "buy" ? "default" : "secondary"}>
                            {trade.type.toUpperCase()}
                          </Badge>
                          <span className="font-medium">@{market.authorHandle}</span>
                        </div>

                        <div className="flex items-center gap-6 text-muted-foreground">
                          <span className="font-mono">{trade.tokenAmount.toFixed(4)} tokens</span>
                          <span className="font-mono">{trade.solAmount.toFixed(4)} SOL</span>
                          <span className="font-mono">${trade.price.toFixed(6)}</span>
                          <span className="text-xs">{trade.timestamp.toLocaleTimeString()}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Trade Modal */}
      <TradeModal
        market={selectedMarket}
        open={tradeModalOpen}
        onClose={() => setTradeModalOpen(false)}
        onExecuteTrade={handleTrade}
        userBalance={userBalance}
        userPosition={selectedMarket ? positions.get(selectedMarket.id)?.tokenBalance || 0 : 0}
      />
    </div>
  )
}
