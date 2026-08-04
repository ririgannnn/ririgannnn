import { useState } from 'react';
import { useStore } from '../../stores';
import type { VtuberEntry } from '../../types';
import { InlineAddForm, EntryCard, StatusBadge } from './shared';

const TOPIC_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  idea:    { label: '待开发', bg: 'rgba(138,148,166,0.1)', color: '#6b7280' },
  planned: { label: '已规划', bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
  scripted:{ label: '已写稿', bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6' },
  done:    { label: '已完成', bg: 'rgba(31,157,85,0.1)', color: '#1f9d55' },
};

const NEXT_STATUS: Record<string, string> = {
  idea: 'planned', planned: 'scripted', scripted: 'done', done: 'idea',
};

const TOPIC_TYPES = ['杂谈', '游戏实况', '歌回', '联动', '短视频', '其他'];

const SCRIPT_TEMPLATES: Record<string, string> = {
  '杂谈': `【开场】打招呼 + 今日心情（2-3分钟）\n【话题1】最近发生的趣事（5-8分钟）\n【话题2】粉丝互动/弹幕话题（5分钟）\n【话题3】近期计划预告（3分钟）\n【结尾】感谢+下播预告`,
  '游戏实况': `【开场】打招呼 + 游戏名（2分钟）\n【介绍】游戏背景/今日目标（3分钟）\n【主环节】游戏实况（核心时间）\n【高光】精彩时刻复盘（5分钟）\n【结尾】总结+下期预告`,
  '歌回': `【开场】打招呼 + 今日歌单预告（2分钟）\n【歌曲1-3】主歌连唱\n【互动】弹幕点歌/猜歌（5分钟）\n【歌曲4-6】继续\n【结尾】感谢+晚安`,
  '联动': `【开场】互相介绍 + 联动主题（3分钟）\n【环节1】合作游戏/互动（15分钟）\n【环节2】惩罚/奖励环节（10分钟）\n【结尾】各自宣传+道别`,
};

export default function ContentDept() {
  const { vtuberEntries, addVtuberEntry, updateVtuberEntry, deleteVtuberEntry } = useStore();
  const [subTab, setSubTab] = useState<'topic' | 'schedule' | 'script' | 'chat'>('topic');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatText, setEditingChatText] = useState('');

  const topics = vtuberEntries.filter((e) => e.type === 'topic');
  const schedules = vtuberEntries.filter((e) => e.type === 'stream_schedule');
  const chatNotes = vtuberEntries.filter((e) => e.type === 'chat_note');

  const handleTopicStatus = (entry: VtuberEntry) => {
    const nxt = NEXT_STATUS[entry.status] || 'idea';
    updateVtuberEntry(entry.id, { status: nxt });
  };

  const handleScriptGen = (entry: VtuberEntry) => {
    const ct = (entry.data.contentType as string) || '杂谈';
    const template = SCRIPT_TEMPLATES[ct] || SCRIPT_TEMPLATES['杂谈'];
    updateVtuberEntry(entry.id, {
      data: { ...entry.data, scriptOutline: template, aiGenerated: true },
    });
  };

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.04)' }}>
        {[
          { id: 'topic' as const, label: '选题库' },
          { id: 'schedule' as const, label: '直播排期' },
          { id: 'script' as const, label: 'AI脚本' },
          { id: 'chat' as const, label: '杂谈库' },
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

      {subTab === 'topic' && (
        <div className="space-y-3">
          <InlineAddForm placeholder="新选题（如：周五杂谈·夏日回忆）"
            extra={
              <select onChange={(e) => {}} id="topic-type-select"
                className="text-xs px-2 py-1.5 rounded-lg outline-none"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)', color: 'var(--text-mid)' }}>
                {TOPIC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            }
            onAdd={(title) => {
              const sel = (document.getElementById('topic-type-select') as HTMLSelectElement)?.value || '杂谈';
              addVtuberEntry({
                type: 'topic', title,
                status: 'idea',
                data: { contentType: sel, description: '', scriptOutline: '', aiGenerated: false },
                tags: [sel],
              });
            }} />

          <div className="space-y-2">
            {topics.map((entry) => (
              <EntryCard key={entry.id} title={entry.title}
                subtitle={(entry.data.contentType as string) || ''}
                status={entry.status} statusMap={TOPIC_STATUS}
                onDelete={() => deleteVtuberEntry(entry.id)}>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {(entry.tags || []).map((tag: string) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(153,167,188,0.1)', color: 'var(--text-dim)' }}>{tag}</span>
                  ))}
                  <div className="flex-1" />
                  <button onClick={() => handleTopicStatus(entry)}
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors"
                    style={{ background: TOPIC_STATUS[NEXT_STATUS[entry.status]]?.bg, color: TOPIC_STATUS[NEXT_STATUS[entry.status]]?.color }}>
                    → {NEXT_STATUS[entry.status]}
                  </button>
                  <button onClick={() => handleScriptGen(entry)}
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors"
                    style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                    AI大纲
                  </button>
                </div>
                {(entry.data.scriptOutline as string) && (
                  <div className="mt-2 text-xs rounded-lg p-2 whitespace-pre-wrap leading-relaxed"
                    style={{ background: 'rgba(139,92,246,0.04)', color: 'var(--text-mid)', border: '1px dashed rgba(139,92,246,0.15)' }}>
                    {entry.data.scriptOutline as string}
                  </div>
                )}
              </EntryCard>
            ))}
            {topics.length === 0 && (
              <div className="text-center py-8 text-xs" style={{ color: 'var(--text-dim)' }}>
                还没有选题，点击上方按钮添加你的第一个选题
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'schedule' && (
        <div className="space-y-3">
          <InlineAddForm placeholder="新排期（如：周六 20:00 B站杂谈）"
            onAdd={(title) => addVtuberEntry({
              type: 'stream_schedule', title,
              status: 'scheduled',
              data: { platform: 'B站', startTime: '', duration: 120 },
              tags: [],
            })} />

          <div className="space-y-2">
            {schedules.map((entry) => (
              <EntryCard key={entry.id} title={entry.title}
                status={entry.status}
                statusMap={{
                  scheduled: { label: '已排期', bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
                  live:     { label: '直播中', bg: 'rgba(220,38,38,0.1)', color: '#dc2626' },
                  completed:{ label: '已完成', bg: 'rgba(31,157,85,0.1)', color: '#1f9d55' },
                  cancelled:{ label: '已取消', bg: 'rgba(0,0,0,0.06)', color: 'var(--text-dim)' },
                }}
                onDelete={() => deleteVtuberEntry(entry.id)}>
                <div className="flex items-center gap-2 mt-1.5">
                  <select value={entry.status as string} onChange={(e) => updateVtuberEntry(entry.id, { status: e.target.value })}
                    className="text-[10px] px-1.5 py-0.5 rounded outline-none"
                    style={{ background: 'transparent', border: '1px solid var(--line)', color: 'var(--text-mid)' }}>
                    <option value="scheduled">已排期</option>
                    <option value="live">直播中</option>
                    <option value="completed">已完成</option>
                    <option value="cancelled">已取消</option>
                  </select>
                  <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                    平台: {entry.data.platform as string || '未设置'}
                  </span>
                </div>
              </EntryCard>
            ))}
          </div>
        </div>
      )}

      {subTab === 'script' && (
        <div className="space-y-3">
          <div className="text-xs rounded-lg p-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)', color: 'var(--text-mid)' }}>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>AI脚本生成器</span>
            <p className="mt-1">在「选题库」中点击 "AI大纲" 按钮即可为选中的选题自动生成直播脚本大纲。</p>
            <p className="mt-1">可选模板：杂谈 / 游戏实况 / 歌回 / 联动</p>
          </div>

          <div className="space-y-2">
            {topics.filter((e) => e.data.scriptOutline).map((entry) => (
              <div key={entry.id} className="rounded-lg p-3"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{entry.title}</span>
                  <StatusBadge status={entry.status} map={TOPIC_STATUS} />
                </div>
                <pre className="text-xs whitespace-pre-wrap leading-relaxed"
                  style={{ color: 'var(--text-mid)', fontFamily: 'var(--font-sans)' }}>
                  {entry.data.scriptOutline as string}
                </pre>
              </div>
            ))}
            {topics.filter((e) => e.data.scriptOutline).length === 0 && (
              <div className="text-center py-8 text-xs" style={{ color: 'var(--text-dim)' }}>
                还没有生成脚本的选题，去「选题库」点击 AI大纲 试试
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'chat' && (
        <div className="space-y-3">
          <InlineAddForm placeholder="记录一个杂谈话题（如：今天路上遇到的猫）"
            onAdd={(title) => addVtuberEntry({
              type: 'chat_note', title,
              status: 'active',
              data: {}, tags: [],
            })} />

          <div className="space-y-1">
            {chatNotes.map((entry) => (
              <div key={entry.id} className="flex items-center gap-2 group py-1.5 px-2 rounded-lg transition-colors hover:bg-black/[0.02]">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--text-dim)' }} />
                {editingChatId === entry.id ? (
                  <input
                    value={editingChatText}
                    onChange={(e) => setEditingChatText(e.target.value)}
                    onBlur={() => {
                      if (editingChatText.trim()) updateVtuberEntry(entry.id, { title: editingChatText.trim() });
                      setEditingChatId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (editingChatText.trim()) updateVtuberEntry(entry.id, { title: editingChatText.trim() });
                        setEditingChatId(null);
                      }
                      if (e.key === 'Escape') setEditingChatId(null);
                    }}
                    className="flex-1 text-sm px-1.5 py-0.5 rounded outline-none"
                    style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)', border: '1px solid var(--line)' }}
                    autoFocus
                  />
                ) : (
                  <span
                    className="flex-1 text-sm cursor-text truncate"
                    style={{ color: 'var(--text-primary)' }}
                    onClick={() => { setEditingChatId(entry.id); setEditingChatText(entry.title); }}
                    title="点击编辑"
                  >
                    {entry.title}
                  </span>
                )}
                <button
                  onClick={() => deleteVtuberEntry(entry.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 rounded text-[11px]"
                  style={{ color: 'var(--text-dim)' }}
                  title="删除"
                >
                  删除
                </button>
              </div>
            ))}
            {chatNotes.length === 0 && (
              <div className="text-center py-8 text-xs" style={{ color: 'var(--text-dim)' }}>
                还没有杂谈话题，遇到有趣的点子就记下来吧
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
