import { CsvImportPanel, DateRangeFilter } from '@/components/dashboard';
import { useState } from 'react';
import type { DateRangePreset } from '@/types/dashboard';

const history = [
  { id: 'IMP-301', type: 'Orders', rows: 540, status: 'Completed', time: '2026-03-28 10:10' },
  { id: 'IMP-300', type: 'Customers', rows: 86, status: 'Completed', time: '2026-03-27 09:35' },
  { id: 'IMP-299', type: 'Menu Items', rows: 12, status: 'Completed with warnings', time: '2026-03-24 16:05' },
];

export const ImportsReportsPage = () => {
  const [range, setRange] = useState<DateRangePreset>('90d');

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Imports & Reports</h2>
          <p className="text-sm text-[#6B7280]">Upload CSV files safely, review validation results, and track import jobs.</p>
        </div>
        <DateRangeFilter value={range} onChange={setRange} />
      </section>

      <CsvImportPanel />

      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-2">
        <h3 className="font-medium">Import History</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm min-w-[620px]">
            <thead><tr className="text-left"><th>Batch ID</th><th>Type</th><th>Rows</th><th>Status</th><th>Submitted</th></tr></thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-t"><td>{item.id}</td><td>{item.type}</td><td>{item.rows}</td><td>{item.status}</td><td>{item.time}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[#6B7280]">History is currently mocked and will be wired to import jobs API when available.</p>
      </section>
    </div>
  );
};
