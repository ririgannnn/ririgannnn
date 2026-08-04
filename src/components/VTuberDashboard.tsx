import { useState } from 'react';
import { UserCircle } from 'lucide-react';
import ContentDept from './vtuber/ContentDept';
import TechDept from './vtuber/TechDept';
import DesignDept from './vtuber/DesignDept';
import CommunityDept from './vtuber/CommunityDept';
import CommerceDept from './vtuber/CommerceDept';
import FinanceDept from './vtuber/FinanceDept';
import AnalyticsDept from './vtuber/AnalyticsDept';
import StrategyDept from './vtuber/StrategyDept';

interface DeptTab {
  id: string;
  name: string;
  short: string;
  type: 'core' | 'sup';
  component: React.ComponentType;
}

const deptTabs: DeptTab[] = [
  { id: 'content',    name: '内容策划', short: '内容', type: 'core', component: ContentDept },
  { id: 'tech',       name: '技术运维', short: '技术', type: 'core', component: TechDept },
  { id: 'design',     name: '视觉设计', short: '设计', type: 'core', component: DesignDept },
  { id: 'community',  name: '社群运营', short: '社群', type: 'core', component: CommunityDept },
  { id: 'commerce',   name: '商务合作', short: '商务', type: 'core', component: CommerceDept },
  { id: 'finance',    name: '财务管理', short: '财务', type: 'core', component: FinanceDept },
  { id: 'analytics',  name: '数据分析', short: '数据', type: 'sup',  component: AnalyticsDept },
  { id: 'strategy',   name: 'IP 战略',  short: '战略', type: 'sup',  component: StrategyDept },
];

export default function VTuberDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const ActiveComponent = deptTabs[activeTab].component;

  return (
    <div className="flex flex-col gap-4">
      {/* Hero Banner */}
      <div
        className="rounded-xl p-5 md:p-6"
        style={{
          background: 'linear-gradient(135deg, #5b4cf0 0%, #8b5cf6 100%)',
          color: '#fff',
        }}
      >
        <div className="flex items-center gap-3 mb-1">
          <UserCircle size={24} />
          <h2 className="font-serif text-lg md:text-xl font-semibold tracking-wide">
            虚拟主播「一人公司」工作台
          </h2>
        </div>
        <p className="text-xs opacity-85 mt-1 max-w-2xl">
          8 大部门 · 轻量实操工具 · 数据云端同步
        </p>
      </div>

      {/* Tab Bar */}
      <div className="overflow-x-auto -mx-2 px-2">
        <div className="flex gap-1 p-1 rounded-lg min-w-max"
          style={{ background: 'rgba(0,0,0,0.04)' }}>
          {deptTabs.map((tab, idx) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(idx)}
              className="text-xs px-3 py-1.5 rounded-md font-medium transition-colors shrink-0"
              style={{
                background: activeTab === idx ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === idx
                  ? (tab.type === 'core' ? 'var(--kon-dark)' : 'var(--text-primary)')
                  : 'var(--text-dim)',
                boxShadow: activeTab === idx ? 'var(--shadow-xs)' : 'none',
              }}
            >
              <span className="hidden sm:inline">{tab.name}</span>
              <span className="sm:hidden">{tab.short}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Panel */}
      <div className="rounded-xl p-4 md:p-5 min-h-[300px]"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)', boxShadow: 'var(--card-shadow)' }}>
        <ActiveComponent />
      </div>

      {/* Tip */}
      <div
        className="rounded-xl p-4"
        style={{
          background: 'var(--bg-surface)',
          border: '1px dashed var(--line)',
        }}
      >
        <h4 className="font-serif text-sm font-semibold mb-2" style={{ color: 'var(--kon-dark)' }}>
          使用建议
        </h4>
        <div className="space-y-1.5 text-xs" style={{ color: 'var(--text-mid)' }}>
          <p><b style={{ color: 'var(--kon-dark)' }}>每次开播前：</b>技术运维部 → 逐项检查清单 → 内容策划部 → 确认选题与脚本</p>
          <p><b style={{ color: 'var(--kon-dark)' }}>每周复盘：</b>财务部 → 更新收支 → 数据分析部 → 录入各平台数据</p>
          <p><b style={{ color: 'var(--kon-dark)' }}>每季度：</b>IP战略部 → 回顾 OKR 进度 → 设定新季度目标</p>
        </div>
      </div>
    </div>
  );
}
