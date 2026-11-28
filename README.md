# WebGL2 三维制作工具

这套工具用于制作和比较实时三维场景。默认画面使用一个 100 × 60 × 80 mm 的倒角校准块，可以直接检查尺寸、材质、线框和节拍切换。

## 打开预览

直接用支持 WebGL2 的浏览器打开 [单文件播放器](dist-single/master/index.html)。它包含全片 11 幕路演（清单见 [master/manifest.js](master/manifest.js)），可以离线使用。左右方向键翻拍，A 自动播放，N 演讲备注，O 总览，H 显示快捷键。

要同时使用模型检视和候选比较，从本目录运行以下命令，再打开终端所示端口的首页。

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

首页地址为 `http://127.0.0.1:8000/`。多入口构建支持部署到静态站点的子目录。

| 入口 | 用途 |
| --- | --- |
| `/master/index.html` | 按清单播放，支持键盘、指针、节拍定位、备注和缩略图总览 |
| `/core/sandbox/inspector.html` | 旋转、缩放、更换灯光与材质模式，读取包围盒、底面间隙和三角面数 |
| `/core/sandbox/compare.html` | 输入两个同幕候选的地址，并排或拉帘比较 |
| `/acts/<单元>/candidates/<候选>/index.html` | 创建候选后即可单独运行，开发服务和多入口构建都会识别 |

## 编辑和构建

使用 Node.js 20 或 22 及以上版本和 npm。安装会用到 npm 缓存或网络，默认场景的播放和模型解码使用本地资源。

```sh
npm ci
npm run dev
```

开发首页为 `http://127.0.0.1:5173/`，如端口已用，以 Vite 终端输出为准。锁定的直接依赖是 Three.js 0.185.1、Vite 6.4.6、vite-plugin-singlefile 2.3.4 和 playwright-core 1.65.1。

| 命令 | 结果 |
| --- | --- |
| `npm run new:candidate -- unit-01 variant-a` | 在 `acts/` 下创建任务书、独立候选、源文件和素材目录 |
| `npm run check` | 检查项目结构、静态候选引用和 100 MiB 单文件上限 |
| `npm run build` | 重新生成 `dist/` 下的多入口静态站点 |
| `npm run build:singlefile` | 重新生成 `dist-single/master/index.html` |
| `npm run preview` | 用 Vite 启动多入口产物的本地预览 |
| `npm run verify` | 用 Chromium 检查当前构建：总装逐拍走完、经真实转场跨过每一幕并检查整帧不发黑，在 `outputs/master/` 的新目录保存 PNG |

自动验收需要可执行的 Chromium 或 Chrome。脚本优先读取 `CHROME_PATH`，也会查找 Playwright 的浏览器缓存和常用 Linux 安装路径。需要安装时可用 `npx playwright-core install chromium`。源码修改后先重建两种产物，再运行自动验收。`dist-single` 只打包总装入口。

## 文件导航

| 部分 | 入口 |
| --- | --- |
| 共享渲染、节拍和字体 | [图形管线](core/engine/gfx.js) · [场景调度](core/engine/deck.js) · [文字图集](core/engine/text.js) |
| 交互、声音和转场 | [选框](core/engine/selectBox.js) · [辅助界面](core/engine/ui.js) · [Web Audio](core/engine/audio.js) · [转场着色器](core/transitions/index.js) |
| 制作与检视 | [独立运行器](core/sandbox/act-runner.js) · [模型检视器](core/sandbox/model-inspector.js) · [候选对比](core/sandbox/compare.html) |
| 校准与总装 | [通用校准块](core/sandbox/reference-mesh.js) · [双通道分屏](core/sandbox/split-view.js) · [测试视图](core/sandbox/reference-scenes.js) · [场景清单](master/manifest.js) |
| 使用方法与交付核查 | [制作与验收](docs/制作与验收.md) · [核验记录](docs/核验记录.md) · [第三方组件声明](THIRD-PARTY.txt) |
