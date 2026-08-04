import { useStore } from '../../stores';
import { InlineAddForm } from './shared';

const DEFAULT_ITEMS = [
  'OBS 场景切换测试（主场景/待机/转场）',
  '麦克风音量与降噪参数检查',
  '网络测速（上传带宽 ≥ 10Mbps）',
  'Live2D/VTS 面部捕捉校准',
  '弹幕姬连接与显示测试',
  '录制功能开启确认',
  '备用方案确认（断网/软件崩溃应对）',
];

export default function TechDept() {
  const { vtuberEntries, addVtuberEntry, updateVtuberEntry, deleteVtuberEntry } = useStore();
  const checklist = vtuberEntries.find((e) => e.type === 'checklist');

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

  const toggleItem = (itemId: string) => {
    const newItems = items.map((i) =>
      i.id === itemId ? { ...i, checked: !i.checked } : i
    );
    updateVtuberEntry(checklist.id, {
      data: { ...checklist.data, items: newItems, lastUsedAt: new Date().toISOString() },
    });
  };

  const resetAll = () => {
    const newItems = items.map((i) => ({ ...i, checked: false }));
    updateVtuberEntry(checklist.id, {
      data: { ...checklist.data, items: newItems, lastUsedAt: new Date().toISOString() },
    });
  };

  const addItem = (text: string) => {
    const newItems = [...items, { id: `ci-${Date.now()}`, text, checked: false }];
    updateVtuberEntry(checklist.id, {
      data: { ...checklist.data, items: newItems, lastUsedAt: new Date().toISOString() },
    });
  };

  const removeItem = (itemId: string) => {
    const newItems = items.filter((i) => i.id !== itemId);
    updateVtuberEntry(checklist.id, {
      data: { ...checklist.data, items: newItems },
    });
  };

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="rounded-lg p-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: 'var(--text-mid)' }}>
            开播前检查清单
          </span>
          <span className="text-xs font-semibold" style={{ color: checkedCount === items.length ? 'var(--ok)' : 'var(--warn)' }}>
            {checkedCount}/{items.length}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
          <div className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${items.length > 0 ? (checkedCount / items.length) * 100 : 0}%`,
              background: checkedCount === items.length ? 'var(--ok)' : 'var(--primary)',
            }} />
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.id}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer"
            style={{ background: item.checked ? 'rgba(31,157,85,0.04)' : 'transparent' }}
            onClick={() => toggleItem(item.id)}>
            <div className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
              style={{
                borderColor: item.checked ? 'var(--ok)' : 'var(--line)',
                background: item.checked ? 'var(--ok)' : 'transparent',
              }}>
              {item.checked && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span className="flex-1 text-sm transition-colors"
              style={{
                color: item.checked ? 'var(--text-dim)' : 'var(--text-primary)',
                textDecoration: item.checked ? 'line-through' : 'none',
              }}>
              {item.text}
            </span>
            <button onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
              className="text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-black/5 transition-all"
              style={{ color: 'var(--text-dim)' }}>
              移除
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <InlineAddForm placeholder="添加检查项..." onAdd={addItem} />
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
