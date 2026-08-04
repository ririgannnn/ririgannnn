import { useState } from 'react';
import { useStore } from '../stores';
import { format } from 'date-fns';
import { Plus, Search, Trash2, FolderOpen, Tag, FileText, X, Edit3, ChevronLeft, ImageIcon } from 'lucide-react';
import ImageUpload from './ImageUpload';

const defaultFolders = ['工作', '学习', '生活', '项目'];

export default function NotesView() {
  const { notes, addNote, updateNote, deleteNote } = useStore();
  const [search, setSearch] = useState('');
  const [activeFolder, setActiveFolder] = useState<string | 'all'>('all');
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newFolder, setNewFolder] = useState('工作');
  const [newTags, setNewTags] = useState('');
  const [customFolder, setCustomFolder] = useState('');
  const [showCustomFolder, setShowCustomFolder] = useState(false);
  const [newImages, setNewImages] = useState<string[]>([]);

  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);

  const folders = [...new Set([...defaultFolders, ...notes.map((n) => n.folder).filter((f) => f && !defaultFolders.includes(f))])];

  const filtered = notes
    .filter((n) => activeFolder === 'all' || n.folder === activeFolder)
    .filter((n) => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()));

  const selected = notes.find((n) => n.id === selectedNote);

  const handleSelectNote = (id: string) => {
    setSelectedNote(id);
    setIsNew(false);
    setIsEditing(false);
  };

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const folder = showCustomFolder && customFolder.trim() ? customFolder.trim() : newFolder;
    addNote({
      title: newTitle, content: newContent, folder,
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
      images: newImages,
    });
    setNewTitle(''); setNewContent(''); setNewTags(''); setNewImages([]);
    setShowCustomFolder(false); setCustomFolder('');
    setIsNew(false);
  };

  const handleStartEdit = () => {
    if (!selected) return;
    setEditTitle(selected.title);
    setEditContent(selected.content);
    setEditImages(Array.isArray(selected.images) ? selected.images : []);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selected) return;
    updateNote(selected.id, {
      title: editTitle,
      content: editContent,
      images: editImages,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!selected) return;
    deleteNote(selected.id);
    setSelectedNote(null);
    setIsEditing(false);
  };

  const inputBaseStyle: React.CSSProperties = {
    border: '1px solid var(--line)',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    outline: 'none',
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Sidebar - Folders */}
      <div className="w-52 shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold font-serif-cn text-fg">笔记</h1>
          <button
            onClick={() => { setIsNew(true); setSelectedNote(null); setIsEditing(false); }}
            className="p-1.5 rounded-lg text-white transition-all"
            style={{ background: 'var(--kon-dark)' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            <Plus size={16} />
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text" placeholder="搜索笔记..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              fontSize: '13px',
              borderRadius: 'var(--radius-md)',
              ...inputBaseStyle,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--kon-main)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; }}
          />
        </div>

        {/* Folders */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-dim)' }}>文件夹</p>
          <div className="space-y-0.5">
            <button
              onClick={() => setActiveFolder('all')}
              className="w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors"
              style={{
                background: activeFolder === 'all' ? 'rgba(153,167,188,0.1)' : 'transparent',
                color: activeFolder === 'all' ? 'var(--kon-deeper)' : 'var(--text-dim)',
                fontWeight: activeFolder === 'all' ? 500 : 400,
              }}
            >全部笔记</button>
            {folders.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFolder(f)}
                className="w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2"
                style={{
                  background: activeFolder === f ? 'rgba(153,167,188,0.1)' : 'transparent',
                  color: activeFolder === f ? 'var(--kon-deeper)' : 'var(--text-dim)',
                  fontWeight: activeFolder === f ? 500 : 400,
                }}
              >
                <FolderOpen size={13} /> {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Note List - Card style */}
      <div className="w-64 shrink-0 border-r overflow-y-auto pr-3 space-y-2" style={{ borderColor: 'var(--line)' }}>
        {filtered.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--text-dim)' }}>暂无笔记</p>
        ) : (
          filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => handleSelectNote(n.id)}
              className="card-surface w-full text-left p-3 transition-all"
              style={{
                borderColor: selectedNote === n.id ? 'var(--kon-main)' : 'var(--line)',
                borderLeftWidth: selectedNote === n.id ? '3px' : '1px',
                borderLeftColor: selectedNote === n.id ? 'var(--kon-main)' : 'var(--line)',
                background: selectedNote === n.id ? 'rgba(153,167,188,0.06)' : 'var(--bg-surface)',
              }}
            >
              <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {n.title || '无标题'}
              </div>
              <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-dim)' }}>
                {n.content.slice(0, 50) || '无内容'}
              </p>
              <div className="text-xs mt-1.5 flex items-center gap-2" style={{ color: 'var(--text-dim)' }}>
                <span>{format(new Date(n.updatedAt || n.createdAt), 'MM-dd')}</span>
                {n.folder && (
                  <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-deep)', color: 'var(--text-dim)' }}>
                    {n.folder}
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {isNew ? (
          <div className="max-w-3xl mx-auto animate-scale-in">
            <div className="card-surface p-6 space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setIsNew(false)} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
                  <ChevronLeft size={18} style={{ color: 'var(--text-dim)' }} />
                </button>
                <h2 className="text-lg font-semibold font-serif-cn text-fg">新建笔记</h2>
              </div>
              <input
                type="text" placeholder="笔记标题" value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 text-lg font-semibold rounded-lg outline-none"
                style={{ ...inputBaseStyle, background: 'var(--bg-deep)' }}
                autoFocus
              />
              <textarea
                placeholder="开始书写..." value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full px-3 py-3 text-sm rounded-lg outline-none min-h-[300px] resize-none leading-relaxed"
                style={{ ...inputBaseStyle, background: 'var(--bg-deep)' }}
              />
              <ImageUpload images={newImages} onChange={setNewImages} />
              <div className="flex gap-2 items-center flex-wrap">
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>文件夹：</span>
                {!showCustomFolder ? (
                  <>
                    <select value={newFolder} onChange={(e) => setNewFolder(e.target.value)}
                      className="text-xs px-2 py-1 rounded border outline-none"
                      style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)', borderColor: 'var(--line)' }}>
                      {folders.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <button onClick={() => setShowCustomFolder(true)} className="text-xs transition-colors" style={{ color: 'var(--kon-dark)' }}>+ 自定义</button>
                  </>
                ) : (
                  <div className="flex gap-1">
                    <input value={customFolder} onChange={(e) => setCustomFolder(e.target.value)}
                      placeholder="新文件夹名" className="text-xs px-2 py-1 rounded border outline-none w-28"
                      style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)', borderColor: 'var(--line)' }} />
                    <button onClick={() => setShowCustomFolder(false)} className="p-1"><X size={14} style={{ color: 'var(--text-dim)' }} /></button>
                  </div>
                )}
                <input
                  type="text" placeholder="标签，逗号分隔" value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="text-xs px-2 py-1 rounded border outline-none flex-1 min-w-[150px]"
                  style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)', borderColor: 'var(--line)' }}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsNew(false)} className="px-4 py-2 text-sm rounded-lg transition-colors" style={{ background: 'var(--bg-deep)', color: 'var(--text-dim)' }}>取消</button>
                <button onClick={handleCreate} className="px-4 py-2 text-sm rounded-lg text-white font-medium transition-all" style={{ background: 'var(--kon-dark)' }}>保存</button>
              </div>
            </div>
          </div>
        ) : selected ? (
          <div className="max-w-3xl mx-auto animate-scale-in">
            <div className="card-surface p-6">
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button onClick={handleCancelEdit} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
                      <ChevronLeft size={18} style={{ color: 'var(--text-dim)' }} />
                    </button>
                    <h2 className="text-lg font-semibold font-serif-cn text-fg">编辑笔记</h2>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleCancelEdit} className="px-3 py-1.5 text-sm rounded-lg transition-colors" style={{ background: 'var(--bg-deep)', color: 'var(--text-dim)' }}>取消</button>
                    <button onClick={handleSaveEdit} className="px-3 py-1.5 text-sm rounded-lg text-white font-medium transition-all" style={{ background: 'var(--kon-dark)' }}>保存</button>
                  </div>
                </div>
                <input
                  type="text" value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-lg font-semibold rounded-lg outline-none"
                  style={{ ...inputBaseStyle, background: 'var(--bg-deep)' }}
                  autoFocus
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-3 text-sm rounded-lg outline-none min-h-[300px] resize-none leading-relaxed"
                  style={{ ...inputBaseStyle, background: 'var(--bg-deep)' }}
                  placeholder="开始书写..."
                />
                <ImageUpload images={editImages} onChange={setEditImages} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-2xl font-bold text-fg leading-tight font-serif-cn">{selected.title || '无标题'}</h1>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={handleStartEdit}
                      className="p-2 rounded-lg hover:bg-black/5 transition-colors flex items-center gap-1.5 text-sm"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      <Edit3 size={15} />
                      <span className="hidden sm:inline">编辑</span>
                    </button>
                    <button onClick={handleDelete}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={15} style={{ color: 'var(--text-dim)' }} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs pb-3 border-b" style={{ color: 'var(--text-dim)', borderColor: 'var(--line)' }}>
                  <span className="flex items-center gap-1">
                    <FolderOpen size={12} /> {selected.folder || '未分类'}
                  </span>
                  {(Array.isArray(selected.tags) ? selected.tags : []).map((t) => (
                    <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-deep)' }}>
                      <Tag size={10} /> {t}
                    </span>
                  ))}
                  <span className="ml-auto">
                    {format(new Date(selected.updatedAt || selected.createdAt), 'yyyy年MM月dd日 HH:mm')}
                  </span>
                </div>

                <div className="prose prose-sm max-w-none">
                  {selected.content ? (
                    <div className="font-serif-cn text-[17px] md:text-[18px] leading-[2] whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                      {selected.content}
                    </div>
                  ) : (
                    <p className="italic" style={{ color: 'var(--text-dim)' }}>暂无内容</p>
                  )}
                </div>

                {Array.isArray(selected.images) && selected.images.length > 0 && (
                  <div className="pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
                    <p className="text-xs font-medium mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
                      <ImageIcon size={13} /> 配图
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selected.images.map((img, idx) => (
                        <div key={idx} className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--line)', background: 'var(--bg-surface)' }}>
                          <img src={img} alt={`图片 ${idx + 1}`} className="w-full h-48 object-cover" loading="lazy" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center" style={{ color: 'var(--text-dim)' }}>
              <FileText size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">选择一篇笔记或创建新笔记</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
