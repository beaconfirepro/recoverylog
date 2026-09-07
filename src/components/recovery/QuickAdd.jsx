import React, { useEffect, useRef, useState } from "react";
import { TYPES, QUICK_ORDER } from "@/lib/recovery";
import { Check, Plus, X } from "lucide-react";

const LONG_PRESS_MS = 450;
const SLOP_PX = 8;

const Tile = ({ type, arranging, dragging, onClick, onRemove, innerRef, ...handlers }) => {
  const c = TYPES[type];
  const Icon = c.icon;
  return (
    <div ref={innerRef} className="relative" {...handlers}>
      <button
        type="button"
        onClick={onClick}
        tabIndex={arranging ? -1 : 0}
        className={`nb-btn w-full min-h-16 py-1.5 flex-col gap-0.5 text-[9px] leading-tight !rounded-xl ${
          arranging ? "outline outline-2 outline-dashed outline-offset-2" : ""
        } ${dragging ? "opacity-40" : ""}`}
        style={{
          backgroundColor: c.color,
          color: c.darkText ? "#1A1024" : "#fff",
          touchAction: arranging ? "none" : undefined
        }}
      >
        <Icon className="w-5 h-5" />
        <span className="px-0.5">{c.label}</span>
      </button>
      {arranging && (
        <button
          type="button"
          aria-label={`Remove ${c.label}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full border-2 border-foreground bg-background flex items-center justify-center"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

// The buttons are the app's main surface, so their order is the patient's to
// set. Hold one down, or right-click it, and the grid becomes arrangeable:
// drag to reorder, X to take one off, and the tray adds the rest back.
export default function QuickAdd({ types, onAdd, onReorder, canWrite = true }) {
  const list = types?.length ? types : QUICK_ORDER;
  const [arranging, setArranging] = useState(false);
  const [order, setOrder] = useState(list);
  const [dragIndex, setDragIndex] = useState(null);

  const tiles = useRef([]);
  const press = useRef(null);
  const drag = useRef(null);

  // A saved layout arriving from elsewhere wins, but never mid-drag.
  useEffect(() => {
    if (!arranging) setOrder(list);
  }, [list, arranging]);

  useEffect(() => () => clearTimeout(press.current?.timer), []);

  const enterArrange = () => {
    if (!canWrite) return;
    setArranging(true);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const cancelPress = () => {
    clearTimeout(press.current?.timer);
    press.current = null;
  };

  // Which slot is under the pointer, by the tiles' own boxes. Reading them live
  // keeps this correct across wrapping, orientation changes and any grid width.
  const slotAt = (x, y) => {
    for (let i = 0; i < order.length; i++) {
      const el = tiles.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i;
    }
    return -1;
  };

  const onPointerDown = (index) => (e) => {
    if (e.button === 2) return; // right-click is handled by onContextMenu
    if (arranging) {
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { pointerId: e.pointerId, index };
      setDragIndex(index);
      return;
    }
    press.current = { x: e.clientX, y: e.clientY, timer: setTimeout(enterArrange, LONG_PRESS_MS) };
  };

  const onPointerMove = (e) => {
    if (press.current) {
      const moved = Math.hypot(e.clientX - press.current.x, e.clientY - press.current.y);
      if (moved > SLOP_PX) cancelPress();
      return;
    }
    if (!drag.current || e.pointerId !== drag.current.pointerId) return;
    const from = drag.current.index;
    const over = slotAt(e.clientX, e.clientY);
    if (over === -1 || over === from) return;
    // Pull it out and drop it back in at the slot under the finger, which
    // leaves it holding exactly that index.
    setOrder((prev) => {
      const next = [...prev];
      next.splice(over, 0, next.splice(from, 1)[0]);
      return next;
    });
    drag.current.index = over;
    setDragIndex(over);
  };

  const endDrag = () => {
    cancelPress();
    drag.current = null;
    setDragIndex(null);
  };

  const remove = (type) => setOrder((prev) => prev.filter((t) => t !== type));
  const add = (type) => setOrder((prev) => [...prev, type]);

  const done = () => {
    setArranging(false);
    setDragIndex(null);
    onReorder?.(order);
  };

  const available = QUICK_ORDER.filter((t) => !order.includes(t));

  if (list.length === 0 && !arranging) {
    return (
      <p className="text-sm text-muted-foreground border-2 rounded-xl p-4 bg-card break-words">
        Nothing is selected to track. Pick what to track in Profile.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {order.map((t, i) =>
          TYPES[t] ? (
            <Tile
              key={t}
              type={t}
              arranging={arranging}
              dragging={dragIndex === i}
              innerRef={(el) => (tiles.current[i] = el)}
              onClick={() => !arranging && onAdd(t)}
              onRemove={() => remove(t)}
              onPointerDown={onPointerDown(i)}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onContextMenu={(e) => {
                e.preventDefault();
                enterArrange();
              }}
            />
          ) : null
        )}
      </div>

      {arranging && (
        <div className="nb-card p-3 space-y-3">
          <p className="text-sm font-semibold break-words">
            Drag to reorder. X takes one off. Tap one below to add it back.
          </p>

          {available.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {available.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => add(t)}
                  className="nb-btn h-9 px-2.5 text-xs flex items-center gap-1"
                  style={{ backgroundColor: TYPES[t].color, color: TYPES[t].darkText ? "#1A1024" : "#fff" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  {TYPES[t].label}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="nb-btn h-12 bg-card"
              onClick={() => {
                setOrder(list);
                setArranging(false);
                setDragIndex(null);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="nb-btn h-12 bg-primary text-primary-foreground flex items-center justify-center gap-1.5"
              onClick={done}
            >
              <Check className="w-4 h-4" />
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
