import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ItemMetric } from '@/types/dashboard';

export const TopItemsChart = ({ title, data }: { title: string; data: ItemMetric[] }) => (
  <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3">
    <h3 className="font-medium">{title}</h3>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 16 }}>
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={130} />
          <Tooltip />
          <Bar dataKey="value" fill="#0ea5e9" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </section>
);
