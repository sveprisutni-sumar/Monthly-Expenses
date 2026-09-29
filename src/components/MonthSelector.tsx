import { monthLabel } from '../lib/format';

interface Props {
  monthKey: string;
  onChange: (key: string) => void;
}

function shiftMonth(key: string, delta: number): string {
  const [year, month] = key.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function MonthSelector({ monthKey, onChange }: Props) {
  return (
    <div className="month-selector">
      <button className="icon-btn" onClick={() => onChange(shiftMonth(monthKey, -1))} aria-label="Previous month">
        ‹
      </button>
      <span className="month-label">{monthLabel(monthKey)}</span>
      <button className="icon-btn" onClick={() => onChange(shiftMonth(monthKey, 1))} aria-label="Next month">
        ›
      </button>
    </div>
  );
}
