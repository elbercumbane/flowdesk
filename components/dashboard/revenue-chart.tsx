'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from 'recharts'
import { useState } from 'react'

export function RevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  return (
    <div className="w-full h-56 sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
          onMouseMove={(state: any) => {
            const idx = state?.activeTooltipIndex
            setActiveIndex(idx === undefined || idx === null || idx === '' ? null : Number(idx))
          }}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <defs>
            <linearGradient id="fd-revenue-bar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#71717A' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#71717A' }} axisLine={false} tickLine={false} width={48} />
          <Tooltip
            formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, 'Receita']}
            cursor={{ fill: 'rgba(99, 102, 241, 0.06)', radius: 4 }}
            contentStyle={{
              borderRadius: 10,
              border: '1px solid #E4E4E7',
              fontSize: 12,
              boxShadow: '0 8px 24px -8px rgba(99, 102, 241, 0.25)',
            }}
            labelStyle={{ fontWeight: 600, color: '#3F3F46' }}
          />
          <Bar
            dataKey="revenue"
            radius={[6, 6, 0, 0]}
            isAnimationActive
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill="url(#fd-revenue-bar)"
                fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.45}
                style={{ transition: 'fill-opacity 0.2s ease' }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
