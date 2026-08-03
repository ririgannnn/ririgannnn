import { useStore } from '../stores';
import type { ModuleType } from '../types';
import {
  LayoutDashboard, CheckSquare, FileText, BookOpen,
  Calendar, BarChart3, Lightbulb, ChevronLeft, Settings, X
} from 'lucide-react';

const menuItems: { id: ModuleType; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: '工作台', icon: LayoutDashboard },
  { id: 'tasks', label: '任务', icon: CheckSquare },
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
      className="h-full flex flex-col shrink-0 overflow-hidden transition-all duration-300"
      style={{ width: collapsed ? 64 : 240, backgroundColor: 'hsl(var(--sidebar))', color: 'hsl(var(--sidebar-foreground))' }}
    >
      {/* Logo — gradient color-block */}
      <div className="flex items-center h-14 px-4 shrink-0 border-b" style={{ borderColor: 'hsl(var(--sidebar-foreground) / 0.1)' }}>
        {!collapsed && (
          <div className="flex items-center gap-3 animate-fade-in">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-base shrink-0"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--accent-pink)), hsl(var(--accent-purple)), hsl(var(--accent-teal)), hsl(var(--accent-amber)))',
                backgroundSize: '300% 300%',
                animation: 'colorShift 8s ease infinite',
              }}
            >
              荔
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm tracking-[0.15em] uppercase">RIRIGANNNN</span>
              <span className="text-[10px] opacity-50 font-medium -mt-0.5">荔荔绀工作台</span>
            </div>
          </div>
        )}
        {/* Close button on mobile */}
        {onMobileClose && (
          <button onClick={onMobileClose} className="md:hidden ml-auto p-1.5 rounded-md hover:bg-white/10 transition-colors" style={{ color: 'hsl(var(--sidebar-foreground) / 0.7)' }}>
            <X size={20} />
          </button>
        )}
        {!onMobileClose && (
          <button
            onClick={() => updateSettings({ sidebarCollapsed: !collapsed })}
            className="ml-auto p-1 rounded-md hover:bg-white/10 transition-colors"
            style={{ opacity: collapsed ? 1 : undefined, color: 'hsl(var(--sidebar-foreground) / 0.6)' }}
          >
            <ChevronLeft size={18} style={{ transform: collapsed ? 'rotate(180deg)' : undefined, transition: 'transform 0.3s' }} />
          </button>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-150 group"
              style={{
                marginLeft: collapsed ? 0 : 8,
                marginRight: collapsed ? 0 : 8,
                borderRadius: '0.5rem',
                background: active ? 'hsl(var(--sidebar-accent))' : 'transparent',
                color: active ? 'white' : 'hsl(var(--sidebar-foreground) / 0.7)',
                ...(!collapsed && { marginBottom: 2 }),
              }}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={19} />
              {!collapsed && <span className="font-medium">{item.label}</span>}
              {active && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom: decorative English + settings */}
      <div className="border-t" style={{ borderColor: 'hsl(var(--sidebar-foreground) / 0.1)' }}>
        {!collapsed && (
          <div className="px-4 pt-3 pb-1 flex gap-2 text-[9px] uppercase tracking-[0.2em] font-bold opacity-30 select-none">
            <span style={{ color: 'hsl(var(--accent-pink))' }}>Create</span>
            <span className="opacity-30">·</span>
            <span style={{ color: 'hsl(var(--accent-teal))' }}>Focus</span>
            <span className="opacity-30">·</span>
            <span style={{ color: 'hsl(var(--accent-amber))' }}>Flow</span>
          </div>
        )}
        <div className="px-3 pb-3" style={{ paddingTop: collapsed ? 3 : 0 }}>
          <button
            onClick={() => handleNav('dashboard')}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: 'hsl(var(--sidebar-foreground))' }}
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
        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={onMobileClose}
        />
        {/* Drawer */}
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
