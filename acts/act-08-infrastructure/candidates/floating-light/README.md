# act-08-infrastructure · 候选 `floating-light`（悬浮空间 · 延续第六、七幕）

- **所属幕次**：[act-08-infrastructure](../../README.md)
- **状态**：当前主选（初版）
- **风格**：延续第六、七幕「悬浮空间 + 实时光学景深」；2D 版面实现 `renderOverlay`，在调色之后叠加并随渲染分辨率重绘；3D 标签写入深度参与景深；景深目标 4× MSAA。
- **文件组成**：
  - [shaders/floating-space-and-dof.js](shaders/floating-space-and-dof.js)：复制自第七幕（含圆形微尘与 4× MSAA）
  - [models/materials.js](models/materials.js)：复制自第七幕材质库
  - [models/props.js](models/props.js)：复制自第七幕的 MCP 中枢芯片与客户 Agent 对话入口（对话文案改为可配置）
  - [models/act8-data.js](models/act8-data.js)：全部上屏文案；**除「0.1 元/次（示例）」与第三幕已有的「广告 ¥30」外不出现金额**
  - [models/act8-stage.js](models/act8-stage.js)：舞台编排——三个时代实物与时间轴、旧黄页 → 数据卡环、逐家对接 → 一次对接、通用 AI 对话窗口从「缺少行业数据」到「已接入行业 MCP」（付费授权）、广告块 → 准入金片、客观的尺子与样品测量、三层基础设施与三臂飞轮
  - [textures/act8-cards.js](textures/act8-cards.js) · [textures/editorial-overlay.js](textures/editorial-overlay.js) · [scene.js](scene.js)
- **空间布局（米制）**：第 1 拍时间轴 `y = -0.075`，三件实物在 `x = -0.5 / 0 / 0.5`；第 2–4 拍 MCP 居中 `(0, 0)`，客户 Agent 在左（`x = -0.37 / -0.48`），企业 / 样品在右；第 5 拍三层平台 `y = -0.12 / -0.045 / 0.03`（半径 0.2），MCP 与飞轮在 `y = 0.09`。
- **交互**：纯前后翻拍自动演出。
- **独立预览**：`acts/act-08-infrastructure/candidates/floating-light/index.html`
- **单幕验证（Gate B）**：2026-11-28 用本机 Chrome 无头模式按 `__deck.go` 逐拍取静帧（B0 1.5s / 4s / 6.2s / 9s · B1 1.2s / 6.5s · B2 2s / 6s / 10s · B3 3s / 7s · B4 9s），无脚本错误；动态效果待浏览器内复看。
