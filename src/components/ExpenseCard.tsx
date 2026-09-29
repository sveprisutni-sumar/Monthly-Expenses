import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Expense } from '../types';
import { formatCurrency } from '../lib/format';
import { db } from '../db';
import { useState } from 'react';
import { EditExpenseModal } from './EditExpenseModal';

export function ExpenseCard({ expense }: { expense: Expense }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: expense.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  const [editing, setEditing] = useState(false);

  async function removeExpense(e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm(`Delete "${expense.merchant}"?`)) {
      await db.expenses.delete(expense.id);
    }
  }

  return (
    <>
    <div ref={setNodeRef} style={style} className="expense-card" {...listeners} {...attributes} onClick={() => setEditing(true)} title="Click to edit, drag to move">
      <div className="expense-card-header">
        <span className="expense-merchant">{expense.merchant}</span>
        <button className="icon-btn danger small" onClick={removeExpense} onPointerDown={(e) => e.stopPropagation()} aria-label="Delete expense">
          ×
        </button>
      </div>
      <div className="expense-date">{expense.date}</div>
      <div className="expense-items">{expense.items.length} item{expense.items.length === 1 ? '' : 's'}</div>
      <div className="expense-total">{formatCurrency(expense.total)}</div>
    </div>
    {editing && <EditExpenseModal expense={expense} onClose={() => setEditing(false)} />}
    </>
  );
}
