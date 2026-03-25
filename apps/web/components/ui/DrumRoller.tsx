'use client';
import { useRef, useEffect, useCallback } from 'react';

const ITEM_HEIGHT = 44;
const VISIBLE = 3; // items shown above + center + below

interface Props {
  items: (string | number)[];
  value: number | string;
  onChange: (value: number | string) => void;
  width?: string;
  label?: string;
}

export default function DrumRoller({ items, value, onChange, width = '100%', label }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const currentIndex = items.indexOf(value);

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: index * ITEM_HEIGHT, behavior });
  }, []);

  // On mount: scroll to initial value instantly
  useEffect(() => {
    const index = items.indexOf(value);
    if (index >= 0) scrollToIndex(index, 'instant' as ScrollBehavior);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    isScrollingRef.current = true;
    timeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      const index = Math.round(el.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(items.length - 1, index));
      scrollToIndex(clamped);
      onChange(items[clamped]);
    }, 80);
  };

  const containerHeight = ITEM_HEIGHT * (VISIBLE * 2 - 1); // 5 items visible

  return (
    <div style={{ width, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {label && (
        <span style={{ fontSize: 11, color: '#475569', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {label}
        </span>
      )}
      <div style={{ position: 'relative', width: '100%' }}>
        {/* Selection highlight */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            height: ITEM_HEIGHT,
            background: 'rgba(0, 150, 255, 0.1)',
            border: '1px solid rgba(0, 150, 255, 0.25)',
            borderRadius: 10,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        {/* Top fade */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: ITEM_HEIGHT * 2,
            background: 'linear-gradient(to bottom, #0f172a 0%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        {/* Bottom fade */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: ITEM_HEIGHT * 2,
            background: 'linear-gradient(to top, #0f172a 0%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        <div
          ref={containerRef}
          onScroll={handleScroll}
          style={{
            height: containerHeight,
            overflowY: 'scroll',
            scrollSnapType: 'y mandatory',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
          // hide scrollbar in webkit
          className="drum-roller-scroll"
        >
          {/* Padding so first/last items can center */}
          <div style={{ height: ITEM_HEIGHT * 2 }} />
          {items.map((item, i) => (
            <div
              key={item}
              style={{
                height: ITEM_HEIGHT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                scrollSnapAlign: 'center',
                fontSize: i === currentIndex ? 22 : 17,
                fontWeight: i === currentIndex ? 700 : 400,
                color: i === currentIndex ? '#f1f5f9' : '#475569',
                transition: 'font-size 0.15s, color 0.15s',
                cursor: 'pointer',
                userSelect: 'none',
              }}
              onClick={() => {
                scrollToIndex(i);
                onChange(item);
              }}
            >
              {item}
            </div>
          ))}
          <div style={{ height: ITEM_HEIGHT * 2 }} />
        </div>
      </div>
    </div>
  );
}
