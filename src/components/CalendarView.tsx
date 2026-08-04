import { useState } from 'react';
import { useStore } from '../stores';
import type { CalendarEvent } from '../types';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';

const eventColors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

export default function CalendarView() {
  const { events, addEvent, deleteEvent } = useStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [color, setColor] = useState(eventColors[0]);
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  const getEventsForDay = (date: Date) =>
    events.filter((e) => isSameDay(new Date(e.startDate), date));

  const todayEvents = events.filter((e) => isSameDay(new Date(e.startDate), new Date()));

  const handleAdd = () => {
    if (!title.trim()) return;
    const startDate = allDay ? selectedDate : `${selectedDate}T${startTime}:00`;
    const endDate = allDay ? selectedDate : `${selectedDate}T${endTime}:00`;
    addEvent({
      title, description: desc, startDate, endDate, allDay, color,
    });
    setTitle(''); setDesc(''); setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-fg">日历</h1>
        <button onClick={() => { setSelectedDate(format(new Date(), 'yyyy-MM-dd')); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-fg text-sm font-medium hover:opacity-90">
          <Plus size={16} /> 新建日程
        </button>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Calendar Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ChevronLeft size={18} className="text-muted-fg" />
            </button>
            <h2 className="text-lg font-semibold text-fg">
              {format(currentMonth, 'yyyy年 M月', { locale: zhCN })}
            </h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ChevronRight size={18} className="text-muted-fg" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
            {weekDays.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-muted-fg py-2 bg-muted/50">
                {d}
              </div>
            ))}
            {days.map((day, i) => {
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const dayEvents = getEventsForDay(day);
              return (
                <button
                  key={i}
                  onClick={() => { setSelectedDate(format(day, 'yyyy-MM-dd')); setShowForm(true); }}
                  className={`min-h-[80px] p-1.5 text-left transition-colors hover:bg-muted/50 ${
                    isCurrentMonth ? '' : 'bg-muted/30 text-muted-fg/50'
                  }`}
                  style={isCurrentMonth ? { background: 'rgba(255,255,255,0.65)' } : undefined}
                >
                  <span className={`text-xs inline-block w-6 h-6 rounded-full text-center leading-6 ${
                    isToday ? 'bg-primary text-primary-fg font-bold' : ''
                  }`}>
                    {format(day, 'd')}
                  </span>
                  <div className="space-y-0.5 mt-1">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        className="text-xs px-1 py-0.5 rounded truncate text-white"
                        style={{ backgroundColor: ev.color }}
                        onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-fg pl-1">+{dayEvents.length - 3} 更多</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Side Panel - Today's events */}
        <div className="lg:w-72 shrink-0">
          <h3 className="text-sm font-semibold text-fg mb-3">
            今日日程 · {format(new Date(), 'M月d日', { locale: zhCN })}
          </h3>
          {todayEvents.length === 0 ? (
            <p className="text-sm text-muted-fg">今日暂无日程安排</p>
          ) : (
            <div className="space-y-2">
              {todayEvents.map((ev) => (
                <div key={ev.id}
                  className="p-3 rounded-xl border-l-3 border border-black/5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  style={{ borderLeftColor: ev.color, borderLeftWidth: 4, background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(20px) saturate(150%)', WebkitBackdropFilter: 'blur(20px) saturate(150%)' }}
                  onClick={() => setSelectedEvent(ev)}>
                  <div className="text-sm font-medium text-fg">{ev.title}</div>
                  {!ev.allDay && (
                    <div className="text-xs text-muted-fg mt-1">
                      {format(new Date(ev.startDate), 'HH:mm')} - {format(new Date(ev.endDate), 'HH:mm')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upcoming */}
          <h3 className="text-sm font-semibold text-fg mt-6 mb-3">即将到来</h3>
          <div className="space-y-2">
            {events
              .filter((e) => new Date(e.startDate) > new Date())
              .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
              .slice(0, 5)
              .map((ev) => (
                <div key={ev.id} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                  <span className="text-fg truncate flex-1">{ev.title}</span>
                  <span className="text-xs text-muted-fg">{format(new Date(ev.startDate), 'M/d')}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="rounded-2xl border border-black/5 shadow-xl p-6 w-full max-w-md animate-scale-in" style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(20px) saturate(150%)', WebkitBackdropFilter: 'blur(20px) saturate(150%)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-fg">新建日程</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-muted"><X size={18} className="text-muted-fg" /></button>
            </div>

            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border bg-muted/50 text-fg outline-none mb-3" />

            <input type="text" placeholder="日程标题" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border bg-muted/50 text-fg outline-none focus:ring-2 focus:ring-primary/30 mb-3" autoFocus />

            <textarea placeholder="描述（可选）" value={desc} onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border bg-muted/50 text-fg outline-none focus:ring-2 focus:ring-primary/30 mb-3 h-20 resize-none" />

            <div className="flex items-center gap-3 mb-3">
              <label className="flex items-center gap-2 text-sm text-fg">
                <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)}
                  className="rounded border-border accent-primary" />
                全天
              </label>
              {!allDay && (
                <div className="flex gap-2 text-sm text-fg">
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                    className="px-2 py-1 rounded border bg-muted/50 text-fg outline-none text-xs" />
                  <span className="text-muted-fg self-center">-</span>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                    className="px-2 py-1 rounded border bg-muted/50 text-fg outline-none text-xs" />
                </div>
              )}
            </div>

            <div className="flex gap-1.5 mb-4">
              {eventColors.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full border-2 transition-all"
                  style={{ backgroundColor: c, borderColor: color === c ? 'hsl(var(--foreground))' : 'transparent' }} />
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm rounded-lg bg-muted text-muted-fg hover:bg-border">取消</button>
              <button onClick={handleAdd}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-fg hover:opacity-90">创建</button>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setSelectedEvent(null)}>
          <div className="rounded-2xl border border-black/5 shadow-xl p-6 w-full max-w-md animate-scale-in" style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(20px) saturate(150%)', WebkitBackdropFilter: 'blur(20px) saturate(150%)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedEvent.color }} />
              <div className="flex gap-2">
                <button onClick={() => { deleteEvent(selectedEvent.id); setSelectedEvent(null); }}
                  className="px-3 py-1 text-xs rounded-lg bg-red-50 text-red-500 hover:bg-red-100">删除</button>
                <button onClick={() => setSelectedEvent(null)} className="p-1"><X size={16} className="text-muted-fg" /></button>
              </div>
            </div>
            <h2 className="text-lg font-bold text-fg mb-2">{selectedEvent.title}</h2>
            {selectedEvent.description && <p className="text-sm text-muted-fg mb-2">{selectedEvent.description}</p>}
            <div className="text-xs text-muted-fg">
              <p>{format(new Date(selectedEvent.startDate), 'yyyy年M月d日', { locale: zhCN })}
                {!selectedEvent.allDay && ` ${format(new Date(selectedEvent.startDate), 'HH:mm')} - ${format(new Date(selectedEvent.endDate), 'HH:mm')}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
