'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatNaira } from '@/lib/utils';
import type { MonthlyCollection } from '@/types';

export function MonthlyChart({ data }: { data: MonthlyCollection[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748B', fontSize: 12 }}
          tickFormatter={(v) => `₦${(v / 1_000_000).toFixed(1)}M`}
        />
        <Tooltip
          formatter={(value: number) => [formatNaira(value), 'Collected']}
          contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
        />
        <Bar dataKey="amount" fill="#00A86B" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
