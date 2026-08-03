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
      initSync(token);
    }
    return () => {
      if (syncStarted.current) {
        stopSync();
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
    <div className="relative flex h-screen overflow-hidden">
      {/* ===== Background Layer ===== */}
      <img
        src="/bg-main.jpg"
        alt=""
        className="fixed inset-0 w-full h-full object-cover -z-20"
        style={{ objectPosition: 'center 40%' }}
      />
      {/* Dark overlay — ensure readability */}
      <div className="fixed inset-0 bg-slate-900/40 -z-10" />
      {/* Bottom gradient */}
      <div className="fixed inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-slate-900/30 -z-10" />
      {/* Vignette */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(15,23,42,0.45) 100%)',
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
        {/* Top bar */}
        <header
          className="h-14 shrink-0 flex items-center px-3 md:px-6 border-b border-white/10 relative z-10"
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px) saturate(150%)',
            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
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
