import { useState, useRef, useEffect } from 'react';
import { useStore } from '../../stores';
import { InlineAddForm } from './shared';
import { ClipboardCheck, CalendarDays, RotateCcw, Trash2, Plus, GripVertical } from 'lucide-react';

const DEFAULT_ITEMS = [
  { text: 'OBS 场景切换测试（主场景/待机/转场）', date: '' },
  { text: '麦克风音量与降噪参数检查', date: '' },
  { text: '网络测速（上传带宽 >= 10Mbps）', date: '' },
  { text: 'Live2D / VTS 面部捕捉校准', date: '' },
  { text: '弹幕姬连接与显示测试', date: '' },
  { text: '录制功能开启确认', date: '' },
  { text: '备用方案确认（断网/软件崩溃应对）', date: '' },
];

interface CheckItem {
  id: string;
  text: string;
  checked: boolean;
  date: string; // YYYY-MM-DD
}

export default function TechDept() {
  const { vtuberEntries, addVtuberEntry, updateVtuberEntry, deleteVtuberEntry } = useStore();
  const checklist = vtuberEntries.find((e) => e.type === 'checklist');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editDate, setEditDate] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Drag & drop state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Auto-create on first mount if missing
  useEffect(() => {
    if (!checklist && vtuberEntries.length >= 0) {
      addVtuberEntry({
        type: 'checklist',
        title: '开播前检查清单',
        status: 'active',
        data: {
          items: DEFAULT_ITEMS.map((it, i) => ({
            id: `ci-${Date.now()}-${i}`,
            text: it.text,
            checked: false,
            date: it.date,
          })),
          lastUsedAt: new Date().toISOString(),
        },
        tags: [],
      });
    }
  }, [checklist, vtuberEntries.length, addVtuberEntry]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  if (!checklist) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
            style={{ background: 'rgba(107,70,193,0.08)' }}>
            <ClipboardCheck size={22} style={{ color: 'var(--accent-purple)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>正在初始化检查清单…</p>
        </div>
      </div>
    );
  }

  const items: CheckItem[] = (checklist.data.items as CheckItem[]) || [];
  const checkedCount = items.filter((i) => i.checked).length;
  const progressPct = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;

  const saveItems = (newItems: CheckItem[]) => {
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
    saveItems([...items, { id: `ci-${Date.now()}`, text, checked: false, date: '' }]);
  };

  const removeItem = (itemId: string) => {
    saveItems(items.filter((i) => i.id !== itemId));
  };

  const startEdit = (item: CheckItem) => {
    setEditingId(item.id);
    setEditText(item.text);
    setEditDate(item.date || '');
  };

  const commitEdit = () => {
    if (editingId && editText.trim()) {
      saveItems(
        items.map((i) =>
          i.id === editingId ? { ...i, text: editText.trim(), date: editDate } : i
        )
      );
    }
    setEditingId(null);
    setEditText('');
    setEditDate('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditDate('');
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggingId(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', itemId);
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    if (itemId !== draggingId) {
      setDragOverId(itemId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }
    const sourceIdx = items.findIndex((i) => i.id === sourceId);
    const targetIdx = items.findIndex((i) => i.id === targetId);
    if (sourceIdx === -1 || targetIdx === -1) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }
    const newItems = [...items];
    const [moved] = newItems.splice(sourceIdx, 1);
    newItems.splice(targetIdx, 0, moved);
    saveItems(newItems);
    setDraggingId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div
        className="rounded-xl p-4 border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <ClipboardCheck size={18} style={{ color: 'var(--accent-purple)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            技术运维部 · 开播前检查清单
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-auto"
            style={{
              background: progressPct === 100 ? 'rgba(31,157,85,0.1)' : 'rgba(107,70,193,0.08)',
              color: progressPct === 100 ? 'var(--ok)' : 'var(--accent-purple)',
            }}>
            {checkedCount}/{items.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(0,0,0,0.05)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              background:
                progressPct === 100
                  ? 'linear-gradient(90deg, #1f9d55, #34d399)'
                  : 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
            {progressPct === 100 && items.length > 0
              ? '全部完成，可以开播啦 🎉'
              : `已完成 ${progressPct}%`}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
            今日 {todayStr}
          </span>
        </div>
      </div>

      {/* Checklist items */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--line)' }}
      >
        {/* Table header */}
        <div
          className="grid px-4 py-2 text-[10px] font-medium uppercase tracking-wider"
          style={{
            gridTemplateColumns: '24px 32px 1fr 130px 36px',
            color: 'var(--text-dim)',
            borderBottom: '1px solid var(--line)',
            background: 'rgba(0,0,0,0.015)',
          }}
        >
          <span></span>
          <span>状态</span>
          <span>检查内容</span>
          <span className="flex items-center gap-1">
            <CalendarDays size={10} /> 计划日期
          </span>
          <span></span>
        </div>

        {items.length === 0 && (
          <div className="text-center py-10">
            <p className="text-xs mb-3" style={{ color: 'var(--text-dim)' }}>
              清单为空，请在下方添加检查项
            </p>
          </div>
        )}

        {items.map((item, idx) => (
          <div
            key={item.id}
            draggable={editingId !== item.id}
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDrop={(e) => handleDrop(e, item.id)}
            onDragEnd={handleDragEnd}
            className="group grid items-center px-4 py-2.5 transition-all"
            style={{
              gridTemplateColumns: '24px 32px 1fr 130px 36px',
              borderBottom:
                idx < items.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
              background: dragOverId === item.id
                ? 'rgba(139,92,246,0.08)'
                : item.checked
                  ? 'rgba(31,157,85,0.03)'
                  : 'transparent',
              boxShadow: dragOverId === item.id ? 'inset 0 0 0 1.5px rgba(139,92,246,0.25)' : 'none',
              opacity: draggingId === item.id ? 0.5 : 1,
              cursor: editingId !== item.id ? 'grab' : 'default',
            }}
          >
            {/* Drag handle */}
            <div className="flex items-center justify-center">
              {editingId !== item.id && (
                <GripVertical size={14} style={{ color: 'var(--text-dim)' }} className="opacity-0 group-hover:opacity-40 transition-opacity" />
              )}
            </div>

            {/* Checkbox */}
            <button
              onClick={() => toggleItem(item.id)}
              className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all hover:scale-105"
              style={{
                borderColor: item.checked ? 'var(--ok)' : 'var(--line)',
                background: item.checked ? 'var(--ok)' : 'transparent',
              }}
              title={item.checked ? '标记为未完成' : '标记为已完成'}
            >
              {item.checked && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 6L5 8.5L9.5 4"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>

            {/* Text content */}
            {editingId === item.id ? (
              <div className="flex items-center gap-2 min-w-0">
                <input
                  ref={editInputRef}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className="flex-1 text-sm px-2 py-1 rounded outline-none min-w-0"
                  style={{
                    border: '1px solid var(--primary)',
                    background: 'rgba(255,255,255,0.95)',
                    color: 'var(--text-primary)',
                  }}
                />
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className="text-xs px-2 py-1 rounded outline-none w-[110px]"
                  style={{
                    border: '1px solid var(--line)',
                    background: 'rgba(255,255,255,0.95)',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  onClick={() => setEditDate(new Date().toISOString().slice(0, 10))}
                  className="text-[10px] px-2 py-1 rounded-md shrink-0 transition-colors"
                  style={{ background: 'var(--bg-deep)', color: 'var(--kon-dark)', border: '1px solid var(--line)' }}
                >
                  今日
                </button>
                <button
                  onClick={commitEdit}
                  className="text-[10px] px-2 py-1 rounded-md text-white shrink-0"
                  style={{ background: 'var(--ok)' }}
                >
                  保存
                </button>
                <button
                  onClick={cancelEdit}
                  className="text-[10px] px-2 py-1 rounded-md shrink-0"
                  style={{ color: 'var(--text-dim)', border: '1px solid var(--line)' }}
                >
                  取消
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <span
                  onClick={() => startEdit(item)}
                  className="font-serif-cn cursor-pointer select-none min-w-0 truncate"
                  style={{
                    fontSize: '15px',
                    color: item.checked ? 'var(--text-dim)' : 'var(--text-primary)',
                    textDecoration: item.checked ? 'line-through' : 'none',
                    textDecorationColor: 'var(--text-dim)',
                    textDecorationThickness: '1.5px',
                    transition: 'all 0.2s ease',
                  }}
                  title="点击编辑检查内容"
                >
                  {item.text}
                </span>
                {item.checked && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: 'rgba(31,157,85,0.1)', color: 'var(--ok)' }}
                  >
                    已完成
                  </span>
                )}
              </div>
            )}

            {/* Date cell */}
            <div className="flex items-center">
              {editingId !== item.id && (
                <button
                  onClick={() => startEdit(item)}
                  className="text-xs px-2 py-1 rounded-md transition-colors min-w-0"
                  style={{
                    color: item.date ? 'var(--text-mid)' : 'var(--text-dim)',
                    background: item.date ? 'rgba(107,70,193,0.06)' : 'transparent',
                    border: item.date ? '1px solid rgba(107,70,193,0.12)' : '1px dashed var(--line)',
                  }}
                  title="点击编辑日期"
                >
                  {item.date ? (
                    <span className="flex items-center gap-1">
                      <CalendarDays size={10} />
                      {item.date}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Plus size={10} /> 设日期
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Remove */}
            <div className="flex justify-end">
              <button
                onClick={() => removeItem(item.id)}
                className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                style={{ color: 'var(--danger)' }}
                title="删除此项"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <InlineAddForm placeholder="添加新的检查项…" onAdd={addItem} />
        </div>
        <button
          onClick={resetAll}
          className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg transition-colors shrink-0"
          style={{ color: 'var(--text-dim)', border: '1px solid var(--line)' }}
        >
          <RotateCcw size={12} /> 全部重置
        </button>
        <button
          onClick={() => {
            if (confirm('确定要删除整个检查清单吗？所有检查项将被清空。')) {
              deleteVtuberEntry(checklist.id);
            }
          }}
          className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg transition-colors shrink-0"
          style={{ color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.15)' }}
        >
          <Trash2 size={12} /> 删除清单
        </button>
      </div>

      {/* Tips */}
      <div
        className="rounded-lg px-4 py-3 text-xs space-y-1"
        style={{ background: 'rgba(107,70,193,0.04)', color: 'var(--text-mid)' }}
      >
        <p className="font-medium" style={{ color: 'var(--accent-purple)' }}>
          使用提示
        </p>
        <ul className="space-y-0.5 ml-4 list-disc">
          <li>点击检查内容文字可直接编辑，按 Enter 保存 / Esc 取消</li>
          <li>点击「设日期」可为检查项添加计划完成日期</li>
          <li>勾选复选框后文字自动显示删除线，表示该项已完成</li>
          <li>数据自动保存到云端，刷新页面不会丢失</li>
        </ul>
      </div>
    </div>
  );
}
