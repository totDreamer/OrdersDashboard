"use client"

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"

type Order = {
  id: number
  created_at: string
  total_sum: number
}

type Mode = "count" | "total"

export default function Home() {
  const [data, setData] = useState<any[]>([])
  const [mode, setMode] = useState<Mode>("count")

  useEffect(() => {
    fetchOrders()
  }, [])

  function formatLocalDate(date: Date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  function formatDisplayDate(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    })
  }

  async function fetchOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")

    if (error || !data) {
      console.error("Supabase error:", error)
      return
    }

    const grouped: Record<string, { count: number; total: number }> = {}

    data.forEach((order: Order) => {
      const date = formatLocalDate(new Date(order.created_at))

      if (!grouped[date]) {
        grouped[date] = { count: 0, total: 0 }
      }

      grouped[date].count += 1
      grouped[date].total += order.total_sum
    })

    let chartData = Object.entries(grouped).map(([date, values]) => ({
      date,
      count: values.count,
      total: values.total,
    }))

    chartData.sort((a, b) => a.date.localeCompare(b.date))

    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const fullMonth: any[] = []

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const date = formatLocalDate(d)

      const existing = chartData.find((x) => x.date === date)

      fullMonth.push({
        date,
        count: existing?.count || 0,
        total: existing?.total || 0,
      })
    }

    setData(fullMonth)
  }

  const getLabelName = () => {
    return mode === "count"
      ? "Количество заказов"
      : "Общая сумма заказов"
  }

  return (
    <main style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: 20 }}>Orders Dashboard</h1>

      {/* 🎛 кнопки */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => setMode("count")}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid #ccc",
            cursor: "pointer",
            background: mode === "count" ? "#8884d8" : "white",
            color: mode === "count" ? "white" : "black",
            fontWeight: 600,
          }}
        >
          📦 Заказы
        </button>

        <button
          onClick={() => setMode("total")}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid #ccc",
            cursor: "pointer",
            background: mode === "total" ? "#82ca9d" : "white",
            color: mode === "total" ? "white" : "black",
            fontWeight: 600,
          }}
        >
          💰 Сумма ₸
        </button>
      </div>

      <ResponsiveContainer width="100%" height={420}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 20, left: 40, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="date" tick={{ fontSize: 12 }} />

          <YAxis tick={{ fontSize: 12 }} width={70} />

          <Tooltip
          contentStyle={{
          backgroundColor: "white",
          borderRadius: 10,
          border: "1px solid #ddd",
        }}
          labelFormatter={(label) => formatDisplayDate(label)}
          formatter={(value: any) => {
          if (value === undefined || value === null) return ["0", ""]

          return mode === "total"
            ? [`${Number(value).toLocaleString("ru-RU")} ₸`, getLabelName()]
            : [value, getLabelName()]
        }}
      />

          <Line
            type="monotone"
            dataKey={mode === "count" ? "count" : "total"}
            name={getLabelName()}
            stroke={mode === "count" ? "#8884d8" : "#82ca9d"}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </main>
  )
}