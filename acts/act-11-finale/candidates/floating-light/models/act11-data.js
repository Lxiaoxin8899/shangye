// 第十一幕全部上屏文案（不出现金额与成果数字；设备不写参数）

// 第 1 拍：AI 应用调香 × 自动化调香设备
export const NEED = '清新西瓜 · 不含甜瓜醛';
export const FORMULA_ROWS = [
  ['香精 · A 厂', '西瓜主香'],
  ['香精 · B 厂', '瓜皮青香'],
  ['单体', '凉感修饰'],
  ['适配', '陶瓷芯 · 中功率']
];
export const CONSTRAINTS = ['多厂家香精', '单体', '设备', '棉芯 / 陶瓷芯', '功率', '法规'];
export const DATA_CARDS = [
  { code: 'TEST-01', title: '口感还原度', row: '陶瓷芯实测' },
  { code: 'TEST-02', title: '功率适配', row: '多档位实测' },
  { code: 'TEST-03', title: '法规校验', row: '目标市场' }
];

// 第 2 拍：三角承重
export const AGENT_TAG = { name: 'AI / Agent 技术', sub: '模型与框架人人可用' };
export const BASE_TAGS = [
  { name: '数据治理', sub: '实测数据 · 标准化沉淀' },
  { name: '业务理解', sub: '调香现场 · 设备与工况' }
];
export const TRIANGLE_LINE = '应用调香，只是我们对「AI + 烟油应用研发」深度理解的一次外在体现';

// 第 3 拍：企业剖面
export const DEPARTMENTS = ['研发', '采购', '生产', '品控', '销售'];

// 第 4 拍：路线回望（每个里程碑用前面出现过的实物）
export const MILESTONES = [
  { name: '应用调香与自动化设备', sub: '今天 · 第十一幕' },
  { name: '行业知识 MCP', sub: '第一步 · 第十幕' },
  { name: '制造基础与统一评价标准', sub: '第二步 · 第十幕' },
  { name: '全链六环 · AI B2B 平台', sub: '第六、七幕' },
  { name: '行业基础设施', sub: '第八幕' }
];
export const ROUTE_LINE = '建立 AI 评价与选择体系：从传统营销输出，转向产品质量与性能比较';

// 第 5 拍：封底
export const CLOSING = {
  company: '深圳新智微科技有限公司',
  title: 'AI 时代的雾化产业基础设施',
  sub: '建立连接全球的行业底层 AI 知识库  ·  构建客观的 AI 评价与选择体系',
  mission: '为企业降低对话成本，提高协同效率',
  thanks: '感谢聆听  ·  欢迎深入交流'
};
