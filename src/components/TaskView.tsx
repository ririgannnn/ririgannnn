import { useState, useRef, useEffect } from 'react';
import { useStore } from '../stores';
import type { Task, TaskStatus, TaskPriority, SubTask } from '../types';
import { format } from 'date-fns';
import { Plus, Trash2, Search, Calendar, ChevronUp, ChevronDown, ChevronRight, Check, Pencil, X, ListChecks, Timer, Play } from 'lucide-react';
import FocusTimer, { stopTaskTimer } from './FocusTimer';

const statusLabels: Record<TaskStatus, { label: string; color: string }> = {
  'todo': { label: '待办', color: 'var(--accent-warm)' },
  'in-progress': { label: '进行中', color: 'var(--kon-dark)' },
  'done': { label: '已完成', color: 'var(--accent-teal)' },
};

const priorityColors: Record<TaskPriority, string> = {
  high: 'var(--accent-orange)',
  medium: 'var(--accent-warm)',
  low: 'var(--text-dim)',
};

const statusBgMap: Record<TaskStatus, string> = {
  'todo': '#b8a08818',
  'in-progress': '#99a7bc18',
  'done': '#4a8a7a18',
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

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [taskProjectId, setTaskProjectId] = useState<string>(projectId || '');
  const [taskParentId, setTaskParentId] = useState<string>('');

  useEffect(() => {
    if (projectId) setTaskProjectId(projectId);
  }, [projectId]);

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
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-xs font-medium transition-all"
            style={{
              background: 'linear-gradient(135deg, var(--kon-dark), var(--kon-deeper))',
              boxShadow: '0 2px 8px rgba(153,167,188,0.25)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Plus size={16} /> 新建任务
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text" placeholder="搜索任务..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              fontSize: '13px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--line)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'all 0.3s var(--ease-smooth)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--kon-main)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(153,167,188,0.12)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>

        {!projectId && (
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--line)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
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
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              borderRadius: 'var(--radius-md)',
              fontWeight: filter === s ? 500 : 400,
              border: filter === s ? '1px solid var(--kon-main)' : '1px solid var(--line)',
              background: filter === s ? 'rgba(153,167,188,0.12)' : 'var(--bg-surface)',
              color: filter === s ? 'var(--kon-deeper)' : 'var(--text-dim)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {s === 'all' ? '全部' : statusLabels[s].label}
          </button>
        ))}
        {projectId && (
          <button
            onClick={() => setShowForm(true)}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 500, borderRadius: 'var(--radius-md)', color: '#fff', background: 'linear-gradient(135deg, var(--kon-dark), var(--kon-deeper))', border: 'none', cursor: 'pointer' }}
          >
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
              style={{
                borderRadius: 'var(--radius-lg)',
                padding: '12px',
                border: '1px solid var(--line)',
                background: 'var(--bg-deep)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', padding: '0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col === 'done' ? '#86efac' : statusLabels[col].color }} />
                  <span className="font-serif-cn" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                    {statusLabels[col].label}
                  </span>
                </div>
                <span style={{
                  fontSize: '11px',
                  color: 'var(--text-dim)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--line)',
                }}>
                  {colTasks.length}
                </span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={() => setShowForm(false)}>
          <div
            className="card-surface animate-scale-in"
            style={{ padding: '24px', width: '100%', maxWidth: '440px', cursor: 'default' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-serif-cn text-lg font-semibold text-fg mb-4">{projectId ? '新增任务' : '新建任务'}</h2>
            <input
              type="text" placeholder="任务标题" value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-xs outline-none focus:ring-2 transition-all mb-3"
              style={{ border: '1px solid var(--line)', background: 'var(--bg-deep)', color: 'var(--text-primary)' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--kon-main)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(153,167,188,0.12)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'none'; }}
              autoFocus
            />
            <textarea
              placeholder="任务描述（可选）" value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-xs outline-none focus:ring-2 transition-all mb-3 h-20 resize-none"
              style={{ border: '1px solid var(--line)', background: 'var(--bg-deep)', color: 'var(--text-primary)' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--kon-main)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(153,167,188,0.12)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            <div className="flex gap-2 mb-4">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className="flex-1 py-1.5 rounded-md text-[10px] border transition-all"
                  style={{
                    background: priority === p ? priorityColors[p] : 'var(--bg-surface)',
                    color: priority === p ? '#fff' : 'var(--text-dim)',
                    borderColor: priority === p ? priorityColors[p] : 'var(--line)',
                  }}
                >
                  {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                </button>
              ))}
            </div>
            {/* Project selector */}
            <div className="mb-4">
              <label className="block text-[10px] font-semibold text-fg-mid mb-1.5">所属项目</label>
              <select
                value={taskProjectId}
                onChange={(e) => setTaskProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                style={{ border: '1px solid var(--line)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              >
                <option value="">无项目</option>
                {projects.filter((p) => p.status === 'active').map((p) => (
                  <option key={p.id} value={p.id}>{p.icon}{p.name}</option>
                ))}
              </select>
            </div>
            {/* Parent task selector */}
            <div className="mb-4">
              <label className="block text-[10px] font-semibold text-fg-mid mb-1.5">父任务（可选）</label>
              <select
                value={taskParentId}
                onChange={(e) => setTaskParentId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                style={{ border: '1px solid var(--line)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
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
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-xs rounded-lg transition-colors"
                style={{ background: 'var(--bg-deep)', color: 'var(--text-dim)' }}
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 text-xs rounded-lg text-white font-medium transition-all"
                style={{ background: 'linear-gradient(135deg, var(--kon-dark), var(--kon-deeper))' }}
              >
                创建
              </button>
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
  const [showTimer, setShowTimer] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');
  const [subtaskError, setSubtaskError] = useState('');
  const [showTimerPrompt, setShowTimerPrompt] = useState(false);
  const hasAutoStartedRef = useRef(false);
  const [showDetails, setShowDetails] = useState(false);

  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  const completedSubtasks = subtasks.filter((st) => st.done).length;
  const isDone = task.status === 'done';

  const nextStatus = (current: TaskStatus): TaskStatus => {
    if (current === 'todo') return 'in-progress';
    if (current === 'in-progress') return 'done';
    return 'todo';
  };

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
    onUpdate({ subtasks: updated });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const updated = subtasks.filter((st) => st.id !== subtaskId);
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

  const handleParentStatusToggle = () => {
    const next = nextStatus(task.status);
    if (next === 'in-progress') {
      setShowTimerPrompt(true);
    } else if (next === 'done') {
      stopTaskTimer(task.id);
      if (subtasks.length > 0) {
        const updated = subtasks.map((st) => ({ ...st, done: true }));
        onUpdate({ status: 'done', subtasks: updated });
      } else {
        onUpdate({ status: 'done' });
      }
    } else if (task.status === 'done') {
      onUpdate({ status: next });
    } else {
      onUpdate({ status: next });
    }
  };

  const handleStartTimer = () => {
    setShowTimerPrompt(false);
    setShowTimer(true);
    useStore.getState().startTimer(task.id, task.title);
    onUpdate({ status: 'in-progress' });
  };

  const handleSkipTimer = () => {
    setShowTimerPrompt(false);
    onUpdate({ status: 'in-progress' });
  };

  return (
    <div
      className="rounded-xl border overflow-hidden transition-shadow group"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--line)',
        boxShadow: 'var(--shadow-xs)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}
    >
      {project && (
        <div className="h-0.5 w-full" style={{ backgroundColor: project.coverColor }} />
      )}
      <div className="p-3">
      {isEditing ? (
        <div className="space-y-2">
          <input
            value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
            className="w-full text-xs font-medium px-2 py-1 rounded border outline-none"
            style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)', borderColor: 'var(--line)' }}
            autoFocus
          />
          <textarea
            value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
            className="w-full text-[10px] px-2 py-1 rounded border outline-none h-16 resize-none"
            style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)', borderColor: 'var(--line)' }}
          />
          <div className="flex gap-1 justify-end">
            <button
              onClick={() => onEditingChange(false)}
              className="px-2 py-1 text-[10px] rounded"
              style={{ background: 'var(--bg-deep)', color: 'var(--text-dim)' }}
            >取消</button>
            <button
              onClick={() => { onEdit({ title: editTitle, description: editDesc }); onEditingChange(false); }}
              className="px-2 py-1 text-[10px] rounded text-white"
              style={{ background: 'var(--kon-dark)' }}
            >保存</button>
          </div>
        </div>
      ) : isDone ? (
        <div className="p-3">
          <div className="flex items-start gap-3">
            <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ backgroundColor: '#86efac' }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-medium leading-relaxed" style={{ opacity: 0.55, textDecoration: 'line-through', color: 'var(--text-primary)' }}>
                  {task.title}
                </span>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="ml-auto p-1 rounded hover:bg-black/5 transition-colors shrink-0"
                  style={{ color: 'var(--text-dim)' }}
                  title={showDetails ? '收起详情' : '展开详情'}
                >
                  {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
              {!showDetails && (
                <div className="text-[10px] mt-1.5 flex items-center gap-2 flex-wrap" style={{ color: 'var(--text-dim)' }}>
                  {subtasks.length > 0 && <span>{completedSubtasks}/{subtasks.length} 子任务</span>}
                  {(task.focusSession?.totalDuration ?? 0) > 0 && <span>专注 {formatDuration(task.focusSession!.totalDuration)} · {task.focusSession!.sessionCount} 次</span>}
                  {task.dueDate && <span>{format(new Date(task.dueDate), 'MM/dd')}</span>}
                </div>
              )}
            </div>
          </div>

          {showDetails && (
            <div className="mt-3 space-y-3 animate-scale-in" style={{ marginLeft: '1.25rem' }}>
              {task.description && (
                <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-mid)' }}>{task.description}</p>
              )}
              {subtasks.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>子任务</p>
                  <div className="space-y-1">
                    {subtasks.map((st) => (
                      <div key={st.id} className="flex items-center gap-1.5">
                        <Check size={11} className="text-green-500 shrink-0" />
                        <span className="text-[10px] line-through" style={{ color: 'var(--text-dim)' }}>{st.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(task.focusSession?.totalDuration ?? 0) > 0 && (
                <div>
                  <p className="text-[10px] font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>专注记录</p>
                  <div className="text-[10px] flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
                    <Timer size={12} />
                    <span>累计 {formatDuration(task.focusSession!.totalDuration)} · {task.focusSession!.sessionCount} 次</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(74,138,122,0.1)', color: 'var(--accent-teal)' }}>已完成</span>
                {task.dueDate && <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{format(new Date(task.dueDate), 'yyyy-MM-dd')}</span>}
                <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>优先级：{task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button onClick={handleParentStatusToggle} className="text-[10px] px-2.5 py-1 rounded-lg transition-colors" style={{ background: 'var(--bg-deep)', color: 'var(--text-dim)' }}>重新开始</button>
                <button onClick={onDelete} className="text-[10px] px-2.5 py-1 rounded-lg transition-colors" style={{ color: 'var(--accent-orange)' }}>删除</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: priorityColors[task.priority] }} />
              {parentTask && (
                <span className="text-[10px] bg-black/3 px-1 rounded shrink-0 mt-0.5" style={{ color: 'var(--text-dim)' }} title={`父任务: ${parentTask.title}`}>
                  ↳{parentTask.title.slice(0, 4)}…
                </span>
              )}
              <span
                className="text-xs font-medium cursor-pointer truncate transition-colors"
                style={{ color: 'var(--text-primary)' }}
                onClick={() => onEditingChange(true)}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--kon-dark)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              >
                {task.title}
              </span>
            </div>
            <div className="flex gap-1 shrink-0">
              {task.status === 'in-progress' && (
                <button
                  onClick={handleParentStatusToggle}
                  className="flex items-center gap-1 px-2 py-1 rounded border text-[10px] transition-all hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)]"
                  style={{ borderColor: 'var(--line)', color: 'var(--text-dim)' }}
                  title="标记完成"
                >
                  <Check size={12} /> 完成
                </button>
              )}
              {task.status === 'todo' && (
                <button
                  onClick={handleParentStatusToggle}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all hover:opacity-90"
                  style={{ background: 'var(--accent-orange)', color: 'white' }}
                  title="开始任务"
                >
                  <Play size={11} /> 开始
                </button>
              )}
              <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100" title="删除">
                <Trash2 size={13} style={{ color: 'var(--text-dim)' }} />
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-[10px] mt-1.5 line-clamp-2 ml-3.5" style={{ color: 'var(--text-dim)' }}>{task.description}</p>
          )}


          {showSubtasks && (
            <div className="mt-2 ml-3.5 space-y-1 animate-scale-in">
              {subtasks.length > 0 && (
                <div className="h-1 rounded-full overflow-hidden mb-1" style={{ background: 'var(--bg-deep)' }}>
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0}%`, background: 'var(--kon-main)' }} />
                </div>
              )}
              {subtasks.map((st) => (
                <div key={st.id} className="flex items-center gap-1.5 group/sub">
                  <button
                    onClick={() => handleToggleSubtask(st.id)}
                    className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all"
                    style={{
                      background: st.done ? 'var(--accent-teal)' : 'transparent',
                      borderColor: st.done ? 'var(--accent-teal)' : 'var(--text-dim)',
                    }}
                  >
                    {st.done && <Check size={10} className="text-white" />}
                  </button>
                  {editingSubtaskId === st.id ? (
                    <input
                      value={editingSubtaskTitle}
                      onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                      onBlur={handleSaveEditSubtask}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEditSubtask(); if (e.key === 'Escape') { setEditingSubtaskId(null); setEditingSubtaskTitle(''); }}}
                      className="flex-1 text-[10px] px-1.5 py-0.5 rounded border outline-none"
                      style={{ borderColor: 'var(--kon-main)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="flex-1 text-[10px] cursor-text truncate"
                      style={{ color: 'var(--text-primary)', textDecoration: st.done ? 'line-through' : 'none', opacity: st.done ? 0.4 : 1 }}
                      onDoubleClick={() => handleStartEditSubtask(st)}
                    >
                      {st.title}
                    </span>
                  )}
                  {editingSubtaskId !== st.id && (
                    <div className="flex gap-0.5 opacity-0 group-hover/sub:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => handleStartEditSubtask(st)} className="p-0.5 rounded hover:bg-black/5 transition-colors" title="编辑"><Pencil size={10} style={{ color: 'var(--text-dim)' }} /></button>
                      <button onClick={() => handleDeleteSubtask(st.id)} className="p-0.5 rounded hover:bg-red-50 transition-colors" title="删除"><Trash2 size={10} style={{ color: 'var(--text-dim)' }} /></button>
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
                  className="flex-1 text-[10px] px-1.5 py-0.5 rounded border outline-none focus:ring-1 disabled:opacity-50"
                  style={{ borderColor: 'var(--line)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--kon-main)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; }}
                />
                {newSubtaskTitle.trim() && subtasks.length < MAX_SUBTASKS && (
                  <button onClick={handleAddSubtask} className="p-0.5 rounded hover:bg-black/5 transition-colors"><Plus size={12} style={{ color: 'var(--kon-dark)' }} /></button>
                )}
              </div>
              {subtaskError && <p className="text-[10px] text-red-500 mt-1 ml-5.5">{subtaskError}</p>}
              <p className="text-[10px] mt-0.5 ml-5.5" style={{ color: 'var(--text-dim)' }}>{subtasks.length}/{MAX_SUBTASKS}</p>
            </div>
          )}


          <div className="flex items-center gap-2 mt-2 ml-3.5 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: statusBgMap[task.status], color: statusLabels[task.status].color }}>
              {statusLabels[task.status].label}
            </span>

            {/* 子任务下拉 */}
            <button
              onClick={() => setShowSubtasks(!showSubtasks)}
              className="text-[10px] flex items-center gap-1 transition-colors"
              style={{ color: 'var(--text-dim)' }}
            >
              <ListChecks size={10} />
              {subtasks.length > 0 ? `${completedSubtasks}/${subtasks.length}` : '子任务'}
              {showSubtasks ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            </button>

            {/* 专注计时 */}
            <button
              onClick={() => setShowTimer(!showTimer)}
              className="text-[10px] flex items-center gap-1 transition-colors"
              style={{ color: 'var(--text-dim)' }}
            >
              <Timer size={10} />
              {(task.focusSession?.totalDuration ?? 0) > 0
                ? `${formatDuration(task.focusSession!.totalDuration)} · ${(task.focusSession?.sessions ?? []).length}次`
                : '专注'}
            </button>

            {childCount > 0 && (
              <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-dim)' }} title={`${childCount} 个子任务`}>
                <ListChecks size={10} /> {childCount}
              </span>
            )}
            {task.dueDate && (
              <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-dim)' }}>
                <Calendar size={10} /> {format(new Date(task.dueDate), 'MM/dd')}
              </span>
            )}
          </div>

          {/* FocusTimer — 可选项，默认隐藏 */}
          {showTimer && (
            <div className="mt-2">
              <FocusTimer
                taskId={task.id}
                taskTitle={task.title}
                focusSession={task.focusSession}
              />
            </div>
          )}

          {/* Timer Start Prompt Modal */}
          {showTimerPrompt && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={handleSkipTimer}>
              <div
                className="card-surface rounded-2xl p-6 w-full max-w-xs animate-scale-in"
                style={{ boxShadow: 'var(--shadow-xl)', cursor: 'default' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(153,167,188,0.15)' }}>
                    <Timer size={20} style={{ color: 'var(--kon-dark)' }} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-fg">启动专注计时？</h3>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-dim)' }}>任务「{task.title}」</p>
                  </div>
                </div>
                {(task.focusSession?.totalDuration ?? 0) > 0 && (
                  <p className="text-[10px] mb-4 px-3 py-2 rounded-lg" style={{ color: 'var(--text-dim)', background: 'var(--bg-deep)' }}>
                    已累计专注 {formatDuration(task.focusSession!.totalDuration)}
                  </p>
                )}
                <div className="flex gap-2">
                  <button onClick={handleSkipTimer} className="flex-1 py-2.5 text-xs rounded-lg transition-colors" style={{ background: 'var(--bg-deep)', color: 'var(--text-dim)' }}>暂不启动</button>
                  <button onClick={handleStartTimer} className="flex-1 py-2.5 text-xs rounded-lg text-white font-medium transition-all flex items-center justify-center gap-1.5" style={{ background: 'linear-gradient(135deg, var(--accent-orange), var(--accent-rust))' }}>
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
