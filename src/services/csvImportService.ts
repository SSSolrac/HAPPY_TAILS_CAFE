import type { CsvImportType, CsvValidationResult } from '@/types/dashboard';

const splitCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }
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
    };

    const required = requiredColumns[type];
    const invalidRows: CsvValidationResult['invalidRows'] = [];
    const validRows: CsvValidationResult['validRows'] = [];

    rows.forEach((row, index) => {
      const missing = required.filter((column) => !row[column]?.trim());
      if (missing.length) {
        invalidRows.push({
          rowNumber: index + 2,
          reason: `Missing required column values: ${missing.join(', ')}`,
          row,
        });
        return;
      }
      validRows.push(row);
    });

    return { validRows, invalidRows };
  },

  async importCsvData(type: CsvImportType, rows: Record<string, string>[]): Promise<{ imported: number }> {
    const response = await fetch('/api/imports/csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ type, rows }),
    });

    if (!response.ok) throw new Error('CSV import failed');
    return response.json() as Promise<{ imported: number }>;
  },
};
