import ExcelJS from 'exceljs';
import type { Category, Expense } from '../types';
import { monthLabel } from './format';

const CURRENCY_FMT = '#,##0 "RSD"';

function categoryName(categories: Category[], id: string | null): string {
  if (!id) return 'Unassigned';
  return categories.find((c) => c.id === id)?.name ?? 'Unassigned';
}

export async function exportMonthToXlsx(monthKey: string, expenses: Expense[], categories: Category[]) {
  const wb = new ExcelJS.Workbook();
  wb.created = new Date();

  const summarySheet = wb.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Category', key: 'category', width: 28 },
    { header: 'Total (RSD)', key: 'total', width: 16, style: { numFmt: CURRENCY_FMT } },
  ];
  const totalsByCategory = new Map<string, number>();
  for (const e of expenses) {
    const key = categoryName(categories, e.categoryId);
    totalsByCategory.set(key, (totalsByCategory.get(key) ?? 0) + e.total);
  }
  for (const [category, total] of [...totalsByCategory.entries()].sort((a, b) => b[1] - a[1])) {
    summarySheet.addRow({ category, total });
  }
  const grandTotal = expenses.reduce((sum, e) => sum + e.total, 0);
  summarySheet.addRow({});
  const totalRow = summarySheet.addRow({ category: 'Grand total', total: grandTotal });
  totalRow.font = { bold: true };
  summarySheet.getRow(1).font = { bold: true };

  const expensesSheet = wb.addWorksheet('Expenses');
  expensesSheet.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Merchant', key: 'merchant', width: 28 },
    { header: 'Category', key: 'category', width: 24 },
    { header: 'Items', key: 'items', width: 8 },
    { header: 'Total (RSD)', key: 'total', width: 16, style: { numFmt: CURRENCY_FMT } },
  ];
  expensesSheet.getRow(1).font = { bold: true };
  for (const e of [...expenses].sort((a, b) => a.date.localeCompare(b.date))) {
    expensesSheet.addRow({
      date: e.date,
      merchant: e.merchant,
      category: categoryName(categories, e.categoryId),
      items: e.items.length,
      total: e.total,
    });
  }

  const itemsSheet = wb.addWorksheet('Items');
  itemsSheet.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Merchant', key: 'merchant', width: 28 },
    { header: 'Category', key: 'category', width: 24 },
    { header: 'Item', key: 'item', width: 32 },
    { header: 'Price (RSD)', key: 'price', width: 16, style: { numFmt: CURRENCY_FMT } },
  ];
  itemsSheet.getRow(1).font = { bold: true };
  for (const e of [...expenses].sort((a, b) => a.date.localeCompare(b.date))) {
    const category = categoryName(categories, e.categoryId);
    for (const item of e.items) {
      itemsSheet.addRow({ date: e.date, merchant: e.merchant, category, item: item.name, price: item.price });
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `expenses-${monthLabel(monthKey).replace(/\s+/g, '-')}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
