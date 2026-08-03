import { useState } from 'react';
import { useStore } from '../stores';
import { format } from 'date-fns';
import { Plus, Search, Trash2, FolderOpen, Tag, FileText, X, Edit3, Eye, ChevronLeft, ImageIcon } from 'lucide-react';
import ImageUpload from './ImageUpload';

const defaultFolders = ['工作', '学习', '生活', '项目'];

export default function NotesView() {
  const { notes, addNote, updateNote, deleteNote } = useStore();
  const [search, setSearch] = useState('');
  const [activeFolder, setActiveFolder] = useState<string | 'all'>('all');
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // New note form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newFolder, setNewFolder] = useState('工作');
  const [newTags, setNewTags] = useState('');
  const [customFolder, setCustomFolder] = useState('');
  const [showCustomFolder, setShowCustomFolder] = useState(false);
  const [newImages, setNewImages] = useState<string[]>([]);

  // Edit form
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

  // Compute content summary (first 150 chars)
  const getSummary = (content: string) => {
    if (content.length <= 150) return content;
    return content.slice(0, 150) + '...';
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Sidebar - Folders */}
      <div className="w-52 shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-fg">笔记</h1>
          <button onClick={() => { setIsNew(true); setSelectedNote(null); setIsEditing(false); }}
            className="p-1.5 rounded-lg bg-primary text-primary-fg hover:opacity-90 transition-opacity">
            <Plus size={16} />
          </button>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
          <input
            type="text" placeholder="搜索笔记..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border bg-card text-fg outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Folders */}
        <div>
          <p className="text-xs font-semibold text-muted-fg uppercase tracking-wider mb-2">文件夹</p>
          <div className="space-y-0.5">
            <button
              onClick={() => setActiveFolder('all')}
              className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeFolder === 'all' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-fg hover:bg-muted'
              }`}
            >全部笔记</button>
            {folders.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFolder(f)}
                className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2 ${
                  activeFolder === f ? 'bg-primary/10 text-primary font-medium' : 'text-muted-fg hover:bg-muted'
                }`}
              >
                <FolderOpen size={13} /> {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Note List */}
      <div className="w-64 shrink-0 border-r pr-3 space-y-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-fg py-8 text-center">暂无笔记</p>
        ) : (
          filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => handleSelectNote(n.id)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedNote === n.id ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-muted border-l-2 border-l-transparent'
              }`}
            >
              <div className="text-sm font-medium text-fg truncate">{n.title || '无标题'}</div>
              <p className="text-xs text-muted-fg truncate mt-0.5">{n.content.slice(0, 50) || '无内容'}</p>
              <div className="text-xs text-muted-fg mt-1">{format(new Date(n.updatedAt || n.createdAt), 'MM-dd')}</div>
            </button>
          ))
        )}
      </div>

      {/* Content Area - Full width for reading */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {isNew ? (
          /* New Note Form */
          <div className="max-w-3xl mx-auto space-y-3 animate-scale-in">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setIsNew(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <ChevronLeft size={18} className="text-muted-fg" />
              </button>
              <h2 className="text-lg font-semibold text-fg">新建笔记</h2>
            </div>
            <input
              type="text" placeholder="笔记标题" value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 text-lg font-semibold rounded-lg border border-black/5 text-fg outline-none focus:ring-2 focus:ring-primary/30"
              style={{ background: 'rgba(255,255,255,0.72)' }}
              autoFocus
            />
            <textarea
              placeholder="开始书写..." value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full px-3 py-3 text-sm rounded-lg border border-black/5 text-fg outline-none focus:ring-2 focus:ring-primary/30 min-h-[300px] resize-none leading-relaxed"
              style={{ background: 'rgba(255,255,255,0.72)' }}
            />

            <ImageUpload images={newImages} onChange={setNewImages} />

            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-xs text-muted-fg">文件夹：</span>
              {!showCustomFolder ? (
                <>
                  <select value={newFolder} onChange={(e) => setNewFolder(e.target.value)}
                    className="text-xs px-2 py-1 rounded border bg-muted/50 text-fg outline-none">
                    {folders.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <button onClick={() => setShowCustomFolder(true)} className="text-xs text-primary hover:underline">+ 自定义</button>
                </>
              ) : (
                <div className="flex gap-1">
                  <input value={customFolder} onChange={(e) => setCustomFolder(e.target.value)}
                    placeholder="新文件夹名" className="text-xs px-2 py-1 rounded border bg-muted/50 text-fg outline-none w-28" />
                  <button onClick={() => setShowCustomFolder(false)} className="p-1">
                    <X size={14} className="text-muted-fg" />
                  </button>
                </div>
              )}

              <input
                type="text" placeholder="标签，逗号分隔" value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                className="text-xs px-2 py-1 rounded border bg-muted/50 text-fg outline-none flex-1 min-w-[150px]"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setIsNew(false)} className="px-4 py-2 text-sm rounded-lg bg-muted text-muted-fg hover:bg-border transition-colors">取消</button>
              <button onClick={handleCreate} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg hover:opacity-90 transition-opacity">保存</button>
            </div>
          </div>
        ) : selected ? (
          <div className="max-w-3xl mx-auto animate-scale-in">
            {isEditing ? (
              /* Edit Mode */
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button onClick={handleCancelEdit} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                      <ChevronLeft size={18} className="text-muted-fg" />
                    </button>
                    <h2 className="text-lg font-semibold text-fg">编辑笔记</h2>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleCancelEdit} className="px-3 py-1.5 text-sm rounded-lg bg-muted text-muted-fg hover:bg-border transition-colors">取消</button>
                    <button onClick={handleSaveEdit} className="px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-fg hover:opacity-90 transition-opacity">保存</button>
                  </div>
                </div>

                <input
                  type="text" value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-lg font-semibold rounded-lg border border-black/5 text-fg outline-none focus:ring-2 focus:ring-primary/30"
                  style={{ background: 'rgba(255,255,255,0.72)' }}
                  autoFocus
                />

                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-3 text-sm rounded-lg border border-black/5 text-fg outline-none focus:ring-2 focus:ring-primary/30 min-h-[300px] resize-none leading-relaxed"
                  style={{ background: 'rgba(255,255,255,0.72)' }}
                  placeholder="开始书写..."
                />

                <ImageUpload images={editImages} onChange={setEditImages} />
              </div>
            ) : (
              /* Read Mode */
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-2xl font-bold text-fg leading-tight">{selected.title || '无标题'}</h1>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={handleStartEdit}
                      className="p-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-1.5 text-sm text-muted-fg hover:text-fg">
                      <Edit3 size={15} />
                      <span className="hidden sm:inline">编辑</span>
                    </button>
                    <button onClick={handleDelete}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={15} className="text-muted-fg hover:text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-fg pb-3 border-b border-black/5">
                  <span className="flex items-center gap-1">
                    <FolderOpen size={12} /> {selected.folder || '未分类'}
                  </span>
                  {(Array.isArray(selected.tags) ? selected.tags : []).map((t) => (
                    <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/60">
                      <Tag size={10} /> {t}
                    </span>
                  ))}
                  <span className="ml-auto">
                    {format(new Date(selected.updatedAt || selected.createdAt), 'yyyy年MM月dd日 HH:mm')}
                  </span>
                </div>

                {/* Content - Rich read-only display */}
                <div className="prose prose-sm max-w-none">
                  {selected.content ? (
                    <div className="text-[15px] text-fg leading-[1.85] whitespace-pre-wrap">
                      {selected.content}
                    </div>
                  ) : (
                    <p className="text-muted-fg italic">暂无内容</p>
                  )}
                </div>

                {/* Images */}
                {Array.isArray(selected.images) && selected.images.length > 0 && (
                  <div className="pt-4 border-t border-black/5">
                    <p className="text-xs font-medium text-muted-fg mb-3 flex items-center gap-1.5">
                      <ImageIcon size={13} /> 配图
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selected.images.map((img, idx) => (
                        <div key={idx} className="rounded-xl overflow-hidden border border-black/5 bg-white/50">
                          <img src={img} alt={`图片 ${idx + 1}`} className="w-full h-48 object-cover" loading="lazy" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="flex items-center justify-center h-full text-muted-fg">
            <div className="text-center">
              <FileText size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">选择一篇笔记或创建新笔记</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
