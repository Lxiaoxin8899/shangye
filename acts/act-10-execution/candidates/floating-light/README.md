# act-10-execution · 候选 `floating-light`（悬浮空间 · 延续第六至九幕）

- **所属幕次**：[act-10-execution](../../README.md)
- **状态**：当前主选（初版）
- **风格**：延续第六至九幕「悬浮空间 + 实时光学景深」；2D 版面实现 `renderOverlay`，在调色之后叠加并随渲染分辨率重绘；3D 标签写入深度参与景深；景深目标 4× MSAA。
- **文件组成**：
  - [shaders/floating-space-and-dof.js](shaders/floating-space-and-dof.js) · [models/materials.js](models/materials.js) · [models/props.js](models/props.js)：复制自第九幕（`createChatScreenTex` 可配置名称与状态）
  - [models/act10-data.js](models/act10-data.js)：全部上屏文案；不出现金额与具体数字，不点名具体通用 AI 工具
  - [models/act10-parts.js](models/act10-parts.js)：八件制造上游实物（香精 · 单体 · 发热体 · 电池 · 塑胶 · 方案板 · 包装瓶盒 · 打样与组装），按同一高度归一
  - [models/act10-stage.js](models/act10-stage.js)：舞台编排——杂乱资料与治理光幕、标准数据卡压进 MCP、企业定制 Agent 与通用 AI 工作工具、八件实物与统一评价标准尺子、行业期刊与 AI 对话窗口、供应商与客户入口的势能反转、四站环形循环（数据治理 × 工作链条连通 → 行业知识底座 → AI B2B 平台 → 企业 AI 部署潜在客户）
  - [textures/act10-cards.js](textures/act10-cards.js) · [textures/editorial-overlay.js](textures/editorial-overlay.js) · [scene.js](scene.js)
- **空间布局（米制）**：第 1 拍杂乱资料在 `x = -0.4 … -0.2`，治理光幕从 `x = -0.48` 扫到 `-0.12`，标准数据卡两列在 `x = -0.03 / 0.085`，MCP 从 `(0.3, -0.015)` 移到 `(0.15, -0.015)`；第 2 拍 MCP 居中，企业 Agent 列 `x = -0.36`，通用 AI 工作工具列 `x = 0.36`（`y = 0.088 / -0.004 / -0.096`）；第 3 拍八件实物 `x = -0.385 … 0.385`、`y = -0.03`，尺子 `y = 0.085`；第 4 拍期刊 `(-0.23, -0.005)`，AI 对话窗口 `(0.2, 0)`；第 5 拍 MCP `(0, -0.03)`，供应商与客户入口分列左右两段弧（半径 0.3 × 0.15）；第 6 拍四站在 `(±0.27, 0.012)` 与 `(±0.27, -0.132)`，环形轨道在其后方 `z = -0.03`，中央「壁垒」标签 `(0, -0.06)`。
- **交互**：纯前后翻拍自动演出。
- **独立预览**：`acts/act-10-execution/candidates/floating-light/index.html`
- **单幕验证（Gate B）**：2026-11-28 用本机 Chrome 无头模式按 `__deck.go` 逐拍取静帧（B0 1.5s / 3.6s / 6s / 9.5s · B1 0.8s / 2s / 6.5s · B2 2.5s / 5.4s / 8.5s · B3 2.2s / 4s / 7.5s · B4 2s / 4s / 5s / 9s · B5 0.5s / 2.8s / 4.4s / 6s / 9s），无脚本错误；动态效果待浏览器内复看。
