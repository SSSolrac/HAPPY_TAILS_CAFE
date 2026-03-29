import type { RecentOrder } from '@/types/dashboard';

export const RecentOrdersTable = ({ title, rows }: { title: string; rows: RecentOrder[] }) => (
  <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3 overflow-auto">
    <h3 className="font-medium">{title}</h3>
    <table className="w-full text-sm min-w-[640px]">
      <thead>
        <tr className="text-left">
          <th>Order ID</th>
          <th>Customer</th>
          <th>Status</th>
          <th>Total</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-t">
            <td>{row.id}</td>
            <td>{row.customerName}</td>
            <td className="capitalize">{row.status}</td>
            <td>${row.total.toFixed(2)}</td>
            <td>{new Date(row.createdAt).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </section>
);
