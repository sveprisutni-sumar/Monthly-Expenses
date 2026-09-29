import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, ensureSeedData } from './db';
import { monthKey as currentMonthKey, isInMonth, monthLabel } from './lib/format';
import { pickXlsxSaveTarget, writeToTarget } from './lib/saveFile';
import { MonthSelector } from './components/MonthSelector';
import { SummaryPanel } from './components/SummaryPanel';
import { ExpenseBoard } from './components/ExpenseBoard';
import { ReceiptScanner } from './components/ReceiptScanner';
import { ManualExpense } from './components/ManualExpense';
import { CategoryManager } from './components/CategoryManager';

type Tab = 'board' | 'scan' | 'manual';

function App() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>('board');
  const [monthKey, setMonthKey] = useState(currentMonthKey(new Date()));
  const [showCategories, setShowCategories] = useState(false);
  const [exporting, setExporting] = useState(false);

  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? [];
  const monthExpenses =
    useLiveQuery(() => db.expenses.filter((e) => isInMonth(e.date, monthKey)).toArray(), [monthKey]) ?? [];

  useEffect(() => {
    ensureSeedData().then(() => setReady(true));
  }, []);

  if (!ready) return null;

  async function handleExport() {
    // Open the Save As dialog first: browsers only allow it right after the click.
    const target = await pickXlsxSaveTarget(`expenses-${monthLabel(monthKey).replace(/\s+/g, '-')}.xlsx`);
    if (!target) return;
    setExporting(true);
    try {
      const { buildMonthXlsx } = await import('./lib/exportXlsx');
      await writeToTarget(target, await buildMonthXlsx(monthExpenses, categories));
    } catch (err) {
      alert(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Monthly Expenses</h1>
        <MonthSelector monthKey={monthKey} onChange={setMonthKey} />
      </header>

      <nav className="tab-bar">
        <button className={`tab-btn ${tab === 'board' ? 'active' : ''}`} onClick={() => setTab('board')}>
          Board
        </button>
        <button className={`tab-btn ${tab === 'scan' ? 'active' : ''}`} onClick={() => setTab('scan')}>
          Scan Receipt
        </button>
        <button className={`tab-btn ${tab === 'manual' ? 'active' : ''}`} onClick={() => setTab('manual')}>
          Add Manually
        </button>
        <button
          className="tab-btn secondary"
          onClick={handleExport}
          disabled={exporting || monthExpenses.length === 0}
        >
          {exporting ? 'Exporting…' : 'Export XLSX…'}
        </button>
        <button className="tab-btn" onClick={() => setShowCategories(true)}>
          Manage Categories
        </button>
      </nav>

      <main className="app-main">
        {tab === 'board' && (
          <>
            <SummaryPanel monthKey={monthKey} />
            <ExpenseBoard monthKey={monthKey} />
          </>
        )}
        {tab === 'scan' && <ReceiptScanner onSaved={() => setTab('board')} />}
        {tab === 'manual' && <ManualExpense onDone={() => setTab('board')} />}
      </main>

      {showCategories && <CategoryManager onClose={() => setShowCategories(false)} />}
    </div>
  );
}

export default App;
