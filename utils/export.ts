import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Transaction } from '@/types';

export const exportTransactionsToCSV = async (transactions: Transaction[]) => {
  try {
    const header = ['Date', 'Type', 'Amount', 'Description', 'Category', 'Account'];
    const rows = transactions.map((t) => {
      return [
        t.date,
        t.type,
        t.amount,
        `"${t.description.replace(/"/g, '""')}"`, // escape quotes
        `"${t.category?.name || ''}"`,
        `"${t.payment_method?.name || ''}"`,
      ].join(',');
    });

    const csvContent = [header.join(','), ...rows].join('\n');

    const fileName = `budgetwise-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    const file = new File(Paths.document, fileName);
    file.write(csvContent);

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Transactions',
        UTI: 'public.comma-separated-values-text'
      });
    }
  } catch (error) {
    console.error('Error exporting CSV:', error);
    throw error;
  }
};
