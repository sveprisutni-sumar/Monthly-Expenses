export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface ExpenseItem {
  id: string;
  name: string;
  price: number;
}

export interface Expense {
  id: string;
  merchant: string;
  date: string; // ISO date, yyyy-MM-dd
  items: ExpenseItem[];
  total: number;
  categoryId: string | null;
  createdAt: number;
}
