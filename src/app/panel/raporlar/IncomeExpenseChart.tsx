"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrencyTRY } from "@/lib/utils";

export function IncomeExpenseChart({ data }: { data: { label: string; income: number; expense: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EF4444" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#E2E8F8" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#7484CC", fontSize: 12 }}
          dy={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#7484CC", fontSize: 12 }}
          width={48}
          tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}b` : `${v}`)}
        />
        <Tooltip
          formatter={(value: number, name: string) => [formatCurrencyTRY(value), name === "income" ? "Gelir" : "Gider"]}
          labelStyle={{ color: "#1B2559", fontWeight: 600 }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #E2E8F8",
            boxShadow: "0 8px 24px -8px rgba(27,37,89,0.16)",
          }}
        />
        <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2.5} fill="url(#incomeFill)" />
        <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2.5} fill="url(#expenseFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
