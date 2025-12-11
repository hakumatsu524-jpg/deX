"use client"

import { useEffect, useRef, useState } from "react"
import type { PricePoint } from "@/lib/market-data"

interface TradingChartProps {
  data: PricePoint[]
  currentPrice: number
}

export function TradingChart({ data, currentPrice }: TradingChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredPoint, setHoveredPoint] = useState<PricePoint | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height
    const padding = 40

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    if (data.length === 0) return

    // Find min and max prices
    const prices = data.map((d) => d.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice

    // Draw grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)"
    ctx.lineWidth = 1

    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * (height - padding * 2)) / 5
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Draw price labels
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
    ctx.font = "11px monospace"
    ctx.textAlign = "right"

    for (let i = 0; i <= 5; i++) {
      const price = maxPrice - (i * priceRange) / 5
      const y = padding + (i * (height - padding * 2)) / 5
      ctx.fillText(price.toFixed(6), padding - 5, y + 4)
    }

    // Draw area under curve
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding)
    gradient.addColorStop(0, "rgba(0, 255, 163, 0.2)")
    gradient.addColorStop(1, "rgba(0, 255, 163, 0)")

    ctx.beginPath()
    data.forEach((point, i) => {
      const x = padding + (i * (width - padding * 2)) / (data.length - 1)
      const y = height - padding - ((point.price - minPrice) / priceRange) * (height - padding * 2)

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.lineTo(width - padding, height - padding)
    ctx.lineTo(padding, height - padding)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    // Draw line
    ctx.beginPath()
    ctx.strokeStyle = "#00ffa3"
    ctx.lineWidth = 2

    data.forEach((point, i) => {
      const x = padding + (i * (width - padding * 2)) / (data.length - 1)
      const y = height - padding - ((point.price - minPrice) / priceRange) * (height - padding * 2)

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()
  }, [data])

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" style={{ width: "100%", height: "100%" }} />
      {hoveredPoint && (
        <div className="absolute top-2 left-2 bg-black/80 border border-primary/20 rounded px-2 py-1 text-xs">
          <div className="text-primary font-mono">${hoveredPoint.price.toFixed(6)}</div>
          <div className="text-muted-foreground">{new Date(hoveredPoint.timestamp).toLocaleTimeString()}</div>
        </div>
      )}
    </div>
  )
}
