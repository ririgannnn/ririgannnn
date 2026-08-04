import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Wifi, CloudOff, ChevronDown } from 'lucide-react';

export default function UserMenu() {
  const { user, logout, isOfflineMode } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-black/3 transition-colors"
      >
        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
        >
          <img src="/ito.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        <span className="hidden sm:inline text-sm font-medium" style={{ color: 'var(--text-mid)' }}>
          {user.username}
        </span>
        <ChevronDown size={12} className={`hidden sm:block transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-dim)' }} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden animate-scale-in z-50"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--line)',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          {/* User info */}
          <div className="p-3" style={{ borderBottom: '1px solid var(--line)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              >
                <img src="/ito.jpg" alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {user.username}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isOfflineMode
                    ? <><CloudOff size={10} style={{ color: 'var(--accent-rust)' }} /><span className="text-[10px] font-medium" style={{ color: 'var(--accent-rust)' }}>离线模式</span></>
                    : <><Wifi size={10} style={{ color: 'var(--accent-teal)' }} /><span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>在线</span></>
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-1.5">
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-red-50"
              style={{ color: 'var(--accent-dust)' }}
            >
              <LogOut size={15} />
              退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
