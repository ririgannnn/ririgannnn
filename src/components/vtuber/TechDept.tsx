import { useState, useRef, useEffect } from 'react';
import { useStore } from '../../stores';
import { InlineAddForm } from './shared';

const DEFAULT_ITEMS = [
  'OBS 场景切换测试（主场景/待机/转场）',
  '麦克风音量与降噪参数检查',
  '网络测速（上传带宽 >= 10Mbps）',
  'Live2D/VTS 面部捕捉校准',
  '弹幕姬连接与显示测试',
  '录制功能开启确认',
  '备用方案确认（断网/软件崩溃应对）',
];

export default function TechDept() {
  const { vtuberEntries, addVtuberEntry, updateVtuberEntry, deleteVtuberEntry } = useStore();
  const checklist = vtuberEntries.find((e) => e.type === 'checklist');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const ensureChecklist = () => {
    if (!checklist) {
      addVtuberEntry({
        type: 'checklist',
        title: '开播前检查清单',
        status: 'active',
        data: {
          items: DEFAULT_ITEMS.map((text, i) => ({ id: `ci-${i}`, text, checked: false })),
          lastUsedAt: new Date().toISOString(),
        },
        tags: [],
      });
    }
  };

  if (!checklist) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12">
          <p className="text-sm mb-3" style={{ color: 'var(--text-dim)' }}>还没有开播检查清单</p>
          <button onClick={ensureChecklist} className="text-sm px-4 py-2 rounded-lg text-white transition-colors"
            style={{ background: 'var(--primary)' }}>
            创建默认清单
          </button>
        </div>
      </div>
    );
  }

  const items = (checklist.data.items as Array<{ id: string; text: string; checked: boolean }>) || [];
  const checkedCount = items.filter((i) => i.checked).length;

  const saveItems = (newItems: typeof items) => {
    updateVtuberEntry(checklist.id, {
      data: { ...checklist.data, items: newItems, lastUsedAt: new Date().toISOString() },
    });
  };

  const toggleItem = (itemId: string) => {
    saveItems(items.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)));
  };

  const resetAll = () => {
    saveItems(items.map((i) => ({ ...i, checked: false })));
  };

  const addItem = (text: string) => {
    saveItems([...items, { id: `ci-${Date.now()}`, text, checked: false }]);
  };

  const removeItem = (itemId: string) => {
    saveItems(items.filter((i) => i.id !== itemId));
  };

  const startEdit = (itemId: string, currentText: string) => {
    setEditingId(itemId);
    setEditText(currentText);
  };

  const commitEdit = () => {
    if (editingId && editText.trim()) {
      saveItems(items.map((i) => (i.id === editingId ? { ...i, text: editText.trim() } : i)));
    }
    setEditingId(null);
    setEditText('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="rounded-lg p-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: 'var(--text-mid)' }}>
            开播前检查清单
          </span>
          <span className="text-xs font-semibold"
            style={{ color: checkedCount === items.length && items.length > 0 ? 'var(--ok)' : 'var(--warn)' }}>
            {checkedCount}/{items.length}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
          <div className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${items.length > 0 ? (checkedCount / items.length) * 100 : 0}%`,
              background: checkedCount === items.length && items.length > 0 ? 'var(--ok)' : 'var(--primary)',
            }} />
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-1">
        {items.length === 0 && (
          <p className="text-center text-xs py-6" style={{ color: 'var(--text-dim)' }}>
            清单为空，请在下方添加检查项
          </p>
        )}
        {items.map((item) => (
          <div key={item.id}
            className="group flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors"
            style={{ background: item.checked ? 'rgba(31,157,85,0.04)' : 'transparent' }}>

            {/* Checkbox — always clickable */}
            <button
              onClick={() => toggleItem(item.id)}
              className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors mt-0.5"
              style={{
                borderColor: item.checked ? 'var(--ok)' : 'var(--line)',
                background: item.checked ? 'var(--ok)' : 'transparent',
              }}>
              {item.checked && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            {/* Text — click to edit */}
            {editingId === item.id ? (
              <input
                ref={editInputRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit();
                  if (e.key === 'Escape') cancelEdit();
                }}
                onBlur={commitEdit}
                className="flex-1 text-sm px-2 py-0.5 rounded outline-none"
                style={{
                  border: '1px solid var(--primary)',
                  background: 'rgba(255,255,255,0.9)',
                  color: 'var(--text-primary)',
                }}
              />
            ) : (
              <span
                onClick={() => { if (!item.checked) startEdit(item.id, item.text); }}
                className="flex-1 text-sm transition-colors cursor-pointer select-none"
                style={{
                  color: item.checked ? 'var(--text-dim)' : 'var(--text-primary)',
                  textDecoration: item.checked ? 'line-through' : 'none',
                }}
                title="点击文字编辑（已完成项不可编辑）">
                {item.text}
              </span>
            )}

            {/* Remove button — visible on hover */}
            <button
              onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
              className="shrink-0 text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-all hover:bg-black/5"
              style={{ color: 'var(--text-dim)' }}>
              移除
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-0">
          <InlineAddForm placeholder="添加检查项..." onAdd={addItem} />
        </div>
        <button onClick={resetAll}
          className="text-xs px-3 py-1.5 rounded-lg transition-colors shrink-0"
          style={{ color: 'var(--text-dim)', border: '1px solid var(--line)' }}>
          全部重置
        </button>
        <button onClick={() => deleteVtuberEntry(checklist.id)}
          className="text-xs px-3 py-1.5 rounded-lg transition-colors shrink-0"
          style={{ color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.2)' }}>
          删除清单
        </button>
      </div>
    </div>
  );
}
