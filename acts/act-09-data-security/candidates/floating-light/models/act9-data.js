// 第九幕全部上屏文案（不出现金额；数字一律为示例）

// 红线外：明确开放、法律允许的资料，以及它们的来源章
export const PUBLIC_DOCS = [
  { title: '产品规格书', sub: '型号 · 参数 · 适用工况', stamp: '企业主动登记' },
  { title: '合规资质', sub: '许可 · 备案 · 适用法规', stamp: '依据公开法规与标准' },
  { title: '检测报告', sub: '第三方检测 · 公开发布', stamp: '公开检测报告' }
];

// 红线内：商业机密与研发技术（固定四项）
export const SECRET_DOCS = [
  { title: '配方', sub: '香精配比 · BOM' },
  { title: '研发工艺', sub: '工艺参数 · 试验记录' },
  { title: '客户名单', sub: '客户 · 订单往来' },
  { title: '成本底价', sub: '成本 · 报价底线' }
];

// 第 2 拍：来源可查的标准数据卡
export const STD_CARD = {
  code: 'WM-0418',
  title: '清新西瓜香精',
  rows: ['来源：企业主动登记', '依据：公开法规与标准', '检测：公开检测报告']
};

// 第 3 拍：借用第七幕的一个示例问题
export const QUESTION = '2 万支，15 天能交吗？';
export const ANSWER = '可以 · 第 15 天交付';

export const RULES = [
  { no: '01', name: '明确开放', line: '只提供明确开放、法律允许的信息' },
  { no: '02', name: '零触碰机密', line: '绝不涉及商业机密与研发技术' },
  { no: '03', name: '治理壁垒', line: '专注整理难度极大的公开与挖掘信息' }
];

export const CORE_LINE = '数据安全，是我们发展的核心与必要性';
