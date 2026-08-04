import { useStore } from '../../stores';
import { InlineAddForm, EntryCard } from './shared';

const DESIGN_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  requested:   { label: '待处理', bg: 'rgba(138,148,166,0.1)', color: '#6b7280' },
  in_progress: { label: '进行中', bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
  done:        { label: '已完成', bg: 'rgba(31,157,85,0.1)', color: '#1f9d55' },
};

const COLUMNS = ['requested', 'in_progress', 'done'] as const;
const COLUMN_LABELS: Record<string, string> = {
  requested: '待处理', in_progress: '进行中', done: '已完成',
};

export default function DesignDept() {
  const { vtuberEntries, addVtuberEntry, updateVtuberEntry, deleteVtuberEntry } = useStore();
  const items = vtuberEntries.filter((e) => e.type === 'design_todo');

  const moveTo = (id: string, status: string) => {
    updateVtuberEntry(id, { status });
  };

  return (
    <div className="space-y-4">
      <InlineAddForm placeholder="新素材需求（如：B站封面·周五杂谈）"
        onAdd={(title) => addVtuberEntry({
          type: 'design_todo', title,
          status: 'requested',
          data: { description: '', platform: 'B站', size: '1920x1080', assignee: '', dueDate: '' },
          tags: [],
        })} />

      {/* Kanban */}
      <div className="grid grid-cols-3 gap-3">
        {COLUMNS.map((col) => {
          const colItems = items.filter((i) => i.status === col);
          return (
            <div key={col} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold" style={{ color: 'var(--text-dim)' }}>
                  {COLUMN_LABELS[col]}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--text-dim)' }}>
                  {colItems.length}
                </span>
              </div>
              <div className="space-y-2 min-h-[100px] rounded-lg p-2" style={{ background: 'rgba(0,0,0,0.02)', border: '1px dashed var(--line)' }}>
                {colItems.map((entry) => (
                  <div key={entry.id} className="rounded-lg p-2.5 cursor-pointer transition-colors"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)' }}
                    onClick={() => {
                      const cols = ['requested', 'in_progress', 'done'];
                      const idx = cols.indexOf(entry.status);
                      moveTo(entry.id, cols[(idx + 1) % 3]);
                    }}>
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{entry.title}</span>
                      <button onClick={(e) => { e.stopPropagation(); deleteVtuberEntry(entry.id); }}
                        className="text-[10px] px-1 py-0.5 rounded hover:bg-black/5"
                        style={{ color: 'var(--text-dim)' }}>
                        ✕
                      </button>
                    </div>
                    {(entry.data.platform || entry.data.size) && (
                      <div className="flex items-center gap-1.5 mt-1">
                        {entry.data.platform && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(153,167,188,0.08)', color: 'var(--text-dim)' }}>
                            {entry.data.platform as string}
                          </span>
                        )}
                        {entry.data.size && (
                          <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                            {entry.data.size as string}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {colItems.length === 0 && (
                  <div className="text-center py-4 text-[10px]" style={{ color: 'var(--text-dim)' }}>拖拽至此</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
