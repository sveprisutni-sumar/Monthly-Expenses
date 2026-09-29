import { useDroppable } from '@dnd-kit/core';
import type { Expense } from '../types';
import { ExpenseCard } from './ExpenseCard';
import { formatCurrency } from '../lib/format';

interface Props {
  id: string;
  title: string;
  color: string;
  expenses: Expense[];
}

export function CategoryColumn({ id, title, color, expenses }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const total = expenses.reduce((sum, e) => sum + e.total, 0);

  return (
    <div className={`category-column ${isOver ? 'drag-over' : ''}`} ref={setNodeRef}>
      <div className="category-column-header">
        <span className="dot" style={{ background: color }} />
        <span className="category-column-title">{title}</span>
        <span className="category-column-total">{formatCurrency(total)}</span>
      </div>
      <div className="category-column-body">
        {expenses.length === 0 && <div className="empty-hint">Drop expenses here</div>}
        {expenses.map((e) => (
          <ExpenseCard key={e.id} expense={e} />
        ))}
      </div>
    </div>
  );
}
