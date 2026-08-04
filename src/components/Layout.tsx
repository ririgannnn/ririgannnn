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
import ProjectView from './ProjectView';
import ProjectDetailView from './ProjectDetailView';
import HabitTracker from './HabitTracker';
import VTuberDashboard from './VTuberDashboard';
import SettingsPanel from './SettingsPanel';
import { useStore } from '../stores';
import { useAuth } from '../contexts/AuthContext';
import type { ModuleType } from '../types';

const moduleMeta: Record<Exclude<ModuleType, 'dashboard'>, { label: string; english: string; accentClass: string }> = {
  tasks:      { label: '任务管理', english: 'EXECUTE',     accentClass: 'module-accent-rust' },
  projects:   { label: '项目管理', english: 'ORGANIZE',    accentClass: 'module-accent-teal' },
  notes:      { label: '笔记文档', english: 'CAPTURE',     accentClass: 'module-accent-kon' },
  knowledge:  { label: '个人知识库', english: 'ORGANIZE',   accentClass: 'module-accent-teal' },
  calendar:   { label: '日历日程', english: 'PLAN',        accentClass: 'module-accent-dust' },
  data:       { label: '数据分析', english: 'ANALYZE',     accentClass: 'module-accent-teal' },
  inspiration:{ label: '灵感数据库', english: 'SPARK',     accentClass: 'module-accent-orange' },
  habits:     { label: '习惯打卡', english: 'TRACK',      accentClass: 'module-accent-orange' },
  vtuber:     { label: 'VTuber工作台', english: 'PERFORM',  accentClass: 'module-accent-purple' },
};

export default function Layout() {
  const { token } = useAuth();
  const activeModule = useStore((s) => s.activeModule);
  const initSync = useStore((s) => s.initSync);
  const stopSync = useStore((s) => s.stopSync);
  const meta = activeModule !== 'dashboard' ? moduleMeta[activeModule as Exclude<ModuleType, 'dashboard'>] : null;
  const syncStarted = useRef(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (token && !syncStarted.current) {
      syncStarted.current = true;
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
  }, [token]);

  const activeProjectId = useStore((s) => s.activeProjectId);

  const renderModule = () => {
    switch (activeModule) {
      case 'tasks': return <TaskView />;
      case 'projects': return activeProjectId ? <ProjectDetailView /> : <ProjectView />;
      case 'notes': return <NotesView />;
      case 'knowledge': return <KnowledgeBase />;
      case 'calendar': return <CalendarView />;
      case 'data': return <DataDashboard />;
      case 'inspiration': return <InspirationView />;
      case 'habits': return <HabitTracker />;
      case 'vtuber': return <VTuberDashboard />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="relative flex h-full overflow-hidden">
      {/* ── Background ── */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: 'linear-gradient(180deg, var(--bg-page) 0%, var(--bg-deep) 100%)',
        }}
      />

      {/* Ambient orbs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute w-[500px] h-[500px] rounded-full border opacity-[0.035]"
          style={{ borderColor: 'var(--kon-main)', top: '-8%', right: '-10%', animation: 'drift 24s ease-in-out infinite' }} />
        <div className="absolute w-[360px] h-[360px] rounded-full opacity-[0.03]"
          style={{ background: 'var(--accent-warm)', bottom: '-10%', left: '-6%', animation: 'drift 28s ease-in-out infinite reverse' }} />
        <div className="absolute w-[200px] h-[200px] rounded-full opacity-[0.04]"
          style={{ background: 'var(--accent-teal)', bottom: '15%', left: '20%', animation: 'drift 34s ease-in-out infinite 8s' }} />
      </div>

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
          className="h-14 shrink-0 flex items-center px-3 md:px-6 relative z-10"
          style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--line)' }}
        >
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 mr-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(true)}
            style={{ color: 'var(--text-mid)' }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          </button>

          {/* Brand logo — desktop */}
          <div className="hidden md:flex items-center gap-3">
            <img
              src="/logo.png"
              alt="logo"
              className="w-7 h-7 rounded-lg object-cover transition-transform duration-300 hover:scale-110"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            />
            <span className="font-serif text-sm font-medium tracking-[0.04em]" style={{ color: 'var(--kon-dark)' }}>
              荔荔绀 · 工作台
            </span>
          </div>

          {/* Module label on mobile */}
          <span
            className="md:hidden text-sm font-medium font-serif truncate"
            style={{ color: 'var(--text-mid)' }}
          >
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
          <div className="animate-fade-up max-w-[1200px] mx-auto">
            {/* Module accent header (non-dashboard modules, desktop) */}
            {meta && (
              <div className="hidden md:flex mb-6 items-center gap-3">
                <div className={`module-accent pl-3 ${meta.accentClass}`}>
                  <span className="text-xs font-semibold uppercase tracking-[0.15em]"
                    style={{ color: 'var(--text-dim)', opacity: 0.6 }}
                  >
                    {meta.english}
                  </span>
                </div>
                <span className="text-sm select-none" style={{ color: 'var(--text-dim)', opacity: 0.4 }}>
                  {meta.label}
                </span>
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
