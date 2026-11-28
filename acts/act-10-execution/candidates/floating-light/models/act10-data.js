// 第十幕全部上屏文案（不出现金额与具体数字；不点名具体通用 AI 工具）

// 第 1 拍：杂乱的原始资料 → 标准数据卡
export const RAW_DOCS = [
  { title: '检测报告（扫描件）', lines: ['模糊 · 盖章歪斜', '数值需人工辨认'], kind: 'scan' },
  { title: 'Regulation (EU) …', lines: ['多语言法规条文', '条款散落各处'], kind: 'law' },
  { title: '参数表 · 单位不一', lines: ['mg/mL · % · ppm', '口径各不相同'], kind: 'table' },
  { title: '打样记录（手写）', lines: ['口感描述随意', '工况没有记录'], kind: 'hand' },
  { title: 'PDF 规格书', lines: ['格式各家不同', 'AI 读不懂'], kind: 'pdf' },
  { title: '展会名录', lines: ['只有企业名称', '真假难辨'], kind: 'list' }
];

export const STD_CARDS = [
  { code: 'WM-0418', title: '清新西瓜香精' },
  { code: 'CC-0800', title: '0.8Ω 陶瓷芯' },
  { code: 'BT-0400', title: '400 mAh 电池' },
  { code: 'SH-2207', title: 'PCTG 壳料' },
  { code: 'PB-1103', title: '方案板 PCB' },
  { code: 'PK-0612', title: '烟弹包装盒' }
];
export const STD_ROWS = ['来源可查', '单位统一', '实测补齐'];
export const GOVERN_STEPS = ['校对来源', '统一单位', '实测补齐'];
export const STEP1_CHIPS = ['自用刚需', '市场空白', '苦活累活本身就是壁垒'];

// 第 2 拍：一库两用
export const ENTERPRISE_AGENTS = [
  { name: '调香 Agent', user: ['西瓜香型', '不含甜瓜醛'], reply: ['已给出 3 个配方方向', '附单体与工况数据'] },
  { name: '采购 Agent', user: ['陶瓷芯备选', '交期优先'], reply: ['已比对 5 家供应商', '附评估与交期'] },
  { name: '研发 Agent', user: ['高功率下', '还原度怎么样'], reply: ['已调取实测曲线', '附棉芯 / 陶瓷芯对比'] }
];
export const TOOL_WINDOWS = ['通用 AI 工作工具', '通用 AI 工作工具', '通用 AI 工作工具'];

// 第 3 拍：先攻制造基础
export const MAKE_ITEMS = ['香精', '单体', '发热体', '电池', '塑胶', '方案板', '包装瓶盒', '打样与组装'];

// 第 4 拍：AI 时代的曝光渠道
export const AI_QUESTION = ['推荐高功率下', '还原度最好的陶瓷芯'];
export const AI_ANSWER = ['推荐 B 产品', '实测还原度领先 · 附评估报告'];

// 第 5 拍：供给势能反转
export const SUPPLIER_COUNT = 6;
export const CLIENT_COUNT = 6;

// 第 6 拍：一个循环（AI 企业化落地最难的两件事 → 底座 → 平台 → 潜在客户 → 回到起点）
export const LOOP_STATIONS = [
  { name: '数据治理 × 工作链条连通', sub: 'AI 企业化落地最难的两件事' },
  { name: '行业知识底座', sub: '行业知识 MCP' },
  { name: 'AI B2B 平台', sub: '一次对接，多方拉通' },
  { name: '企业 AI 部署', sub: '积累潜在客户' }
];
export const LOOP_CORE = { name: '壁垒', sub: '不可或缺的底层工具' };
export const LOOP_RETURN = '↺ 更多数据与链条';
export const LOOP_FINAL = '这个循环一旦转起来，就是行业不可或缺的底层工具';
