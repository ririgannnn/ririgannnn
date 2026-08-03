import { useState } from 'react';
import { useStore } from '../stores';
import { format } from 'date-fns';
import { Trash2, Lightbulb, X, Sparkles } from 'lucide-react';

const cardColors = ['#ec4899', '#8b5cf6', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];

export default function InspirationView() {
  const { inspirations, addInspiration, deleteInspiration } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [color, setColor] = useState(cardColors[Math.floor(Math.random() * cardColors.length)]);

  const handleAdd = () => {
    if (!content.trim()) return;
    addInspiration({
      content, source, tags, color,
    });
    setContent(''); setSource(''); setTagInput(''); setTags([]);
    setColor(cardColors[Math.floor(Math.random() * cardColors.length)]);
    setShowForm(false);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-fg">灵感数据库</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-fg text-sm font-medium hover:opacity-90">
          <Sparkles size={16} /> 记录灵感
        </button>
      </div>

      <p className="text-sm text-muted-fg">快速捕捉转瞬即逝的想法，按标签归类，构建你的创意素材库。</p>

      {/* Inspiration Grid */}
      {inspirations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-fg">
          <Lightbulb size={48} className="mb-4 opacity-20" />
          <p className="text-sm">还没有灵感记录</p>
          <p className="text-xs mt-1">点击右上角按钮，捕捉你的第一个灵感</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {inspirations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((insp) => (
            <div
              key={insp.id}
              className="rounded-xl border p-4 shadow-sm hover:shadow-md transition-all group relative"
              style={{ backgroundColor: insp.color + '10', borderColor: insp.color + '30' }}
            >
              <button
                onClick={() => deleteInspiration(insp.id)}
                className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/50"
              >
                <Trash2 size={13} className="text-muted-fg" />
              </button>
              <p className="text-sm text-fg leading-relaxed whitespace-pre-wrap">{insp.content}</p>
              {insp.source && (
                <p className="text-xs mt-2 opacity-60" style={{ color: insp.color }}>来源: {insp.source}</p>
              )}
              <div className="flex flex-wrap gap-1 mt-2">
                {(Array.isArray(insp.tags) ? insp.tags : []).map((t) => (
                  <span key={t} className="text-xs px-1.5 py-0.5 rounded-full border" style={{ borderColor: insp.color + '40', color: insp.color }}>
                    {t}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-fg mt-2">{format(new Date(insp.createdAt), 'yyyy-MM-dd HH:mm')}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="rounded-2xl border border-black/5 shadow-xl p-6 w-full max-w-lg animate-scale-in" style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(20px) saturate(150%)', WebkitBackdropFilter: 'blur(20px) saturate(150%)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-fg flex items-center gap-2">
                <Sparkles size={18} style={{ color }} /> 记录灵感
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-muted"><X size={18} className="text-muted-fg" /></button>
            </div>

            <textarea
              placeholder="写下你的灵感..." value={content} onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-3 text-sm rounded-lg border bg-muted/50 text-fg outline-none focus:ring-2 focus:ring-primary/30 min-h-[120px] resize-none mb-3"
              autoFocus
            />

            <input
              type="text" placeholder="来源（可选）" value={source} onChange={(e) => setSource(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border bg-muted/50 text-fg outline-none mb-3"
            />

            <div className="flex gap-2 mb-3">
              <input
                type="text" placeholder="添加标签" value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                className="flex-1 px-3 py-2 text-sm rounded-lg border bg-muted/50 text-fg outline-none"
              />
              <button onClick={handleAddTag}
                className="px-3 py-2 text-sm rounded-lg bg-muted text-muted-fg hover:bg-border transition-colors">
                添加
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {tags.map((t) => (
                  <span key={t} className="text-xs px-2 py-1 rounded-full bg-muted text-fg flex items-center gap-1">
                    {t}
                    <button onClick={() => setTags(tags.filter((tg) => tg !== t))}><X size={11} /></button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-1.5 mb-4">
              {cardColors.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full border-2 transition-all"
                  style={{ backgroundColor: c, borderColor: color === c ? 'hsl(var(--foreground))' : 'transparent' }} />
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm rounded-lg bg-muted text-muted-fg hover:bg-border">取消</button>
              <button onClick={handleAdd}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg hover:opacity-90">保存灵感</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
