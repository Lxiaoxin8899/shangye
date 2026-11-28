# act-09-data-security · 候选 `floating-light`（悬浮空间 · 延续第六至八幕）

- **所属幕次**：[act-09-data-security](../../README.md)
- **状态**：当前主选（初版）
- **风格**：延续第六至八幕「悬浮空间 + 实时光学景深」；2D 版面实现 `renderOverlay`，在调色之后叠加并随渲染分辨率重绘；3D 标签写入深度参与景深；景深目标 4× MSAA。
- **文件组成**：
  - [shaders/floating-space-and-dof.js](shaders/floating-space-and-dof.js)：复制自第八幕
  - [models/materials.js](models/materials.js)：复制自第八幕材质库
  - [models/props.js](models/props.js)：复制自第八幕的 MCP 中枢芯片与对话入口；对话屏贴图 `createChatScreenTex` 改为导出，名称、状态与空闲提示可配置（用于「工厂 Agent · 部署在企业内部」）
  - [models/act9-data.js](models/act9-data.js)：全部上屏文案；不出现金额，「2 万支，15 天」标为示例
  - [models/act9-stage.js](models/act9-stage.js)：舞台编排——工厂与七份资料、红线、来源章与标准数据卡、来源不明资料与红色拒收环、保险柜、MES 屏、工厂 Agent 与问答轨道、六家企业各守红线
  - [textures/act9-cards.js](textures/act9-cards.js) · [textures/editorial-overlay.js](textures/editorial-overlay.js) · [scene.js](scene.js)
- **空间布局（米制）**：红线在 `x = 0`（`y = -0.155 … 0.105`）；红线外资料列 `x = -0.15`，MCP 在 `x = -0.38`（第 2 拍）→ `-0.27`（第 3 拍）；红线内机密资料 `x = 0.165 / 0.315`，工厂 `(0.24, -0.125)`，工厂 Agent `(0.1, -0.012)`，MES `(0.25, 0.062)`，保险柜 `(0.42, 0)`；第 4 拍六家企业在 `y = -0.075` 的椭圆环（半径 0.36 × 0.22），MCP 居中 `y = -0.06`。
- **配色**：红线与拒收用压在 1 以下的饱和红（AgX 会把过亮的红推成粉橙）；合法来源与企业绿色；MCP 香槟金；问题蓝色；保险柜深钛。
- **交互**：纯前后翻拍自动演出。
- **独立预览**：`acts/act-09-data-security/candidates/floating-light/index.html`
- **单幕验证（Gate B）**：2026-11-28 用本机 Chrome 无头模式按 `__deck.go` 逐拍取静帧（B0 1.5s / 3s / 4.2s / 9s · B1 2.5s / 6s / 7s · B2 1.5s / 4.4s / 6.9s / 9.5s · B3 3s / 8.5s），无脚本错误；动态效果待浏览器内复看。
