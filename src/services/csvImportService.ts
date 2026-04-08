import type { CsvImportType, CsvValidationResult, SalesImportMergeResult, SalesImportPreview } from '@/types/dashboard';
import { normalizeError } from '@/lib/errors';
import { asRecord } from '@/lib/mappers';
import { requireSupabaseClient } from '@/lib/supabase';

const splitCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') { inQuotes = !inQuotes; continue; }
    if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
    current += char;
  }
  values.push(current.trim());
  return values;
};

export const csvImportService = {
  async parseCsvFile(file: File): Promise<Record<string, string>[]> {
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const headers = splitCsvLine(lines[0]);
    return lines.slice(1).map((line) => {
      const values = splitCsvLine(line);
      return headers.reduce<Record<string, string>>((acc, header, index) => {
        acc[header] = values[index] ?? '';
        return acc;
      }, {});
    });
  },

  validateImportedRows(type: CsvImportType, rows: Record<string, string>[]): CsvValidationResult {
    const requiredColumns: Record<CsvImportType, string[]> = {
      orders: ['order_id', 'customer_name', 'total', 'status'],
      customers: ['customer_id', 'name', 'email'],
      'menu-items': ['item_name', 'category', 'price'],
      sales: ['date', 'sales_total', 'payment_method', 'status'],
    };
    const required = requiredColumns[type];
    const invalidRows: CsvValidationResult['invalidRows'] = [];
    const validRows: CsvValidationResult['validRows'] = [];
    rows.forEach((row, index) => {
      const missing = required.filter((column) => !row[column]?.trim());
      if (missing.length) return invalidRows.push({ rowNumber: index + 2, reason: `Missing required column values: ${missing.join(', ')}`, row });
      validRows.push(row);
    });
    return { validRows, invalidRows };
  },

  async previewSalesImport(rows: Record<string, string>[]): Promise<SalesImportPreview> {
    const { validRows, invalidRows } = this.validateImportedRows('sales', rows);

    return {
      validRows,
      invalidRows,
      summary: { totalRows: rows.length, validCount: validRows.length, invalidCount: invalidRows.length },
    };
  },

  async importSales(rows: Record<string, string>[]): Promise<SalesImportMergeResult> {
    const supabase = requireSupabaseClient();
    const now = new Date().toISOString();
    const { validRows, invalidRows } = this.validateImportedRows('sales', rows);

    const asImportError = (error: unknown, fallback = 'Import failed.') => normalizeError(error, { fallbackMessage: fallback });

    const findMissingColumn = (error: unknown, relation: string) => {
      const message = String(asRecord(error)?.message ?? (error instanceof Error ? error.message : ''));
      const match = message.match(new RegExp(`column \\"(?<column>[a-zA-Z0-9_]+)\\" of relation \\"${relation}\\" does not exist`, 'i'));
      return match?.groups?.column ?? null;
    };

    const insertWithFallback = async (relation: string, payload: Record<string, unknown>) => {
      let attemptPayload = { ...payload };
      let lastError: unknown = null;

      for (let attempt = 0; attempt < 6; attempt += 1) {
        const { data, error } = await supabase.from(relation).insert(attemptPayload).select('*').single();
        if (!error) return data;
        lastError = error;

        const missing = findMissingColumn(error, relation);
        if (!missing || !(missing in attemptPayload)) break;

        const { [missing]: _removed, ...next } = attemptPayload;
        attemptPayload = next;
      }

      throw lastError;
    };

    const user = await supabase.auth.getUser();
    if (user.error) throw asImportError(user.error, 'Unable to load session.');

    const batchPayload: Record<string, unknown> = {
      type: 'sales',
      total_rows: rows.length,
      valid_rows: validRows.length,
      invalid_rows: invalidRows.length,
      created_by: user.data.user?.id ?? null,
      created_at: now,
    };

    let batchRow: Record<string, unknown>;
    try {
      batchRow = (await insertWithFallback('sales_import_batches', batchPayload)) as Record<string, unknown>;
    } catch (error) {
      throw asImportError(error, 'Unable to create import batch.');
    }

    const batchId = String(batchRow.id ?? '');

    if (invalidRows.length) {
      const errorRows = invalidRows.map((row) => ({
        batch_id: batchId || null,
        row_number: row.rowNumber,
        reason: row.reason,
        raw_row: row.row,
        created_at: now,
      }));

      const { error } = await supabase.from('import_errors').insert(errorRows);
      if (error) throw asImportError(error, 'Unable to write import errors.');
    }

    if (validRows.length) {
      const salesRows = validRows.map((row) => ({
        batch_id: batchId || null,
        date: row.date,
        sales_total: Number(row.sales_total ?? 0),
        payment_method: row.payment_method,
        status: row.status,
        customer_code: row.customer_code || null,
        item_code: row.item_code || null,
        created_at: now,
      }));

      const { error } = await supabase.from('imported_sales_rows').insert(salesRows);
      if (error) throw asImportError(error, 'Unable to write imported sales rows.');
    }

    return {
      added: validRows.length,
      updated: 0,
      skipped: 0,
      affectedDateRange: validRows.length
        ? {
            start: String(validRows.reduce((min, row) => (row.date < min ? row.date : min), validRows[0].date)),
            end: String(validRows.reduce((max, row) => (row.date > max ? row.date : max), validRows[0].date)),
          }
        : undefined,
    };
  },

  async listHistory(): Promise<Array<{ id: string; type: string; totalRows: number; validRows: number; invalidRows: number; importedAt: string }>> {
    try {
      const supabase = requireSupabaseClient();
      const now = new Date().toISOString();
      const { data, error } = await supabase.from('sales_import_batches').select('*').order('created_at', { ascending: false });
      if (error) return [];

      return (Array.isArray(data) ? data : []).map((row) => ({
        id: String((row as { id?: unknown }).id ?? ''),
        type: String((row as { type?: unknown }).type ?? 'sales'),
        totalRows: Number((row as { total_rows?: unknown; totalRows?: unknown }).total_rows ?? (row as { totalRows?: unknown }).totalRows ?? 0),
        validRows: Number((row as { valid_rows?: unknown; validRows?: unknown }).valid_rows ?? (row as { validRows?: unknown }).validRows ?? 0),
        invalidRows: Number((row as { invalid_rows?: unknown; invalidRows?: unknown }).invalid_rows ?? (row as { invalidRows?: unknown }).invalidRows ?? 0),
        importedAt: String(
          (row as { created_at?: unknown; imported_at?: unknown; importedAt?: unknown }).created_at
            ?? (row as { imported_at?: unknown }).imported_at
            ?? (row as { importedAt?: unknown }).importedAt
            ?? now,
        ),
      }));
    } catch {
      return [];
    }
  },
};
