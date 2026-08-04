import { useState } from 'react';
import { useStore } from '../../stores';
import { InlineAddForm, EntryCard } from './shared';

const GIFT_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  pending:  { label: '待选品', bg: 'rgba(138,148,166,0.1)', color: '#6b7280' },
  ordered:  { label: '已下单', bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
  shipped:  { label: '已发货', bg: 'rgba(245,158,11,0.1)', color: '#d97706' },
  received: { label: '已签收', bg: 'rgba(31,157,85,0.1)', color: '#1f9d55' },
};

const DIST_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  pending:  { label: '待发布', bg: 'rgba(138,148,166,0.1)', color: '#6b7280' },
  posted:   { label: '已发布', bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
  engaged:  { label: '已互动', bg: 'rgba(31,157,85,0.1)', color: '#1f9d55' },
};

const PLATFORMS = ['B站', '抖音', 'YouTube', '微博', '小红书'];

export default function CommunityDept() {
  const { vtuberEntries, addVtuberEntry, updateVtuberEntry, deleteVtuberEntry } = useStore();
  const [subTab, setSubTab] = useState<'gift' | 'dist'>('gift');

  const gifts = vtuberEntries.filter((e) => e.type === 'gift');
  const distributions = vtuberEntries.filter((e) => e.type === 'distribution');

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.04)' }}>
        {[
          { id: 'gift' as const, label: '舰礼管理' },
          { id: 'dist' as const, label: '多平台分发' },
        ].map((t) => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className="flex-1 text-xs py-1.5 rounded-md font-medium transition-colors"
            style={{
              background: subTab === t.id ? 'var(--bg-surface)' : 'transparent',
              color: subTab === t.id ? 'var(--text-primary)' : 'var(--text-dim)',
              boxShadow: subTab === t.id ? 'var(--shadow-xs)' : 'none',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'gift' && (
        <div className="space-y-3">
          <InlineAddForm placeholder="新舰礼（如：舰长·张三·新年礼盒）"
            onAdd={(title) => addVtuberEntry({
              type: 'gift', title,
              status: 'pending',
              data: { captainName: '', giftName: '', giftQty: 1, address: '', trackingNo: '' },
              tags: [],
            })} />

          {/* Summary */}
          {gifts.length > 0 && (
            <div className="flex flex-wrap gap-2 text-[10px]">
              <span className="px-2 py-1 rounded-full" style={{ background: GIFT_STATUS.pending.bg, color: GIFT_STATUS.pending.color }}>
                待选品: {gifts.filter((g) => g.status === 'pending').length}
              </span>
              <span className="px-2 py-1 rounded-full" style={{ background: GIFT_STATUS.ordered.bg, color: GIFT_STATUS.ordered.color }}>
                已下单: {gifts.filter((g) => g.status === 'ordered').length}
              </span>
              <span className="px-2 py-1 rounded-full" style={{ background: GIFT_STATUS.shipped.bg, color: GIFT_STATUS.shipped.color }}>
                已发货: {gifts.filter((g) => g.status === 'shipped').length}
              </span>
              <span className="px-2 py-1 rounded-full" style={{ background: GIFT_STATUS.received.bg, color: GIFT_STATUS.received.color }}>
                已签收: {gifts.filter((g) => g.status === 'received').length}
              </span>
            </div>
          )}

          <div className="space-y-2">
            {gifts.map((entry) => (
              <EntryCard key={entry.id} title={entry.title} status={entry.status} statusMap={GIFT_STATUS}
                onDelete={() => deleteVtuberEntry(entry.id)}>
                <div className="grid grid-cols-2 gap-1.5 mt-1.5 text-[10px]">
                  <div style={{ color: 'var(--text-dim)' }}>
                    舰长: {entry.data.captainName as string || '-'}
                  </div>
                  <div style={{ color: 'var(--text-dim)' }}>
                    礼品: {entry.data.giftName as string || '-'} ×{entry.data.giftQty as number || 1}
                  </div>
                  {entry.data.trackingNo && (
                    <div style={{ color: 'var(--text-dim)' }}>
                      单号: {entry.data.trackingNo as string}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <select value={entry.status} onChange={(e) => updateVtuberEntry(entry.id, { status: e.target.value })}
                    className="text-[10px] px-1.5 py-0.5 rounded outline-none"
                    style={{ background: 'transparent', border: '1px solid var(--line)', color: 'var(--text-mid)' }}>
                    <option value="pending">待选品</option>
                    <option value="ordered">已下单</option>
                    <option value="shipped">已发货</option>
                    <option value="received">已签收</option>
                  </select>
                  {entry.status === 'ordered' && (
                    <button onClick={() => {
                      const no = prompt('输入物流单号：', entry.data.trackingNo as string || '');
                      if (no !== null) updateVtuberEntry(entry.id, { status: 'shipped', data: { ...entry.data, trackingNo: no } });
                    }} className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706' }}>
                      填入单号&发货
                    </button>
                  )}
                </div>
              </EntryCard>
            ))}
            {gifts.length === 0 && (
              <div className="text-center py-8 text-xs" style={{ color: 'var(--text-dim)' }}>
                还没有舰礼记录，添加第一条吧
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'dist' && (
        <div className="space-y-3">
          <InlineAddForm placeholder="新分发（如：周五杂谈切片·B站+抖音）"
            onAdd={(title) => addVtuberEntry({
              type: 'distribution', title,
              status: 'pending',
              data: { content: '', platform: 'B站', postedUrl: '' },
              tags: [PLATFORMS[0]],
            })} />

          <div className="space-y-2">
            {distributions.map((entry) => (
              <EntryCard key={entry.id} title={entry.title} status={entry.status} statusMap={DIST_STATUS}
                onDelete={() => deleteVtuberEntry(entry.id)}>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <select value={entry.status} onChange={(e) => updateVtuberEntry(entry.id, { status: e.target.value })}
                    className="text-[10px] px-1.5 py-0.5 rounded outline-none"
                    style={{ background: 'transparent', border: '1px solid var(--line)', color: 'var(--text-mid)' }}>
                    <option value="pending">待发布</option>
                    <option value="posted">已发布</option>
                    <option value="engaged">已互动</option>
                  </select>
                  <div className="flex gap-1">
                    {PLATFORMS.map((p) => {
                      const active = (entry.tags || []).includes(p);
                      return (
                        <button key={p} onClick={() => {
                          const newTags = active ? entry.tags.filter((t: string) => t !== p) : [...entry.tags, p];
                          updateVtuberEntry(entry.id, { tags: newTags });
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded-full transition-colors"
                        style={{
                          background: active ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.03)',
                          color: active ? '#3b82f6' : 'var(--text-dim)',
                        }}>
                        {p}
                      </button>
                    );
                  })}
                </div>
                </div>
              </EntryCard>
            ))}
            {distributions.length === 0 && (
              <div className="text-center py-8 text-xs" style={{ color: 'var(--text-dim)' }}>
                还没有分发记录，添加第一条吧
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
