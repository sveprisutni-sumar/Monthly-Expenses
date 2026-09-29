import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { isInMonth } from '../lib/format';
import { CategoryColumn } from './CategoryColumn';

const UNASSIGNED_ID = 'unassigned';

export function ExpenseBoard({ monthKey }: { monthKey: string }) {
  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? [];
  const monthExpenses =
    useLiveQuery(
      () => db.expenses.filter((e) => isInMonth(e.date, monthKey)).toArray(),
      [monthKey],
    ) ?? [];

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const expenseId = active.id as string;
    const targetId = over.id as string;
    const categoryId = targetId === UNASSIGNED_ID ? null : targetId;
    await db.expenses.update(expenseId, { categoryId });
  }

  const unassigned = monthExpenses.filter((e) => !e.categoryId);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="board">
        <CategoryColumn id={UNASSIGNED_ID} title="Unassigned" color="#868e96" expenses={unassigned} />
        {categories.map((c) => (
          <CategoryColumn
            key={c.id}
            id={c.id}
            title={c.name}
            color={c.color}
            expenses={monthExpenses.filter((e) => e.categoryId === c.id)}
          />
        ))}
      </div>
    </DndContext>
  );
}
