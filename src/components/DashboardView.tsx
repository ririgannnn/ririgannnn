import { useState, useMemo } from 'react';
import { useStore } from '../stores';
import type { Task, Note, CalendarEvent, Inspiration, KnowledgeEntry } from '../types';
import { format, getDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { CheckSquare, FileText, Calendar, Lightbulb, TrendingUp, ArrowUpRight, BookOpen, Sparkle, Clock, CheckCheck, Target, Flame } from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext, rectSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const defaultWidgets = [
  { id: 'tasks-overview', title: '任务概览', color: 'var(--accent-orange)', icon: CheckSquare },
  { id: 'recent-notes', title: '最近笔记', color: 'var(--accent-teal)', icon: FileText },
  { id: 'upcoming-events', title: '近期日程', color: 'var(--accent-warm)', icon: Calendar },
  { id: 'inspiration-wall', title: '灵感火花', color: 'var(--accent-dust)', icon: Lightbulb },
  { id: 'quick-stats', title: '数据概览', color: 'var(--accent-indigo)', icon: TrendingUp },
];

function SortableWidget({ widget, children }: { widget: typeof defaultWidgets[0]; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="card-surface overflow-hidden">
      <div
        className="flex items-center gap-2 px-4 py-3 border-b border-[var(--line)] cursor-grab active:cursor-grabbing"
        style={{ background: 'rgba(248,247,244,0.5)' }}
        {...attributes} {...listeners}
      >
        <widget.icon size={16} style={{ color: widget.color }} />
        <h3 className="text-sm font-semibold text-fg">{widget.title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function DashboardView() {
  const { tasks, notes, events, inspirations, knowledge, setActiveModule, projects } = useStore();
  const [widgets, setWidgets] = useState(defaultWidgets);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setWidgets((items) => {
      const old = items.findIndex((w) => w.id === active.id);
      const n = items.findIndex((w) => w.id === over.id);
      const result = [...items];
      [result[old], result[n]] = [result[n], result[old]];
      return result;
    });
  };

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 6 ? '夜深了' : hour < 12 ? '上午好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';

  // Date info with serif formatting
  const dateStr = format(now, 'yyyy年M月d日', { locale: zhCN });
  const weekdayStr = format(now, 'EEEE', { locale: zhCN });
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekdayShort = weekdays[getDay(now)];

  const pendingTasks = tasks.filter((t) => t.status !== 'done');
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress');
  const urgentTasks = pendingTasks.filter((t) => t.priority === 'high');
  const todayEvents = events.filter((e) => format(new Date(e.startDate), 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd'));

  // This week completed tasks
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - getDay(now));
  weekStart.setHours(0, 0, 0, 0);
  const weekCompleted = tasks.filter((t) =>
    t.status === 'done' && new Date(t.updatedAt || t.createdAt) >= weekStart
  ).length;

  // Active projects
  const activeProjects = projects.filter((p) => p.status === 'active').length;

  // Today's total focus time from all task sessions
  const todayFocusMs = tasks.reduce((sum, t) => {
    if (!t.focusSession?.sessions) return sum;
    const todayStr = format(now, 'yyyy-MM-dd');
    return sum + t.focusSession.sessions
      .filter((s) => format(new Date(s.start), 'yyyy-MM-dd') === todayStr)
      .reduce((s, session) => s + session.duration, 0);
  }, 0);
  const todayFocusMin = Math.floor(todayFocusMs / 60000);

  const statCards = [
    { label: '进行中任务', value: inProgressTasks.length, icon: Clock, color: 'var(--accent-orange)', suffix: '' },
    { label: '今日专注', value: todayFocusMin > 0 ? `${todayFocusMin}min` : '--', icon: Flame, color: 'var(--accent-rust)', suffix: '' },
    { label: '本周完成', value: weekCompleted, icon: CheckCheck, color: 'var(--accent-teal)', suffix: '' },
    { label: '活跃项目', value: activeProjects, icon: Target, color: 'var(--accent-indigo)', suffix: '' },
  ];

  // Daily random knowledge selection
  const dailyKnowledge = useMemo(() => {
    if (knowledge.length === 0) return null;
    const todayStr = format(now, 'yyyy-MM-dd');
    let hash = 0;
    for (let i = 0; i < todayStr.length; i++) {
      hash = ((hash << 5) - hash) + todayStr.charCodeAt(i);
      hash = hash & hash;
    }
    const index = Math.abs(hash) % knowledge.length;
    return knowledge[index];
  }, [knowledge]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ═══ Hero Greeting Area ═══ */}
      <div
        className="relative overflow-hidden card-surface"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '32px 36px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {/* RIRIGANNNN watermark */}
        <div
          className="decorative-english absolute -top-4 -right-6 text-[7rem] md:text-[9rem] leading-none pointer-events-none"
          style={{ opacity: 0.035, color: 'var(--kon-main)' }}
        >
          RIRIGANNNN
        </div>

        {/* Content row */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Greeting - large serif */}
            <h2
              className="font-serif-cn"
              style={{
                fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                fontWeight: 400,
                color: 'var(--text-primary)',
                lineHeight: 1.15,
                margin: 0,
                letterSpacing: '0.03em',
              }}
            >
              {greeting}
            </h2>
            {/* Name - smaller, elegant */}
            <p
              className="font-serif-cn"
              style={{
                fontSize: 'clamp(0.95rem, 1.6vw, 1.15rem)',
                fontWeight: 300,
                color: 'var(--text-mid)',
                marginTop: '4px',
                letterSpacing: '0.05em',
              }}
            >
              荔荔绀
            </p>

            {/* Date line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px' }}>
              <span
                className="font-serif-cn"
                style={{
                  fontSize: 'clamp(0.85rem, 1.2vw, 1rem)',
                  color: 'var(--text-mid)',
                  letterSpacing: '0.02em',
                }}
              >
                {dateStr}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: 'var(--kon-main)',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 500,
                  letterSpacing: '0.03em',
                }}
              >
                {weekdayShort}
              </span>
            </div>

            {/* Quick summary */}
            <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '12px', lineHeight: 1.5 }}>
              {pendingTasks.length > 0
                ? `${pendingTasks.length} 项待办任务 · ${urgentTasks.length} 项高优先级`
                : '今天没有待办任务，享受这一天 ☀️'}
            </p>
          </div>

          {/* Right side: Avatar + Geometric art */}
          <div style={{ position: 'relative', flexShrink: 0, width: 'clamp(80px, 14vw, 120px)', height: 'clamp(80px, 14vw, 120px)' }}>
            {/* Geometric art SVG behind avatar */}
            <svg
              viewBox="0 0 140 140"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35 }}
            >
              <circle cx="30" cy="35" r="14" fill="none" stroke="var(--kon-main)" strokeWidth="1.2" />
              <circle cx="110" cy="55" r="18" fill="none" stroke="var(--accent-warm)" strokeWidth="1.2" />
              <rect x="15" y="90" width="16" height="16" rx="3" fill="none" stroke="var(--accent-dust)" strokeWidth="1" transform="rotate(20 23 98)" />
              <circle cx="95" cy="105" r="7" fill="none" stroke="var(--accent-teal)" strokeWidth="1" />
              <line x1="120" y1="20" x2="120" y2="50" stroke="var(--accent-indigo)" strokeWidth="1" opacity="0.5" />
              <line x1="125" y1="25" x2="125" y2="55" stroke="var(--accent-indigo)" strokeWidth="1" opacity="0.3" />
              <circle cx="60" cy="115" r="5" fill="none" stroke="var(--kon-main)" strokeWidth="0.8" />
            </svg>
            {/* ITO Avatar */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '70%',
                height: '70%',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid var(--kon-main)',
                boxShadow: 'var(--shadow-md)',
                background: 'var(--bg-surface)',
              }}
            >
              <img
                src="/ito.jpg"
                alt="ITO"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Daily Knowledge Card ═══ */}
      {dailyKnowledge && (
        <DailyKnowledgeCard entry={dailyKnowledge} onClick={() => setActiveModule('knowledge')} />
      )}

      {/* ═══ Statistics Row ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
      }}>
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="card-surface"
            style={{
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `${stat.color}14`,
                flexShrink: 0,
              }}
            >
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
            <div>
              <div
                className="font-serif-cn"
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  lineHeight: 1.1,
                }}
              >
                {stat.value}{stat.suffix}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ Quick Actions ═══ */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {[
          { label: '新建任务', action: () => setActiveModule('tasks') },
          { label: '写笔记', action: () => setActiveModule('notes') },
          { label: '记录灵感', action: () => setActiveModule('inspiration') },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={btn.action}
            style={{
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: 'var(--radius-md)',
              color: '#fff',
              background: 'linear-gradient(135deg, var(--kon-dark), var(--kon-deeper))',
              boxShadow: '0 2px 10px rgba(153,167,188,0.25)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s var(--ease-smooth)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, var(--accent-orange), var(--accent-rust))';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(216,107,66,0.3)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, var(--kon-dark), var(--kon-deeper))';
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(153,167,188,0.25)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <ArrowUpRight size={14} />
            {btn.label}
          </button>
        ))}
      </div>

      {/* ═══ Draggable Widget Grid ═══ */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '14px',
          }}>
            {widgets.map((widget) => (
              <SortableWidget key={widget.id} widget={widget}>
                {widget.id === 'tasks-overview' && <TaskWidget tasks={tasks} onClick={() => setActiveModule('tasks')} />}
                {widget.id === 'recent-notes' && <NoteWidget notes={notes} onClick={() => setActiveModule('notes')} />}
                {widget.id === 'upcoming-events' && <EventWidget events={todayEvents} onClick={() => setActiveModule('calendar')} />}
                {widget.id === 'inspiration-wall' && <InspirationWidget inspirations={inspirations} onClick={() => setActiveModule('inspiration')} />}
                {widget.id === 'quick-stats' && <StatsWidget tasks={tasks} notes={notes} />}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function TaskWidget({ tasks, onClick }: { tasks: Task[]; onClick: () => void }) {
  const todo = tasks.filter((t) => t.status === 'todo');
  const inProgress = tasks.filter((t) => t.status === 'in-progress');
  const done = tasks.filter((t) => t.status === 'done');

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        {[
          { label: '待办', count: todo.length, color: 'var(--accent-warm)' },
          { label: '进行中', count: inProgress.length, color: 'var(--kon-dark)' },
          { label: '已完成', count: done.length, color: 'var(--accent-teal)' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '10px 8px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-deep)',
            }}
          >
            <div style={{ fontSize: '1.15rem', fontWeight: 600, color: stat.color }}>{stat.count}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>{stat.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {tasks.filter((t) => t.status !== 'done').slice(0, 4).map((t) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-mid)' }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
              background: t.priority === 'high' ? 'var(--accent-orange)' : t.priority === 'medium' ? 'var(--accent-warm)' : 'var(--text-dim)',
            }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{t.title}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onClick}
        style={{
          marginTop: '10px',
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--text-dim)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--kon-dark)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-dim)'; }}
      >
        查看全部 →
      </button>
    </div>
  );
}

function NoteWidget({ notes, onClick }: { notes: Note[]; onClick: () => void }) {
  return (
    <div>
      {notes.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-dim)', padding: '8px 0' }}>暂无笔记，点击下方开始记录</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notes.slice(0, 4).map((n) => (
            <div key={n.id} style={{ fontSize: '13px' }}>
              <div style={{ fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {n.title || '无标题'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                {format(new Date(n.updatedAt || n.createdAt), 'MM-dd HH:mm')}
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={onClick}
        style={{
          marginTop: '10px',
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--kon-dark)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          transition: 'opacity 0.2s',
        }}
      >
        {notes.length === 0 ? '新建笔记' : '查看全部 →'}
      </button>
    </div>
  );
}

function EventWidget({ events, onClick }: { events: CalendarEvent[]; onClick: () => void }) {
  return (
    <div>
      {events.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-dim)', padding: '8px 0' }}>今日暂无日程</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {events.slice(0, 4).map((e) => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: e.color }} />
              <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{e.title}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                {format(new Date(e.startDate), 'HH:mm')}
              </span>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={onClick}
        style={{
          marginTop: '10px',
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--text-dim)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--kon-dark)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-dim)'; }}
      >
        查看日历 →
      </button>
    </div>
  );
}

function InspirationWidget({ inspirations, onClick }: { inspirations: Inspiration[]; onClick: () => void }) {
  return (
    <div>
      {inspirations.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-dim)', padding: '8px 0' }}>记录你的灵感瞬间</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {inspirations.slice(0, 3).map((i) => (
            <div
              key={i.id}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                background: `${i.color}10`,
                borderLeft: `3px solid ${i.color}`,
              }}
            >
              <p style={{ color: 'var(--text-primary)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {i.content}
              </p>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                {format(new Date(i.createdAt), 'MM-dd')}
              </span>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={onClick}
        style={{
          marginTop: '10px',
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--kon-dark)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          transition: 'opacity 0.2s',
        }}
      >
        记录灵感 →
      </button>
    </div>
  );
}

function StatsWidget({ tasks, notes }: {
  tasks: Task[];
  notes: Note[];
}) {
  const completionRate = tasks.length > 0 ? Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100) : 0;

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px' }}>
        {[
          { label: '总任务', value: tasks.length, color: 'var(--kon-dark)' },
          { label: '完成率', value: `${completionRate}%`, color: 'var(--accent-teal)' },
          { label: '笔记', value: notes.length, color: 'var(--accent-indigo)' },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{s.label}</div>
          </div>
        ))}
      </div>
      {tasks.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>
            <span>进度</span>
            <span>{completionRate}%</span>
          </div>
          <div style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-deep)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '3px', background: 'var(--kon-main)', transition: 'width 0.6s var(--ease-smooth)', width: `${completionRate}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

function DailyKnowledgeCard({ entry, onClick }: { entry: KnowledgeEntry; onClick: () => void }) {
  const hasImage = Array.isArray(entry.images) && entry.images.length > 0;

  return (
    <button
      onClick={onClick}
      className="card-surface"
      style={{
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        overflow: 'hidden',
        border: 'none',
        padding: 0,
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'box-shadow 0.35s var(--ease-smooth)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
    >
      <div style={{ display: 'flex', flexDirection: hasImage ? undefined : 'column' }}>
        {hasImage && (
          <div style={{ width: '40%', minHeight: '140px', overflow: 'hidden', flexShrink: 0 }}>
            <img
              src={entry.images![0]}
              alt={entry.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s var(--ease-smooth)' }}
              className="group-hover:scale-105"
            />
          </div>
        )}
        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--kon-main)' }}>
              <Sparkle size={13} />
              <span>每日知识</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', padding: '1px 6px', borderRadius: '4px', background: 'var(--bg-deep)' }}>
              {entry.category}
            </span>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entry.title}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-mid)', lineHeight: 1.6, margin: '6px 0 0', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {entry.content.length > 150 ? entry.content.slice(0, 150) + '...' : entry.content}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
            {(Array.isArray(entry.tags) ? entry.tags : []).slice(0, 3).map((t) => (
              <span key={t} style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--kon-main)', opacity: 0.5 }} />
                {t}
              </span>
            ))}
            <span style={{ fontSize: '12px', color: 'var(--text-dim)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <BookOpen size={12} />
              阅读全文
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
