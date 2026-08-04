import { useMemo } from 'react';
import { useStore } from '../../stores';
import { InlineAddForm, EntryCard } from './shared';

const PLATFORMS = ['B站', '抖音', 'YouTube', '微博', '小红书'];

export default function AnalyticsDept() {
  const { vtuberEntries, addVtuberEntry, deleteVtuberEntry } = useStore();
  const records = useMemo(() => {
    return vtuberEntries
      .filter((e) => e.type === 'analytics')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [vtuberEntries]);

  return (
    <div className="space-y-4">
      <InlineAddForm placeholder="新数据记录（如：B站粉丝 12.5万）"
        onAdd={(title) => addVtuberEntry({
          type: 'analytics', title,
          status: 'recorded',
          data: { platform: 'B站', followers: 0, views: 0, interactions: 0, note: '', date: new Date().toISOString().slice(0, 10) },
          tags: [],
        })} />

      <div className="space-y-2">
        {records.map((entry, idx) => {
          const prev = idx > 0 ? records[idx - 1] : null;
          const followers = entry.data.followers as number || 0;
          const prevFollowers = prev ? (prev.data.followers as number || 0) : 0;
          const diff = followers - prevFollowers;

          return (
            <div key={entry.id} className="rounded-lg p-3"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)' }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{entry.title}</span>
                  <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(153,167,188,0.08)', color: 'var(--text-dim)' }}>
                    {entry.data.platform as string}
                  </span>
                  <span className="text-[10px] ml-2" style={{ color: 'var(--text-dim)' }}>
                    {entry.data.date as string}
                  </span>
                </div>
                <button onClick={() => deleteVtuberEntry(entry.id)}
                  className="text-[10px] px-1.5 py-0.5 rounded hover:bg-black/5"
                  style={{ color: 'var(--text-dim)' }}>
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-[10px] mb-0.5" style={{ color: 'var(--text-dim)' }}>粉丝</div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {followers >= 10000 ? `${(followers / 10000).toFixed(1)}万` : followers.toLocaleString()}
                  </div>
                  {prev && (
                    <div className="text-[10px] mt-0.5" style={{ color: diff >= 0 ? '#1f9d55' : '#dc2626' }}>
                      {diff >= 0 ? '↑' : '↓'} {Math.abs(diff) >= 10000 ? `${(Math.abs(diff) / 10000).toFixed(1)}万` : Math.abs(diff)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-[10px] mb-0.5" style={{ color: 'var(--text-dim)' }}>播放</div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {(entry.data.views as number || 0) >= 10000
                      ? `${((entry.data.views as number) / 10000).toFixed(1)}万`
                      : (entry.data.views as number || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] mb-0.5" style={{ color: 'var(--text-dim)' }}>互动</div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {(entry.data.interactions as number || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {records.length === 0 && (
          <div className="text-center py-8 text-xs" style={{ color: 'var(--text-dim)' }}>
            还没有数据记录，添加第一条吧（从各平台后台导出数据填入）
          </div>
        )}
      </div>

      {/* Mini trend chart */}
      {records.length >= 2 && (() => {
        const followersData = records.map((r) => r.data.followers as number || 0);
        const max = Math.max(...followersData);
        const min = Math.min(...followersData);
        const range = max - min || 1;
        const w = 680, h = 100, pad = 20;
        const points = followersData.map((v, i) =>
          `${(i / (followersData.length - 1)) * (w - pad * 2) + pad},${h - pad - ((v - min) / range) * (h - pad * 2)}`
        ).join(' ');

        return (
          <div className="rounded-lg p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)' }}>
            <div className="text-[10px] font-semibold mb-2" style={{ color: 'var(--text-dim)' }}>粉丝趋势</div>
            <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }}>
              <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {followersData.map((v, i) => (
                <circle key={i}
                  cx={(i / (followersData.length - 1)) * (w - pad * 2) + pad}
                  cy={h - pad - ((v - min) / range) * (h - pad * 2)}
                  r="3" fill="var(--bg-surface)" stroke="var(--primary)" strokeWidth="1.5" />
              ))}
            </svg>
          </div>
        );
      })()}
    </div>
  );
}
