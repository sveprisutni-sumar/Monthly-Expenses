import Dexie, { type Table } from 'dexie';
import type { Category, Expense } from './types';

class ExpenseDB extends Dexie {
  categories!: Table<Category, string>;
  expenses!: Table<Expense, string>;

  constructor() {
    super('monthly-expenses');
    this.version(1).stores({
      categories: 'id, name',
      expenses: 'id, categoryId, date',
    });

    // Merge the "Household" category into "Groceries" (renamed "Groceries & Household").
    this.version(2)
      .stores({
        categories: 'id, name',
        expenses: 'id, categoryId, date',
      })
      .upgrade(async (tx) => {
        const categories = tx.table<Category, string>('categories');
        const expenses = tx.table<Expense, string>('expenses');

        const household = await categories.get('household');
        if (household) {
          await expenses.where('categoryId').equals('household').modify({ categoryId: 'groceries' });
          await categories.delete('household');
        }

        const groceries = await categories.get('groceries');
        if (groceries) {
          await categories.update('groceries', { name: 'Groceries & Household' });
        }
      });

    // Receipt photos are no longer kept: strip any stored images to free space.
    this.version(3)
      .stores({
        categories: 'id, name',
        expenses: 'id, categoryId, date',
      })
      .upgrade((tx) =>
        tx
          .table('expenses')
          .toCollection()
          .modify((e: Record<string, unknown>) => {
            delete e.receiptImage;
          }),
      );
  }
}

export const db = new ExpenseDB();

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'groceries', name: 'Groceries & Household', color: '#2f9e44' },
  { id: 'dining', name: 'Dining Out', color: '#e8590c' },
  { id: 'transport', name: 'Transport', color: '#1971c2' },
];

export async function ensureSeedData() {
  const count = await db.categories.count();
  if (count === 0) {
    await db.categories.bulkPut(DEFAULT_CATEGORIES);
  }
}
