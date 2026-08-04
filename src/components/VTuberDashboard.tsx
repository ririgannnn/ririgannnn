import { useState } from 'react';
import { ChevronDown, ChevronRight, UserCircle } from 'lucide-react';

interface Department {
  id: number;
  name: string;
  tag: string;
  type: 'core' | 'sup';
  responsibility: string;
  tasks: string[];
  aiCan: string[];
  aiCannot: string[];
}

const departments: Department[] = [
  {
    id: 1,
    name: '内容策划部',
    tag: '核心 · 高频',
    type: 'core',
    responsibility: '规划直播与短视频的内容方向，保证内容持续、稳定产出，且始终贴合人设与粉丝预期。',
    tasks: [
      '直播选题与大纲设计（日常杂谈 / 游戏实况 / 歌回 / 联动企划）',
      '直播排期与内容日历管理（避免断更、错峰竞争）',
      '短视频脚本撰写、选题库沉淀与标签化',
      '人设与世界观维护（台词风格、口头禅、背景故事一致性）',
      '热点追踪与"蹭热点"策划（节日、二创梗、平台活动）',
      '内容复盘：哪些选题数据好、为何翻车',
    ],
    aiCan: [
      '生成直播大纲、流程脚本、串词初稿',
      '维护结构化选题库，按标签/热度/类型分类',
      '检索实时热点并给出选题角度建议',
      '撰写短视频口播文案与标题',
      '把复盘数据转写为文字总结与改进清单',
    ],
    aiCannot: [
      '无法替代临场发挥与真实人格魅力',
      '微妙社交直觉需你把关（什么梗会冒犯粉丝）',
      '不掌握平台实时算法变动，策略须以官方为准',
    ],
  },
  {
    id: 2,
    name: '技术运维部',
    tag: '核心 · 关键',
    type: 'core',
    responsibility: '保障直播稳定、画面与声音质量达标，快速处理设备与软件故障，降低直播事故率。',
    tasks: [
      'OBS / 推流软件配置、场景切换与快捷键布局',
      '摄像头、麦克风、采集卡、声卡的调试与选型',
      'Live2D / VTube Studio / 动捕（面捕）的调试与参数',
      '网络与推流码率、延迟优化',
      '直播事故排查（掉线、音画不同步、卡顿）',
      '录制、切片、自动上传的流水线搭建',
    ],
    aiCan: [
      '编写/优化 OBS 脚本、自动化批处理与切片脚本',
      '搭建故障排查知识库（按报错给分步排查指引）',
      '生成配置模板、开播前检查清单（Checklist）',
      '协助编写弹幕联动、语音触发等小插件代码',
    ],
    aiCannot: [
      '不能直接操作本地硬件/软件（需你执行）',
      '驱动兼容、设备冲突等复杂硬件问题须实测',
      '直播中无法主动介入，只能事前预案+事后复盘',
    ],
  },
  {
    id: 3,
    name: '视觉设计部',
    tag: '核心 · 形象',
    type: 'core',
    responsibility: '维护角色形象与直播间视觉资产，保持统一且具辨识度的美术风格。',
    tasks: [
      '角色立绘、表情包、Live2D 建模与参数调试',
      '直播间背景、悬浮窗、转场动画、待机画面',
      '封面图、Banner、头像、平台标识图',
      '表情/贴纸/GIF/弹幕表情包',
      '周边与同人物料设计（立牌、挂件、海报）',
      '多平台尺寸适配（B站/抖音/YouTube/微博）',
    ],
    aiCan: [
      '文生图生成概念稿、表情包、封面草图、配色方案',
      '批量图片处理（裁剪/水印/尺寸适配/格式转换）',
      '用 SVG/CSS 制作简单直播间组件与图标',
      '产出美术需求 Brief，方便外包给画师时对齐',
    ],
    aiCannot: [
      '无法产出可商用的高精度 Live2D/3D 模型',
      '文生图存在风格漂移与版权风险',
      '复杂动效、骨骼绑定、3D渲染需专业工具',
    ],
  },
  {
    id: 4,
    name: '社群运营部',
    tag: '核心 · 留存',
    type: 'core',
    responsibility: '维系粉丝关系，提升社群活跃度与留存，管理多平台账号矩阵。',
    tasks: [
      '弹幕/评论/私信的回复与互动节奏把控',
      '粉丝群（QQ/Discord/微博超话）日常管理',
      '粉丝活动策划（抽奖、二创大赛、生日会）',
      '负面舆情监测与危机应对',
      '核心粉丝（舰长/大粉）分层维护',
      '多平台内容同步分发与改写',
    ],
    aiCan: [
      '草拟回复话术、FAQ 自动应答模板（保持人设语气）',
      '生成活动策划案、海报文案、抽奖规则',
      '汇总评论情绪，产出舆情周报',
      '多平台内容一键改写与排期提醒',
    ],
    aiCannot: [
      '不能替代真实情感连接（粉丝要"角色本人在说话"）',
      '危机公关、敏感话题须你亲自决策',
      '涉及个人隐私或越界内容的回复需高度谨慎',
    ],
  },
  {
    id: 5,
    name: '商务合作部',
    tag: '核心 · 变现',
    type: 'core',
    responsibility: '拓展变现渠道，对接品牌与平台，管理商单从洽谈到履约的全流程。',
    tasks: [
      '商务拓展（品牌主动接洽/主动Pitch/MCN对接）',
      '报价策略与媒介包（Media Kit）制作',
      '商单洽谈、档期排布与权益确认',
      '选品与样品管理（带货场景）',
      '合同初审、履约跟进与交付验收',
      '平台活动/扶持计划申报',
    ],
    aiCan: [
      '生成 Media Kit 文案与数据页模板',
      '起草商务邮件、报价单、权益清单模板',
      '维护商单排期表与交付 checklist',
      '提示合同条款风险点（非法律意见）',
      '竞品/品牌/报价行情调研',
    ],
    aiCannot: [
      '不能代为签署合同或做出具法律效力的承诺',
      '商务谈判中的人情世故、信任建立需你亲自',
      '不提供正式法律意见，重大条款须律师审核',
    ],
  },
  {
    id: 6,
    name: '财务管理部',
    tag: '核心 · 合规',
    type: 'core',
    responsibility: '记录收支、确保税务合规、做好成本核算与预算规划，守住现金流安全。',
    tasks: [
      '收入记账（打赏/商单/平台分成/周边销售）',
      '成本归类（设备/软件订阅/外包画师/推广）',
      '税务申报辅助（个人所得税/个体工商户）',
      '分成结算核对（与平台/MCN的对账单）',
      '预算制定与现金流管理',
      '月度/季度经营报表',
    ],
    aiCan: [
      '搭建记账模板与自动化表格',
      '从银行/平台流水批量分类记账',
      '生成经营报表与可视化图表',
      '税务计算示例与申报清单',
      '预算超支/续费提醒',
    ],
    aiCannot: [
      '不能替你完成正式税务申报',
      '财税建议非专业资质，重大决策请咨询会计师',
      '无法实时直连银行/支付接口获取流水',
    ],
  },
  {
    id: 7,
    name: '数据分析与增长部',
    tag: '补充 · 杠杆',
    type: 'sup',
    responsibility: '监控各平台核心指标，复盘增长瓶颈，输出可执行的涨粉与优化策略。',
    tasks: [
      '直播/视频核心数据看板',
      '粉丝画像与活跃时段分析',
      '涨粉策略设计与 A/B 测试方案',
      '周/月增长复盘报告',
      '竞品对标与内容赛道机会扫描',
    ],
    aiCan: [
      '将导出的数据生成可视化看板与图表',
      '撰写周/月增长复盘报告（含洞察）',
      '设计涨粉 A/B 测试与内容实验方案',
      '竞品公开数据整理与对标分析',
    ],
    aiCannot: [
      '无平台内部数据权限，需你从后台导出原始数据',
      '因果归因只能给假设，需你验证',
    ],
  },
  {
    id: 8,
    name: '法务与合规部',
    tag: '补充 · 风控',
    type: 'sup',
    responsibility: '管控版权、授权、肖像权与平台规则风险，守住合规底线。',
    tasks: [
      '音乐/素材/字体/二创的版权与授权核查',
      '角色肖像权、形象授权范围管理',
      '平台社区规范与直播红线跟踪',
      '合同要素审查（权利义务、违约、保密）',
      '侵权应对与下架申诉流程',
    ],
    aiCan: [
      '版权/授权风险点提示与自查清单',
      '合同条款要素检查表（缺漏项提醒）',
      '检索平台规则、整理合规红线速查',
      '生成标准授权书/二创许可模板',
    ],
    aiCannot: [
      '不提供正式法律意见，纠纷须律师介入',
      '各地法规更新快，结论须以最新官方文本为准',
    ],
  },
  {
    id: 9,
    name: '个人品牌/IP战略部',
    tag: '补充 · 长期',
    type: 'sup',
    responsibility: '做长期人设定位与跨平台矩阵规划，布局 IP 衍生与可持续发展。',
    tasks: [
      '人设长期定位与差异化（避免同质化）',
      '跨平台矩阵策略（主平台+分发平台分工）',
      'IP 衍生规划（周边、联名、线下）',
      '阶段性目标设定（涨粉/破圈/商业化里程碑）',
      '个人精力与 burnout 管理（可持续产出）',
    ],
    aiCan: [
      '品牌定位分析与差异化机会梳理',
      '竞品/同赛道研究，输出定位建议',
      '起草长期路线图与阶段 OKR 框架',
      '帮你做"精力分配"与优先级排序推演',
    ],
    aiCannot: [
      '战略方向与"要不要做"的最终决策权在你',
      '无法预判平台政策、市场口味等外部突变',
    ],
  },
];

export default function VTuberDashboard() {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggleDept = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Banner */}
      <div
        className="rounded-xl p-6 md:p-8"
        style={{
          background: 'linear-gradient(135deg, #3b6ef5 0%, #6a4bf0 100%)',
          color: '#fff',
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <UserCircle size={28} />
          <h2 className="font-serif text-xl md:text-2xl font-semibold tracking-wide">
            虚拟主播「一人公司」工作台
          </h2>
        </div>
        <p className="text-sm opacity-90 mt-2 max-w-2xl">
          以单人视角系统化梳理 VTuber 全链路工作，将直播间视为公司来运营。
          6 大核心部门保障生存线与增长线，3 大补充部门建立长期竞争壁垒。
        </p>
        <div className="flex gap-3 mt-4 flex-wrap">
          <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }}>
            编制视角：一人公司（CEO 兼全岗）
          </span>
          <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }}>
            部门数：6 核心 + 3 补充
          </span>
        </div>
      </div>

      {/* Org chart mini */}
      <div
        className="rounded-xl p-4 flex flex-col items-center gap-1"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)' }}
      >
        <span className="text-xs font-semibold px-4 py-1.5 rounded-lg text-white"
          style={{ background: 'linear-gradient(135deg, #3b6ef5, #6a4bf0)' }}>
          虚拟主播（CEO / 一人公司主体）
        </span>
        <div className="flex gap-1 mt-1">
          {['内容策划', '技术运维', '视觉设计', '社群运营', '商务合作', '财务管理'].map((n) => (
            <span key={n} className="text-[10px] px-2 py-0.5 rounded"
              style={{ background: 'rgba(153,167,188,0.12)', color: 'var(--text-mid)' }}>
              {n}
            </span>
          ))}
        </div>
        <div className="flex gap-1 mt-1">
          {['数据分析', '法务合规', 'IP战略'].map((n) => (
            <span key={n} className="text-[10px] px-2 py-0.5 rounded"
              style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--text-dim)' }}>
              {n}
            </span>
          ))}
        </div>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => {
          const isOpen = expanded.has(dept.id);
          return (
            <div
              key={dept.id}
              className="rounded-xl overflow-hidden transition-all duration-300"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--line)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              {/* Header */}
              <button
                onClick={() => toggleDept(dept.id)}
                className="w-full flex items-center gap-3 p-4 text-left transition-colors"
                style={{
                  borderTop: `3px solid ${dept.type === 'core' ? 'var(--kon-main)' : '#8a94a6'}`,
                  background: isOpen ? 'rgba(153,167,188,0.06)' : 'transparent',
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    background: dept.type === 'core' ? 'rgba(153,167,188,0.15)' : 'rgba(0,0,0,0.06)',
                    color: dept.type === 'core' ? 'var(--kon-dark)' : 'var(--text-dim)',
                  }}
                >
                  {dept.id}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--kon-dark)' }}>
                    {dept.name}
                  </h3>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: dept.type === 'core' ? 'rgba(153,167,188,0.1)' : 'rgba(0,0,0,0.04)',
                    color: 'var(--text-dim)',
                  }}
                >
                  {dept.tag}
                </span>
                {isOpen
                  ? <ChevronDown size={16} style={{ color: 'var(--text-dim)' }} />
                  : <ChevronRight size={16} style={{ color: 'var(--text-dim)' }} />}
              </button>

              {/* Body */}
              {isOpen && (
                <div className="px-4 pb-4 space-y-4 animate-fade-in">
                  {/* Responsibility */}
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-dim)' }}>
                      核心职责
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-mid)' }}>
                      {dept.responsibility}
                    </p>
                  </div>

                  {/* Tasks */}
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-dim)' }}>
                      关键工作
                    </div>
                    <ul className="space-y-0.5">
                      {dept.tasks.map((task, i) => (
                        <li key={i} className="text-sm pl-4 relative" style={{ color: 'var(--text-mid)' }}>
                          <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full"
                            style={{ background: dept.type === 'core' ? 'var(--kon-main)' : '#8a94a6' }} />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* AI Can / Cannot */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg p-3" style={{ background: '#f0faf4', border: '1px solid #c8e6cf' }}>
                      <div className="text-xs font-semibold mb-1.5" style={{ color: '#1f9d55' }}>
                        AI 可胜任
                      </div>
                      <ul className="space-y-0.5">
                        {dept.aiCan.map((item, i) => (
                          <li key={i} className="text-xs" style={{ color: '#4a7c59' }}>
                            · {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: '#fef9ef', border: '1px solid #f0d9ad' }}>
                      <div className="text-xs font-semibold mb-1.5" style={{ color: '#c87a12' }}>
                        能力边界
                      </div>
                      <ul className="space-y-0.5">
                        {dept.aiCannot.map((item, i) => (
                          <li key={i} className="text-xs" style={{ color: '#8b6914' }}>
                            · {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div
        className="rounded-xl p-6"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)' }}
      >
        <h3 className="font-serif text-base font-semibold mb-4" style={{ color: 'var(--kon-dark)' }}>
          AI 助手总体能力边界
        </h3>

        <div className="mb-4">
          <div className="text-xs font-semibold mb-2" style={{ color: 'var(--ok)' }}>稳定交付的共性能力</div>
          <div className="flex flex-wrap gap-2">
            {['文本生成', '信息检索', '表格模板', '数据可视化', '自动化脚本', '图像概念稿', '排程检查'].map((item) => (
              <span key={item} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(31,157,85,0.08)', color: '#1f9d55' }}>
                {item}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: '#c87a12' }}>需你拍板的共性边界</div>
          <ul className="space-y-1 text-sm" style={{ color: 'var(--text-mid)' }}>
            <li>· 不能替代真实人格、临场反应与情感连接——这是 VTuber 的核心资产</li>
            <li>· 不能签署合同、完成正式税务/法律申报、做出具法律效力的承诺</li>
            <li>· 不能直接操作本地硬件、账号或实时介入直播过程</li>
            <li>· 涉及法律、税务、医疗、重大商业决策时，仅作辅助</li>
          </ul>
        </div>
      </div>

      {/* Tip */}
      <div
        className="rounded-xl p-5"
        style={{
          background: 'var(--bg-surface)',
          border: '1px dashed var(--line)',
        }}
      >
        <h4 className="font-serif text-sm font-semibold mb-3" style={{ color: 'var(--kon-dark)' }}>
          一人公司落地建议
        </h4>
        <div className="space-y-2 text-sm" style={{ color: 'var(--text-mid)' }}>
          <p><b style={{ color: 'var(--kon-dark)' }}>运作节奏：</b>用"CEO 周会"方式每周花 1 小时，产出各部门周报与待办，你只做决策与执行关键动作。</p>
          <p><b style={{ color: 'var(--kon-dark)' }}>优先级排序：</b>内容策划+技术运维是"生存线"；社群运营+商务合作是"增长线"；财务+法务是"底线"；数据+IP战略是"杠杆线"。</p>
          <p><b style={{ color: 'var(--kon-dark)' }}>省力原则：</b>凡重复、模板化、可批量的事，先交 AI 做初稿，你做终审+个性化润色。</p>
        </div>
      </div>
    </div>
  );
}
