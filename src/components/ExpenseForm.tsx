import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuid } from 'uuid';
import { db } from '../db';
import { formatCurrency, roundDinars } from '../lib/format';
import type { ExpenseItem } from '../types';

export interface ExpenseFormValues {
  merchant: string;
  date: string;
  items: ExpenseItem[];
  total: number;
  categoryId: string | null;
}

interface Props {
  initial: { merchant: string; date: string; items: ExpenseItem[]; categoryId?: string | null };
  imageUrl?: string | null;
  initialError?: string | null;
  notice?: string | null;
  saveLabel: string;
  onSave: (values: ExpenseFormValues) => void | Promise<void>;
  onCancel: () => void;
}

/** Editable merchant/date/items/category form shared by the scanner review step and the edit dialog. */
export function ExpenseForm({ initial, imageUrl, initialError, notice, saveLabel, onSave, onCancel }: Props) {
  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? [];
  const [merchant, setMerchant] = useState(initial.merchant);
  const [date, setDate] = useState(initial.date);
  const [items, setItems] = useState<ExpenseItem[]>(() =>
    initial.items.map((i) => ({ ...i, price: roundDinars(i.price) })),
  );
  const [categoryId, setCategoryId] = useState<string | null>(initial.categoryId ?? null);
  const [error, setError] = useState<string | null>(initialError ?? null);

  const total = items.reduce((sum, i) => sum + i.price, 0);

  function updateItem(id: string, patch: Partial<ExpenseItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  async function save() {
    if (items.length === 0 || total <= 0) {
      setError('Add at least one item with a price before saving.');
      return;
    }
    await onSave({ merchant: merchant.trim() || 'Receipt', date, items, total, categoryId });
  }

  return (
    <div className="review-panel">
      <div className="review-grid">
        {imageUrl && <img className="receipt-preview small" src={imageUrl} alt="Receipt" />}
        <div className="review-fields">
          <label>
            Merchant
            <input value={merchant} onChange={(e) => setMerchant(e.target.value)} />
          </label>
          <label>
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            Category
            <select value={categoryId ?? ''} onChange={(e) => setCategoryId(e.target.value || null)}>
              <option value="">Unassigned</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {notice && !error && <div className="notice-banner">{notice}</div>}
      {error && <div className="error-banner">{error}</div>}

      <table className="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Price</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <input
                  value={item.name}
                  placeholder="Item name"
                  onChange={(e) => updateItem(item.id, { name: e.target.value })}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={item.price}
                  onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                  onBlur={(e) => updateItem(item.id, { price: roundDinars(parseFloat(e.target.value) || 0) })}
                />
              </td>
              <td>
                <button
                  className="icon-btn danger"
                  onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                  aria-label="Remove item"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="ghost-btn" onClick={() => setItems((prev) => [...prev, { id: uuid(), name: '', price: 0 }])}>
        + Add item
      </button>

      <div className="review-footer">
        <div className="review-total">
          Total: <strong>{formatCurrency(total)}</strong>
        </div>
        <div className="review-actions">
          <button className="ghost-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary-btn" onClick={save}>
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
