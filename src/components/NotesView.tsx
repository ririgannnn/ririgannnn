import { useState } from 'react';
import { useStore } from '../stores';
import { format } from 'date-fns';
import { Plus, Search, Trash2, FolderOpen, Tag, FileText, X } from 'lucide-react';

const defaultFolders = ['工作', '学习', '生活', '项目'];

export default function NotesView() {
  const { notes, addNote, updateNote, deleteNote } = useStore();
  const [search, setSearch] = useState('');
  const [activeFolder, setActiveFolder] = useState<string | 'all'>('all');
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);

  // New note form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newFolder, setNewFolder] = useState('工作');
  const [newTags, setNewTags] = useState('');
  const [customFolder, setCustomFolder] = useState('');
  const [showCustomFolder, setShowCustomFolder] = useState(false);

  const folders = [...new Set([...defaultFolders, ...notes.map((n) => n.folder).filter((f) => f && !defaultFolders.includes(f))])];

  const filtered = notes
    .filter((n) => activeFolder === 'all' || n.folder === activeFolder)
    .filter((n) => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()));

  const selected = notes.find((n) => n.id === selectedNote);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const folder = showCustomFolder && customFolder.trim() ? customFolder.trim() : newFolder;
    addNote({
      id: '', title: newTitle, content: newContent, folder,
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    setNewTitle(''); setNewContent(''); setNewTags('');
    setShowCustomFolder(false); setCustomFolder('');
    setIsNew(false);
  };

  const handleSaveEdit = (id: string, title: string, content: string) => {
    updateNote(id, { title, content });
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Sidebar */}
      <div className="w-56 shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-fg">笔记</h1>
          <button onClick={() => { setIsNew(true); setSelectedNote(null); }}
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

      {/* Main */}
      <div className="flex-1 flex gap-4 min-w-0">
        {/* Note List */}
        <div className="w-72 shrink-0 border-r pr-4 space-y-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-fg py-8 text-center">暂无笔记</p>
          ) : (
            filtered.map((n) => (
              <button
                key={n.id}
                onClick={() => { setSelectedNote(n.id); setIsNew(false); }}
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

        {/* Editor */}
        <div className="flex-1 min-w-0">
          {isNew ? (
            <div className="space-y-3 animate-scale-in">
              <input
                type="text" placeholder="笔记标题" value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 text-lg font-semibold rounded-lg border bg-card text-fg outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
              <textarea
                placeholder="开始书写..." value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full px-3 py-3 text-sm rounded-lg border bg-card text-fg outline-none focus:ring-2 focus:ring-primary/30 min-h-[300px] resize-none leading-relaxed"
              />

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
            <div className="space-y-3 animate-scale-in">
              <div className="flex items-center justify-between">
                <input
                  type="text" value={selected.title}
                  onChange={(e) => handleSaveEdit(selected.id, e.target.value, selected.content)}
                  className="flex-1 px-2 py-1 text-lg font-semibold rounded border-transparent hover:border-border focus:border-primary bg-transparent text-fg outline-none transition-colors"
                />
                <button onClick={() => { deleteNote(selected.id); setSelectedNote(null); }}
                  className="p-1.5 rounded hover:bg-red-50 transition-colors">
                  <Trash2 size={15} className="text-muted-fg hover:text-red-500" />
                </button>
              </div>
              <div className="flex gap-2 text-xs text-muted-fg">
                <span className="flex items-center gap-1"><FolderOpen size={12} /> {selected.folder}</span>
                {selected.tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted"><Tag size={10} /> {t}</span>
                ))}
              </div>
              <textarea
                value={selected.content}
                onChange={(e) => handleSaveEdit(selected.id, selected.title, e.target.value)}
                className="w-full px-3 py-3 text-sm rounded-lg border bg-card text-fg outline-none focus:ring-2 focus:ring-primary/30 min-h-[300px] resize-none leading-relaxed"
                placeholder="开始书写..."
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-fg">
              <div className="text-center">
                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">选择一篇笔记或创建新笔记</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
