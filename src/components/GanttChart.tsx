import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from '../stores';
import type { Task } from '../types';

const DAY_WIDTH = 28;
const ROW_HEIGHT = 38;
const HEADER_H = 56;
const PANEL_W = 250;

/* ── Tree helpers ── */

interface GanttNode {
  task: Task;
  children: GanttNode[];
  depth: number;
}

function buildGanttTree(tasks: Task[], parentId: string | null = null, depth = 0): GanttNode[] {
  return tasks
    .filter((t) => (parentId === null ? !t.parentId : t.parentId === parentId))
    .map((t) => ({ task: t, children: buildGanttTree(tasks, t.id, depth + 1), depth }));
}

function flattenTree(nodes: GanttNode[], expandedIds: Set<string>): GanttNode[] {
  const result: GanttNode[] = [];
  const walk = (items: GanttNode[]) => {
    for (const n of items) {
      result.push(n);
      if (expandedIds.has(n.task.id) && n.children.length) walk(n.children);
    }
  };
  walk(nodes);
  return result;
}

/* ── Date helpers ── */

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDateFull(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${weekDays[d.getDay()]}`;
}

/* ── Bar helpers ── */

function getBarColor(task: Task): { bg: string; border: string; text: string } {
  if (task.status === 'done') return { bg: '#cbd5e1', border: '#94a3b8', text: '#64748b' };
  switch (task.priority) {
    case 'high':   return { bg: '#fecaca', border: '#ef4444', text: '#991b1b' };
    case 'medium': return { bg: '#fde68a', border: '#f59e0b', text: '#92400e' };
    default:       return { bg: '#dbeafe', border: '#60a5fa', text: '#1e40af' };
  }
}

function getStatusLabel(s: Task['status']): string {
  if (s === 'done') return '✓';
  if (s === 'in-progress') return '◎';
  return '○';
}

/* ── Component ── */

export default function GanttChart({ projectId }: { projectId?: string }) {
  const { tasks, projects, updateTask } = useStore();
  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; task: Task } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  // ── Filter & build tree ──

  const scopeTasks = useMemo(
    () => (projectId ? tasks.filter((t) => t.projectId === projectId) : tasks),
    [tasks, projectId],
  );

  const project = useMemo(
    () => (projectId ? projects.find((p) => p.id === projectId) : undefined),
    [projects, projectId],
  );

  const tree = useMemo(() => buildGanttTree(scopeTasks), [scopeTasks]);

  // Auto-expand first level
  useEffect(() => {
    const ids = new Set<string>();
    tree.forEach((n) => ids.add(n.task.id));
    setExpandedIds(ids);
  }, [scopeTasks.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Date range ──

  const dateRange = useMemo(() => {
    let min: Date | null = null;
    let max: Date | null = null;

    if (project?.startDate) min = startOfDay(new Date(project.startDate));
    if (project?.endDate)   max = startOfDay(new Date(project.endDate));

    for (const t of scopeTasks) {
      const s = t.startDate || t.createdAt;
      const e = t.dueDate;
      if (s) {
        const sd = startOfDay(new Date(s));
        if (!min || sd < min) min = sd;
        if (e) { const ed = startOfDay(new Date(e)); if (!max || ed > max) max = ed; }
        else { const ed = new Date(sd); ed.setDate(ed.getDate() + 1); if (!max || ed > max) max = ed; }
      }
    }

    if (!min) min = startOfDay(new Date());
    if (!max) max = startOfDay(new Date());
    if (max <= min) { max = new Date(min); max.setDate(max.getDate() + 7); }

    // Padding
    min = new Date(min); min.setDate(min.getDate() - 4);
    max = new Date(max); max.setDate(max.getDate() + 4);

    const days = daysBetween(min, max);
    return { start: min, end: max, totalDays: Math.max(days, 14) };
  }, [scopeTasks, project]);

  // ── Flatten visible rows ──

  const flatRows = useMemo(
    () => flattenTree(tree, expandedIds),
    [tree, expandedIds],
  );

  // ── Month header data ──

  const months = useMemo(() => {
    const result: { label: string; colStart: number; colSpan: number }[] = [];
    const d = new Date(dateRange.start);
    while (d <= dateRange.end) {
      const m = d.getMonth();
      const y = d.getFullYear();
      const label = `${y}年${m + 1}月`;
      const colStart = daysBetween(dateRange.start, d);
      // Count days in this month
      let span = 0;
      const cursor = new Date(d);
      while (cursor.getMonth() === m && cursor <= dateRange.end) {
        span++;
        cursor.setDate(cursor.getDate() + 1);
      }
      result.push({ label, colStart, colSpan });
      d.setMonth(d.getMonth() + 1);
      d.setDate(1);
    }
    return result;
  }, [dateRange]);

  // ── Day columns ──

  const days = useMemo(() => {
    const result: Date[] = [];
    const d = new Date(dateRange.start);
    while (d <= dateRange.end) {
      result.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return result;
  }, [dateRange]);

  // ── Today ──

  const today = startOfDay(new Date());
  const todayCol =
    today >= dateRange.start && today <= dateRange.end
      ? daysBetween(dateRange.start, today)
      : null;

  // Scroll to today on mount
  useEffect(() => {
    if (todayCol !== null && timelineRef.current) {
      const scrollTo = todayCol * DAY_WIDTH - 200;
      timelineRef.current.scrollLeft = Math.max(0, scrollTo);
    }
  }, [todayCol]); // eslint-disable-line

  // ── Bar position ──

  const getBar = useCallback(
    (task: Task) => {
      const startStr = task.startDate || task.createdAt;
      const endStr = task.dueDate;
      const s = startStr ? startOfDay(new Date(startStr)) : startOfDay(new Date());
      let e: Date;
      if (endStr) {
        e = startOfDay(new Date(endStr));
        e.setDate(e.getDate() + 1); // inclusive
      } else {
        e = new Date(s);
        e.setDate(e.getDate() + 4); // no due date → 4-day placeholder
      }
      if (e <= s) { e = new Date(s); e.setDate(e.getDate() + 1); }

      const left = daysBetween(dateRange.start, s) * DAY_WIDTH;
      const width = Math.max(DAY_WIDTH, daysBetween(s, e) * DAY_WIDTH);
      return { left, width, startDate: s, endDate: e };
    },
    [dateRange],
  );

  // ── Toggle expand ──

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Date edit ──

  const openEdit = (task: Task) => {
    setEditingId(task.id);
    setEditStart(task.startDate ? task.startDate.slice(0, 10) : '');
    setEditEnd(task.dueDate ? task.dueDate.slice(0, 10) : '');
  };

  const saveEdit = () => {
    if (!editingId) return;
    const partial: Partial<Task> = {};
    if (editStart) partial.startDate = new Date(editStart).toISOString();
    else partial.startDate = null;
    if (editEnd) partial.dueDate = new Date(editEnd).toISOString();
    else partial.dueDate = null;
    updateTask(editingId, partial);
    setEditingId(null);
  };

  // ── Total height ──

  const totalHeight = flatRows.length * ROW_HEIGHT;

  if (scopeTasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-sm" style={{ color: 'var(--text-dim)' }}>
        <div className="text-center">
          <svg className="mx-auto mb-3 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <line x1="8" y1="14" x2="8" y2="14" />
            <line x1="12" y1="14" x2="12" y2="14" />
            <line x1="16" y1="14" x2="16" y2="14" />
            <line x1="8" y1="18" x2="8" y2="18" />
            <line x1="12" y1="18" x2="12" y2="18" />
            <line x1="16" y1="18" x2="16" y2="18" />
          </svg>
          <p>暂无任务，请先创建任务并为它们设置日期</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: 'var(--line)', background: 'var(--bg-surface)' }}
    >
      {/* ── Toolbar ── */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b text-xs"
        style={{ borderColor: 'var(--line)', color: 'var(--text-dim)' }}
      >
        <div className="flex items-center gap-3">
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>甘特图</span>
          <span>{flatRows.length} 个任务</span>
          {project && <span>· {project.name}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: 'var(--primary)' }}
          />
          <span>今日</span>
        </div>
      </div>

      <div className="flex" style={{ height: 'calc(100vh - 16rem)', minHeight: 360 }}>
        {/* ── LEFT: task list ── */}
        <div
          className="shrink-0 overflow-y-auto border-r"
          style={{ width: PANEL_W, borderColor: 'var(--line)' }}
        >
          {/* Header */}
          <div
            className="sticky top-0 z-10 flex items-center px-3 text-xs font-medium border-b"
            style={{
              height: HEADER_H,
              background: 'var(--bg-deep)',
              borderColor: 'var(--line)',
              color: 'var(--text-dim)',
            }}
          >
            任务名称
          </div>

          {flatRows.map((node, i) => {
            const t = node.task;
            const colors = getBarColor(t);
            const hasChildren = node.children.length > 0;
            const isExpanded = expandedIds.has(t.id);
            return (
              <div
                key={t.id}
                className="flex items-center gap-1.5 px-2 border-b text-xs cursor-pointer hover:bg-black/[0.02] transition-colors"
                style={{
                  height: ROW_HEIGHT,
                  borderColor: 'var(--line)',
                  background: selectedId === t.id ? 'var(--bg-deep)' : undefined,
                }}
                onClick={() => setSelectedId(selectedId === t.id ? null : t.id)}
              >
                {/* Indent + expand */}
                <div style={{ width: node.depth * 16 }} className="shrink-0" />
                {hasChildren ? (
                  <button
                    className="shrink-0 w-4 h-4 flex items-center justify-center rounded hover:bg-black/5 transition-colors"
                    onClick={(e) => { e.stopPropagation(); toggleExpand(t.id); }}
                  >
                    <svg
                      width="10" height="10" viewBox="0 0 10 10"
                      style={{ transform: isExpanded ? 'rotate(90deg)' : '', transition: 'transform 0.15s' }}
                    >
                      <path d="M3 1L7 5L3 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ) : (
                  <div className="w-4 shrink-0" />
                )}
                {/* Status dot */}
                <span
                  className="shrink-0 text-[10px] leading-none"
                  style={{ color: colors.border }}
                  title={t.status === 'done' ? '已完成' : t.status === 'in-progress' ? '进行中' : '待办'}
                >
                  {getStatusLabel(t.status)}
                </span>
                {/* Title */}
                <span
                  className="truncate flex-1"
                  style={{
                    color: t.status === 'done' ? 'var(--text-dim)' : 'var(--text-primary)',
                    textDecoration: t.status === 'done' ? 'line-through' : 'none',
                  }}
                >
                  {t.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── RIGHT: timeline ── */}
        <div
          ref={timelineRef}
          className="flex-1 overflow-auto"
          onMouseLeave={() => setTooltip(null)}
        >
          <div style={{ width: dateRange.totalDays * DAY_WIDTH, minWidth: '100%' }}>
            {/* Month header */}
            <div
              className="sticky top-0 z-10 flex border-b"
              style={{ height: HEADER_H / 2, borderColor: 'var(--line)', background: 'var(--bg-deep)' }}
            >
              {months.map((m) => (
                <div
                  key={m.label}
                  className="flex items-center pl-1 text-[11px] font-medium border-r"
                  style={{
                    width: m.colSpan * DAY_WIDTH,
                    marginLeft: m.colStart === 0 ? 0 : undefined,
                    position: m.colStart !== 0 ? 'absolute' : undefined,
                    left: m.colStart !== 0 ? m.colStart * DAY_WIDTH : undefined,
                    color: 'var(--text-mid)',
                    borderColor: 'var(--line)',
                  }}
                >
                  {m.label}
                </div>
              ))}
            </div>

            {/* Day header */}
            <div
              className="sticky flex border-b"
              style={{ top: HEADER_H / 2, zIndex: 9, height: HEADER_H / 2, borderColor: 'var(--line)', background: 'var(--bg-deep)' }}
            >
              {days.map((d, i) => {
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                const isToday = d.getTime() === today.getTime();
                return (
                  <div
                    key={i}
                    className="flex items-center justify-center text-[10px] font-medium border-r shrink-0"
                    style={{
                      width: DAY_WIDTH,
                      color: isToday ? 'var(--primary)' : isWeekend ? 'var(--text-dim)' : 'var(--text-mid)',
                      background: isToday ? 'var(--bg-deep)' : isWeekend ? 'rgba(0,0,0,0.015)' : undefined,
                      borderColor: 'var(--line)',
                    }}
                  >
                    {d.getDate()}
                  </div>
                );
              })}
            </div>

            {/* Grid rows */}
            <div style={{ position: 'relative', height: totalHeight }}>
              {/* Weekend shading */}
              {days.map((d, i) => {
                if (d.getDay() !== 0 && d.getDay() !== 6) return null;
                return (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 pointer-events-none"
                    style={{ left: i * DAY_WIDTH, width: DAY_WIDTH, background: 'rgba(0,0,0,0.015)' }}
                  />
                );
              })}

              {/* Today line */}
              {todayCol !== null && (
                <div
                  className="absolute top-0 bottom-0 z-20 pointer-events-none"
                  style={{ left: todayCol * DAY_WIDTH + DAY_WIDTH / 2 }}
                >
                  <div style={{ width: 2, height: '100%', background: 'var(--primary)', opacity: 0.5 }} />
                </div>
              )}

              {/* Row backgrounds + bars */}
              {flatRows.map((node, rowIdx) => {
                const t = node.task;
                const colors = getBarColor(t);
                const bar = getBar(t);
                const isSelected = selectedId === t.id;
                const y = rowIdx * ROW_HEIGHT;

                return (
                  <div
                    key={t.id}
                    className="absolute flex items-center"
                    style={{ top: y, height: ROW_HEIGHT, width: '100%' }}
                  >
                    {/* Row background line */}
                    <div
                      className="absolute inset-0 border-b"
                      style={{ borderColor: 'var(--line)', pointerEvents: 'none' }}
                    />

                    {/* Task bar */}
                    <div
                      className="absolute rounded-full flex items-center px-2 cursor-pointer transition-shadow hover:shadow-md z-10"
                      style={{
                        left: bar.left,
                        width: Math.max(bar.width, DAY_WIDTH - 4),
                        height: 22,
                        top: (ROW_HEIGHT - 22) / 2,
                        background: colors.bg,
                        border: `1.5px solid ${colors.border}`,
                        boxShadow: isSelected ? `0 0 0 2px ${colors.border}40` : undefined,
                        opacity: t.status === 'done' ? 0.6 : 1,
                      }}
                      onClick={() => setSelectedId(selectedId === t.id ? null : t.id)}
                      onDoubleClick={() => openEdit(t)}
                      onMouseEnter={(e) => {
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        const containerRect = containerRef.current?.getBoundingClientRect();
                        if (!containerRect) return;
                        setTooltip({
                          x: rect.left - containerRect.left + rect.width / 2,
                          y: rect.bottom - containerRect.top + 4,
                          task: t,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <span
                        className="text-[10px] font-medium truncate leading-none"
                        style={{ color: colors.text }}
                      >
                        {t.title}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Tooltip */}
              {tooltip && (
                <div
                  className="absolute z-30 pointer-events-none px-3 py-2 rounded-lg text-xs shadow-lg"
                  style={{
                    left: tooltip.x,
                    top: tooltip.y,
                    transform: 'translateX(-50%)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--line)',
                    color: 'var(--text-primary)',
                    maxWidth: 260,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div className="font-semibold text-sm mb-1">{tooltip.task.title}</div>
                  <div className="flex gap-3" style={{ color: 'var(--text-dim)' }}>
                    <span>{tooltip.task.status === 'done' ? '已完成' : tooltip.task.status === 'in-progress' ? '进行中' : '待办'}</span>
                    <span>{tooltip.task.priority === 'high' ? '🔴 高' : tooltip.task.priority === 'medium' ? '🟡 中' : '🔵 低'}</span>
                  </div>
                  <div style={{ color: 'var(--text-dim)', marginTop: 2 }}>
                    开始: {formatDateFull(tooltip.task.startDate || tooltip.task.createdAt)} · 截止: {formatDateFull(tooltip.task.dueDate)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Date Edit Modal ── */}
      {editingId && (() => {
        const task = scopeTasks.find((t) => t.id === editingId);
        if (!task) return null;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.35)' }}
            onClick={() => setEditingId(null)}
          >
            <div
              className="rounded-xl p-5 shadow-2xl w-80"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                编辑日期 · {task.title}
              </h3>
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs" style={{ color: 'var(--text-dim)' }}>开始日期</span>
                  <input
                    type="date"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    className="px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2"
                    style={{
                      borderColor: 'var(--line)',
                      background: 'var(--bg-page)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs" style={{ color: 'var(--text-dim)' }}>截止日期</span>
                  <input
                    type="date"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    className="px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2"
                    style={{
                      borderColor: 'var(--line)',
                      background: 'var(--bg-page)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="px-4 py-1.5 rounded-lg text-sm transition-colors"
                  style={{ color: 'var(--text-dim)' }}
                  onClick={() => setEditingId(null)}
                >
                  取消
                </button>
                <button
                  className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors"
                  style={{ background: 'var(--primary)' }}
                  onClick={saveEdit}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
