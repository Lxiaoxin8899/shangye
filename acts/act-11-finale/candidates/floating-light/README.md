# act-11-finale · 候选 `floating-light`（悬浮空间 · 延续第六至十幕）

- **所属幕次**：[act-11-finale](../../README.md)
- **状态**：当前主选
- **风格**：延续第六至十幕「悬浮空间 + 实时光学景深」；2D 版面实现 `renderOverlay`，在调色之后叠加并随渲染分辨率重绘；3D 标签写入深度参与景深；景深目标 4× MSAA。
- **文件组成**：
  - [shaders/floating-space-and-dof.js](shaders/floating-space-and-dof.js) · [models/materials.js](models/materials.js) · [models/props.js](models/props.js)：复制自第十幕
  - [models/parts.js](models/parts.js)：复制自第十幕的制造实物（香精、发热体、电池、包装盒、电子烟等）
  - [models/act11-device.js](models/act11-device.js)：通用多工位精密调香设备（龙门滴定头、六个香精工位、称量盘与样品烟弹），不写参数
  - [models/act11-data.js](models/act11-data.js)：全部上屏文案；不出现金额与成果数字
  - [models/act11-stage.js](models/act11-stage.js)：舞台编排——设备滴定与样品浮出、六个约束、实测数据卡、Agent 与两块承重底座、企业五部门链条与行业网络、五个里程碑路线与地球仪、封底 MCP 近景
  - [textures/act11-cards.js](textures/act11-cards.js) · [textures/editorial-overlay.js](textures/editorial-overlay.js) · [scene.js](scene.js)
- **一条线索**：样品 → 实测数据卡（第 1 拍流出）→ 叠进「数据治理」底座（第 2 拍）→ 三角承重落进企业研发（第 3 拍）→ 路线回望（第 4 拍）→ 第一幕的 MCP 近景（第 5 拍）。
- **空间布局（米制）**：第 1 拍设备 `(-0.01, -0.075)`，样品浮出时设备让到 `x = -0.07`，AI 应用调香屏 `(-0.355, 0)`，样品展示位 `(0.275, -0.005)`；第 2 拍 Agent `(0, 0.03)`，承重底座 `(±0.17, -0.11)`；第 3 拍五部门 `x = -0.3 … 0.3`、`y = -0.05`，缩小后企业移到 `(-0.3, -0.07)`，MCP `(0.02, -0.04)`；第 4 拍五个里程碑从 `(-0.4, -0.09)` 斜向延伸到 `(0.31, 0.01)`，地球仪 `(0.47, 0.05)`；第 5 拍 MCP `(0, -0.005)` 放大至 1.05。
- **交互**：纯前后翻拍自动演出；最后一拍为全片终点。
- **独立预览**：`acts/act-11-finale/candidates/floating-light/index.html`
- **单幕验证（Gate B）**：2026-11-28 用本机 Chrome 无头模式按 `__deck.go` 逐拍取静帧（B0 1.5s / 4.2s / 8s / 10.5s · B1 1s / 3s / 7.5s · B2 3.5s / 4s / 5.6s / 9s · B3 1.5s / 4s / 9s · B4 1.5s / 6s），无脚本错误；第二轮优化后复查各拍切换帧（B1 0.35s · B3 0.6s · B4 0.35s 等），动态效果待浏览器内复看。
- **第二轮优化**：拍间退场缩短到 0.45 秒（避免缩小中的物件残留成碎点）；香精与样品颜色加深；第 1 拍样品与六个约束之间加连线（画出耦合）；第 3 拍企业缩小后标「一家企业 · AI 化」；第 4 拍路线一开始即带出第一个里程碑，里程碑标签放大。
