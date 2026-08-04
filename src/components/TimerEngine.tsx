import { useEffect, useRef } from 'react';
import { useStore } from '../stores';

/**
 * TimerEngine — mounted at Layout level, never unmounts on module switch.
 * Drives the timer tick at 200ms intervals via store.tickTimer().
 * When activeTimer is running, it ticks. When paused or null, it's idle.
 */
export default function TimerEngine() {
  const activeTimer = useStore((s) => s.activeTimer);
  const tickTimer = useStore((s) => s.tickTimer);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const shouldRun = activeTimer && !activeTimer.isPaused;

    if (shouldRun && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        tickTimer();
      }, 200);
    }

    if (!shouldRun && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeTimer?.isPaused, activeTimer?.taskId, tickTimer]);

  // This component renders nothing — it's invisible infrastructure
  return null;
}
