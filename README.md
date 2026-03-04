<p align="center">
  <img src="./favicon.svg" width="84" alt="vibe-101-publish icon" />
</p>

<h1 align="center">vibe-101-publish</h1>

<p align="center">
  面向公众号创作者的 Markdown 排版与发布工作台
</p>

<p align="center">
  <a href="https://yuzc-001.github.io/vibe-101-publish/">
    <img src="https://img.shields.io/badge/Live-GitHub%20Pages-2BAE85?logo=githubpages&logoColor=white" alt="Live on GitHub Pages" />
  </a>
  <a href="https://github.com/Yuzc-001/vibe-101-publish/actions/workflows/deploy.yml">
    <img src="https://github.com/Yuzc-001/vibe-101-publish/actions/workflows/deploy.yml/badge.svg" alt="Deploy Status" />
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-3D7FE8.svg" alt="License MIT" />
  </a>
  <a href="https://github.com/Yuzc-001/vibe-101-publish/stargazers">
    <img src="https://img.shields.io/github/stars/Yuzc-001/vibe-101-publish?style=social" alt="GitHub Stars" />
  </a>
</p>

<p align="center">
  <a href="https://yuzc-001.github.io/vibe-101-publish/"><strong>在线预览</strong></a>
  ·
  <a href="https://github.com/Yuzc-001/vibe-101-publish">GitHub 仓库</a>
  ·
  <a href="https://github.com/Yuzc-001">GitHub 主页</a>
  ·
  <a href="mailto:zxyu24@outlook.com">交流合作</a>
</p>

---

## 一句话介绍

`vibe-101-publish` 是一个面向公众号创作者的 Markdown 排版与发布工作台。  
核心目标：让“编辑效果”尽量接近“最终发布效果”。

## 快速入口

- 在线预览：<https://yuzc-001.github.io/vibe-101-publish/>
- GitHub 仓库：<https://github.com/Yuzc-001/vibe-101-publish>
- GitHub 主页：<https://github.com/Yuzc-001>

访问提示：

- 如果首次打开预览是空白页，请强制刷新（`Ctrl + F5`）。

## 能力矩阵

| 模块 | 能力说明 | 状态 |
| --- | --- | --- |
| 富文本粘贴 | 飞书、Notion、网页、Word 粘贴后自动净化为 Markdown | 已完成 |
| 主题系统 | 内置主题 + 推荐主题 + 自定义主题微调 | 已完成 |
| 多端预览 | 手机 / 平板 / 桌面视图切换，支持同步滚动 | 已完成 |
| 公式渲染 | 支持 `$...$`、`$$...$$`，基于 KaTeX 渲染 | 已完成 |
| 公众号兼容 | 复制链路结构修正、样式补偿、公式兼容策略 | 已完成 |
| 文档导出 | HTML / PDF / DOC / DOCX 导出 | 已完成 |
| 图片资产化 | 超长 data URI 自动资产化，源码区显示缩略预览 | 已完成 |

## 设计原则

- 发布一致性优先：编辑区体验服务最终发布效果。
- 微信兼容优先：复制到公众号时稳定优先于“花哨效果”。
- 细节可控优先：字体、间距、代码块、公式都可验证。
- 工程可持续优先：每一项功能都可复用、可演进、可维护。

## 快速开始

### Windows 一键启动

```bat
start.bat
```

### 本地开发

```bash
corepack enable
pnpm install
pnpm dev
```

### 生产构建

```bash
pnpm build
```

## 常用命令

```bash
pnpm dev      # 本地开发
pnpm build    # 生产构建
```

## GitHub Pages 部署

仓库已内置自动部署工作流。

- workflow 文件：`.github/workflows/deploy.yml`
- 触发方式：push 到 `main`

需要确认：

1. 仓库 `Settings -> Pages`
2. `Build and deployment` 的 `Source` 设为 `GitHub Actions`

## 近期更新（2026-03-04）

- 修复手机/平板预览下同步滚动偶发无法回到题目行的问题。
- 强化 LaTeX 公式渲染与公众号兼容逻辑。
- 新增 data URI 图片资产化，降低源码噪音并提供缩略图预览。
- 修复 GitHub Pages 项目路径 `base`，解决线上空白页问题。
- 顶栏新增 GitHub 主页与仓库入口按钮。

## 协作与沟通

- 交流合作：`zxyu24@outlook.com`
- 宣传文案：[PROMO.md](./PROMO.md)
- 问题反馈：[Issue](https://github.com/Yuzc-001/vibe-101-publish/issues)

## 路线图

- 优化公众号内长公式换行与图文混排稳定性。
- 增加模板市场化能力（主题配置可分享）。
- 提供文章质量检查与发布前检查报告。
- 完善 Playwright 回归测试，固化复制链路质量。

## 与上游项目关系

本项目是围绕内容排版与发布工作流的独立新创作。

演进过程中参考并继承了开源项目 [raphael-publish](https://github.com/liuxiaopai-ai/raphael-publish) 的基础能力，在此致谢。

## 许可证与合规

- License: [MIT](./LICENSE)
- Third-party notices: [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)
- Asset notice: [ASSET_NOTICE.md](./ASSET_NOTICE.md)
