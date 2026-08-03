import { useState } from 'react';
import { useStore } from '../stores';
import type { Task, Note, CalendarEvent, Inspiration } from '../types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { CheckSquare, FileText, Calendar, Lightbulb, TrendingUp, ArrowUpRight } from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext, rectSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const defaultWidgets = [
  { id: 'tasks-overview', title: '任务概览', color: '#3b82f6', icon: CheckSquare },
  { id: 'recent-notes', title: '最近笔记', color: '#8b5cf6', icon: FileText },
  { id: 'upcoming-events', title: '近期日程', color: '#f59e0b', icon: Calendar },
  { id: 'inspiration-wall', title: '灵感火花', color: '#ec4899', icon: Lightbulb },
  { id: 'quick-stats', title: '数据概览', color: '#10b981', icon: TrendingUp },
];

function SortableWidget({ widget, children }: { widget: typeof defaultWidgets[0]; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-card rounded-xl border shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50 cursor-grab active:cursor-grabbing"
        {...attributes} {...listeners}>
        <widget.icon size={16} style={{ color: widget.color }} />
        <h3 className="text-sm font-semibold text-fg">{widget.title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function DashboardView() {
  const { tasks, notes, events, inspirations, setActiveModule } = useStore();
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

  const today = format(new Date(), 'MM月dd日 EEEE', { locale: zhCN });
  const pendingTasks = tasks.filter((t) => t.status !== 'done');
  const urgentTasks = pendingTasks.filter((t) => t.priority === 'high');
  const todayEvents = events.filter((e) => format(new Date(e.startDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'));

  return (
    <div className="space-y-6">
      {/* Header with decorative watermark */}
      <div className="relative overflow-hidden rounded-2xl bg-card border p-6 pb-8">
        {/* Decorative "RIRIGANNNN" watermark */}
        <div className="decorative-english color-block-text absolute -top-6 -right-4 text-[6rem] md:text-[8rem] leading-none opacity-[0.06] select-none pointer-events-none"
          style={{ wordBreak: 'break-all' }}>
          RIRIGANNNN
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-fg">你好，{today}</h1>
          <p className="text-muted-fg mt-1 text-sm">
            {pendingTasks.length > 0
              ? `${pendingTasks.length} 项待办任务，其中 ${urgentTasks.length} 项高优先级`
              : '今天没有待办任务'}
          </p>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.25em] opacity-25">YOUR PERSONAL WORKSPACE</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: '新建任务', action: () => setActiveModule('tasks') },
          { label: '写笔记', action: () => setActiveModule('notes') },
          { label: '记录灵感', action: () => setActiveModule('inspiration') },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={btn.action}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-fg hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <ArrowUpRight size={15} />
            {btn.label}
          </button>
        ))}
      </div>

      {/* Draggable Widget Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
      <div className="flex gap-3 mb-3">
        {[
          { label: '待办', count: todo.length, color: '#f59e0b' },
          { label: '进行中', count: inProgress.length, color: '#3b82f6' },
          { label: '已完成', count: done.length, color: '#10b981' },
        ].map((stat) => (
          <div key={stat.label} className="flex-1 text-center p-2 rounded-lg bg-muted">
            <div className="text-lg font-bold" style={{ color: stat.color }}>{stat.count}</div>
            <div className="text-xs text-muted-fg">{stat.label}</div>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {tasks.filter((t) => t.status !== 'done').slice(0, 4).map((t) => (
          <div key={t.id} className="flex items-center gap-2 text-sm text-muted-fg">
            <div className={`w-1.5 h-1.5 rounded-full ${t.priority === 'high' ? 'bg-red-500' : t.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-400'}`} />
            <span className="truncate flex-1">{t.title}</span>
          </div>
        ))}
      </div>
      <button onClick={onClick} className="mt-3 text-xs font-medium text-muted-fg hover:text-fg transition-colors">
        查看全部 →
      </button>
    </div>
  );
}

function NoteWidget({ notes, onClick }: { notes: Note[]; onClick: () => void }) {
  return (
    <div>
      {notes.length === 0 ? (
        <p className="text-sm text-muted-fg py-2">暂无笔记，点击下方开始记录</p>
      ) : (
        <div className="space-y-2">
          {notes.slice(0, 4).map((n) => (
            <div key={n.id} className="text-sm">
              <div className="font-medium text-fg truncate">{n.title || '无标题'}</div>
              <div className="text-xs text-muted-fg">{format(new Date(n.updatedAt || n.createdAt), 'MM-dd HH:mm')}</div>
            </div>
          ))}
        </div>
      )}
      <button onClick={onClick} className="mt-3 text-xs font-medium text-primary hover:underline">
        {notes.length === 0 ? '新建笔记' : '查看全部 →'}
      </button>
    </div>
  );
}

function EventWidget({ events, onClick }: { events: CalendarEvent[]; onClick: () => void }) {
  return (
    <div>
      {events.length === 0 ? (
        <p className="text-sm text-muted-fg py-2">今日暂无日程</p>
      ) : (
        <div className="space-y-2">
          {events.slice(0, 4).map((e) => (
            <div key={e.id} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
              <span className="text-fg truncate flex-1">{e.title}</span>
              <span className="text-xs text-muted-fg">{format(new Date(e.startDate), 'HH:mm')}</span>
            </div>
          ))}
        </div>
      )}
      <button onClick={onClick} className="mt-3 text-xs font-medium text-muted-fg hover:text-fg transition-colors">
        查看日历 →
      </button>
    </div>
  );
}

function InspirationWidget({ inspirations, onClick }: { inspirations: Inspiration[]; onClick: () => void }) {
  return (
    <div>
      {inspirations.length === 0 ? (
        <p className="text-sm text-muted-fg py-2">记录你的灵感瞬间</p>
      ) : (
        <div className="space-y-2">
          {inspirations.slice(0, 3).map((i) => (
            <div key={i.id} className="p-2 rounded-lg text-sm" style={{ backgroundColor: i.color + '18', borderLeft: `3px solid ${i.color}` }}>
              <p className="text-fg line-clamp-2">{i.content}</p>
              <span className="text-xs text-muted-fg mt-1 block">{format(new Date(i.createdAt), 'MM-dd')}</span>
            </div>
          ))}
        </div>
      )}
      <button onClick={onClick} className="mt-3 text-xs font-medium text-primary hover:underline">
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
      <div className="flex gap-3">
        {[
          { label: '总任务', value: tasks.length, color: '#3b82f6' },
          { label: '完成率', value: `${completionRate}%`, color: '#10b981' },
          { label: '笔记', value: notes.length, color: '#8b5cf6' },
        ].map((s) => (
          <div key={s.label} className="flex-1 text-center">
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-muted-fg">{s.label}</div>
          </div>
        ))}
      </div>
      {tasks.length > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-fg mb-1">
            <span>进度</span>
            <span>{completionRate}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
