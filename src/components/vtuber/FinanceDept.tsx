import { useState, useMemo } from 'react';
import { useStore } from '../../stores';
import { InlineAddForm, EntryCard } from './shared';

const FINANCE_CATEGORIES = {
  income: ['打赏', '商单', '平台分成', '周边销售', '其他收入'],
  expense: ['设备', '软件订阅', '外包画师', '推广投放', '其他支出'],
};

export default function FinanceDept() {
  const { vtuberEntries, addVtuberEntry, updateVtuberEntry, deleteVtuberEntry } = useStore();
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const finances = useMemo(() => {
    let list = vtuberEntries.filter((e) => e.type === 'finance');
    if (filterType !== 'all') list = list.filter((e) => e.status === filterType);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [vtuberEntries, filterType]);

  const allFinances = vtuberEntries.filter((e) => e.type === 'finance');
  const totalIncome = allFinances.filter((e) => e.status === 'income').reduce((s, e) => s + ((e.data.amount as number) || 0), 0);
  const totalExpense = allFinances.filter((e) => e.status === 'expense').reduce((s, e) => s + ((e.data.amount as number) || 0), 0);

  return (
    <div className="space-y-4">
      <InlineAddForm placeholder="新记录（如：B站打赏收入 ¥500）"
        onAdd={(title) => {
          addVtuberEntry({
            type: 'finance', title,
            status: 'income',
            data: { category: '打赏', amount: 0, note: '', date: new Date().toISOString().slice(0, 10) },
            tags: [],
          });
        }} />

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(31,157,85,0.06)', border: '1px solid rgba(31,157,85,0.15)' }}>
          <div className="text-[10px] mb-0.5" style={{ color: '#1f9d55' }}>收入</div>
          <div className="text-sm font-bold" style={{ color: '#1f9d55' }}>¥{totalIncome.toLocaleString()}</div>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)' }}>
          <div className="text-[10px] mb-0.5" style={{ color: '#dc2626' }}>支出</div>
          <div className="text-sm font-bold" style={{ color: '#dc2626' }}>¥{totalExpense.toLocaleString()}</div>
        </div>
        <div className="rounded-lg p-3 text-center" style={{
          background: totalIncome - totalExpense >= 0 ? 'rgba(31,157,85,0.06)' : 'rgba(220,38,38,0.06)',
          border: `1px solid ${totalIncome - totalExpense >= 0 ? 'rgba(31,157,85,0.15)' : 'rgba(220,38,38,0.15)'}`,
        }}>
          <div className="text-[10px] mb-0.5" style={{ color: totalIncome - totalExpense >= 0 ? '#1f9d55' : '#dc2626' }}>净额</div>
          <div className="text-sm font-bold" style={{ color: totalIncome - totalExpense >= 0 ? '#1f9d55' : '#dc2626' }}>
            ¥{(totalIncome - totalExpense).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.04)' }}>
        {[
          { id: 'all' as const, label: '全部' },
          { id: 'income' as const, label: '收入' },
          { id: 'expense' as const, label: '支出' },
        ].map((f) => (
          <button key={f.id} onClick={() => setFilterType(f.id)}
            className="flex-1 text-xs py-1 rounded-md font-medium transition-colors"
            style={{
              background: filterType === f.id ? 'var(--bg-surface)' : 'transparent',
              color: filterType === f.id ? 'var(--text-primary)' : 'var(--text-dim)',
              boxShadow: filterType === f.id ? 'var(--shadow-xs)' : 'none',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {finances.map((entry) => {
          const isIncome = entry.status === 'income';
          return (
            <EntryCard key={entry.id} title={entry.title}
              status={entry.status}
              statusMap={{
                income: { label: '收入', bg: 'rgba(31,157,85,0.1)', color: '#1f9d55' },
                expense: { label: '支出', bg: 'rgba(220,38,38,0.1)', color: '#dc2626' },
              }}
              onDelete={() => deleteVtuberEntry(entry.id)}>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: isIncome ? '#1f9d55' : '#dc2626' }}>
                    {isIncome ? '+' : '-'}¥{(entry.data.amount as number || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(153,167,188,0.08)', color: 'var(--text-dim)' }}>
                    {entry.data.category as string || '-'}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                    {entry.data.date as string || '-'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <select value={entry.status} onChange={(e) => updateVtuberEntry(entry.id, { status: e.target.value })}
                    className="text-[10px] px-1 py-0.5 rounded outline-none"
                    style={{ background: 'transparent', border: '1px solid var(--line)', color: 'var(--text-mid)' }}>
                    <option value="income">收入</option>
                    <option value="expense">支出</option>
                  </select>
                  <select value={entry.data.category as string || ''}
                    onChange={(e) => updateVtuberEntry(entry.id, { data: { ...entry.data, category: e.target.value } })}
                    className="text-[10px] px-1 py-0.5 rounded outline-none"
                    style={{ background: 'transparent', border: '1px solid var(--line)', color: 'var(--text-mid)' }}>
                    {(FINANCE_CATEGORIES[entry.status as keyof typeof FINANCE_CATEGORIES] || FINANCE_CATEGORIES.income).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </EntryCard>
          );
        })}
        {finances.length === 0 && (
          <div className="text-center py-8 text-xs" style={{ color: 'var(--text-dim)' }}>
            还没有财务记录，添加第一条吧
          </div>
        )}
      </div>
    </div>
  );
}
