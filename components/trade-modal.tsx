"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { TweetMarket } from "@/lib/market-data"
import { calculateBuyAmount, calculateSellAmount, getCurrentPrice } from "@/lib/amm"
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react"

interface TradeModalProps {
  market: TweetMarket | null
  open: boolean
  onClose: () => void
  onExecuteTrade: (market: TweetMarket, type: "buy" | "sell", amount: number) => void
  userBalance: number
  userPosition: number
}

export function TradeModal({ market, open, onClose, onExecuteTrade, userBalance, userPosition }: TradeModalProps) {
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy")
  const [amount, setAmount] = useState("")
  const [preview, setPreview] = useState<{
    output: number
    priceImpact: number
    slippage: number
    newPrice: number
    fee: number
  } | null>(null)

  useEffect(() => {
    if (!market || !amount || isNaN(Number.parseFloat(amount))) {
      setPreview(null)
      return
    }

    const inputAmount = Number.parseFloat(amount)
    if (inputAmount <= 0) {
      setPreview(null)
      return
    }

    if (tradeType === "buy") {
      const result = calculateBuyAmount(market.pool, inputAmount)
      setPreview({
        output: result.outputAmount,
        priceImpact: result.priceImpact,
        slippage: result.slippage,
        newPrice: result.newPrice,
        fee: result.fee,
      })
    } else {
      const result = calculateSellAmount(market.pool, inputAmount)
      setPreview({
        output: result.outputAmount,
        priceImpact: result.priceImpact,
        slippage: result.slippage,
        newPrice: result.newPrice,
        fee: result.fee,
      })
    }
  }, [market, amount, tradeType])

  const handleTrade = () => {
    if (!market || !amount) return

    onExecuteTrade(market, tradeType, Number.parseFloat(amount))
    setAmount("")
    onClose()
  }

  if (!market) return null

  const currentPrice = getCurrentPrice(market.pool)
  const maxAmount = tradeType === "buy" ? userBalance : userPosition
  const isValid = amount && Number.parseFloat(amount) > 0 && Number.parseFloat(amount) <= maxAmount && preview !== null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Trade {market.authorHandle}'s Tweet</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Trade Type Selector */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={tradeType === "buy" ? "default" : "outline"}
              onClick={() => setTradeType("buy")}
              className="gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Buy
            </Button>
            <Button
              variant={tradeType === "sell" ? "default" : "outline"}
              onClick={() => setTradeType("sell")}
              className="gap-2"
            >
              <TrendingDown className="w-4 h-4" />
              Sell
            </Button>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{tradeType === "buy" ? "SOL Amount" : "Token Amount"}</Label>
              <span className="text-xs text-muted-foreground">Available: {maxAmount.toFixed(4)}</span>
            </div>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-16"
                step="0.0001"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-7 text-xs"
                onClick={() => setAmount(maxAmount.toString())}
              >
                MAX
              </Button>
            </div>
          </div>

          {/* Current Price */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <div className="text-xs text-muted-foreground">Current Price</div>
            <div className="font-mono text-lg font-semibold">${currentPrice.toFixed(6)}</div>
          </div>

          {/* Trade Preview */}
          {preview && (
            <div className="space-y-2 border border-border rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">You Receive</span>
                <span className="font-mono font-semibold">
                  {preview.output.toFixed(4)} {tradeType === "buy" ? "TOKENS" : "SOL"}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Price Impact</span>
                <Badge variant={Math.abs(preview.priceImpact) > 5 ? "destructive" : "secondary"}>
                  {preview.priceImpact.toFixed(2)}%
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Trading Fee</span>
                <span className="font-mono">{preview.fee.toFixed(4)} SOL</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">New Price</span>
                <span className="font-mono">${preview.newPrice.toFixed(6)}</span>
              </div>

              {Math.abs(preview.priceImpact) > 5 && (
                <div className="flex items-start gap-2 text-xs text-orange-500 bg-orange-500/10 rounded p-2 mt-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>High price impact! Consider trading a smaller amount.</span>
                </div>
              )}
            </div>
          )}

          {/* Execute Button */}
          <Button onClick={handleTrade} disabled={!isValid} className="w-full" size="lg">
            {tradeType === "buy" ? "Buy Tokens" : "Sell Tokens"}
          </Button>

          {/* Position Info */}
          {userPosition > 0 && (
            <div className="text-xs text-center text-muted-foreground">
              Your position: {userPosition.toFixed(4)} tokens
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
