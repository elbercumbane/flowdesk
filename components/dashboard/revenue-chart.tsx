'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'

export function RevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <div className="w-full h-56 sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#71717A' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#71717A' }} axisLine={false} tickLine={false} width={48} />
          <Tooltip
            formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, 'Receita']}
            contentStyle={{ borderRadius: 8, border: '1px solid #E4E4E7', fontSize: 12 }}
          />
          <Bar dataKey="revenue" fill="#6366F1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
