import { CsvImportPanel, DateRangeFilter } from '@/components/dashboard';
import { useEffect, useState } from 'react';
import { csvImportService } from '@/services/csvImportService';
import type { DateRangePreset } from '@/types/dashboard';

export const ImportsReportsPage = () => {
  const [range, setRange] = useState<DateRangePreset>('all');
  const [history, setHistory] = useState<Array<{ id: string; type: string; totalRows: number; validRows: number; invalidRows: number; importedAt: string }>>([]);

  useEffect(() => {
    csvImportService.listHistory().then(setHistory).catch(() => setHistory([]));
  }, []);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Import Sales Data</h2>
          <p className="text-sm text-[#6B7280]">Upload sales CSV files, review validation results, and track import jobs.</p>
        </div>
        <DateRangeFilter value={range} onChange={setRange} />
      </section>

      <CsvImportPanel />

      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-2">
        <h3 className="font-medium">Import History</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm min-w-[620px]"><thead><tr className="text-left"><th>Batch ID</th><th>Type</th><th>Total Rows</th><th>Valid</th><th>Invalid</th><th>Submitted</th></tr></thead><tbody>{history.map((item) => <tr key={item.id} className="border-t"><td>{item.id}</td><td>{item.type}</td><td>{item.totalRows}</td><td>{item.validRows}</td><td>{item.invalidRows}</td><td>{new Date(item.importedAt).toLocaleString()}</td></tr>)}</tbody></table>
        </div>
      </section>
    </div>
  );
};
