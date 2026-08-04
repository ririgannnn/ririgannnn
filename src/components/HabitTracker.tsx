import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../stores';
import { Flame, Plus, Trash2, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Habit, HabitRecord } from '../types';

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getYearRange(year: number): string[] {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(formatDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function getMonthRange(year: number, month: number): string[] {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(formatDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

// Get streak length: max consecutive days ending on or before date
function getStreak(records: HabitRecord[], habitId: string, date: string): number {
  const recordSet = new Set(records.filter((r) => r.habitId === habitId).map((r) => r.date));
  const d = new Date(date + 'T00:00:00');
  let streak = 0;
  const cursor = new Date(d);
  while (recordSet.has(formatDate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
    if (cursor.getFullYear() < 2020) break;
  }
  return streak;
}

function getHeatColor(streak: number, habitColor: string): string {
  if (streak === 0) return 'transparent';
  if (streak <= 3) {
    return `${habitColor}20`;
  }
  if (streak <= 7) {
    return `${habitColor}45`;
  }
  if (streak <= 14) {
    return `${habitColor}70`;
  }
  if (streak <= 30) {
    return `${habitColor}99`;
  }
  return `${habitColor}`;
}

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];
const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export default function HabitTracker() {
  const {
    habits, habitRecords,
    addHabit, updateHabit, deleteHabit, toggleHabitRecord,
  } = useStore();

  const today = new Date();
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [newName, setNewName] = useState('');
  const [editingHabit, setEditingHabit] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [hoveredCell, setHoveredCell] = useState<{ habitId: string; date: string } | null>(null);
  const editRef = useRef<HTMLInputElement>(null);

  // Focus input when editing
  useEffect(() => {
    if (editingHabit && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editingHabit]);

  // Scroll to today on month view
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (viewMode === 'month' && scrollRef.current) {
      const todayCol = scrollRef.current.querySelector('[data-today="true"]');
      if (todayCol) {
        todayCol.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [viewMode, viewMonth, viewYear]);

  const dates = useMemo(() => {
    if (viewMode === 'month') return getMonthRange(viewYear, viewMonth);
    return getYearRange(viewYear);
  }, [viewMode, viewYear, viewMonth]);

  const recordSet = useMemo(() => {
    const set = new Set<string>();
    habitRecords.forEach((r) => set.add(`${r.habitId}:${r.date}`));
    return set;
  }, [habitRecords]);

  const handleAdd = useCallback(() => {
    const name = newName.trim();
    if (!name) return;
    addHabit({ name });
    setNewName('');
  }, [newName, addHabit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (editingHabit) {
        const name = editingName.trim();
        if (name) {
          updateHabit(editingHabit, { name });
        }
        setEditingHabit(null);
      } else {
        handleAdd();
      }
    }
    if (e.key === 'Escape') {
      setEditingHabit(null);
    }
  }, [editingHabit, editingName, updateHabit, handleAdd]);

  const currentStreaks = useMemo(() => {
    const todayStr = formatDate(today);
    return habits.map((h) => ({
      habitId: h.id,
      streak: getStreak(habitRecords, h.id, todayStr),
    }));
  }, [habits, habitRecords, today]);

  // Navigation
  const goPrev = () => {
    if (viewMode === 'month') {
      if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
      else setViewMonth(viewMonth - 1);
    } else {
      setViewYear(viewYear - 1);
    }
  };

  const goNext = () => {
    if (viewMode === 'month') {
      if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
      else setViewMonth(viewMonth + 1);
    } else {
      setViewYear(viewYear + 1);
    }
  };

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Flame size={20} style={{ color: 'var(--accent-coral)' }} />
          <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--kon-dark)' }}>
            习惯打卡
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-warm-glass)', color: 'var(--text-dim)' }}>
            {habits.length} 个习惯
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="text-xs px-3 py-1 rounded-full transition-colors hover:bg-black/5"
            style={{ color: 'var(--text-dim)', border: '1px solid var(--line)' }}
          >
            今天
          </button>
          <button onClick={goPrev} className="p-1 rounded hover:bg-black/5" style={{ color: 'var(--text-mid)' }}>
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium min-w-[80px] text-center" style={{ color: 'var(--text-mid)' }}>
            {viewMode === 'month'
              ? `${viewYear}年 ${viewMonth + 1}月`
              : `${viewYear}年`}
          </span>
          <button onClick={goNext} className="p-1 rounded hover:bg-black/5" style={{ color: 'var(--text-mid)' }}>
            <ChevronRight size={16} />
          </button>
          <div className="flex rounded-lg overflow-hidden ml-2" style={{ border: '1px solid var(--line)' }}>
            <button
              onClick={() => setViewMode('month')}
              className="text-xs px-2.5 py-1 transition-colors"
              style={{
                background: viewMode === 'month' ? 'rgba(153, 167, 188, 0.15)' : 'transparent',
                color: viewMode === 'month' ? 'var(--kon-dark)' : 'var(--text-dim)',
              }}
            >
              月
            </button>
            <button
              onClick={() => setViewMode('year')}
              className="text-xs px-2.5 py-1 transition-colors"
              style={{
                background: viewMode === 'year' ? 'rgba(153, 167, 188, 0.15)' : 'transparent',
                color: viewMode === 'year' ? 'var(--kon-dark)' : 'var(--text-dim)',
              }}
            >
              年
            </button>
          </div>
        </div>
      </div>

      {/* Add habit input */}
      <div className="flex items-center gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="+ 新建习惯，如「每天运动」「早睡早起」..."
          className="flex-1 px-3 py-2 text-sm rounded-lg outline-none transition-all"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--line)',
            color: 'var(--text-mid)',
          }}
        />
        <button
          onClick={handleAdd}
          disabled={!newName.trim()}
          className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: newName.trim() ? 'var(--accent-coral)' : 'var(--line)',
            color: newName.trim() ? '#fff' : 'var(--text-dim)',
          }}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Empty state */}
      {habits.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-xl"
          style={{ background: 'var(--bg-surface)', border: '1px dashed var(--line)' }}
        >
          <Flame size={40} style={{ color: 'var(--text-dim)', opacity: 0.3 }} />
          <p className="mt-3 text-sm" style={{ color: 'var(--text-dim)' }}>还没有习惯，点击上方创建第一个</p>
        </div>
      )}

      {habits.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--line)', background: 'var(--bg-surface)' }}
        >
          {/* Heatmap grid */}
          <div className="overflow-x-auto" ref={scrollRef}>
            <div className="inline-flex min-w-full">
              {/* Habit names column */}
              <div className="shrink-0" style={{ minWidth: 140 }}>
                {/* Header row */}
                <div className="h-10 flex items-center px-3" style={{ borderBottom: '1px solid var(--line)' }}>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>习惯</span>
                </div>
                {/* Habit rows */}
                {habits.map((habit) => {
                  const streak = currentStreaks.find((s) => s.habitId === habit.id)?.streak || 0;
                  const isEditing = editingHabit === habit.id;
                  return (
                    <div
                      key={habit.id}
                      className="flex items-center gap-2 px-3 h-8 group"
                      style={{ borderBottom: '1px solid var(--line)' }}
                    >
                      {/* Color dot */}
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: habit.color }}
                      />
                      {/* Name */}
                      {isEditing ? (
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <input
                            ref={editRef}
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={() => {
                              const n = editingName.trim();
                              if (n) updateHabit(habit.id, { name: n });
                              setEditingHabit(null);
                            }}
                            className="flex-1 text-xs px-1 py-0.5 rounded outline-none min-w-0"
                            style={{ border: '1px solid var(--accent-coral)', background: 'var(--bg-surface)' }}
                          />
                          <button onClick={() => {
                            const n = editingName.trim();
                            if (n) updateHabit(habit.id, { name: n });
                            setEditingHabit(null);
                          }} className="shrink-0">
                            <Check size={12} style={{ color: 'var(--ok)' }} />
                          </button>
                          <button onClick={() => setEditingHabit(null)} className="shrink-0">
                            <X size={12} style={{ color: 'var(--text-dim)' }} />
                          </button>
                        </div>
                      ) : (
                        <span
                          className="text-xs truncate flex-1 cursor-pointer"
                          style={{ color: 'var(--text-mid)' }}
                          onDoubleClick={() => { setEditingHabit(habit.id); setEditingName(habit.name); }}
                          title="双击编辑"
                        >
                          {habit.name}
                        </span>
                      )}
                      {/* Streak badge */}
                      <span
                        className="text-[10px] font-semibold shrink-0 px-1.5 py-0.5 rounded"
                        style={{
                          background: streak > 0 ? `${habit.color}20` : 'transparent',
                          color: streak > 0 ? habit.color : 'var(--text-dim)',
                        }}
                      >
                        {streak > 0 ? `${streak}天` : '-'}
                      </span>
                      {/* Delete */}
                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/5"
                        style={{ color: 'var(--text-dim)' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Date cells */}
              <div className="flex-1 min-w-0">
                {/* Date header */}
                <div className="flex h-10" style={{ borderBottom: '1px solid var(--line)' }}>
                  {dates.map((date) => {
                    const d = new Date(date + 'T00:00:00');
                    const isToday = date === formatDate(today);
                    const dayLabel = viewMode === 'year'
                      ? `${d.getMonth() + 1}/${d.getDate()}`
                      : `${d.getDate()}`;
                    return (
                      <div
                        key={date}
                        className="flex items-center justify-center"
                        style={{ width: viewMode === 'year' ? `${100 / dates.length}%` : 28, minWidth: viewMode === 'year' ? 0 : 28 }}
                      >
                        <span
                          className="text-[10px]"
                          style={{
                            color: isToday ? 'var(--accent-coral)' : 'var(--text-dim)',
                            fontWeight: isToday ? 700 : 400,
                          }}
                        >
                          {dayLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Heatmap cells */}
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    className="flex"
                    style={{
                      height: 32,
                      borderBottom: '1px solid var(--line)',
                    }}
                  >
                    {dates.map((date) => {
                      const isChecked = recordSet.has(`${habit.id}:${date}`);
                      const todayStr = formatDate(today);
                      const isFuture = date > todayStr;
                      const isToday = date === todayStr;
                      const streak = isChecked ? getStreak(habitRecords, habit.id, date) : 0;
                      const isHovered = hoveredCell?.habitId === habit.id && hoveredCell?.date === date;

                      return (
                        <div
                          key={date}
                          data-today={isToday ? 'true' : undefined}
                          className="flex items-center justify-center cursor-pointer transition-all hover:scale-110"
                          style={{
                            width: viewMode === 'year' ? `${100 / dates.length}%` : 28,
                            minWidth: viewMode === 'year' ? 0 : 28,
                            position: 'relative',
                          }}
                          onClick={() => {
                            if (!isFuture) toggleHabitRecord(habit.id, date);
                          }}
                          onMouseEnter={() => setHoveredCell({ habitId: habit.id, date })}
                          onMouseLeave={() => setHoveredCell(null)}
                          title={`${habit.name} · ${date}${isChecked ? ` · 连续 ${streak} 天` : ''}`}
                        >
                          <div
                            className="rounded-sm transition-all"
                            style={{
                              width: viewMode === 'year' ? '80%' : 18,
                              height: viewMode === 'year' ? '80%' : 18,
                              background: isFuture
                                ? 'transparent'
                                : isChecked
                                  ? getHeatColor(streak, habit.color)
                                  : 'rgba(0,0,0,0.04)',
                              border: isToday ? `1.5px solid ${habit.color}` : '1px solid transparent',
                              boxShadow: isHovered && !isFuture ? `0 0 6px ${habit.color}40` : 'none',
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      {habits.length > 0 && (
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-dim)' }}>
          <span>图例：</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid var(--line)' }} />
            <span>无</span>
          </div>
          {[1, 4, 8, 15].map((level, i) => (
            <div key={level} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ background: getHeatColor(level, '#99a7bc') }} />
              <span>{level}天</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
