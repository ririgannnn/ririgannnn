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
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors"
      >
        <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
          style={{ background: 'linear-gradient(135deg, hsl(var(--accent-pink)), hsl(var(--accent-purple)))' }}
        >
          {user.username.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:inline text-sm font-medium text-fg">{user.username}</span>
        <ChevronDown size={12} className={`hidden sm:block text-muted-fg transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-lg border overflow-hidden animate-scale-in z-50"
          style={{
            background: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
          }}
        >
          {/* User info */}
          <div className="p-3 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg font-bold"
                style={{ background: 'linear-gradient(135deg, hsl(var(--accent-pink)), hsl(var(--accent-purple)))' }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-fg">{user.username}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isOfflineMode
                    ? <><CloudOff size={10} className="text-amber-500" /><span className="text-[10px] text-amber-600">离线模式</span></>
                    : <><Wifi size={10} className="text-green-500" /><span className="text-[10px] text-muted-fg">在线</span></>
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-1.5">
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-red-500 hover:bg-red-50 transition-colors"
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
