import { useState, useEffect, useRef } from 'react';
import { useStore } from '../stores';
import type { Task, TaskStatus, TaskPriority, SubTask, FocusSession } from '../types';
import { format } from 'date-fns';
import { Plus, Trash2, Search, Calendar, ChevronUp, ChevronDown, ChevronRight, Check, Pencil, X, ListChecks, Timer, Play } from 'lucide-react';
import FocusTimer, { stopTaskTimer } from './FocusTimer';

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

const MAX_SUBTASKS = 20;

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 1) return '< 1m';
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function TaskView({ projectId }: { projectId?: string }) {
  const { tasks, projects, addTask, updateTask, deleteTask } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [editing, setEditing] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>('all');

  // New task form state
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [taskProjectId, setTaskProjectId] = useState<string>(projectId || '');
  const [taskParentId, setTaskParentId] = useState<string>('');

  // When projectId prop changes, update form default
  useEffect(() => {
    if (projectId) setTaskProjectId(projectId);
  }, [projectId]);

  // Filter tasks
  const displayedTasks = projectId
    ? tasks.filter((t) => t.projectId === projectId)
    : tasks.filter((t) => projectFilter === 'all' || t.projectId === projectFilter || (projectFilter === 'none' && !t.projectId));

  const filtered = displayedTasks
    .filter((t) => filter === 'all' || t.status === filter)
    .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));

  const columns: TaskStatus[] = ['todo', 'in-progress', 'done'];

  const handleAdd = () => {
    if (!title.trim()) return;
    addTask({
      title, description: desc, status: 'todo', priority,
      dueDate: null, tags: [], subtasks: [],
      projectId: taskProjectId || null,
      parentId: taskParentId || null,
    });
    setTitle(''); setDesc(''); setPriority('medium'); setTaskParentId(''); setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {!projectId && (
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-fg">任务管理</h1>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-fg text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus size={16} /> 新建任务
          </button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
          <input
            type="text" placeholder="搜索任务..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-black/5 text-fg outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            style={{ background: 'rgba(255,255,255,0.65)' }}
          />
        </div>

        {/* Project filter (only in global task view) */}
        {!projectId && (
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-black/5 bg-white/80 outline-none"
          >
            <option value="all">全部项目</option>
            <option value="none">无项目</option>
            {projects.filter((p) => p.status === 'active').map((p) => (
              <option key={p.id} value={p.id}>{p.icon}{p.name}</option>
            ))}
          </select>
        )}

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
        {projectId && (
          <button onClick={() => setShowForm(true)} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-fg text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus size={16} /> 新建任务
          </button>
        )}
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
                    onUpdate={(partial) => updateTask(task.id, partial)}
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
            <h2 className="text-lg font-bold text-fg mb-4">{projectId ? '新增任务' : '新建任务'}</h2>
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
            {/* Project selector */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-muted-fg mb-1.5">所属项目</label>
              <select
                value={taskProjectId}
                onChange={(e) => setTaskProjectId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border bg-white/80 text-fg outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">无项目</option>
                {projects.filter((p) => p.status === 'active').map((p) => (
                  <option key={p.id} value={p.id}>{p.icon}{p.name}</option>
                ))}
              </select>
            </div>

            {/* Parent task selector */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-muted-fg mb-1.5">父任务（可选）</label>
              <select
                value={taskParentId}
                onChange={(e) => setTaskParentId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border bg-white/80 text-fg outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">无（独立任务）</option>
                {tasks
                  .filter((t) => t.status !== 'done' && (!taskProjectId || t.projectId === taskProjectId))
                  .map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
              </select>
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

function TaskCard({ task, onUpdate, onDelete, onEdit, isEditing, onEditingChange }: {
  task: Task;
  onUpdate: (partial: Partial<Task>) => void;
  onDelete: () => void;
  onEdit: (partial: Partial<Task>) => void;
  isEditing: boolean;
  onEditingChange: (v: boolean) => void;
}) {
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const project = task.projectId ? projects.find((p) => p.id === task.projectId) : null;
  const parentTask = task.parentId ? tasks.find((t) => t.id === task.parentId) : null;
  const childCount = tasks.filter((t) => t.parentId === task.id).length;
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');
  const [subtaskError, setSubtaskError] = useState('');
  const [showTimerPrompt, setShowTimerPrompt] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  // Increment this to force re-mount / re-start the timer
  const [timerSessionKey, setTimerSessionKey] = useState(0);
  const hasAutoStartedRef = useRef(false);
  // Collapsible details panel for done tasks
  const [showDetails, setShowDetails] = useState(false);

  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  const completedSubtasks = subtasks.filter((st) => st.done).length;
  const isDone = task.status === 'done';

  // Auto-resume timer on mount if task is in-progress (survives navigation)
  useEffect(() => {
    if (task.status === 'in-progress' && !timerStarted && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      setTimerStarted(true);
      setTimerSessionKey((k) => k + 1);
    }
  }, [task.status, timerStarted]);

  const nextStatus = (current: TaskStatus): TaskStatus => {
    if (current === 'todo') return 'in-progress';
    if (current === 'in-progress') return 'done';
    return 'todo';
  };

  // ── Subtask operations ──

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    if (subtasks.length >= MAX_SUBTASKS) {
      setSubtaskError(`最多 ${MAX_SUBTASKS} 个子任务`);
      setTimeout(() => setSubtaskError(''), 3000);
      return;
    }
    const newSubtask: SubTask = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: newSubtaskTitle.trim(),
      done: false,
    };
    onUpdate({ subtasks: [...subtasks, newSubtask] });
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const updated = subtasks.map((st) =>
      st.id === subtaskId ? { ...st, done: !st.done } : st
    );
    // Pure subtask operation — no timer interaction, no parent status change
    onUpdate({ subtasks: updated });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const updated = subtasks.filter((st) => st.id !== subtaskId);
    // Pure subtask operation — no timer interaction, no parent status change
    onUpdate({ subtasks: updated });
  };

  const handleStartEditSubtask = (st: SubTask) => {
    setEditingSubtaskId(st.id);
    setEditingSubtaskTitle(st.title);
  };

  const handleSaveEditSubtask = () => {
    if (!editingSubtaskId) return;
    const updated = subtasks.map((st) =>
      st.id === editingSubtaskId ? { ...st, title: editingSubtaskTitle.trim() || st.title } : st
    );
    onUpdate({ subtasks: updated });
    setEditingSubtaskId(null);
    setEditingSubtaskTitle('');
  };

  // ── Parent status toggle with subtask sync ──

  const handleParentStatusToggle = () => {
    const next = nextStatus(task.status);
    if (next === 'in-progress') {
      // Show timer prompt instead of directly changing status
      setShowTimerPrompt(true);
    } else if (next === 'done') {
      // Stop any running timer for this task
      stopTaskTimer(task.id);
      setTimerStarted(false);
      if (subtasks.length > 0) {
        const updated = subtasks.map((st) => ({ ...st, done: true }));
        onUpdate({ status: 'done', subtasks: updated });
      } else {
        onUpdate({ status: 'done' });
      }
    } else if (task.status === 'done') {
      // Moving away from done
      onUpdate({ status: next });
    } else {
      onUpdate({ status: next });
    }
  };

  const handleStartTimer = () => {
    setShowTimerPrompt(false);
    setTimerStarted(true);
    setTimerSessionKey((k) => k + 1);
    onUpdate({ status: 'in-progress' });
  };

  const handleSkipTimer = () => {
    setShowTimerPrompt(false);
    setTimerStarted(false);
    onUpdate({ status: 'in-progress' });
  };

  const handleSaveFocusSession = (session: FocusSession) => {
    onUpdate({ focusSession: session });
  };

  const handleTimerStop = () => {
    setTimerStarted(false);
  };

  const handleTimerRestart = () => {
    stopTaskTimer(task.id);
    setTimerStarted(true);
    setTimerSessionKey((k) => k + 1);
    if (task.status !== 'in-progress') {
      onUpdate({ status: 'in-progress' });
    }
  };

  return (
    <div
      className="rounded-xl border border-black/5 shadow-sm hover:shadow-md transition-shadow group overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
    >
      {/* Project color bar */}
      {project && (
        <div className="h-0.5 w-full" style={{ backgroundColor: project.coverColor }} />
      )}
      <div className="p-3">
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
            <button onClick={() => { onEdit({ title: editTitle, description: editDesc }); onEditingChange(false); }} className="px-2 py-1 text-xs rounded bg-primary text-primary-fg">保存</button>
          </div>
        </div>
      ) : isDone ? (
        <div className="p-4">
          {/* ── Title row — most prominent ── */}
          <div className="flex items-start gap-2.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ backgroundColor: '#10b981' }}
            >
              <Check size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <span
                  className="text-base font-semibold text-fg leading-snug"
                  style={{ opacity: 0.55, textDecoration: 'line-through' }}
                >
                  {task.title}
                </span>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="ml-auto p-1 rounded hover:bg-black/5 transition-colors shrink-0 text-muted-fg mt-0.5"
                  title={showDetails ? '收起详情' : '展开详情'}
                >
                  {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
              {/* One-line summary when collapsed */}
              {!showDetails && (
                <div className="text-xs text-muted-fg mt-1.5 flex items-center gap-2 flex-wrap">
                  {subtasks.length > 0 && <span>{completedSubtasks}/{subtasks.length} 子任务</span>}
                  {(task.focusSession?.totalDuration ?? 0) > 0 && <span>专注 {formatDuration(task.focusSession!.totalDuration)} · {task.focusSession!.sessionCount} 次</span>}
                  {task.dueDate && <span>{format(new Date(task.dueDate), 'MM/dd')}</span>}
                </div>
              )}
            </div>
          </div>

          {/* ── Expandable details panel ── */}
          {showDetails && (
            <div className="mt-3 space-y-3 animate-scale-in" style={{ marginLeft: '2.125rem' }}>
              {task.description && (
                <p className="text-xs text-muted-fg leading-relaxed">{task.description}</p>
              )}

              {/* Subtasks — read-only */}
              {subtasks.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium text-muted-fg mb-1.5 uppercase tracking-wide">子任务</p>
                  <div className="space-y-1">
                    {subtasks.map((st) => (
                      <div key={st.id} className="flex items-center gap-1.5">
                        <Check size={11} className="text-green-500 shrink-0" />
                        <span className="text-xs text-muted-fg line-through">{st.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Focus summary */}
              {(task.focusSession?.totalDuration ?? 0) > 0 && (
                <div>
                  <p className="text-[11px] font-medium text-muted-fg mb-1.5 uppercase tracking-wide">专注记录</p>
                  <div className="text-xs text-muted-fg flex items-center gap-1.5">
                    <Timer size={12} />
                    <span>累计 {formatDuration(task.focusSession!.totalDuration)} · {task.focusSession!.sessionCount} 次</span>
                  </div>
                </div>
              )}

              {/* Meta row */}
              <div className="flex items-center gap-2 pt-2 border-t border-black/5">
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-green-50 text-green-600">已完成</span>
                {task.dueDate && <span className="text-[11px] text-muted-fg">{format(new Date(task.dueDate), 'yyyy-MM-dd')}</span>}
                <span className="text-[11px] text-muted-fg">优先级：{task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button onClick={handleParentStatusToggle} className="text-xs px-2.5 py-1 rounded-lg bg-muted text-muted-fg hover:bg-border transition-colors">重新开始</button>
                <button onClick={onDelete} className="text-xs px-2.5 py-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors">删除</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: priorityColors[task.priority] }} />
              {parentTask && (
                <span className="text-[10px] text-muted-fg/60 bg-black/3 px-1 rounded shrink-0 mt-0.5" title={`父任务: ${parentTask.title}`}>
                  ↳{parentTask.title.slice(0, 4)}…
                </span>
              )}
              <span
                className="text-sm font-medium text-fg cursor-pointer hover:text-primary transition-colors truncate"
                onClick={() => onEditingChange(true)}
              >
                {task.title}
              </span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={handleParentStatusToggle} className="p-1 rounded hover:bg-muted transition-colors" title="切换状态">
                <Check size={13} className={isDone ? 'text-green-500' : 'text-muted-fg'} />
              </button>
              <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 transition-colors" title="删除">
                <Trash2 size={13} className="text-muted-fg hover:text-red-500" />
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-muted-fg mt-1.5 line-clamp-2 ml-3.5">{task.description}</p>
          )}

          {/* Subtask progress bar */}
          {subtasks.length > 0 && (
            <div className="mt-2 ml-3.5">
              <button
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="flex items-center gap-1.5 text-xs text-muted-fg hover:text-fg transition-colors"
              >
                {showSubtasks ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <ListChecks size={12} />
                <span>{completedSubtasks}/{subtasks.length} 子任务</span>
              </button>
              <div className="h-1 rounded-full mt-1 overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0}%`, backgroundColor: '#3b82f6' }} />
              </div>
            </div>
          )}

          {/* Subtask list (expandable) */}
          {showSubtasks && (
            <div className="mt-2 ml-3.5 space-y-1 animate-scale-in">
              {subtasks.map((st) => (
                <div key={st.id} className="flex items-center gap-1.5 group/sub">
                  <button
                    onClick={() => handleToggleSubtask(st.id)}
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${st.done ? 'bg-green-500 border-green-500' : 'border-muted-fg/40 hover:border-primary'}`}
                  >
                    {st.done && <Check size={10} className="text-white" />}
                  </button>
                  {editingSubtaskId === st.id ? (
                    <input
                      value={editingSubtaskTitle}
                      onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                      onBlur={handleSaveEditSubtask}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEditSubtask(); if (e.key === 'Escape') { setEditingSubtaskId(null); setEditingSubtaskTitle(''); }}}
                      className="flex-1 text-xs px-1.5 py-0.5 rounded border border-primary/30 bg-white/80 text-fg outline-none"
                      autoFocus
                    />
                  ) : (
                    <span className={`flex-1 text-xs text-fg cursor-text truncate ${st.done ? 'line-through opacity-40' : ''}`} onDoubleClick={() => handleStartEditSubtask(st)}>{st.title}</span>
                  )}
                  {editingSubtaskId !== st.id && (
                    <div className="flex gap-0.5 opacity-0 group-hover/sub:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => handleStartEditSubtask(st)} className="p-0.5 rounded hover:bg-muted transition-colors" title="编辑"><Pencil size={10} className="text-muted-fg" /></button>
                      <button onClick={() => handleDeleteSubtask(st.id)} className="p-0.5 rounded hover:bg-red-50 transition-colors" title="删除"><Trash2 size={10} className="text-muted-fg hover:text-red-500" /></button>
                    </div>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-1.5 pt-1">
                <div className="w-4 h-4 shrink-0" />
                <input
                  type="text"
                  placeholder={subtasks.length >= MAX_SUBTASKS ? `已达上限 ${MAX_SUBTASKS} 个` : '添加子任务...'}
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubtask(); }}
                  disabled={subtasks.length >= MAX_SUBTASKS}
                  className="flex-1 text-xs px-1.5 py-0.5 rounded border border-black/5 bg-white/50 text-fg outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                />
                {newSubtaskTitle.trim() && subtasks.length < MAX_SUBTASKS && (
                  <button onClick={handleAddSubtask} className="p-0.5 rounded hover:bg-muted transition-colors"><Plus size={12} className="text-primary" /></button>
                )}
              </div>
              {subtaskError && <p className="text-xs text-red-500 mt-1 ml-5.5">{subtaskError}</p>}
              <p className="text-xs text-muted-fg/60 mt-0.5 ml-5.5">{subtasks.length}/{MAX_SUBTASKS}</p>
            </div>
          )}

          {/* Add subtask button — hidden until hover (when collapsed) */}
          {!showSubtasks && subtasks.length < MAX_SUBTASKS && (
            <button
              onClick={() => setShowSubtasks(true)}
              className="mt-2 ml-3.5 flex items-center gap-1 text-xs text-muted-fg/60 hover:text-primary transition-all opacity-0 group-hover:opacity-100"
            >
              <Plus size={11} /> 添加子任务
            </button>
          )}

          {/* ── Focus Timer ── */}
          <div className="mt-2">
            <FocusTimer
              taskId={task.id}
              taskTitle={task.title}
              focusSession={task.focusSession}
              onSaveSession={handleSaveFocusSession}
              started={timerStarted}
              onStop={handleTimerStop}
              onRestart={handleTimerRestart}
              key={timerSessionKey}
            />
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 mt-2 ml-3.5">
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: statusLabels[task.status].color + '20', color: statusLabels[task.status].color }}>
              {statusLabels[task.status].label}
            </span>
            {childCount > 0 && (
              <span className="text-xs text-muted-fg flex items-center gap-1" title={`${childCount} 个子任务`}>
                <ListChecks size={10} /> {childCount}
              </span>
            )}
            {task.dueDate && (
              <span className="text-xs text-muted-fg flex items-center gap-1">
                <Calendar size={10} /> {format(new Date(task.dueDate), 'MM/dd')}
              </span>
            )}
          </div>

          {/* ── Timer Start Prompt Modal ── */}
          {showTimerPrompt && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={handleSkipTimer}>
              <div
                className="rounded-2xl shadow-2xl p-6 w-full max-w-xs animate-scale-in border border-black/10"
                style={{ background: '#ffffff', boxShadow: '0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.1)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#3b82f620' }}>
                    <Timer size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-fg">启动专注计时？</h3>
                    <p className="text-xs text-muted-fg mt-0.5">任务「{task.title}」</p>
                  </div>
                </div>
                {(task.focusSession?.totalDuration ?? 0) > 0 && (
                  <p className="text-xs text-muted-fg mb-4 px-3 py-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)' }}>
                    已累计专注 {formatDuration(task.focusSession!.totalDuration)}
                  </p>
                )}
                <div className="flex gap-2">
                  <button onClick={handleSkipTimer} className="flex-1 py-2.5 text-sm rounded-lg bg-muted text-muted-fg hover:bg-border transition-colors">暂不启动</button>
                  <button onClick={handleStartTimer} className="flex-1 py-2.5 text-sm rounded-lg text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                    <Play size={14} /> 开始专注
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
