// 第七幕全部上屏数据（价格、账期、交期、起订量等均为「示例」，不代表真实报价）

export const DEMAND = {
  agent: '客户 Agent · 欧美渠道商',
  text: '我需要开发一款一次性电子烟',
  constraints: ['欧美市场', '首单 10 万支', '西瓜口味']
};

// 四条寻源线：候选数为示例
export const LANES = [
  {
    id: 'shell',
    name: '壳料',
    pool: 128,
    suppliers: ['壳料 A 厂', '壳料 B 厂', '壳料 C 厂'],
    terms: [
      ['需求', 'PCTG 外壳 · 西瓜配色打样'],
      ['交付', '18 天'],
      ['条款', '30% 预付 · 70% 发货前']
    ]
  },
  {
    id: 'battery',
    name: '电池',
    pool: 96,
    suppliers: ['电池 A 厂', '电池 B 厂', '电池 C 厂'],
    terms: [
      ['需求', '400 mAh · UN38.3 认证'],
      ['交付', '21 天'],
      ['条款', '月结 30 天']
    ]
  },
  {
    id: 'liquid',
    name: '烟油',
    pool: 60,
    suppliers: ['烟油 A 厂', '烟油 B 厂', '烟油 C 厂'],
    terms: [
      ['需求', '清新西瓜 · 不含甜瓜醛 · TPD'],
      ['交付', '14 天'],
      ['条款', '30% 预付 · 70% 发货前']
    ]
  },
  {
    id: 'oem',
    name: '代工厂',
    pool: 74,
    suppliers: ['代工 A 厂', '代工 B 厂', '代工 C 厂'],
    terms: [
      ['需求', '灌装组装 · 10 万支'],
      ['交付', '排期第 3 周起（读取 MES）'],
      ['条款', '30% 预付 · 70% 见提单']
    ]
  }
];

// 三套组合方案：pick[i] 为第 i 条线选中的候选（0 = A，1 = B，2 = C）
export const SCHEMES = [
  {
    code: '方案 1',
    focus: '交期最快',
    pick: [0, 1, 0, 2],
    mode: '代工厂总包（OEM）',
    payment: '30% 预付 · 70% 发货前',
    delivery: '35 天',
    moq: '30,000 支'
  },
  {
    code: '方案 2',
    focus: '起订量最低',
    pick: [1, 0, 2, 0],
    mode: '分料采购 + 代工组装',
    payment: '50% 预付 · 50% 发货前',
    delivery: '48 天',
    moq: '5,000 支'
  },
  {
    code: '方案 3',
    focus: '账期与成本最优',
    pick: [2, 2, 1, 1],
    mode: 'ODM 联合开发',
    payment: '30% 预付 · 70% 见提单',
    delivery: '42 天',
    moq: '20,000 支'
  }
];

export const DEFAULT_SCHEME = 2;

// 交给人的确认单
export const CONFIRM = {
  confirmed: 18,
  pending: [
    { q: '交期可提前 5 天，代工厂加价 3%', options: ['接受', '保持原交期'] },
    { q: '电池账期：月结 30 天 / 45 天（45 天单价 +1.5%）', options: ['30 天', '45 天'] }
  ],
  groups: [
    ['壳料', 5],
    ['电池', 4],
    ['烟油', 4],
    ['代工厂', 5]
  ]
};

// 第 5 拍：Agent 对话演示（以代工厂为例；文案随所选方案变化，均为示例）
// from / to：client = 客户 Agent，mcp = MCP，factory = 工厂 Agent
export const DIALOG_START = 1.3;
export const DIALOG_STEP = 1.65;

export function buildDialogue(scheme) {
  const oem = LANES[3].suppliers[scheme.pick[3]];
  return [
    { from: 'client', to: 'mcp', role: '下单', text: `按${scheme.code}下单：10 万支 · ${scheme.delivery}交付 · 欧美市场` },
    { from: 'mcp', role: '查询', text: `${oem}资质有效 · 近 12 个月准时交付 96%` },
    { from: 'mcp', to: 'factory', role: '传递任务', text: `灌装组装 10 万支 · ${scheme.delivery}交付 · ${scheme.payment}` },
    { from: 'factory', to: 'mcp', role: '回复', text: '已读取 MES：产线 2 第 3 周起可排产，按期交付；如需提前 5 天，加价 3%' },
    { from: 'mcp', role: '确认', text: '交期与排期一致 ✓  价格在方案区间内 ✓  条款符合模板 ✓' },
    { from: 'mcp', to: 'client', role: '汇报', text: '代工厂 3 项已谈妥；「提前 5 天加价 3%」留给您判断' }
  ];
}
