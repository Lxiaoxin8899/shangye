// 第八幕全部上屏文案（除「0.1 元/次（示例）」与第三幕已有的「广告 ¥30」外，不出现任何金额）

export const MISSION = '为企业降低对话成本，提高协同效率';

// 第 1 拍：31 年轮回
export const ERAS = [
  { year: '1995', name: '中国黄页', line: '解决信息不通' },
  { year: '1999', name: 'B2B 商城', line: '让生意好做' },
  { year: '2026', name: 'Agent 时代', line: '企业对话交给 Agent' }
];

// 第 2 拍：旧黄页条目（只有企业名和电话）→ AI 读得懂的产品标准数据卡（示例）
export const OLD_LISTINGS = [
  ['XX 香精有限公司', '0755-8XXX XXXX'],
  ['XX 塑胶制品厂', '0755-2XXX XXXX'],
  ['XX 电池科技', '0769-8XXX XXXX'],
  ['XX 电子雾化', '0755-3XXX XXXX'],
  ['XX 线路板厂', '0755-6XXX XXXX'],
  ['XX 代工厂', '0752-5XXX XXXX']
];

export const DATA_CARDS = [
  { code: 'WM-0418', title: '清新西瓜香精', rows: ['甜瓜醛 未检出', 'GC-MS 指纹', '陶瓷芯实测'] },
  { code: 'SH-2207', title: 'PCTG 壳料', rows: ['耐柑橘烯', '色板与打样', '模具周期'] },
  { code: 'BT-0400', title: '400 mAh 电池', rows: ['UN38.3', '放电曲线', '安全数据表'] },
  { code: 'CC-0800', title: '0.8Ω 陶瓷芯', rows: ['还原度', '口数寿命', '漏液测试'] },
  { code: 'PB-1103', title: '方案板 PCB', rows: ['输出功率', '防干烧', '认证'] },
  { code: 'OEM-B', title: '代工厂产线', rows: ['日产能', '起订量', '交期'] }
];
export const MATCH_CARD = 0; // 客户 Agent 这次问的是西瓜香精

// 三步走（第 2–5 拍角落的「阶段收入 / 衡量」与第 5 拍的三层平台共用）
export const STAGES = [
  {
    name: 'AI 时代的黄页',
    sub: '被 AI 找到、读懂',
    income: '查询 / 订阅（示例 0.1 元/次）',
    metric: '查询次数'
  },
  {
    name: 'AI 时代的商城',
    sub: '降低对话成本 · 提高协同效率',
    income: '通用 Agent / AI 平台付费授权 · 企业 AI 部署 · 曝光评估',
    metric: '谈成的协作'
  },
  {
    name: '行业基础设施',
    sub: 'AI 评价和选择体系',
    income: '准入 · 交易服务',
    metric: '行业决策占比'
  }
];

// 第 3 拍：四家企业（示例）
export const ENTERPRISES = ['壳料厂', '电池厂', '烟油厂', '代工厂'];

// 第 4 拍：三件被测产品（质量与性能比较，示例）
export const SAMPLES = [
  { name: '样品 A', score: 0.58 },
  { name: '样品 B', score: 0.92 },
  { name: '样品 C', score: 0.74 }
];
export const WINNER = 1;

// 第 5 拍：三向飞轮
export const FLYWHEEL = ['降服务成本', '提用户体验', '优数据精度'];
