import { v4 as uuid } from 'uuid';
import { db } from '../db';
import { ExpenseForm, type ExpenseFormValues } from './ExpenseForm';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Entry for purchases without a receipt (markets, fairs, cash payments). */
export function ManualExpense({ onDone }: { onDone: () => void }) {
  async function save(values: ExpenseFormValues) {
    await db.expenses.add({ id: uuid(), ...values, createdAt: Date.now() });
    onDone();
  }

  return (
    <div className="scanner">
      <h2 className="panel-title">Add an expense without a receipt</h2>
      <ExpenseForm
        initial={{ merchant: '', date: todayIso(), items: [{ id: uuid(), name: '', price: 0 }], categoryId: null }}
        merchantPlaceholder="Where did you buy it? (e.g. Sajam, pijaca)"
        saveLabel="Save expense"
        onSave={save}
        onCancel={onDone}
      />
    </div>
  );
}
