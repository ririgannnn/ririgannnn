import { useStore } from '../stores';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#ef4444'];

export default function DataDashboard() {
  const { tasks, notes, events } = useStore();

  // Task stats
  const taskByStatus = [
    { name: '待办', value: tasks.filter((t) => t.status === 'todo').length },
    { name: '进行中', value: tasks.filter((t) => t.status === 'in-progress').length },
    { name: '已完成', value: tasks.filter((t) => t.status === 'done').length },
  ].filter((s) => s.value > 0);

  const taskByPriority = [
    { name: '高', value: tasks.filter((t) => t.priority === 'high').length },
    { name: '中', value: tasks.filter((t) => t.priority === 'medium').length },
    { name: '低', value: tasks.filter((t) => t.priority === 'low').length },
  ];

  // Recent 7-day activity
  const last7Days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
  const activityData = last7Days.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return {
      date: format(day, 'M/d'),
      tasks: tasks.filter((t) => format(new Date(t.createdAt), 'yyyy-MM-dd') === dayStr).length,
      notes: notes.filter((n) => format(new Date(n.createdAt), 'yyyy-MM-dd') === dayStr).length,
    };
  });

  // Notes per folder
  const notesByFolder = Object.entries(
    notes.reduce((acc, n) => { acc[n.folder] = (acc[n.folder] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-fg">数据分析</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '总任务', value: tasks.length, sub: `完成 ${tasks.filter((t) => t.status === 'done').length}`, color: '#3b82f6' },
          { label: '笔记数', value: notes.length, sub: `${new Set(notes.map((n) => n.folder)).size} 个分类`, color: '#8b5cf6' },
          { label: '日程', value: events.length, sub: '本月活动', color: '#f59e0b' },
          { label: '知识条目', value: tasks.length, sub: '综合数据', color: '#10b981' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-white/30 p-4" style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(20px) saturate(150%)', WebkitBackdropFilter: 'blur(20px) saturate(150%)' }}>
            <div className="text-2xl font-bold text-fg">{card.value}</div>
            <div className="text-sm mt-1" style={{ color: card.color }}>{card.label}</div>
            <div className="text-xs text-muted-fg mt-0.5">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity Line Chart */}
        <div className="rounded-xl border border-white/30 p-4" style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(20px) saturate(150%)', WebkitBackdropFilter: 'blur(20px) saturate(150%)' }}>
          <h3 className="text-sm font-semibold text-fg mb-3">近 7 天活跃度</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} />
              <Line type="monotone" dataKey="tasks" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="任务" />
              <Line type="monotone" dataKey="notes" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name="笔记" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Task Priority Distribution */}
        <div className="rounded-xl border border-white/30 p-4" style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(20px) saturate(150%)', WebkitBackdropFilter: 'blur(20px) saturate(150%)' }}>
          <h3 className="text-sm font-semibold text-fg mb-3">任务优先级分布</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={taskByPriority}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {taskByPriority.map((_, i) => (
                  <Cell key={i} fill={['#ef4444', '#f59e0b', '#94a3b8'][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task Status Pie */}
        <div className="rounded-xl border border-white/30 p-4" style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(20px) saturate(150%)', WebkitBackdropFilter: 'blur(20px) saturate(150%)' }}>
          <h3 className="text-sm font-semibold text-fg mb-3">任务状态</h3>
          {taskByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={taskByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {taskByStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-fg py-12 text-center">暂无任务数据</p>
          )}
        </div>

        {/* Notes by Folder */}
        <div className="rounded-xl border border-white/30 p-4" style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(20px) saturate(150%)', WebkitBackdropFilter: 'blur(20px) saturate(150%)' }}>
          <h3 className="text-sm font-semibold text-fg mb-3">笔记分类</h3>
          {notesByFolder.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={notesByFolder} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} width={60} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-fg py-12 text-center">暂无笔记数据</p>
          )}
        </div>
      </div>
    </div>
  );
}
