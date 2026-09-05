# TongLi98.github.io

这是 Tong Li 的个人学术网站，使用原生 HTML、CSS 和 JavaScript 构建，部署到 GitHub Pages。

当前内容根据个人 CV 整理，重点展示 INRS 博士研究方向、代表论文、教育经历、科研项目、专利和荣誉。

## 文件结构

- `index.html`：页面内容和结构
- `styles.css`：Apple 风格的响应式视觉样式
- `script.js`：GSAP 滚动动画、Three.js 分子模型和响应式导航
- `assets/site.js`：已构建的浏览器脚本，可直接在 GitHub Pages 和本地文件中运行

## 本地预览

直接在浏览器打开 `index.html` 即可预览。

修改 `script.js` 后运行 `npm ci` 和 `npm run build`，并同时提交 `assets/` 构建结果。HTML 和 CSS 修改不需要构建。依赖已固定版本，页面运行时不依赖外部 CDN。

## 交互与设计

- 浅灰色内容卡片悬停后统一变为 Apple 蓝色，标题、正文和辅助文字变白。
- 四个研究方向分别展示：光催化、等离子体催化、CO2 利用、机器学习。
- 五篇一作论文的标题和整条记录都能在新标签页打开出版社文章页；DOI 已与出版社或 Crossref 记录核对。
- 首屏为可随指针轻微转动的 CO2 与催化剂表面概念模型，不代表具体晶体结构或反应模拟。
- 莫兰迪低饱和配色使用柔石墨色首屏、灰蓝色碳利用、暖灰色光、雾紫色等离子体和鼠尾草绿数据；氧原子为藕粉色，正文保持浅色阅读背景。
- 三维模型采用中性柔光和偏哑光材质，减弱金属高光与自发光；模型、示意图和控件共享 CSS 配色变量。
- 首屏四个选项可切换光子波形、等离子体线条、碳界面路径和数据网络。控件支持键盘，并在 WebGL 不可用时自动禁用。
- 研究卡片包含四幅科学概念示意，论文使用期刊色标，导航顶部显示阅读进度。
- 动画遵循系统减少动态效果设置，模型离开视口或页面进入后台时暂停。
- 小屏导航支持开关、Escape 和选中链接后关闭。没有 WebGL 时显示分子式备用图。

动效参考了 [Brittany Chiang v4](https://github.com/bchiang7/v4) 的分层入场节奏，以及 [3D Developer Portfolio](https://github.com/adrianhajdin/project_3D_developer_portfolio) 的交互三维场景。本站布局和分子场景独立实现；动画使用 [GSAP](https://github.com/greensock/GSAP)，三维渲染使用 [Three.js](https://github.com/mrdoob/three.js)，图标使用 [Lucide](https://github.com/lucide-icons/lucide)。第三方声明保留在 `assets/site.js.LEGAL.txt` 和 `assets/licenses/`。

2026-09-05 的科技视觉更新还参考了以下热门开源 UI 项目。星标为查询当时的约数；仅借鉴视觉和交互模式，没有引入其 React 运行时或复制组件源码。

- [React Bits](https://github.com/DavidHDev/react-bits)，约 46.8k stars：三维网格、波束与交互背景的视觉思路。
- [Magic UI](https://github.com/magicuidesign/magicui)，约 22.2k stars：[Animated Beam](https://magicui.design/docs/components/animated-beam) 的连接路径表达。
- [Uiverse Galaxy](https://github.com/uiverse-io/galaxy)，约 12.4k stars：多色控件状态、边框和轻量 CSS 反馈。

## 发布

仓库远端已指向：

```text
https://github.com/TongLi98/TongLi98.github.io.git
```

推送到 `main` 分支后，GitHub Pages 通常会发布到：

```text
https://tongli98.github.io/
```

后续可以继续加入 Google Scholar、ORCID、论文 DOI、完整 CV 下载和中英双语切换。
