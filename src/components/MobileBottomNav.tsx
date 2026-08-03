import { useStore } from '../stores';
import type { ModuleType } from '../types';
import {
  LayoutDashboard, CheckSquare, FileText, Calendar, Menu
} from 'lucide-react';

const navItems: { id: ModuleType; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: '工作台', icon: LayoutDashboard },
  { id: 'tasks', label: '任务', icon: CheckSquare },
  { id: 'notes', label: '笔记', icon: FileText },
  { id: 'calendar', label: '日历', icon: Calendar },
];

interface Props {
  onMenuClick: () => void;
}

export default function MobileBottomNav({ onMenuClick }: Props) {
  const { activeModule, setActiveModule } = useStore();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around h-16 px-1 pb-safe"
      style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        borderTop: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = activeModule === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveModule(item.id)}
            className="flex flex-col items-center justify-center gap-0.5 min-w-[60px] h-full transition-colors"
            style={{ color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
      <button
        onClick={onMenuClick}
        className="flex flex-col items-center justify-center gap-0.5 min-w-[60px] h-full transition-colors"
        style={{ color: 'hsl(var(--muted-foreground))' }}
      >
        <Menu size={20} />
        <span className="text-[10px] font-medium">更多</span>
      </button>
    </nav>
  );
}
