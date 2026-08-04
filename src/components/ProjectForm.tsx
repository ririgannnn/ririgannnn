import { useState } from 'react';
import type { Project, ProjectType, ProjectStatus, TaskPriority } from '../types';

const PRESET_COLORS = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
];

interface Props {
  initial?: Partial<Project>;
  onSave: (data: Partial<Project>) => void;
  onCancel: () => void;
}

export default function ProjectForm({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [type, setType] = useState<ProjectType>(initial?.type || 'short-term');
  const [startDate, setStartDate] = useState(initial?.startDate || '');
  const [endDate, setEndDate] = useState(initial?.endDate || '');
  const [coverColor, setCoverColor] = useState(initial?.coverColor || '#3b82f6');
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority || 'medium');

  const isEdit = !!initial?.id;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      ...initial,
      name: name.trim(),
      description: description.trim(),
      type,
      startDate: startDate || null,
      endDate: endDate || null,
      coverColor,
      priority,
      status: initial?.status || 'active',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="rounded-2xl shadow-xl p-6 w-full max-w-md animate-scale-in border border-black/5 overflow-y-auto max-h-[90vh]"
        style={{ background: '#ffffff' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-5">
          {isEdit ? '编辑项目' : '新建项目'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-muted-fg mb-1.5">项目名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：演唱会策划案"
              className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-muted-fg mb-1.5">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要描述这个项目的目标…"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none bg-white"
            />
          </div>

          {/* Type & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-fg mb-1.5">项目类型</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ProjectType)}
                className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              >
                <option value="short-term">短期项目</option>
                <option value="long-term">长期项目</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-fg mb-1.5">优先级</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              >
                <option value="low">🟢 低</option>
                <option value="medium">🟡 中</option>
                <option value="high">🔴 高</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-fg mb-1.5">开始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-fg mb-1.5">截止日期</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              />
            </div>
          </div>

          {/* Cover Color */}
          <div>
            <label className="block text-xs font-semibold text-muted-fg mb-1.5">封面颜色</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCoverColor(color)}
                  className="w-8 h-8 rounded-lg border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor: coverColor === color ? '#1e293b' : 'transparent',
                    boxShadow: coverColor === color ? '0 0 0 2px rgba(30,41,59,0.15)' : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-black/10 hover:bg-black/5 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: coverColor }}
            >
              {isEdit ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
