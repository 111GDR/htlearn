import { useState } from "react";

/**
 * Native HTML5 drag-and-drop reorder for a list. No external deps.
 *
 * Two ways to wire it:
 *   • `handlers(i)`  — spread on the whole row (simple lists without inputs).
 *   • `dropZone(i)` + `dragHandle(i)` — split for rows that contain inputs:
 *       put `dropZone` on the row, `dragHandle` on the grip icon.
 */
export function useDragReorder<T>(items: T[], onChange: (next: T[]) => void) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const reset = () => {
    setDragging(null);
    setOver(null);
  };

  const move = (from: number, to: number) => {
    if (from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const dragHandle = (index: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      setDragging(index);
      e.dataTransfer.effectAllowed = "move";
      try {
        e.dataTransfer.setData("text/plain", String(index));
      } catch {
        /* ignore */
      }
    },
    onDragEnd: reset,
  });

  const dropZone = (index: number) => ({
    onDragOver: (e: React.DragEvent) => {
      if (dragging === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (over !== index) setOver(index);
    },
    onDragLeave: () =>
      setOver((o) => (o === index ? null : o)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (dragging === null) {
        reset();
        return;
      }
      move(dragging, index);
      reset();
    },
  });

  const handlers = (index: number) => ({
    ...dragHandle(index),
    ...dropZone(index),
  });

  return { handlers, dragHandle, dropZone, dragging, over };
}
