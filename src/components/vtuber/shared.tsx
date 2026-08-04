import { type ReactNode, useState } from 'react';
import { Plus, X } from 'lucide-react';

// ── Status Badge ──
interface StatusMap { [key: string]: { label: string; bg: string; color: string } }

export function StatusBadge({ status, map }: { status: string; map: StatusMap }) {
  const s = map[status] || { label: status, bg: 'rgba(0,0,0,0.06)', color: 'var(--text-dim)' };
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// ── Entry Card ──
interface EntryCardProps {
  title: string;
  subtitle?: string;
  status: string;
  statusMap: StatusMap;
  onDelete: () => void;
  children?: ReactNode;
}

export function EntryCard({ title, subtitle, status, statusMap, onDelete, children }: EntryCardProps) {
  return (
    <div className="rounded-lg p-3 transition-colors"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)' }}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {title}
          </span>
          {subtitle && (
            <span className="text-xs ml-2" style={{ color: 'var(--text-dim)' }}>{subtitle}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusBadge status={status} map={statusMap} />
          <button onClick={onDelete} className="p-0.5 rounded hover:bg-black/5 transition-colors">
            <X size={12} style={{ color: 'var(--text-dim)' }} />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Inline Add Form ─��
interface InlineAddFormProps {
  placeholder?: string;
  onAdd: (title: string) => void;
  extra?: ReactNode;
}

export function InlineAddForm({ placeholder = '添加...', onAdd, extra }: InlineAddFormProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  const submit = () => {
    if (!value.trim()) return;
    onAdd(value.trim());
    setValue('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs py-2 px-3 rounded-lg transition-colors w-full"
        style={{ color: 'var(--text-dim)', border: '1px dashed var(--line)' }}
      >
        <Plus size={14} />
        {placeholder}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false); }}
        placeholder={placeholder}
        className="flex-1 text-sm px-3 py-1.5 rounded-lg outline-none"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)', color: 'var(--text-primary)' }}
      />
      {extra}
      <button onClick={submit} className="text-xs px-3 py-1.5 rounded-lg text-white transition-colors"
        style={{ background: 'var(--primary)' }}>
        添加
      </button>
      <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-black/5">
        <X size={14} style={{ color: 'var(--text-dim)' }} />
      </button>
    </div>
  );
}
