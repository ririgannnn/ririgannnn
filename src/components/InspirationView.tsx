import { useState } from 'react';
import { useStore } from '../stores';
import { format } from 'date-fns';
import { Trash2, Lightbulb, X, Sparkles } from 'lucide-react';
import ImageUpload from './ImageUpload';

const cardColors = ['#ec4899', '#8b5cf6', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];

export default function InspirationView() {
  const { inspirations, addInspiration, deleteInspiration } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [color, setColor] = useState(cardColors[Math.floor(Math.random() * cardColors.length)]);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const allTags = Array.from(new Set(inspirations.flatMap((i) => Array.isArray(i.tags) ? i.tags : []))).sort();
  const filteredInspirations = filterTag
    ? inspirations.filter((i) => Array.isArray(i.tags) && i.tags.includes(filterTag))
    : inspirations;

  const handleAdd = () => {
    if (!content.trim()) return;
    addInspiration({
      content, source, tags, color, images: formImages,
    });
    setContent(''); setSource(''); setTagInput(''); setTags([]); setFormImages([]);
    setColor(cardColors[Math.floor(Math.random() * cardColors.length)]);
    setShowForm(false);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const inputStyle: React.CSSProperties = {
    border: '1px solid var(--line)',
    background: 'var(--bg-deep)',
    color: 'var(--text-primary)',
    outline: 'none',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-serif-cn text-fg">灵感数据库</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all"
          style={{ background: 'linear-gradient(135deg, var(--accent-dust), var(--accent-dust))' }}
        >
          <Sparkles size={16} /> 记录灵感
        </button>
      </div>

      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>快速捕捉转瞬即逝的想法，按标签归类，构建你的创意素材库。</p>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterTag(null)}
            className="text-xs px-2.5 py-1 rounded-full transition-colors"
            style={{
              background: filterTag === null ? 'var(--kon-dark)' : 'var(--bg-deep)',
              color: filterTag === null ? '#fff' : 'var(--text-dim)',
            }}
          >
            全部
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setFilterTag(t)}
              className="text-xs px-2.5 py-1 rounded-full transition-colors"
              style={{
                background: filterTag === t ? 'var(--accent-dust)' : 'var(--bg-deep)',
                color: filterTag === t ? '#fff' : 'var(--text-dim)',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {filteredInspirations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Lightbulb size={48} className="mb-4 opacity-20" style={{ color: 'var(--text-dim)' }} />
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>还没有灵感记录</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>点击右上角按钮，捕捉你的第一个灵感</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredInspirations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((insp) => (
            <div
              key={insp.id}
              className="card-surface border p-4 group relative"
              style={{ borderColor: `${insp.color}30` }}
            >
              <button
                onClick={() => deleteInspiration(insp.id)}
                className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/50"
              >
                <Trash2 size={13} style={{ color: 'var(--text-dim)' }} />
              </button>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{insp.content}</p>
              {Array.isArray(insp.images) && insp.images.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  {insp.images.slice(0, 4).map((img, i) => (
                    <div key={i} className="rounded-md overflow-hidden aspect-square">
                      <img src={img} alt={`图片 ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
              {insp.source && (
                <p className="text-xs mt-2 opacity-60" style={{ color: insp.color }}>来源: {insp.source}</p>
              )}
              <div className="flex flex-wrap gap-1 mt-2">
                {(Array.isArray(insp.tags) ? insp.tags : []).map((t) => (
                  <span key={t} className="text-xs px-1.5 py-0.5 rounded-full border" style={{ borderColor: `${insp.color}40`, color: insp.color }}>
                    {t}
                  </span>
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>{format(new Date(insp.createdAt), 'yyyy-MM-dd HH:mm')}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={() => setShowForm(false)}>
          <div className="card-surface rounded-2xl p-6 w-full max-w-lg animate-scale-in" style={{ boxShadow: 'var(--shadow-xl)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold font-serif-cn text-fg flex items-center gap-2">
                <Sparkles size={18} style={{ color }} /> 记录灵感
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-black/5"><X size={18} style={{ color: 'var(--text-dim)' }} /></button>
            </div>

            <textarea
              placeholder="写下你的灵感..." value={content} onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-3 text-sm rounded-lg min-h-[120px] resize-none mb-3"
              style={inputStyle} autoFocus
            />

            <input
              type="text" placeholder="来源（可选）" value={source} onChange={(e) => setSource(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg mb-3"
              style={inputStyle}
            />

            <div className="flex gap-2 mb-3">
              <input
                type="text" placeholder="添加标签" value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                className="flex-1 px-3 py-2 text-sm rounded-lg"
                style={inputStyle}
              />
              <button onClick={handleAddTag}
                className="px-3 py-2 text-sm rounded-lg transition-colors"
                style={{ background: 'var(--bg-deep)', color: 'var(--text-dim)' }}>
                添加
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {tags.map((t) => (
                  <span key={t} className="text-xs px-2 py-1 rounded-full flex items-center gap-1" style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)' }}>
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
                  style={{ backgroundColor: c, borderColor: color === c ? 'var(--text-primary)' : 'transparent' }} />
              ))}
            </div>

            <div className="mb-4">
              <ImageUpload images={formImages} onChange={setFormImages} compact />
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm rounded-lg transition-colors" style={{ background: 'var(--bg-deep)', color: 'var(--text-dim)' }}>取消</button>
              <button onClick={handleAdd}
                className="px-4 py-2 text-sm rounded-lg text-white font-medium" style={{ background: 'var(--kon-dark)' }}>保存灵感</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
