import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { csvImportService } from '@/services/csvImportService';
import type { CsvImportType } from '@/types/dashboard';

const options: Array<{ value: CsvImportType; label: string }> = [
  { value: 'orders', label: 'Orders' },
  { value: 'customers', label: 'Customers' },
  { value: 'menu-items', label: 'Menu Items' },
];

export const CsvImportPanel = () => {
  const [type, setType] = useState<CsvImportType>('orders');
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [validRows, setValidRows] = useState<Record<string, string>[]>([]);
  const [invalidRows, setInvalidRows] = useState<Array<{ rowNumber: number; reason: string }>>([]);
  const [loading, setLoading] = useState(false);

  const headers = useMemo(() => (rows[0] ? Object.keys(rows[0]) : []), [rows]);

  return (
    <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-4">
      <div>
        <h3 className="font-medium">CSV Imports</h3>
        <p className="text-sm text-slate-500">Upload and validate historical data before future database import.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm">
          Import Type
          <select className="block border rounded mt-1 px-2 py-1 w-full" value={type} onChange={(e) => setType(e.target.value as CsvImportType)}>
            {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="text-sm">
          CSV File
          <input
            className="block border rounded mt-1 px-2 py-1 w-full"
            type="file"
            accept=".csv,text/csv"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setLoading(true);
              try {
                const parsed = await csvImportService.parseCsvFile(file);
                const validation = csvImportService.validateImportedRows(type, parsed);
                setRows(parsed);
                setValidRows(validation.validRows);
                setInvalidRows(validation.invalidRows.map((row) => ({ rowNumber: row.rowNumber, reason: row.reason })));
                toast.success('CSV parsed successfully.');
              } catch {
                toast.error('Unable to parse CSV file. Please check format.');
                setRows([]);
                setValidRows([]);
                setInvalidRows([]);
              } finally {
                setLoading(false);
              }
            }}
          />
        </label>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <div className="border rounded p-3">Rows parsed: <strong>{rows.length}</strong></div>
        <div className="border rounded p-3">Rows valid: <strong>{validRows.length}</strong></div>
        <div className="border rounded p-3">Rows invalid: <strong>{invalidRows.length}</strong></div>
      </div>

      {invalidRows.length > 0 && (
        <div className="text-sm text-red-600 space-y-1">
          {invalidRows.slice(0, 5).map((row) => <p key={`${row.rowNumber}-${row.reason}`}>Row {row.rowNumber}: {row.reason}</p>)}
        </div>
      )}

      {headers.length > 0 && (
        <div className="overflow-auto border rounded">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr>{headers.map((header) => <th className="text-left p-2 border-b" key={header}>{header}</th>)}</tr>
            </thead>
            <tbody>
              {rows.slice(0, 6).map((row, index) => (
                <tr key={index} className="border-b last:border-b-0">
                  {headers.map((header) => <td className="p-2" key={`${index}-${header}`}>{row[header]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        className="border rounded px-3 py-1"
        disabled={loading || validRows.length === 0}
        onClick={async () => {
          const result = await csvImportService.importCsvData(type, validRows);
          toast.success(`Mock import complete: ${result.imported} rows ready for backend sync.`);
        }}
      >
        {loading ? 'Processing...' : 'Run Mock Import'}
      </button>
    </section>
  );
};
