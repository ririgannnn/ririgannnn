import { useStore } from '../stores';
import type { ModuleType } from '../types';
import {
  LayoutDashboard, CheckSquare, FileText, BookOpen,
  Calendar, BarChart3, Lightbulb, ChevronLeft, Settings, X, FolderKanban
} from 'lucide-react';

const menuItems: { id: ModuleType; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: '工作台', icon: LayoutDashboard },
  { id: 'tasks', label: '任务', icon: CheckSquare },
  { id: 'projects', label: '项目', icon: FolderKanban },
  { id: 'notes', label: '笔记', icon: FileText },
  { id: 'knowledge', label: '知识库', icon: BookOpen },
  { id: 'calendar', label: '日历', icon: Calendar },
  { id: 'data', label: '数据分析', icon: BarChart3 },
  { id: 'inspiration', label: '灵感', icon: Lightbulb },
];

interface Props {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: Props) {
  const { activeModule, setActiveModule, settings, updateSettings } = useStore();
  const collapsed = settings.sidebarCollapsed;

  const handleNav = (id: ModuleType) => {
    setActiveModule(id);
    onMobileClose?.();
  };

  const sidebarContent = (
    <aside
      className="h-full flex flex-col shrink-0 overflow-hidden transition-all duration-300 relative"
      style={{
        width: collapsed ? 64 : 240,
        background: 'var(--bg-surface)',
        color: 'var(--text-mid)',
        borderRight: '1px solid var(--line)',
      }}
    >
      {/* Logo area */}
      <div
        className="flex items-center h-14 px-4 shrink-0 relative z-10"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        {!collapsed && (
          <div className="flex items-center gap-3 animate-fade-in">
            <img
              src="/logo.png"
              alt="logo"
              className="w-8 h-8 rounded-lg object-cover flex-shrink-0 transition-transform duration-300 hover:scale-110"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            />
            <div className="flex flex-col leading-tight">
              <span className="font-medium text-sm tracking-[0.04em] font-serif" style={{ color: 'var(--kon-dark)' }}>
                荔荔绀工作台
              </span>
              <span className="text-[10px] font-medium -mt-0.5" style={{ color: 'var(--text-dim)' }}>
                Ririgannnn
              </span>
            </div>
          </div>
        )}
        {/* Close button on mobile */}
        {onMobileClose && (
          <button onClick={onMobileClose} className="md:hidden ml-auto p-1.5 rounded-md hover:bg-black/5 transition-colors"
            style={{ color: 'var(--text-dim)' }}
          >
            <X size={20} />
          </button>
        )}
        {!onMobileClose && (
          <button
            onClick={() => updateSettings({ sidebarCollapsed: !collapsed })}
            className="ml-auto p-1 rounded-md hover:bg-black/5 transition-colors"
            style={{ color: 'var(--text-dim)' }}
          >
            <ChevronLeft size={18} style={{ transform: collapsed ? 'rotate(180deg)' : undefined, transition: 'transform 0.3s' }} />
          </button>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 py-3 overflow-y-auto relative z-10">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200 group"
              style={{
                marginLeft: collapsed ? 4 : 8,
                marginRight: collapsed ? 4 : 8,
                marginBottom: 2,
                borderRadius: '8px',
                background: active ? 'rgba(153, 167, 188, 0.12)' : 'transparent',
                color: active ? 'var(--kon-deeper)' : 'var(--text-mid)',
                fontWeight: active ? 500 : 400,
              }}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={19} />
              {!collapsed && <span>{item.label}</span>}
              {active && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'var(--kon-main)' }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t relative z-10" style={{ borderColor: 'var(--line)' }}>
        {!collapsed && (
          <div className="px-4 pt-3 pb-1 flex gap-2 text-[9px] uppercase tracking-[0.15em] font-semibold select-none"
            style={{ color: 'var(--text-dim)', opacity: 0.35 }}
          >
            <span>Create</span>
            <span>·</span>
            <span>Focus</span>
            <span>·</span>
            <span>Flow</span>
          </div>
        )}
        <div className="px-3 pb-3" style={{ paddingTop: collapsed ? 3 : 0 }}>
          <button
            onClick={() => handleNav('dashboard')}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all duration-200 hover:bg-black/3"
            style={{ color: 'var(--text-dim)' }}
            title="设置"
          >
            <Settings size={17} />
            {!collapsed && <span>设置</span>}
          </button>
        </div>
      </div>
    </aside>
  );

  // Mobile: render as overlay drawer
  if (onMobileClose) {
    return (
      <>
        <div
          className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 md:hidden ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={onMobileClose}
        />
        <div
          className={`fixed top-0 left-0 z-50 h-full transition-transform duration-300 ease-out md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {sidebarContent}
        </div>
      </>
    );
  }

  // Desktop: render inline
  return <div className="hidden md:block h-full">{sidebarContent}</div>;
}
