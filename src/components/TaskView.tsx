import { useState } from 'react';
import { useStore } from '../stores';
import type { Task, TaskStatus, TaskPriority } from '../types';
import { format } from 'date-fns';
import { Plus, Trash2, GripVertical, Search, Calendar } from 'lucide-react';

const statusLabels: Record<TaskStatus, { label: string; color: string }> = {
  'todo': { label: '待办', color: '#f59e0b' },
  'in-progress': { label: '进行中', color: '#3b82f6' },
  'done': { label: '已完成', color: '#10b981' },
};

const priorityColors: Record<TaskPriority, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#94a3b8',
};

export default function TaskView() {
  const { tasks, addTask, updateTask, deleteTask } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [editing, setEditing] = useState<string | null>(null);

  // New task form state
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');

  const filtered = tasks
    .filter((t) => filter === 'all' || t.status === filter)
    .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));

  const columns: TaskStatus[] = ['todo', 'in-progress', 'done'];

  const handleAdd = () => {
    if (!title.trim()) return;
    addTask({
      id: '', title, description: desc, status: 'todo', priority,
      dueDate: null, tags: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    setTitle(''); setDesc(''); setPriority('medium'); setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-fg">任务管理</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-fg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={16} /> 新建任务
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
          <input
            type="text" placeholder="搜索任务..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-black/5 text-fg outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            style={{ background: 'rgba(255,255,255,0.65)' }}
          />
        </div>
        {(['all', 'todo', 'in-progress', 'done'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === s ? 'bg-primary text-primary-fg' : 'bg-muted text-muted-fg hover:bg-border'
            }`}
          >
            {s === 'all' ? '全部' : statusLabels[s].label}
          </button>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => {
          const colTasks = filtered.filter((t) => t.status === col);
          return (
            <div
              key={col}
              className="rounded-xl p-3 border border-black/5"
              style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px) saturate(130%)', WebkitBackdropFilter: 'blur(12px) saturate(130%)' }}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusLabels[col].color }} />
                  <span className="text-sm font-semibold text-fg">{statusLabels[col].label}</span>
                </div>
                <span
                  className="text-xs text-muted-fg px-2 py-0.5 rounded-full border border-black/5"
                  style={{ background: 'rgba(255,255,255,0.6)' }}
                >{colTasks.length}</span>
              </div>
              <div className="space-y-2">
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatus={(s) => updateTask(task.id, { status: s })}
                    onDelete={() => deleteTask(task.id)}
                    onEdit={(t) => updateTask(task.id, t)}
                    isEditing={editing === task.id}
                    onEditingChange={(v) => setEditing(v ? task.id : null)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div
            className="rounded-2xl shadow-xl p-6 w-full max-w-md animate-scale-in border border-black/5"
            style={{
              background: 'rgba(255,255,255,0.82)',
              backdropFilter: 'blur(24px) saturate(150%)',
              WebkitBackdropFilter: 'blur(24px) saturate(150%)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-fg mb-4">新建任务</h2>
            <input
              type="text" placeholder="任务标题" value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border bg-muted/50 text-fg outline-none focus:ring-2 focus:ring-primary/30 mb-3"
              autoFocus
            />
            <textarea
              placeholder="任务描述（可选）" value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border bg-muted/50 text-fg outline-none focus:ring-2 focus:ring-primary/30 mb-3 h-20 resize-none"
            />
            <div className="flex gap-2 mb-4">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-1.5 text-xs rounded-md border transition-colors ${
                    priority === p ? 'text-white' : 'text-muted-fg hover:bg-muted'
                  }`}
                  style={priority === p ? { backgroundColor: priorityColors[p], borderColor: priorityColors[p] } : {}}
                >
                  {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                </button>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg bg-muted text-muted-fg hover:bg-border transition-colors">取消</button>
              <button onClick={handleAdd} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg hover:opacity-90 transition-opacity">创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onStatus, onDelete, onEdit, isEditing, onEditingChange }: {
  task: Task;
  onStatus: (s: TaskStatus) => void;
  onDelete: () => void;
  onEdit: (partial: Partial<Task>) => void;
  isEditing: boolean;
  onEditingChange: (v: boolean) => void;
}) {
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description);

  const nextStatus = (current: TaskStatus): TaskStatus => {
    if (current === 'todo') return 'in-progress';
    if (current === 'in-progress') return 'done';
    return 'todo';
  };

  return (
    <div
      className="rounded-lg p-3 border border-black/5 shadow-sm hover:shadow-md transition-shadow group"
      style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
    >
      {isEditing ? (
        <div className="space-y-2">
          <input
            value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
            className="w-full text-sm font-medium px-2 py-1 rounded border bg-muted/50 text-fg outline-none"
            autoFocus
          />
          <textarea
            value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
            className="w-full text-xs px-2 py-1 rounded border bg-muted/50 text-fg outline-none h-16 resize-none"
          />
          <div className="flex gap-1 justify-end">
            <button onClick={() => onEditingChange(false)} className="px-2 py-1 text-xs rounded bg-muted text-muted-fg">取消</button>
            <button onClick={() => { onEdit({ title: editTitle, description: editDesc }); onEditingChange(false); }} className="px-2 py-1 text-xs rounded bg-primary text-primary-fg">��存</button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: priorityColors[task.priority] }} />
              <span className={`text-sm font-medium text-fg cursor-pointer hover:text-primary transition-colors truncate ${task.status === 'done' ? 'line-through opacity-60' : ''}`}
                onClick={() => onEditingChange(true)}>
                {task.title}
              </span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onStatus(nextStatus(task.status))} className="p-1 rounded hover:bg-muted transition-colors" title="切换状态">
                <GripVertical size={13} className="text-muted-fg" />
              </button>
              <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 transition-colors" title="删除">
                <Trash2 size={13} className="text-muted-fg hover:text-red-500" />
              </button>
            </div>
          </div>
          {task.description && (
            <p className="text-xs text-muted-fg mt-1.5 line-clamp-2 ml-3.5">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 ml-3.5">
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: statusLabels[task.status].color + '20', color: statusLabels[task.status].color }}>
              {statusLabels[task.status].label}
            </span>
            {task.dueDate && (
              <span className="text-xs text-muted-fg flex items-center gap-1">
                <Calendar size={10} /> {format(new Date(task.dueDate), 'MM/dd')}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
