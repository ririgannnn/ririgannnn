import { useStore } from '../../stores';
import { InlineAddForm } from './shared';

export default function StrategyDept() {
  const { vtuberEntries, addVtuberEntry, updateVtuberEntry, deleteVtuberEntry } = useStore();
  const okrs = vtuberEntries.filter((e) => e.type === 'okr');

  const addKr = (entryId: string) => {
    const text = prompt('输入关键结果描述：');
    if (!text) return;
    const entry = okrs.find((e) => e.id === entryId);
    if (!entry) return;
    const krs = (entry.data.keyResults as Array<{ id: string; text: string; progress: number }>) || [];
    const newKrs = [...krs, { id: `kr-${Date.now()}`, text, progress: 0 }];
    updateVtuberEntry(entryId, { data: { ...entry.data, keyResults: newKrs } });
  };

  const updateKrProgress = (entryId: string, krId: string, delta: number) => {
    const entry = okrs.find((e) => e.id === entryId);
    if (!entry) return;
    const krs = (entry.data.keyResults as Array<{ id: string; text: string; progress: number }>) || [];
    const newKrs = krs.map((kr) =>
      kr.id === krId ? { ...kr, progress: Math.max(0, Math.min(100, kr.progress + delta)) } : kr
    );
    updateVtuberEntry(entryId, { data: { ...entry.data, keyResults: newKrs } });
  };

  const deleteKr = (entryId: string, krId: string) => {
    const entry = okrs.find((e) => e.id === entryId);
    if (!entry) return;
    const krs = (entry.data.keyResults as Array<{ id: string; text: string; progress: number }>) || [];
    updateVtuberEntry(entryId, { data: { ...entry.data, keyResults: krs.filter((kr) => kr.id !== krId) } });
  };

  return (
    <div className="space-y-4">
      <InlineAddForm placeholder="新目标（如：2026 Q3 建立稳定输出节奏）"
        onAdd={(title) => addVtuberEntry({
          type: 'okr', title,
          status: 'active',
          data: { period: '', objective: title, keyResults: [] },
          tags: [],
        })} />

      <div className="space-y-4">
        {okrs.map((entry) => {
          const krs = (entry.data.keyResults as Array<{ id: string; text: string; progress: number }>) || [];
          const avgProgress = krs.length > 0
            ? Math.round(krs.reduce((s, kr) => s + kr.progress, 0) / krs.length)
            : 0;

          return (
            <div key={entry.id} className="rounded-lg overflow-hidden"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)' }}>
              {/* Header */}
              <div className="p-4" style={{ borderLeft: `4px solid ${entry.status === 'active' ? 'var(--primary)' : 'rgba(31,157,85,0.5)'}` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: entry.status === 'active' ? 'rgba(153,167,188,0.1)' : 'rgba(31,157,85,0.1)',
                        color: entry.status === 'active' ? 'var(--text-mid)' : '#1f9d55',
                      }}>
                      {entry.status === 'active' ? '进行中' : '已完成'}
                    </span>
                    {(entry.data.period as string) && (
                      <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{entry.data.period as string}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {entry.status === 'active' && (
                      <button onClick={() => updateVtuberEntry(entry.id, { status: 'completed' })}
                        className="text-[10px] px-2 py-0.5 rounded hover:bg-black/5"
                        style={{ color: '#1f9d55' }}>
                        标记完成
                      </button>
                    )}
                    <button onClick={() => {
                      const period = prompt('输入周期（如：2026 Q3）：', entry.data.period as string || '');
                      if (period !== null) updateVtuberEntry(entry.id, { data: { ...entry.data, period } });
                    }} className="text-[10px] px-2 py-0.5 rounded hover:bg-black/5"
                      style={{ color: 'var(--text-dim)' }}>
                      编辑周期
                    </button>
                    <button onClick={() => deleteVtuberEntry(entry.id)}
                      className="text-[10px] px-2 py-0.5 rounded hover:bg-black/5"
                      style={{ color: 'var(--danger)' }}>
                      删除
                    </button>
                  </div>
                </div>

                {/* Objective */}
                <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  🎯 {entry.title}
                </h3>

                {/* Overall progress */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${avgProgress}%`,
                        background: avgProgress >= 80 ? 'var(--ok)' : avgProgress >= 40 ? 'var(--warn)' : 'var(--primary)',
                      }} />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-mid)' }}>{avgProgress}%</span>
                </div>
              </div>

              {/* Key Results */}
              <div className="px-4 pb-4 pt-2 space-y-2">
                {krs.map((kr) => (
                  <div key={kr.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg"
                    style={{ background: 'rgba(0,0,0,0.02)' }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{kr.text}</span>
                        <span className="text-[10px] font-medium ml-2" style={{ color: 'var(--text-mid)' }}>
                          {kr.progress}%
                        </span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                        <div className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${kr.progress}%`,
                            background: kr.progress >= 80 ? 'var(--ok)' : kr.progress >= 40 ? 'var(--warn)' : 'var(--primary)',
                          }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button onClick={() => updateKrProgress(entry.id, kr.id, -10)}
                        className="w-5 h-5 rounded flex items-center justify-center text-xs hover:bg-black/5"
                        style={{ color: 'var(--text-dim)' }}>−</button>
                      <button onClick={() => updateKrProgress(entry.id, kr.id, 10)}
                        className="w-5 h-5 rounded flex items-center justify-center text-xs hover:bg-black/5"
                        style={{ color: 'var(--text-dim)' }}>+</button>
                      <button onClick={() => deleteKr(entry.id, kr.id)}
                        className="w-5 h-5 rounded flex items-center justify-center text-[10px] hover:bg-black/5 ml-1"
                        style={{ color: 'var(--text-dim)' }}>✕</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => addKr(entry.id)}
                  className="w-full text-xs py-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text-dim)', border: '1px dashed var(--line)' }}>
                  + 添加关键结果
                </button>
              </div>
            </div>
          );
        })}
        {okrs.length === 0 && (
          <div className="text-center py-12 text-xs" style={{ color: 'var(--text-dim)' }}>
            还没有 OKR，添你的第一个季度目标吧
          </div>
        )}
      </div>
    </div>
  );
}
