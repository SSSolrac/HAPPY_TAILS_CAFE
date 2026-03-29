import { CsvImportPanel, DateRangeFilter } from '@/components/dashboard';
import { useState } from 'react';
import type { DateRangePreset } from '@/types/dashboard';

export const ImportsReportsPage = () => {
  const [range, setRange] = useState<DateRangePreset>('3M');

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Imports & Reports</h2>
          <p className="text-sm text-slate-500">Safe owner upload workflow with validation before any real database import.</p>
        </div>
        <DateRangeFilter value={range} onChange={setRange} />
      </section>

      <CsvImportPanel />

      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-2">
        <h3 className="font-medium">Import History (placeholder)</h3>
        <p className="text-sm text-slate-500">No imports have been committed to backend yet.</p>
        <p className="text-xs text-slate-500">TODO: add import audit trail once /api/import-jobs is available.</p>
      </section>
    </div>
  );
};
