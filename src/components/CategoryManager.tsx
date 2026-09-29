import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

const PALETTE = [
  '#2f9e44', '#e8590c', '#1971c2', '#9c36b5',
  '#e03131', '#f08c00', '#0c8599', '#5c940d',
  '#c2255c', '#495057',
];

export function CategoryManager({ onClose }: { onClose: () => void }) {
  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? [];
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await db.categories.add({ id: uuid(), name: trimmed, color });
    setName('');
    setColor(PALETTE[(categories.length + 1) % PALETTE.length]);
  }

  async function removeCategory(id: string) {
    await db.transaction('rw', db.categories, db.expenses, async () => {
      await db.categories.delete(id);
      const affected = await db.expenses.where('categoryId').equals(id).toArray();
      await Promise.all(affected.map((e) => db.expenses.update(e.id, { categoryId: null })));
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Categories</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form className="category-form" onSubmit={addCategory}>
          <input
            type="text"
            placeholder="New category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="swatch-row">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                className="swatch"
                style={{ background: c, outline: c === color ? '2px solid #111' : 'none' }}
                onClick={() => setColor(c)}
                aria-label={`Choose color ${c}`}
              />
            ))}
          </div>
          <button type="submit" className="primary-btn">
            Add category
          </button>
        </form>

        <ul className="category-list">
          {categories.map((c) => (
            <li key={c.id} className="category-list-item">
              <span className="dot" style={{ background: c.color }} />
              <span className="category-name">{c.name}</span>
              <button className="icon-btn danger" onClick={() => removeCategory(c.id)} aria-label={`Delete ${c.name}`}>
                🗑
              </button>
            </li>
          ))}
          {categories.length === 0 && <li className="empty-hint">No categories yet.</li>}
        </ul>
      </div>
    </div>
  );
}
