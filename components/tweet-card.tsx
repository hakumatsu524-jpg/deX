"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { TweetMarket } from "@/lib/market-data"
import { getCurrentPrice, calculateMarketCap } from "@/lib/amm"
import { TrendingUp, TrendingDown, Heart, Repeat2, MessageCircle } from "lucide-react"

interface TweetCardProps {
  market: TweetMarket
  onTrade: (market: TweetMarket) => void
}

export function TweetCard({ market, onTrade }: TweetCardProps) {
  const price = getCurrentPrice(market.pool)
  const marketCap = calculateMarketCap(market.pool)
  const isPositive = market.priceChange24h >= 0

  return (
    <Card className="p-4 hover:border-primary/50 transition-all cursor-pointer group">
      <div className="space-y-4">
        {/* Author Info */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border border-primary/30">
              <span className="text-lg font-bold">{market.authorName.charAt(0)}</span>
            </div>
            <div>
              <div className="font-semibold">{market.authorName}</div>
              <div className="text-sm text-muted-foreground">@{market.authorHandle}</div>
            </div>
          </div>
          <Badge variant={isPositive ? "default" : "destructive"} className="gap-1">
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? "+" : ""}
            {market.priceChange24h.toFixed(2)}%
          </Badge>
        </div>

        {/* Tweet Text */}
        <p className="text-sm leading-relaxed">{market.tweetText}</p>

        {/* Engagement Metrics */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            <span>{(market.metrics.likes / 1000).toFixed(1)}K</span>
          </div>
          <div className="flex items-center gap-1">
            <Repeat2 className="w-4 h-4" />
            <span>{(market.metrics.retweets / 1000).toFixed(1)}K</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span>{(market.metrics.replies / 1000).toFixed(1)}K</span>
          </div>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
          <div>
            <div className="text-xs text-muted-foreground">Price</div>
            <div className="font-mono text-sm font-semibold text-primary">${price.toFixed(6)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Market Cap</div>
            <div className="font-mono text-sm font-semibold">${(marketCap / 1000).toFixed(1)}K</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">24h Volume</div>
            <div className="font-mono text-sm font-semibold">${(market.volume24h / 1000).toFixed(1)}K</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Holders</div>
            <div className="font-mono text-sm font-semibold">{market.holders}</div>
          </div>
        </div>

        {/* Trade Button */}
        <Button
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all bg-transparent"
          variant="outline"
          onClick={() => onTrade(market)}
        >
          Trade Now
        </Button>
      </div>
    </Card>
  )
}
