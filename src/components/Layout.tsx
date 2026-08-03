import { useEffect, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import UserMenu from './UserMenu';
import DashboardView from './DashboardView';
import TaskView from './TaskView';
import NotesView from './NotesView';
import KnowledgeBase from './KnowledgeBase';
import CalendarView from './CalendarView';
import DataDashboard from './DataDashboard';
import InspirationView from './InspirationView';
import SettingsPanel from './SettingsPanel';
import { useStore } from '../stores';
import { useAuth } from '../contexts/AuthContext';
import type { ModuleType } from '../types';

const moduleMeta: Record<Exclude<ModuleType, 'dashboard'>, { label: string; english: string; accentClass: string }> = {
  tasks:      { label: '任务管理', english: 'EXECUTE',     accentClass: 'module-accent-amber' },
  notes:      { label: '笔记文档', english: 'CAPTURE',     accentClass: 'module-accent-purple' },
  knowledge:  { label: '个人知识库', english: 'ORGANIZE',   accentClass: 'module-accent-teal' },
  calendar:   { label: '日历日程', english: 'PLAN',        accentClass: 'module-accent-pink' },
  data:       { label: '数据分析', english: 'ANALYZE',     accentClass: 'module-accent-lime' },
  inspiration:{ label: '灵感数据库', english: 'SPARK',     accentClass: 'module-accent-coral' },
};

export default function Layout() {
  const { token, isOfflineMode } = useAuth();
  const activeModule = useStore((s) => s.activeModule);
  const initSync = useStore((s) => s.initSync);
  const stopSync = useStore((s) => s.stopSync);
  const meta = activeModule !== 'dashboard' ? moduleMeta[activeModule as Exclude<ModuleType, 'dashboard'>] : null;
  const syncStarted = useRef(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (token && !syncStarted.current && !isOfflineMode) {
      syncStarted.current = true;
      // Wrap in try-catch to prevent unhandled rejection from crashing the page
      initSync(token).catch((err) => {
        console.error('[Layout] initSync failed:', err);
        syncStarted.current = false;
      });
    }
    return () => {
      if (syncStarted.current) {
        try {
          stopSync();
        } catch (err) {
          console.error('[Layout] stopSync failed:', err);
        }
        syncStarted.current = false;
      }
    };
  }, [token, isOfflineMode]);

  const renderModule = () => {
    switch (activeModule) {
      case 'tasks': return <TaskView />;
      case 'notes': return <NotesView />;
      case 'knowledge': return <KnowledgeBase />;
      case 'calendar': return <CalendarView />;
      case 'data': return <DataDashboard />;
      case 'inspiration': return <InspirationView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="relative flex h-full overflow-hidden">
      {/* ===== White Frosted Glass Background ===== */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse at 20% 0%, hsl(${220} 30% 94%) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 100%, hsl(${260} 25% 93%) 0%, transparent 50%),
            linear-gradient(180deg, hsl(220 20% 98%) 0%, hsl(220 15% 95%) 100%)
          `,
        }}
      />
      {/* Subtle noise texture overlay for depth */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E")`,
        }}
      />

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar Drawer */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-0">
        {/* Top bar — white frosted glass */}
        <header
          className="h-14 shrink-0 flex items-center px-3 md:px-6 border-b border-black/5 relative z-10"
          style={{
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(20px) saturate(140%)',
            WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          }}
        >
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 mr-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          </button>

          {/* Module label on mobile */}
          <span className="md:hidden text-sm font-semibold text-fg truncate">
            {activeModule === 'dashboard' ? '工作台' : meta?.label}
          </span>

          <div className="flex-1" />

          {/* User Menu */}
          <UserMenu />

          <SettingsPanel />
        </header>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto p-3 md:p-6 pb-20 md:pb-6 relative"
          key={activeModule}
        >
          <div className="animate-scale-in max-w-[1600px] mx-auto">
            {/* Module accent header (non-dashboard modules, desktop) */}
            {meta && (
              <div className="hidden md:flex mb-6 items-center gap-3">
                <div className={`module-accent pl-3 ${meta.accentClass}`}>
                  <span className="text-xs font-bold uppercase tracking-[0.25em] text-muted-fg opacity-60">
                    {meta.english}
                  </span>
                </div>
                <span className="text-sm text-muted-fg opacity-40 select-none">{meta.label}</span>
              </div>
            )}
            {renderModule()}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav onMenuClick={() => setMobileMenuOpen(true)} />
      </main>
    </div>
  );
}
