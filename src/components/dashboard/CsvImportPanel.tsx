import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { csvImportService } from '@/services/csvImportService';
import { useAuth } from '@/hooks/useAuth';
import type { CsvImportType, SalesImportMergeResult } from '@/types/dashboard';

const options: Array<{ value: CsvImportType; label: string }> = [
  { value: 'sales', label: 'Sales (Owner)' },
  { value: 'orders', label: 'Orders' },
  { value: 'customers', label: 'Customers' },
  { value: 'menu-items', label: 'Menu Items' },
];

const templates: Record<CsvImportType, string> = {
  sales: 'date,sales_total,orders_count\n2026-04-01,12340,84',
  orders: 'order_id,customer_name,total,status,payment_method',
  customers: 'customer_id,name,email,points,tier',
  'menu-items': 'item_id,name,category,price,is_available,is_featured',
};

export const CsvImportPanel = () => {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  const [type, setType] = useState<CsvImportType>('sales');
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [validRows, setValidRows] = useState<Record<string, string>[]>([]);
  const [invalidRows, setInvalidRows] = useState<Array<{ rowNumber: number; reason: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SalesImportMergeResult | null>(null);

  const headers = useMemo(() => (rows[0] ? Object.keys(rows[0]) : []), [rows]);

  if (!isOwner) {
    return <section className="rounded-lg border bg-white p-4 text-sm text-[#6B7280]">Only owners can upload and import sales CSV data.</section>;
  }

  return (
    <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-4">
      <div>
        <h3 className="font-medium">CSV Imports</h3>
        <p className="text-sm text-[#6B7280]">Upload, preview, validate, and confirm imports. Overlapping sales dates are replaced.</p>
      </div>

      <div className="rounded border p-3 text-sm space-y-2">
        <p className="font-medium">CSV templates</p>
        <button
          className="border rounded px-2 py-1"
          onClick={() => {
            const blob = new Blob([templates[type]], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}-sample.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download {type} sample template
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm">Import Type<select className="block border rounded mt-1 px-2 py-1 w-full" value={type} onChange={(e) => setType(e.target.value as CsvImportType)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="text-sm">CSV File
          <input className="block border rounded mt-1 px-2 py-1 w-full" type="file" accept=".csv,text/csv" onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setLoading(true);
            setResult(null);
            try {
              const parsed = await csvImportService.parseCsvFile(file);
              const validation = csvImportService.validateImportedRows(type, parsed);
              setRows(parsed);
              setValidRows(validation.validRows);
              setInvalidRows(validation.invalidRows.map((row) => ({ rowNumber: row.rowNumber, reason: row.reason })));
              toast.success('CSV parsed successfully.');
            } catch {
              toast.error('Unable to parse CSV file. Please check format.');
              setRows([]); setValidRows([]); setInvalidRows([]);
            } finally { setLoading(false); }
          }} />
        </label>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 text-sm"><div className="border rounded p-3">Rows parsed: <strong>{rows.length}</strong></div><div className="border rounded p-3">Rows valid: <strong>{validRows.length}</strong></div><div className="border rounded p-3">Rows invalid: <strong>{invalidRows.length}</strong></div></div>

      {result && (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm">
          <p className="font-medium text-emerald-800">Import completed.</p>
          <p>Rows added: <strong>{result.added}</strong>, updated: <strong>{result.updated}</strong>, skipped: <strong>{result.skipped}</strong>.</p>
          {result.affectedDateRange ? <p>Date range affected: <strong>{result.affectedDateRange.start}</strong> to <strong>{result.affectedDateRange.end}</strong>.</p> : null}
        </div>
      )}

      {headers.length > 0 && (
        <div className="overflow-auto border rounded">
          <table className="w-full text-sm min-w-[560px]">
            <thead><tr>{headers.map((header) => <th className="text-left p-2 border-b" key={header}>{header}</th>)}</tr></thead>
            <tbody>
              {rows.slice(0, 12).map((row, index) => {
                const invalid = invalidRows.some((x) => x.rowNumber === index + 2);
                return (
                  <tr key={index} className={`border-b last:border-b-0 ${invalid ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                    {headers.map((header) => <td className="p-2" key={`${index}-${header}`}>{row[header]}</td>)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {invalidRows.length > 0 && <div className="text-sm text-red-600 space-y-1">{invalidRows.slice(0, 6).map((row) => <p key={`${row.rowNumber}-${row.reason}`}>Row {row.rowNumber}: {row.reason}</p>)}</div>}

      <button className="border rounded px-3 py-1" disabled={loading || validRows.length === 0} onClick={async () => {
        const importResult = await csvImportService.importCsvData(type, validRows);
        if ('added' in importResult) {
          setResult(importResult);
          toast.success(`Import complete: ${importResult.added} added, ${importResult.updated} updated.`);
        } else {
          toast.success(`Import review complete: ${importResult.imported} rows staged.`);
        }
      }}>{loading ? 'Processing...' : 'Confirm Import'}</button>
    </section>
  );
};
