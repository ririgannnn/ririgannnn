import { useState } from 'react';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useStore } from '../stores';
import ProjectForm from './ProjectForm';
import TaskView from './TaskView';
import TaskTreeView from './TaskTreeView';
import type { Project } from '../types';

export default function ProjectDetailView() {
  const {
    projects, tasks, activeProjectId, setActiveProjectId,
    updateProject, deleteProject,
  } = useStore();
  const [showEditForm, setShowEditForm] = useState(false);
  const [tab, setTab] = useState<'overview' | 'kanban'>('overview');

  const project = projects.find((p) => p.id === activeProjectId);

  if (!project || !activeProjectId) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-fg text-sm">项目不存在或已被删除</p>
        <button
          onClick={() => setActiveProjectId(null)}
          className="mt-3 text-sm font-medium underline"
          style={{ color: 'hsl(var(--primary))' }}
        >
          返回项目列表
        </button>
      </div>
    );
  }

  // Compute stats
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const totalTasks = projectTasks.length;
  const doneTasks = projectTasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = projectTasks.filter((t) => t.status === 'in-progress').length;
  const todoTasks = projectTasks.filter((t) => t.status === 'todo').length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Progress ring SVG
  const ringRadius = 38;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (progress / 100) * ringCircumference;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '未设置';
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const handleEdit = (data: Partial<Project>) => {
    updateProject(project.id, data);
    setShowEditForm(false);
  };

  const handleDelete = () => {
    if (confirm(`确定要删除项目「${project.name}」吗？项目下的任务将被保留。`)) {
      deleteProject(project.id);
      setActiveProjectId(null);
    }
  };

  const handleStatusChange = (newStatus: Project['status']) => {
    updateProject(project.id, { status: newStatus });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setActiveProjectId(null)}
          className="p-1.5 rounded-lg hover:bg-black/5 transition-colors text-muted-fg"
          title="返回项目列表"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">
              {project.icon && <span className="mr-1.5">{project.icon}</span>}
              {project.name}
            </h1>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              project.status === 'active' ? 'bg-green-100 text-green-700' :
              project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-500'
            }`}>
              {project.status === 'active' ? '进行中' :
               project.status === 'completed' ? '已完成' : '已归档'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
              project.type === 'short-term'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-indigo-100 text-indigo-700'
            }`}>
              {project.type === 'short-term' ? '短期' : '长期'}
            </span>
          </div>
          <p className="text-xs text-muted-fg mt-1">
            {formatDate(project.startDate)} — {formatDate(project.endDate)}
          </p>
        </div>

        {/* Status toggle */}
        <select
          value={project.status}
          onChange={(e) => handleStatusChange(e.target.value as Project['status'])}
          className="px-2.5 py-1.5 rounded-lg border border-black/10 text-xs font-medium bg-white/80"
        >
          <option value="active">进行中</option>
          <option value="completed">已完成</option>
          <option value="archived">归档</option>
        </select>

        <button
          onClick={() => setShowEditForm(true)}
          className="p-2 rounded-lg hover:bg-black/5 transition-colors text-muted-fg"
          title="编辑"
        >
          <Edit size={17} />
        </button>
        <button
          onClick={handleDelete}
          className="p-2 rounded-lg hover:bg-red-50 transition-colors text-muted-fg hover:text-red-500"
          title="删除"
        >
          <Trash2 size={17} />
        </button>
      </div>

      {/* Progress Overview */}
      <div
        className="rounded-xl border border-black/5 p-5 mb-5"
        style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-6">
          {/* Progress ring */}
          <div className="relative w-24 h-24 shrink-0">
            <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
              <circle cx="48" cy="48" r={ringRadius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="8" />
              <circle
                cx="48" cy="48" r={ringRadius} fill="none"
                stroke={project.coverColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold" style={{ color: project.coverColor }}>{progress}%</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 flex-1">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalTasks}</div>
              <div className="text-[11px] text-muted-fg">总任务</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{doneTasks}</div>
              <div className="text-[11px] text-muted-fg">已完成</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{inProgressTasks}</div>
              <div className="text-[11px] text-muted-fg">进行中</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-fg">{todoTasks}</div>
              <div className="text-[11px] text-muted-fg">待办</div>
            </div>
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <p className="mt-4 text-sm text-muted-fg border-t border-black/5 pt-4">{project.description}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-black/5 pb-2">
        <button
          onClick={() => setTab('overview')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            tab === 'overview'
              ? 'bg-black/5 text-fg'
              : 'text-muted-fg hover:text-fg'
          }`}
        >
          任务列表
        </button>
        <button
          onClick={() => setTab('kanban')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            tab === 'kanban'
              ? 'bg-black/5 text-fg'
              : 'text-muted-fg hover:text-fg'
          }`}
        >
          看板
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'kanban' ? (
        <div className="animate-scale-in">
          <TaskView projectId={activeProjectId} />
        </div>
      ) : (
        <div className="animate-scale-in">
          <TaskTreeView projectId={activeProjectId} />
        </div>
      )}

      {/* Edit Form Modal */}
      {showEditForm && (
        <ProjectForm
          initial={project}
          onSave={handleEdit}
          onCancel={() => setShowEditForm(false)}
        />
      )}
    </div>
  );
}
