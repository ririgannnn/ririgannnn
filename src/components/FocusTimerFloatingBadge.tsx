import { useStore } from '../stores';
import { X, Maximize2 } from 'lucide-react';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Global floating timer badge — visible across ALL modules.
 * Only renders when a timer is actively running.
 */
export default function FocusTimerFloatingBadge() {
  const activeTimer = useStore((s) => s.activeTimer);
  const stopTimer = useStore((s) => s.stopTimer);
  const setActiveModule = useStore((s) => s.setActiveModule);

  if (!activeTimer || activeTimer.isPaused) return null;

  // Compute elapsed time from store anchors
  const elapsedMs = Date.now() - activeTimer.startTime + activeTimer.accumulatedMs;

  // Subscribe to tick for re-render
  void activeTimer.tick;

  return (
    <div
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[80] animate-scale-in rounded-full px-4 py-2.5 shadow-xl border flex items-center gap-2 select-none"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--accent-orange)',
        boxShadow: '0 6px 24px rgba(216,107,66,0.20)',
      }}
    >
      {/* Pulse dot */}
      <div className="w-2 h-2 rounded-full shrink-0"
        style={{ background: 'var(--accent-teal)', animation: 'pulse 2s infinite' }} />

      {/* Time display */}
      <span className="text-sm font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
        {formatTime(elapsedMs)}
      </span>

      {/* Task title (truncated) */}
      <span className="text-xs max-w-[80px] md:max-w-[120px] truncate" style={{ color: 'var(--text-dim)' }}>
        {activeTimer.taskTitle}
      </span>

      {/* Go to tasks module */}
      <button
        onClick={() => setActiveModule('tasks')}
        className="p-0.5 rounded-full hover:bg-black/5 transition-colors"
        title="切换到任务视图"
      >
        <Maximize2 size={12} style={{ color: 'var(--text-dim)' }} />
      </button>

      {/* Stop */}
      <button
        onClick={(e) => { e.stopPropagation(); stopTimer(); }}
        className="ml-1 p-0.5 rounded-full hover:bg-red-50 transition-colors"
        title="停止计时"
      >
        <X size={12} className="text-red-400" />
      </button>
    </div>
  );
}
