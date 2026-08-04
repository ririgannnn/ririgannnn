import { useState } from 'react';
import { useStore } from '../stores';
import { format } from 'date-fns';
import { Plus, Search, Trash2, BookOpen, Tag, ChevronRight, X } from 'lucide-react';
import ImageUpload from './ImageUpload';

const defaultCategories = ['技术', '设计', '产品', '工具', '阅读', '其他'];

const inputStyle: React.CSSProperties = {
  border: '1px solid var(--line)',
  background: 'var(--bg-deep)',
  color: 'var(--text-primary)',
  outline: 'none',
};

export default function KnowledgeBase() {
  const { knowledge, addKnowledge, updateKnowledge, deleteKnowledge } = useStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('技术');
  const [tags, setTags] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);

  const categories = [...new Set([...defaultCategories, ...knowledge.map((k) => k.category).filter((c) => !defaultCategories.includes(c))])];

  const filtered = knowledge
    .filter((k) => activeCategory === 'all' || k.category === activeCategory)
    .filter((k) => k.title.toLowerCase().includes(search.toLowerCase()) || k.content.toLowerCase().includes(search.toLowerCase()));

  const selected = knowledge.find((k) => k.id === selectedId);

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) return;
    const cat = showNewCategory && customCategory.trim() ? customCategory.trim() : category;
    addKnowledge({
      title, content, category: cat,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      images: formImages,
    });
    setTitle(''); setContent(''); setTags(''); setFormImages([]); setShowNewCategory(false); setCustomCategory('');
    setShowForm(false);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Sidebar */}
      <div className="w-56 shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold font-serif-cn text-fg">知识库</h1>
          <button
            onClick={() => { setShowForm(true); setSelectedId(null); }}
            className="p-1.5 rounded-lg text-white transition-all"
            style={{ background: 'var(--kon-dark)' }}
          >
            <Plus size={16} />
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text" placeholder="搜索知识条目..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 32px', fontSize: '13px', borderRadius: 'var(--radius-md)', ...inputStyle, background: 'var(--bg-surface)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--kon-main)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; }}
          />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-dim)' }}>分类</p>
          <div className="space-y-0.5">
            <button onClick={() => setActiveCategory('all')}
              className="w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors"
              style={{ background: activeCategory === 'all' ? 'rgba(153,167,188,0.1)' : 'transparent', color: activeCategory === 'all' ? 'var(--kon-deeper)' : 'var(--text-dim)', fontWeight: activeCategory === 'all' ? 500 : 400 }}>
              全部分类
            </button>
            {categories.map((c) => (
              <button key={c} onClick={() => setActiveCategory(c)}
                className="w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors"
                style={{ background: activeCategory === c ? 'rgba(153,167,188,0.1)' : 'transparent', color: activeCategory === c ? 'var(--kon-deeper)' : 'var(--text-dim)', fontWeight: activeCategory === c ? 500 : 400 }}>
                <ChevronRight size={12} className="inline mr-1" />{c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {showForm ? (
          <div className="space-y-3 animate-scale-in max-w-2xl">
            <h2 className="text-lg font-bold font-serif-cn text-fg">新建知识条目</h2>
            <input type="text" placeholder="标题" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg"
              style={inputStyle} autoFocus />
            <textarea placeholder="内容..." value={content} onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-3 text-sm rounded-lg min-h-[200px] resize-none leading-relaxed"
              style={inputStyle} />
            <ImageUpload images={formImages} onChange={setFormImages} />
            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>分类：</span>
              {!showNewCategory ? (
                <>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="text-xs px-2 py-1 rounded border outline-none"
                    style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)', borderColor: 'var(--line)' }}>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={() => setShowNewCategory(true)} className="text-xs" style={{ color: 'var(--kon-dark)' }}>+ 自定义</button>
                </>
              ) : (
                <div className="flex gap-1">
                  <input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="新分类名" className="text-xs px-2 py-1 rounded border outline-none w-28"
                    style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)', borderColor: 'var(--line)' }} />
                  <button onClick={() => setShowNewCategory(false)} className="p-1"><X size={14} style={{ color: 'var(--text-dim)' }} /></button>
                </div>
              )}
              <input type="text" placeholder="标签，逗号分隔" value={tags} onChange={(e) => setTags(e.target.value)}
                className="text-xs px-2 py-1 rounded border outline-none flex-1 min-w-[150px]"
                style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)', borderColor: 'var(--line)' }} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg transition-colors" style={{ background: 'var(--bg-deep)', color: 'var(--text-dim)' }}>取消</button>
              <button onClick={handleCreate} className="px-4 py-2 text-sm rounded-lg text-white font-medium" style={{ background: 'var(--kon-dark)' }}>保存</button>
            </div>
          </div>
        ) : selected ? (
          <div className="animate-scale-in max-w-3xl">
            <div className="card-surface p-6">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setSelectedId(null)} className="text-sm transition-colors flex items-center gap-1" style={{ color: 'var(--text-dim)' }}>
                  ← 返回列表
                </button>
                <button onClick={() => { deleteKnowledge(selected.id); setSelectedId(null); }}
                  className="p-1.5 rounded hover:bg-red-50 transition-colors">
                  <Trash2 size={15} style={{ color: 'var(--text-dim)' }} />
                </button>
              </div>
              <h2 className="text-xl font-bold font-serif-cn text-fg mb-2">{selected.title}</h2>
              <div className="flex gap-3 text-xs mb-4" style={{ color: 'var(--text-dim)' }}>
                <span className="flex items-center gap-1"><BookOpen size={12} /> {selected.category}</span>
                <span>{format(new Date(selected.createdAt), 'yyyy-MM-dd HH:mm')}</span>
                {(Array.isArray(selected.tags) ? selected.tags : []).map((t) => (
                  <span key={t} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ background: 'var(--bg-deep)' }}><Tag size={10} /> {t}</span>
                ))}
              </div>
              <div className="prose prose-sm max-w-none leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{selected.content}</div>

              {Array.isArray(selected.images) && selected.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {selected.images.map((img, i) => (
                    <div key={i} className="rounded-lg overflow-hidden border" style={{ borderColor: 'var(--line)' }}>
                      <img src={img} alt={`图片 ${i + 1}`} className="w-full h-auto object-cover" />
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
                <ImageUpload
                  images={Array.isArray(selected.images) ? selected.images : []}
                  onChange={(imgs) => updateKnowledge(selected.id, { images: imgs })}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.length === 0 ? (
              <p className="text-sm py-8 col-span-full text-center" style={{ color: 'var(--text-dim)' }}>暂无知识条目，点击右上��创建</p>
            ) : (
              filtered.map((k) => (
                <button key={k.id} onClick={() => setSelectedId(k.id)}
                  className="card-surface text-left p-4 transition-all overflow-hidden"
                  style={{ border: 'none' }}
                >
                  {Array.isArray(k.images) && k.images.length > 0 && (
                    <div className="mb-2 -mx-4 -mt-4 h-32 overflow-hidden rounded-t-xl">
                      <img src={k.images[0]} alt={k.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <h3 className="text-sm font-semibold text-fg mb-1 truncate">{k.title}</h3>
                  <p className="text-xs line-clamp-2 mb-2" style={{ color: 'var(--text-dim)' }}>{k.content}</p>
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-dim)' }}>
                    <span className="px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-deep)' }}>{k.category}</span>
                    <span>{format(new Date(k.createdAt), 'MM-dd')}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
