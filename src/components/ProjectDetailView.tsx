import { useState } from 'react';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useStore } from '../stores';
import ProjectForm from './ProjectForm';
import TaskView from './TaskView';
import TaskTreeView from './TaskTreeView';
import GanttChart from './GanttChart';
import type { Project } from '../types';

export default function ProjectDetailView() {
  const {
    projects, tasks, activeProjectId, setActiveProjectId,
    updateProject, deleteProject,
  } = useStore();
  const [showEditForm, setShowEditForm] = useState(false);
  const [tab, setTab] = useState<'overview' | 'kanban' | 'gantt'>('overview');

  const project = projects.find((p) => p.id === activeProjectId);

  if (!project || !activeProjectId) {
    return (
      <div className="text-center py-20">
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>项目不存在或已被删除</p>
        <button
          onClick={() => setActiveProjectId(null)}
          className="mt-3 text-sm font-medium underline"
          style={{ color: 'var(--kon-dark)' }}
        >
          返回项目列表
        </button>
      </div>
    );
  }

  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const totalTasks = projectTasks.length;
  const doneTasks = projectTasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = projectTasks.filter((t) => t.status === 'in-progress').length;
  const todoTasks = projectTasks.filter((t) => t.status === 'todo').length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

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
          className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
          style={{ color: 'var(--text-dim)' }}
          title="返回项目列表"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold font-serif-cn text-fg">
              {project.icon && <span className="mr-1.5">{project.icon}</span>}
              {project.name}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{
              background: project.status === 'active' ? 'rgba(74,138,122,0.12)' :
                project.status === 'completed' ? 'rgba(153,167,188,0.12)' : 'var(--bg-deep)',
              color: project.status === 'active' ? 'var(--accent-teal)' :
                project.status === 'completed' ? 'var(--kon-dark)' : 'var(--text-dim)',
            }}>
              {project.status === 'active' ? '进行中' :
               project.status === 'completed' ? '已完成' : '已归档'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{
              background: project.type === 'short-term' ? 'rgba(184,160,136,0.15)' : 'rgba(153,167,188,0.15)',
              color: project.type === 'short-term' ? 'var(--accent-warm)' : 'var(--kon-dark)',
            }}>
              {project.type === 'short-term' ? '短期' : '长期'}
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
            {formatDate(project.startDate)} — {formatDate(project.endDate)}
          </p>
        </div>

        <select
          value={project.status}
          onChange={(e) => handleStatusChange(e.target.value as Project['status'])}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium outline-none"
          style={{ border: '1px solid var(--line)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
        >
          <option value="active">进行中</option>
          <option value="completed">已完成</option>
          <option value="archived">归档</option>
        </select>

        <button onClick={() => setShowEditForm(true)} className="p-2 rounded-lg hover:bg-black/5 transition-colors" style={{ color: 'var(--text-dim)' }} title="编辑">
          <Edit size={17} />
        </button>
        <button onClick={handleDelete} className="p-2 rounded-lg hover:bg-red-50 transition-colors" style={{ color: 'var(--text-dim)' }} title="删除">
          <Trash2 size={17} />
        </button>
      </div>

      {/* Progress Overview */}
      <div className="card-surface p-5 mb-5">
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 shrink-0">
            <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
              <circle cx="48" cy="48" r={ringRadius} fill="none" stroke="var(--bg-deep)" strokeWidth="8" />
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

          <div className="grid grid-cols-4 gap-4 flex-1">
            {[
              { value: totalTasks, label: '总任务', color: 'var(--text-primary)' },
              { value: doneTasks, label: '已完成', color: 'var(--accent-teal)' },
              { value: inProgressTasks, label: '进行中', color: 'var(--kon-dark)' },
              { value: todoTasks, label: '待办', color: 'var(--text-dim)' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[11px]" style={{ color: 'var(--text-dim)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {project.description && (
          <p className="mt-4 text-sm pt-4 border-t" style={{ color: 'var(--text-mid)', borderColor: 'var(--line)' }}>{project.description}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 pb-2 border-b" style={{ borderColor: 'var(--line)' }}>
        <button
          onClick={() => setTab('overview')}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: tab === 'overview' ? 'var(--bg-deep)' : 'transparent',
            color: tab === 'overview' ? 'var(--text-primary)' : 'var(--text-dim)',
          }}
        >
          任务列表
        </button>
        <button
          onClick={() => setTab('kanban')}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: tab === 'kanban' ? 'var(--bg-deep)' : 'transparent',
            color: tab === 'kanban' ? 'var(--text-primary)' : 'var(--text-dim)',
          }}
        >
          看板
        </button>
        <button
          onClick={() => setTab('gantt')}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: tab === 'gantt' ? 'var(--bg-deep)' : 'transparent',
            color: tab === 'gantt' ? 'var(--text-primary)' : 'var(--text-dim)',
          }}
        >
          甘特图
        </button>
      </div>

      {tab === 'kanban' ? (
        <div className="animate-scale-in"><TaskView projectId={activeProjectId} /></div>
      ) : tab === 'gantt' ? (
        <div className="animate-scale-in"><GanttChart projectId={activeProjectId} /></div>
      ) : (
        <div className="animate-scale-in"><TaskTreeView projectId={activeProjectId} /></div>
      )}

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
