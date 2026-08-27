export type CsvValue = string | number | boolean | null | undefined;

function protectSpreadsheetFormula(value: string) {
  return /^[=+\-@]/.test(value.trimStart()) ? `'${value}` : value;
}

function escapeCsvValue(value: CsvValue) {
  if (value === null || value === undefined) return '';

  const normalized = protectSpreadsheetFormula(String(value));
  return /[",\n\r]/.test(normalized) ? `"${normalized.replaceAll('"', '""')}"` : normalized;
}

export function buildCsv(headers: string[], rows: CsvValue[][]) {
  const normalizedRows = rows.map((row) => headers.map((_, index) => row[index] ?? ''));
  return [headers, ...normalizedRows].map((row) => row.map(escapeCsvValue).join(',')).join('\r\n');
}

export function downloadCsv(filename: string, headers: string[], rows: CsvValue[][]) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  const csv = `\uFEFF${buildCsv(headers, rows)}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return true;
}
