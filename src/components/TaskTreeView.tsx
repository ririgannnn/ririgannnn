import { useState, useMemo, useCallback } from 'react';
import { useStore } from '../stores';
import type { Task, TaskStatus, TaskPriority } from '../types';
import { Plus, Trash2, Search, ChevronDown, ChevronRight, Check, Pencil, X, GitBranch, AlertTriangle } from 'lucide-react';

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

interface TreeNode {
  task: Task;
  children: TreeNode[];
}

function buildTaskTree(tasks: Task[], parentId: string | null = null): TreeNode[] {
  return tasks
    .filter((t) => (parentId === null ? !t.parentId : t.parentId === parentId))
    .map((t) => ({
      task: t,
      children: buildTaskTree(tasks, t.id),
    }));
}

/** Collect all descendant IDs of a task */
function getDescendantIds(tasks: Task[], taskId: string): Set<string> {
  const ids = new Set<string>();
  const walk = (parentId: string) => {
    tasks.forEach((t) => {
      if (t.parentId === parentId) {
        ids.add(t.id);
        walk(t.id);
      }
    });
  };
  walk(taskId);
  return ids;
}

export default function TaskTreeView({ projectId }: { projectId?: string }) {
  const { tasks, projects, addTask, updateTask, deleteTask } = useStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // New task form
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [parentId, setParentId] = useState<string>('');

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string; childCount: number } | null>(null);

  // Filter tasks
  const scopeTasks = useMemo(() => {
    return projectId ? tasks.filter((t) => t.projectId === projectId) : tasks;
  }, [tasks, projectId]);

  const filtered = useMemo(() => {
    return scopeTasks
      .filter((t) => filter === 'all' || t.status === filter)
      .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
  }, [scopeTasks, filter, search]);

  // Build tree from filtered tasks (only root nodes visible at top level)
  const tree = useMemo(() => buildTaskTree(filtered, null), [filtered]);

  // Available parent tasks (exclude self when editing)
  const availableParents = useMemo(() => {
    return scopeTasks.filter((t) => t.status !== 'done');
  }, [scopeTasks]);

  const handleAdd = () => {
    if (!title.trim()) return;
    addTask({
      title, description: desc, status: 'todo', priority,
      dueDate: null, tags: [], subtasks: [],
      projectId: projectId || null,
      parentId: parentId || null,
    });
    setTitle(''); setDesc(''); setPriority('medium'); setParentId(''); setShowForm(false);
  };

  const handleDelete = (taskId: string, taskTitle: string) => {
    const descendants = getDescendantIds(scopeTasks, taskId);
    if (descendants.size > 0) {
      setDeleteConfirm({ id: taskId, title: taskTitle, childCount: descendants.size });
    } else {
      deleteTask(taskId);
    }
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteTask(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  // Total counts
  const totalCount = filtered.length;
  const doneCount = filtered.filter((t) => t.status === 'done').length;

  return (
    <div className="space-y-4">
      {/* Search & Filter bar */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
          <input
            type="text" placeholder="搜索任务..."
            value={search}
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

        <span className="text-xs text-muted-fg ml-auto">
          {doneCount}/{totalCount} 已完成
        </span>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-fg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> 新建任务
        </button>
      </div>

      {/* Tree */}
      <div
        className="rounded-xl border border-black/5 p-4"
        style={{
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(12px) saturate(130%)',
          WebkitBackdropFilter: 'blur(12px) saturate(130%)',
        }}
      >
        {tree.length === 0 ? (
          <div className="text-center py-16">
            <GitBranch size={40} className="mx-auto mb-3 text-muted-fg opacity-25" />
            <p className="text-sm text-muted-fg">
              {search || filter !== 'all' ? '没有匹配的任务' : '还没有任务，点击上方按钮创建'}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {tree.map((node) => (
              <TreeItem
                key={node.task.id}
                node={node}
                depth={0}
                allTasks={scopeTasks}
                onUpdate={(id, partial) => updateTask(id, partial)}
                onDelete={handleDelete}
                editingId={editingId}
                editTitle={editTitle}
                onStartEdit={(id, title) => { setEditingId(id); setEditTitle(title); }}
                onSaveEdit={(id) => { updateTask(id, { title: editTitle }); setEditingId(null); }}
                onCancelEdit={() => setEditingId(null)}
                onEditTitleChange={setEditTitle}
                onAddSubtask={(parentTaskId) => {
                  addTask({
                    title: '新子任务', description: '', status: 'todo', priority: 'medium',
                    dueDate: null, tags: [], subtasks: [],
                    projectId: projectId || null,
                    parentId: parentTaskId,
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
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
            <div className="flex gap-2 mb-3">
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

            {/* Parent task selector */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-muted-fg mb-1.5">父任务（可选）</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border bg-white/80 text-fg outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">无（根任务）</option>
                {availableParents.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.status === 'done' ? '✓ ' : ''}{t.title}
                  </option>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div
            className="rounded-2xl shadow-xl p-6 w-full max-w-sm animate-scale-in border border-black/5"
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(24px) saturate(150%)',
              WebkitBackdropFilter: 'blur(24px) saturate(150%)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-fg">确认删除？</h3>
                <p className="text-sm text-muted-fg mt-1">
                  任务「<strong>{deleteConfirm.title}</strong>」有 <strong className="text-red-500">{deleteConfirm.childCount}</strong> 个子任务，删除后将一并移除。
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 text-sm rounded-lg bg-muted text-muted-fg hover:bg-border transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 text-sm rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Recursive Tree Item ──

function TreeItem({
  node, depth, allTasks, onUpdate, onDelete,
  editingId, editTitle, onStartEdit, onSaveEdit, onCancelEdit, onEditTitleChange, onAddSubtask,
}: {
  node: TreeNode;
  depth: number;
  allTasks: Task[];
  onUpdate: (id: string, partial: Partial<Task>) => void;
  onDelete: (id: string, title: string) => void;
  editingId: string | null;
  editTitle: string;
  onStartEdit: (id: string, title: string) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onEditTitleChange: (v: string) => void;
  onAddSubtask: (parentId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [hover, setHover] = useState(false);
  const { task, children } = node;
  const hasChildren = children.length > 0;
  const isEditing = editingId === task.id;
  const isDone = task.status === 'done';

  const nextStatus = (current: TaskStatus): TaskStatus => {
    if (current === 'todo') return 'in-progress';
    if (current === 'in-progress') return 'done';
    return 'todo';
  };

  const handleStatusToggle = () => {
    onUpdate(task.id, { status: nextStatus(task.status) });
  };

  // Descendant count for parents
  const descendantCount = useMemo(() => getDescendantIds(allTasks, task.id).size, [allTasks, task.id]);

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-2 rounded-lg transition-colors group"
        style={{
          paddingLeft: `${12 + depth * 24}px`,
          background: hover ? 'rgba(255,255,255,0.6)' : 'transparent',
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* Expand/Collapse or placeholder */}
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors text-muted-fg"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <div className="w-[22px] shrink-0" />
        )}

        {/* Status dot */}
        <button
          onClick={handleStatusToggle}
          className="shrink-0 w-3 h-3 rounded-full border-2 transition-colors"
          style={{
            backgroundColor: isDone ? statusLabels.done.color : 'transparent',
            borderColor: statusLabels[task.status].color,
          }}
          title="切换状态"
        />

        {/* Title */}
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <input
              value={editTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit(task.id);
                if (e.key === 'Escape') onCancelEdit();
              }}
              className="flex-1 text-sm font-medium px-2 py-0.5 rounded border border-primary/30 bg-white/80 text-fg outline-none"
              autoFocus
            />
            <button onClick={() => onSaveEdit(task.id)} className="p-1 rounded hover:bg-green-50"><Check size={14} className="text-green-500" /></button>
            <button onClick={onCancelEdit} className="p-1 rounded hover:bg-red-50"><X size={14} className="text-red-400" /></button>
          </div>
        ) : (
          <span
            className={`flex-1 text-sm text-fg cursor-pointer truncate min-w-0 ${isDone ? 'line-through opacity-50' : ''}`}
            onClick={() => onStartEdit(task.id, task.title)}
            title={task.title}
          >
            {task.title}
          </span>
        )}

        {/* Child count badge */}
        {hasChildren && (
          <span className="text-[11px] text-muted-fg bg-black/5 px-1.5 py-0.5 rounded-full shrink-0">
            {descendantCount}
          </span>
        )}

        {/* Priority badge */}
        <span
          className="text-[10px] font-semibold w-5 h-5 rounded flex items-center justify-center shrink-0"
          style={{ backgroundColor: priorityColors[task.priority] + '18', color: priorityColors[task.priority] }}
        >
          {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
        </span>

        {/* Status badge */}
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 hidden sm:inline"
          style={{ backgroundColor: statusLabels[task.status].color + '18', color: statusLabels[task.status].color }}
        >
          {statusLabels[task.status].label}
        </span>

        {/* Actions (show on hover) */}
        <div className={`flex items-center gap-0.5 shrink-0 transition-opacity ${hover ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={() => onAddSubtask(task.id)}
            className="p-1 rounded hover:bg-blue-50 transition-colors"
            title="添加子任务"
          >
            <Plus size={13} className="text-blue-500" />
          </button>
          <button
            onClick={() => onDelete(task.id, task.title)}
            className="p-1 rounded hover:bg-red-50 transition-colors"
            title="删除"
          >
            <Trash2 size={13} className="text-muted-fg hover:text-red-500" />
          </button>
        </div>
      </div>

      {/* Children (recursive) */}
      {hasChildren && expanded && (
        <div>
          {children.map((child) => (
            <TreeItem
              key={child.task.id}
              node={child}
              depth={depth + 1}
              allTasks={allTasks}
              onUpdate={onUpdate}
              onDelete={onDelete}
              editingId={editingId}
              editTitle={editTitle}
              onStartEdit={onStartEdit}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onEditTitleChange={onEditTitleChange}
              onAddSubtask={onAddSubtask}
            />
          ))}
        </div>
      )}

      {/* Tree connector line (when collapsed with children) */}
      {hasChildren && !expanded && (
        <div
          className="text-[10px] text-muted-fg/50 pl-2"
          style={{ paddingLeft: `${12 + (depth + 1) * 24}px` }}
        >
          {descendantCount} 个子任务已折叠
        </div>
      )}
    </div>
  );
}
