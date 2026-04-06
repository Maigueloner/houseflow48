import type { Transaction, Account, Category } from '@/components/dashboard/ExportTransactionsButton';

/**
 * Escapes a single CSV field value per RFC 4180 rules.
 * Wraps in double quotes if it contains commas, double quotes, or line breaks.
 * Doubles internal double quotes.
 */
function escapeCsvField(value: string): string {
  const needsQuotes = /[, "\n\r]/.test(value);
  if (needsQuotes) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportTransactionsCsv(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  month: string
) {
  // 1. Definition of the header row
  const header = ['date', 'description', 'amount', 'currency', 'type', 'category', 'account'];
  
  // 2. Mapping transactions to CSV rows
  const rows = transactions.map((t) => {
    // Lookups
    const cat = categories.find((c) => c.id === t.category_id);
    const catName = cat?.name ?? t.category ?? 'Uncategorized';
    
    const acc = accounts.find((a) => a.id === t.account_id);
    const accName = acc?.name ?? '';

    // Field collection (ordered according to header)
    const fields = [
      t.transaction_date,
      t.description ?? '',
      Number(t.amount || 0).toFixed(2),
      t.currency ?? 'EUR',
      t.type,
      catName,
      accName
    ];

    // Escaping each field individually
    return fields.map(escapeCsvField).join(',');
  });

  // 3. Constructing the final CSV content
  // Header row + data rows, separated by newlines
  const csvString = [header.join(','), ...rows].join('\n');

  // 4. File generation and download
  // Prepend UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.setAttribute('download', `houseflow48-transactions-${month}.csv`);
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
