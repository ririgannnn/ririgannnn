import { useState, useMemo, useCallback } from 'react';
import { useStore } from '../stores';
import type { Task, TaskStatus, TaskPriority } from '../types';
import { Plus, Trash2, Search, ChevronDown, ChevronRight, Check, Pencil, X, GitBranch, AlertTriangle } from 'lucide-react';

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

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [parentId, setParentId] = useState<string>('');

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string; childCount: number } | null>(null);

  const scopeTasks = useMemo(() => {
    return projectId ? tasks.filter((t) => t.projectId === projectId) : tasks;
  }, [tasks, projectId]);

  const filtered = useMemo(() => {
    return scopeTasks
      .filter((t) => filter === 'all' || t.status === filter)
      .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
  }, [scopeTasks, filter, search]);

  const tree = useMemo(() => buildTaskTree(filtered, null), [filtered]);

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

  const totalCount = filtered.length;
  const doneCount = filtered.filter((t) => t.status === 'done').length;

  const inputStyle: React.CSSProperties = {
    border: '1px solid var(--line)',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text" placeholder="搜索任务..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none"
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--kon-main)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(153,167,188,0.12)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>

        {(['all', 'todo', 'in-progress', 'done'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="px-3 py-1.5 text-sm rounded-md transition-colors"
            style={{
              background: filter === s ? 'rgba(153,167,188,0.12)' : 'var(--bg-deep)',
              color: filter === s ? 'var(--kon-deeper)' : 'var(--text-dim)',
              fontWeight: filter === s ? 500 : 400,
            }}
          >
            {s === 'all' ? '全部' : statusLabels[s].label}
          </button>
        ))}

        <span className="text-xs ml-auto" style={{ color: 'var(--text-dim)' }}>
          {doneCount}/{totalCount} 已完成
        </span>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all"
          style={{ background: 'linear-gradient(135deg, var(--kon-dark), var(--kon-deeper))' }}
        >
          <Plus size={16} /> 新建任务
        </button>
      </div>

      <div className="rounded-xl border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--line)' }}>
        {tree.length === 0 ? (
          <div className="text-center py-16">
            <GitBranch size={40} className="mx-auto mb-3 opacity-25" style={{ color: 'var(--text-dim)' }} />
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={() => setShowForm(false)}>
          <div className="card-surface p-6 w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold font-serif-cn text-fg mb-4">新建任务</h2>
            <input
              type="text" placeholder="任务标题" value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none mb-3"
              style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)', borderColor: 'var(--line)' }}
              autoFocus
            />
            <textarea
              placeholder="任务描述（可选）" value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none mb-3 h-20 resize-none"
              style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)', borderColor: 'var(--line)' }}
            />
            <div className="flex gap-2 mb-3">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className="flex-1 py-1.5 text-xs rounded-md border transition-all"
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

            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-dim)' }}>父任务（可选）</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', borderColor: 'var(--line)' }}
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
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg transition-colors" style={{ background: 'var(--bg-deep)', color: 'var(--text-dim)' }}>取消</button>
              <button onClick={handleAdd} className="px-4 py-2 text-sm rounded-lg text-white font-medium" style={{ background: 'var(--kon-dark)' }}>创建</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={() => setDeleteConfirm(null)}>
          <div className="card-surface p-6 w-full max-w-sm animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(216,107,66,0.12)' }}>
                <AlertTriangle size={20} style={{ color: 'var(--accent-orange)' }} />
              </div>
              <div>
                <h3 className="text-base font-bold text-fg">确认删除？</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-mid)' }}>
                  任务「<strong>{deleteConfirm.title}</strong>」有 <strong style={{ color: 'var(--accent-orange)' }}>{deleteConfirm.childCount}</strong> 个子任务，删除后将一并移除。
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 text-sm rounded-lg transition-colors" style={{ background: 'var(--bg-deep)', color: 'var(--text-dim)' }}>取消</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 text-sm rounded-lg text-white font-medium transition-colors" style={{ background: 'var(--accent-orange)' }}>确认删除</button>
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

  const descendantCount = useMemo(() => getDescendantIds(allTasks, task.id).size, [allTasks, task.id]);

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-2 rounded-lg transition-colors group"
        style={{
          paddingLeft: `${12 + depth * 24}px`,
          background: hover ? 'var(--bg-deep)' : 'transparent',
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors" style={{ color: 'var(--text-dim)' }}>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <div className="w-[22px] shrink-0" />
        )}

        <button
          onClick={handleStatusToggle}
          className="shrink-0 w-3 h-3 rounded-full border-2 transition-colors"
          style={{
            backgroundColor: isDone ? statusLabels.done.color : 'transparent',
            borderColor: statusLabels[task.status].color,
          }}
          title="切换状态"
        />

        {isEditing ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <input
              value={editTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSaveEdit(task.id); if (e.key === 'Escape') onCancelEdit(); }}
              className="flex-1 font-serif-cn font-medium px-2 py-0.5 rounded border outline-none"
              style={{ borderColor: 'var(--kon-main)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '16px' }}
              autoFocus
            />
            <button onClick={() => onSaveEdit(task.id)} className="p-1 rounded hover:bg-green-50"><Check size={14} className="text-green-500" /></button>
            <button onClick={onCancelEdit} className="p-1 rounded hover:bg-red-50"><X size={14} className="text-red-400" /></button>
          </div>
        ) : (
          <span
            className="flex-1 font-serif-cn cursor-pointer truncate min-w-0"
            style={{ color: isDone ? 'var(--text-dim)' : 'var(--text-primary)', textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.5 : 1, fontSize: '16px' }}
            onClick={() => onStartEdit(task.id, task.title)}
            title={task.title}
          >
            {task.title}
          </span>
        )}

        {hasChildren && (
          <span className="text-[11px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: 'var(--bg-deep)', color: 'var(--text-dim)' }}>
            {descendantCount}
          </span>
        )}

        <span
          className="text-[10px] font-semibold w-5 h-5 rounded flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${priorityColors[task.priority]}18`, color: priorityColors[task.priority] }}
        >
          {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
        </span>

        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 hidden sm:inline"
          style={{ backgroundColor: `${statusLabels[task.status].color}18`, color: statusLabels[task.status].color }}
        >
          {statusLabels[task.status].label}
        </span>

        <div className={`flex items-center gap-0.5 shrink-0 transition-opacity ${hover ? 'opacity-100' : 'opacity-0'}`}>
          <button onClick={() => onAddSubtask(task.id)} className="p-1 rounded hover:bg-blue-50 transition-colors" title="添加子任务">
            <Plus size={13} style={{ color: 'var(--kon-dark)' }} />
          </button>
          <button onClick={() => onDelete(task.id, task.title)} className="p-1 rounded hover:bg-red-50 transition-colors" title="删除">
            <Trash2 size={13} style={{ color: 'var(--text-dim)' }} />
          </button>
        </div>
      </div>

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

      {hasChildren && !expanded && (
        <div className="text-[10px] pl-2" style={{ color: 'var(--text-dim)', paddingLeft: `${12 + (depth + 1) * 24}px` }}>
          {descendantCount} 个子任务已折叠
        </div>
      )}
    </div>
  );
}
