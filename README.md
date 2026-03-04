# vibe-101-publish

面向公众号发布的 Markdown 排版与导出工作台。

## 在线预览

- 访问地址：https://yuzc-001.github.io/vibe-101-publish/
- 用途：直接在线看排版、公式、主题和导出效果。
- 如果首次打开是空白页：请强制刷新（`Ctrl + F5`）后再试。

## 项目定位

我们把它当作一个产品，而不是“功能拼装编辑器”。

- 发布一致性优先：编辑区效果尽量贴近公众号最终呈现。
- 微信兼容优先：复制到公众号要稳，不靠运气。
- 细节可控优先：字体、间距、代码块、公式都可调可验证。
- 工程化优先：能力可复用、可演进、可持续维护。

## 核心能力

- 魔法粘贴：飞书、Notion、网页、Word 富文本粘贴后自动净化为 Markdown。
- 多主题系统：内置主题 + 推荐主题 + 自定义主题。
- 多端预览：支持手机、平板、桌面视图，滚动同步更稳定。
- 公众号发布链路：结构修正、样式补偿、外链图片处理。
- 公式支持：KaTeX 渲染，兼容公众号复制链路。
- 多格式导出：HTML / PDF / DOC / DOCX。

## 近期更新（2026-03-04）

- 修复手机/平板预览下同步滚动偶发无法回到题目行的问题。
- 强化 LaTeX 渲染与公众号兼容策略。
- 新增超长 data URI 图片资产化，源码更清爽，编辑区可见图片缩略预览。
- 优化 GitHub Pages 部署路径，项目页访问不再空白。

## 快速开始

### Windows 一键启动

```bat
start.bat
```

### 本地开发

```bash
pnpm install
pnpm dev
```

### 生产构建

```bash
pnpm build
```

## 协作与联系

- 宣传文案：见 [PROMO.md](./PROMO.md)
- 交流合作：`zxyu24@outlook.com`

## 致谢与许可

本项目是围绕内容排版与发布工作流的独立新创作。  
在演进过程中参考并继承了原项目 [raphael-publish](https://github.com/liuxiaopai-ai/raphael-publish) 的开源基础，在此向原作者及贡献者致谢。

- License: [MIT](./LICENSE)
- Third-party notices: [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)
- Asset notice: [ASSET_NOTICE.md](./ASSET_NOTICE.md)
