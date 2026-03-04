# vibe-101-publish - 全场景内容排版与发布工作台

面向**公众号、知识库、博客与办公文档**的现代 Markdown 排版引擎（对微信生态做深度兼容优化）。

> **体验方式**：当前不提供在线体验，请运行 `start.bat` 一键本地启动（Windows）。
> 启动后访问：`http://127.0.0.1:5173/`

## 快速开始（Windows）

```bat
start.bat
```

脚本会自动完成依赖安装（如缺失）并启动本地开发服务。

## 新创作声明与致谢

本项目是围绕“内容排版与发布工作流”进行的独立新创作与工程重构。  
在演进过程中参考并继承了原项目 [raphael-publish](https://github.com/liuxiaopai-ai/raphael-publish) 的开源基础，在此向原作者及原仓库贡献者致谢。

本仓库新创作与重构内容（持续迭代中）：

- 主题体系重构（必选主题 + 推荐主题 + 自定义主题）
- 工具栏与交互细节优化（导出/复制分组、Word 导出菜单）
- 导出能力扩展（PDF / HTML / Word）
- 构建体积优化与 ESLint v9 平滑升级

## 近期更新（2026-03-04）

- 同步滚动稳定性增强：重构手机/平板场景下的编辑区与预览区同步逻辑，降低惯性滚动与内容高度变化导致的错位。
- LaTeX 公式支持：新增 `$...$` 与 `$$...$$` 公式渲染（KaTeX）。
- 公众号公式兼容：复制到公众号时自动将公式转为图片（Base64）以提升后台粘贴后的展示稳定性。

## 版本更新说明建议

建议后续每次发布都维护本节（日期 + 变更点），便于区分：

- 原项目能力（upstream）
- 本仓库新创作新增能力（downstream）


## 功能特性


### 魔法粘贴

**从飞书、Notion、Word 甚至任意网页复制富文本**，粘贴瞬间自动净化为纯净 Markdown。无需手写 Markdown 语法，粘贴即用。
同时支持**直接粘贴截图或图片（Ctrl/Cmd + V）**，自动插入 Markdown 图片语法。

### 30 套高定样式

告别同质化白底模板，提供 30 套精心打磨的视觉主题：

- **经典**：Mac 纯净白、Claude 燕麦色、微信原生、NYT 纽约时报、Medium 博客风、Stripe 硅谷风、飞书效率蓝、Linear 暗夜、Retro 复古羊皮纸、Bloomberg 终端机
- **潮流**：Notion、GitHub、少数派、Dracula、Nord、樱花、深海、薄荷、日落、Monokai
- **更多风格**：Solarized、Cyberpunk、水墨、薰衣草、密林、冰川、咖啡、Bauhaus、赤铜、彩虹糖

每套主题在背景色、字体、标题、代码块、引用、表格等元素上都有独立设计，切换即可感受完全不同的排版风格。

### 一键复制到公众号

点击「复制到公众号」按钮，直接粘贴到公众号后台：

- **所有外链图片自动转 Base64，不会出现"此图片来自第三方"的报错**
- 背景色、圆角、间距等样式精准还原
- 列表和表格经过底层 DOM 重塑，在微信中不会塌陷

### 多图排版

支持多图并排网格布局，通过 `wechatCompat` 引擎确保在微信公众号中完美呈现，不会被折断。

### 多端预览

编辑时实时预览，支持手机 (480px)、平板 (768px)、桌面 (PC) 三种视图切换，所见即所得。

### 导出

支持导出为 PDF、HTML、DOCX、DOC，同时支持复制 Word 富文本，适合存档、邮件发送、办公流转或网页发布。

## 技术栈

- **React 18** + **TypeScript**
- **Vite 5** 构建
- **Tailwind CSS 3** 样式
- **markdown-it** Markdown 解析
- **highlight.js** 代码高亮
- **turndown** 富文本转 Markdown（魔法粘贴）
- **html2pdf.js** PDF 导出
- **framer-motion** 动画

## 本地开发

```bash
pnpm install
pnpm dev
# 或
npm install
npm run dev
```

## 构建部署

```bash
pnpm build
# 或
npm run build
```

构建产物输出到 `dist/` 目录，可部署到 GitHub Pages 或任意静态托管服务。

## 开源合规与发布说明

- 本仓库保留并分发原始 [LICENSE](./LICENSE)（MIT）。
- 主要第三方依赖与许可证见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。
- 素材/图标/截图可再分发说明见 [ASSET_NOTICE.md](./ASSET_NOTICE.md)。
- 已完成敏感信息基础扫描（密钥、私有地址、个人路径等），当前未发现高风险泄漏项。

发布到 GitHub 前，建议再执行一次：

```bash
pnpm lint
pnpm build
# 或
npm run lint
npm run build
```
