import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { isInMonth, formatCurrency } from '../lib/format';

export function SummaryPanel({ monthKey }: { monthKey: string }) {
  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? [];
  const monthExpenses =
    useLiveQuery(() => db.expenses.filter((e) => isInMonth(e.date, monthKey)).toArray(), [monthKey]) ?? [];

  const grandTotal = monthExpenses.reduce((sum, e) => sum + e.total, 0);

  const rows = categories
    .map((c) => ({
      ...c,
      total: monthExpenses.filter((e) => e.categoryId === c.id).reduce((sum, e) => sum + e.total, 0),
    }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);

  const unassignedTotal = monthExpenses.filter((e) => !e.categoryId).reduce((sum, e) => sum + e.total, 0);

  return (
    <div className="summary-panel">
      <div className="summary-total">
        <span>Total this month</span>
        <strong>{formatCurrency(grandTotal)}</strong>
      </div>
      <div className="summary-bars">
        {rows.map((r) => (
          <div className="summary-row" key={r.id}>
            <div className="summary-row-label">
              <span className="dot" style={{ background: r.color }} />
              {r.name}
            </div>
            <div className="summary-bar-track">
              <div
                className="summary-bar-fill"
                style={{
                  width: grandTotal > 0 ? `${(r.total / grandTotal) * 100}%` : '0%',
                  background: r.color,
                }}
              />
            </div>
            <div className="summary-row-value">{formatCurrency(r.total)}</div>
          </div>
        ))}
        {unassignedTotal > 0 && (
          <div className="summary-row">
            <div className="summary-row-label">
              <span className="dot" style={{ background: '#868e96' }} />
              Unassigned
            </div>
            <div className="summary-bar-track">
              <div
                className="summary-bar-fill"
                style={{
                  width: grandTotal > 0 ? `${(unassignedTotal / grandTotal) * 100}%` : '0%',
                  background: '#868e96',
                }}
              />
            </div>
            <div className="summary-row-value">{formatCurrency(unassignedTotal)}</div>
          </div>
        )}
        {rows.length === 0 && unassignedTotal === 0 && <div className="empty-hint">No expenses this month yet.</div>}
      </div>
    </div>
  );
}
