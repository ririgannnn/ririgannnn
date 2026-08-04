import { useStore } from '../stores';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';

const COLORS = ['var(--kon-dark)', 'var(--accent-warm)', 'var(--accent-teal)', 'var(--accent-indigo)', 'var(--accent-dust)', 'var(--accent-orange)'];

const tooltipStyle = {
  borderRadius: '8px',
  border: '1px solid var(--line)',
  backgroundColor: 'var(--bg-surface)',
  color: 'var(--text-primary)',
};

const chartCardStyle: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-sm)',
  padding: '16px',
};

export default function DataDashboard() {
  const { tasks, notes, events } = useStore();

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

  const last7Days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
  const activityData = last7Days.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return {
      date: format(day, 'M/d'),
      tasks: tasks.filter((t) => format(new Date(t.createdAt), 'yyyy-MM-dd') === dayStr).length,
      notes: notes.filter((n) => format(new Date(n.createdAt), 'yyyy-MM-dd') === dayStr).length,
    };
  });

  const notesByFolder = Object.entries(
    notes.reduce((acc, n) => { acc[n.folder] = (acc[n.folder] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const summaryCards = [
    { label: '总任务', value: tasks.length, sub: `完成 ${tasks.filter((t) => t.status === 'done').length}`, color: 'var(--kon-dark)' },
    { label: '笔记数', value: notes.length, sub: `${new Set(notes.map((n) => n.folder)).size} 个分类`, color: 'var(--accent-teal)' },
    { label: '日程', value: events.length, sub: '本月活动', color: 'var(--accent-warm)' },
    { label: '知识条目', value: tasks.length, sub: '综合数据', color: 'var(--accent-indigo)' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-serif-cn text-fg">数据分析</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="card-surface p-4">
            <div className="text-2xl font-bold text-fg">{card.value}</div>
            <div className="text-sm mt-1 font-medium" style={{ color: card.color }}>{card.label}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity Line Chart */}
        <div style={chartCardStyle}>
          <h3 className="text-sm font-semibold text-fg mb-3">近 7 天活跃度</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-dim)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-dim)' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="tasks" stroke="var(--kon-main)" strokeWidth={2} dot={{ r: 4 }} name="任务" />
              <Line type="monotone" dataKey="notes" stroke="var(--accent-teal)" strokeWidth={2} dot={{ r: 4 }} name="笔记" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Task Priority Distribution */}
        <div style={chartCardStyle}>
          <h3 className="text-sm font-semibold text-fg mb-3">任务优先级分布</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={taskByPriority}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-dim)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-dim)' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {taskByPriority.map((_, i) => (
                  <Cell key={i} fill={['var(--accent-orange)', 'var(--accent-warm)', 'var(--text-dim)'][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task Status Pie */}
        <div style={chartCardStyle}>
          <h3 className="text-sm font-semibold text-fg mb-3">任务状态</h3>
          {taskByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={taskByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {taskByStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm py-12 text-center" style={{ color: 'var(--text-dim)' }}>暂无任务数据</p>
          )}
        </div>

        {/* Notes by Folder */}
        <div style={chartCardStyle}>
          <h3 className="text-sm font-semibold text-fg mb-3">笔记分类</h3>
          {notesByFolder.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={notesByFolder} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--text-dim)' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-dim)' }} width={60} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="var(--accent-indigo)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm py-12 text-center" style={{ color: 'var(--text-dim)' }}>暂无笔记数据</p>
          )}
        </div>
      </div>
    </div>
  );
}
