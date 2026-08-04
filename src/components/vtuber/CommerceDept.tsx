import { useStore } from '../../stores';
import { InlineAddForm, EntryCard } from './shared';

const COMMERCE_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  negotiating: { label: '洽谈中', bg: 'rgba(138,148,166,0.1)', color: '#6b7280' },
  confirmed:   { label: '已确认', bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
  executing:   { label: '执行中', bg: 'rgba(245,158,11,0.1)', color: '#d97706' },
  delivered:   { label: '已交付', bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6' },
  paid:        { label: '已收款', bg: 'rgba(31,157,85,0.1)', color: '#1f9d55' },
};

const COLUMNS = ['negotiating', 'confirmed', 'executing', 'delivered', 'paid'] as const;
const COLUMN_LABELS: Record<string, string> = {
  negotiating: '洽谈', confirmed: '已确认', executing: '执行', delivered: '交付', paid: '收款',
};

export default function CommerceDept() {
  const { vtuberEntries, addVtuberEntry, updateVtuberEntry, deleteVtuberEntry } = useStore();
  const items = vtuberEntries.filter((e) => e.type === 'commerce');

  const totalPaid = items
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + ((i.data.amount as number) || 0), 0);

  return (
    <div className="space-y-4">
      <InlineAddForm placeholder="新商单（如：XX品牌合作·口播推广）"
        onAdd={(title) => addVtuberEntry({
          type: 'commerce', title,
          status: 'negotiating',
          data: { brand: '', amount: 0, contactPerson: '', deliverable: '', notes: '' },
          tags: [],
        })} />

      {/* Total */}
      {totalPaid > 0 && (
        <div className="rounded-lg p-3 flex items-center justify-between"
          style={{ background: 'rgba(31,157,85,0.06)', border: '1px solid rgba(31,157,85,0.15)' }}>
          <span className="text-xs font-medium" style={{ color: '#1f9d55' }}>已收款总额</span>
          <span className="text-sm font-bold" style={{ color: '#1f9d55' }}>¥{totalPaid.toLocaleString()}</span>
        </div>
      )}

      {/* Kanban */}
      <div className="grid grid-cols-5 gap-2">
        {COLUMNS.map((col) => {
          const colItems = items.filter((i) => i.status === col);
          return (
            <div key={col} className="space-y-1.5">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] font-semibold" style={{ color: COMMERCE_STATUS[col].color }}>
                  {COLUMN_LABELS[col]}
                </span>
                <span className="text-[9px] px-1 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--text-dim)' }}>
                  {colItems.length}
                </span>
              </div>
              <div className="space-y-1.5 min-h-[80px] rounded p-1.5"
                style={{ background: 'rgba(0,0,0,0.02)', border: '1px dashed var(--line)' }}>
                {colItems.map((entry) => (
                  <div key={entry.id} className="rounded p-2 cursor-pointer transition-colors"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)', boxShadow: 'var(--shadow-xs)' }}
                    onClick={() => {
                      const idx = COLUMNS.indexOf(col);
                      if (idx < COLUMNS.length - 1) updateVtuberEntry(entry.id, { status: COLUMNS[idx + 1] });
                    }}>
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-[11px] font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>
                        {entry.title}
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); deleteVtuberEntry(entry.id); }}
                        className="text-[10px] px-1 rounded hover:bg-black/5"
                        style={{ color: 'var(--text-dim)' }}>
                        ✕
                      </button>
                    </div>
                    {(entry.data.amount as number) > 0 && (
                      <div className="text-[10px] mt-0.5 font-semibold" style={{ color: COMMERCE_STATUS[col].color }}>
                        ¥{(entry.data.amount as number).toLocaleString()}
                      </div>
                    )}
                    {entry.data.brand && (
                      <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
                        {entry.data.brand as string}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
