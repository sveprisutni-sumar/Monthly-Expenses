import { db } from '../db';
import type { Expense } from '../types';
import { ExpenseForm, type ExpenseFormValues } from './ExpenseForm';

export function EditExpenseModal({ expense, onClose }: { expense: Expense; onClose: () => void }) {
  async function save(values: ExpenseFormValues) {
    await db.expenses.update(expense.id, { ...values });
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit receipt</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <ExpenseForm
          initial={expense}
          saveLabel="Save changes"
          onSave={save}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
