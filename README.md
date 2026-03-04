<p align="center">
  <img src="./favicon.svg" width="92" alt="vibe-101-publish logo" />
</p>

<h1 align="center">vibe-101-publish</h1>

<p align="center">
  面向公众号、知识库、博客与办公文档的 Markdown 排版与发布工作台
</p>

<p align="center">
  <a href="https://yuzc-001.github.io/vibe-101-publish/">
    <img src="https://img.shields.io/badge/Live%20Preview-GitHub%20Pages-2BAE85?logo=githubpages&logoColor=white" alt="Live Preview" />
  </a>
  <a href="https://github.com/Yuzc-001/vibe-101-publish/actions/workflows/deploy.yml">
    <img src="https://github.com/Yuzc-001/vibe-101-publish/actions/workflows/deploy.yml/badge.svg" alt="Deploy Status" />
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-3D7FE8.svg" alt="MIT License" />
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

## 一句话定位

`vibe-101-publish` 是一个面向内容创作者与内容团队的排版与发布工作台。  
它不是“只在编辑区好看”的工具，而是追求“发布后也稳定”的完整链路产品。

## 快速入口

- 在线预览：<https://yuzc-001.github.io/vibe-101-publish/>
- GitHub 仓库：<https://github.com/Yuzc-001/vibe-101-publish>
- GitHub 主页：<https://github.com/Yuzc-001>

提示：
- 若首次访问预览出现空白，请强制刷新 `Ctrl + F5`。

## 我们在解决的核心问题

很多工具卡在发布最后一公里：

- 粘贴到目标平台后样式丢失、字体错乱。
- 图片、表格、图文混排结构变形。
- LaTeX 公式在不同平台兼容性差。
- 编辑区效果与真实发布效果不一致。

我们的策略是：把“发布稳定性”放在第一优先级，而不是把它当附加功能。

## 核心价值

| 维度 | 价值 |
| --- | --- |
| 发布一致性 | 编辑效果尽量贴近最终发布结果 |
| 跨平台兼容性 | 兼顾公众号、知识库、博客与办公文档链路 |
| 表达质量 | 主题、排版节奏、代码、公式可控 |
| 工程可持续 | 功能可验证、可复用、可持续迭代 |

## 能力亮点

### 1. 发布链路优化

- 复制前进行结构修正与样式补偿。
- 外链图片处理，降低粘贴失真风险。
- 公式链路优化，兼顾渲染质量与平台兼容。

### 2. 创作与排版效率

- 富文本智能粘贴为干净 Markdown。
- 主题系统支持快速切换与个性化微调。
- 支持手机 / 平板 / 桌面多端预览。
- 滚动同步与文档信息面板提升编辑效率。

### 3. 多格式交付能力

- 一键导出 HTML、PDF、DOC、DOCX。
- 支持发布到公众号、知识库、博客与办公文档场景。

## 适用人群

- 技术写作者与长文作者。
- 内容团队与运营团队。
- 高频输出的知识型创作者。
- 对发布品质有明确要求的产品/品牌团队。

## 为什么它是“产品”而不是“Demo”

- 有明确场景：内容发布与分发。
- 有明确指标：稳定性、可读性、交付效率。
- 有明确路径：输入 -> 排版 -> 预览 -> 复制/导出 -> 发布。
- 有持续演进：围绕真实痛点做工程化迭代。

## 快速开始

```bash
corepack enable
pnpm install
pnpm dev
```

## 构建命令

```bash
pnpm build
```

## 部署说明（GitHub Pages）

项目使用 `.github/workflows/deploy.yml` 自动部署。

1. 推送到 `main` 分支后自动触发构建。
2. 仓库设置中将 `Settings -> Pages -> Source` 设为 `GitHub Actions`。

## 最近进展（持续更新）

- 同步滚动稳定性修复（移动端/平板端）。
- LaTeX 渲染与发布兼容链路优化。
- data URI 图片资产化与源码区缩略预览。
- GitHub Pages 路径修复，解决线上空白页问题。
- 预览页顶栏新增 GitHub 主页与仓库入口。

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Yuzc-001/vibe-101-publish&type=Date)](https://www.star-history.com/#Yuzc-001/vibe-101-publish&Date)

## 协作与沟通

- 邮箱：`zxyu24@outlook.com`
- 宣传文案：见 [PROMO.md](./PROMO.md)
- 问题反馈：[Issues](https://github.com/Yuzc-001/vibe-101-publish/issues)

## 路线图（留白）

路线图会根据真实使用反馈持续调整，不在 README 里做过度承诺。  
如果你有想优先推进的方向，欢迎直接提 Issue 或邮件沟通。

## 致谢

本项目是围绕内容排版与发布工作流的独立新创作。  
演进过程中参考并继承了开源项目 [raphael-publish](https://github.com/liuxiaopai-ai/raphael-publish) 的基础能力，在此致谢。

## 许可与合规

- License: [MIT](./LICENSE)
- Third-party notices: [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)
- Asset notice: [ASSET_NOTICE.md](./ASSET_NOTICE.md)
