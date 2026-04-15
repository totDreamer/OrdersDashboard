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
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()

    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

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

    // ✅ ВСЕГДА полный массив (без искажений)
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

      <ResponsiveContainer width="100%" height={isMobile ? 300 : 420}>
        <LineChart
          data={data}
          margin={
            isMobile
              ? { top: 10, right: 10, left: 10, bottom: 10 }
              : { top: 10, right: 20, left: 40, bottom: 10 }
          }
        >
          <CartesianGrid strokeDasharray={isMobile ? "2 2" : "3 3"} />

          <XAxis
            dataKey="date"
            tick={{ fontSize: isMobile ? 10 : 12 }}
            tickFormatter={(value, index) => {
              if (!isMobile) return value

              // ✅ показываем только каждую 4-ю дату
              return index % 4 === 0
                ? new Date(value).getDate()
                : ""
            }}
          />

          <YAxis
            tick={{ fontSize: isMobile ? 10 : 12 }}
            width={isMobile ? 40 : 70}
          />

          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null

              const date = formatDisplayDate(label as string)

              return (
                <div
                  style={{
                    background: "white",
                    border: "1px solid #ddd",
                    borderRadius: 12,
                    padding: isMobile ? 8 : 12,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                    minWidth: isMobile ? 120 : 160,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: "#111",
                      marginBottom: 8,
                    }}
                  >
                    📅 {date}
                  </div>

                  <div style={{ fontSize: 13 }}>
                    {payload.map((entry, i) => (
                      <div key={i} style={{ color: "#444", marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>
                          {entry.name}:
                        </span>{" "}
                        {entry.value?.toLocaleString("ru-RU")}
                        {entry.dataKey === "total" ? " ₸" : ""}
                      </div>
                    ))}
                  </div>
                </div>
              )
            }}
          />

          <Line
            type="monotone"
            dataKey={mode === "count" ? "count" : "total"}
            name={getLabelName()}
            stroke={mode === "count" ? "#8884d8" : "#82ca9d"}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: isMobile ? 4 : 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </main>
  )
}