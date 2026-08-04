import { useState } from 'react';
import { Plus, Search, FolderKanban } from 'lucide-react';
import { useStore } from '../stores';
import ProjectForm from './ProjectForm';
import type { Project, ProjectStatus } from '../types';

export default function ProjectView() {
  const { projects, addProject, updateProject, deleteProject, setActiveProjectId, setActiveModule, tasks } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('active');

  const filteredProjects = projects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getProjectProgress = (projectId: string) => {
    const projectTasks = tasks.filter((t) => t.projectId === projectId);
    if (projectTasks.length === 0) return 0;
    const done = projectTasks.filter((t) => t.status === 'done').length;
    return Math.round((done / projectTasks.length) * 100);
  };

  const getProjectTaskCount = (projectId: string) => {
    const projectTasks = tasks.filter((t) => t.projectId === projectId);
    const done = projectTasks.filter((t) => t.status === 'done').length;
    return { total: projectTasks.length, done };
  };

  const handleSave = (data: Partial<Project>) => {
    if (editingProject) {
      updateProject(editingProject.id, data);
    } else {
      addProject(data);
    }
    setShowForm(false);
    setEditingProject(null);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleDelete = (project: Project) => {
    if (confirm(`确定要删除项目「${project.name}」吗？项目下的任务将被保留。`)) {
      deleteProject(project.id);
    }
  };

  const handleOpenProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setActiveModule('projects');
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索项目…"
              className="w-48 md:w-56 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: '1px solid var(--line)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            />
            <Search size={15} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{ border: '1px solid var(--line)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
          >
            <option value="active">进行中</option>
            <option value="completed">已完成</option>
            <option value="archived">已归档</option>
            <option value="all">全部</option>
          </select>

          <button
            onClick={() => { setEditingProject(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, var(--kon-dark), var(--kon-deeper))' }}
          >
            <Plus size={16} /> 新建项目
          </button>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-20">
          <FolderKanban size={48} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--text-dim)' }} />
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            {search || statusFilter !== 'active' ? '没有找到匹配的项目' : '还没有项目，点击上方按钮创建第一个'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const progress = getProjectProgress(project.id);
            const { total, done } = getProjectTaskCount(project.id);

            return (
              <div
                key={project.id}
                className="card-surface overflow-hidden cursor-pointer transition-all group"
                style={{ padding: 0, border: 'none' }}
                onClick={() => handleOpenProject(project.id)}
              >
                <div className="h-1.5 w-full" style={{ backgroundColor: project.coverColor }} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1.5">
                    <h3 className="font-bold text-sm truncate pr-2 text-fg">
                      {project.icon && <span className="mr-1.5">{project.icon}</span>}
                      {project.name}
                    </h3>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(project); }}
                        className="p-1 rounded hover:bg-black/5 transition-colors"
                        style={{ color: 'var(--text-dim)' }}
                        title="编辑"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(project); }}
                        className="p-1 rounded hover:bg-red-50 transition-colors"
                        style={{ color: 'var(--text-dim)' }}
                        title="删除"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--text-dim)' }}>{project.description}</p>
                  )}

                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--text-dim)' }}>
                      <span>进度</span>
                      <span className="font-semibold">{progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progress}%`, backgroundColor: project.coverColor }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--text-dim)' }}>
                    <span>{total} 任务 · {done} 已完成</span>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium" style={{
                        background: project.type === 'short-term' ? 'rgba(184,160,136,0.15)' : 'rgba(153,167,188,0.15)',
                        color: project.type === 'short-term' ? 'var(--accent-warm)' : 'var(--kon-dark)',
                      }}>
                        {project.type === 'short-term' ? '短期' : '长期'}
                      </span>
                      {(project.startDate || project.endDate) && (
                        <span>
                          {formatDate(project.startDate)}
                          {project.startDate && project.endDate ? ' - ' : ''}
                          {formatDate(project.endDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <ProjectForm
          initial={editingProject || undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingProject(null); }}
        />
      )}
    </div>
  );
}
