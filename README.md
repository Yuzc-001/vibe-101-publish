<p align="center">
  <img src="./favicon.svg" width="92" alt="vibe-101-publish logo" />
</p>

<h1 align="center">vibe-101-publish</h1>

<p align="center">
  面向公众号创作者的 Markdown 排版与发布工作台
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

## 为什么是这个项目

很多排版工具在编辑区看起来不错，但发布到公众号后会出现样式漂移、结构错位、公式异常。  
`vibe-101-publish` 的定位很直接：把“最后一公里发布质量”做成产品核心能力。

## 快速入口

- 在线预览：<https://yuzc-001.github.io/vibe-101-publish/>
- 仓库地址：<https://github.com/Yuzc-001/vibe-101-publish>
- 团队主页：<https://github.com/Yuzc-001>

提示：
- 若首次访问预览出现空白，请强制刷新 `Ctrl + F5`。

## 产品方向

我们不把 README 写成功能“封箱清单”，而是保持产品演进空间。  
当前聚焦方向如下：

- 发布一致性：编辑区与最终发布效果尽量一致。
- 微信兼容：面向公众号复制链路持续优化。
- 公式体验：兼顾渲染质量与平台兼容性。
- 多端体验：手机 / 平板 / 桌面预览协同。
- 交付能力：围绕实际发布场景提供稳定导出链路。

## 设计原则

- 发布一致性优先：编辑体验服务最终发布效果。
- 微信兼容优先：复制链路稳定优先。
- 细节可控优先：文字节奏、代码样式、公式展示都可验证。
- 可持续迭代优先：能力可复用、可维护、可演进。

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
- LaTeX 渲染与公众号兼容链路优化。
- data URI 图片资产化与源码区缩略预览。
- GitHub Pages 路径修复，解决线上空白页问题。
- 预览页顶栏新增 GitHub 主页与仓库入口。

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Yuzc-001/vibe-101-publish&type=Date)](https://www.star-history.com/#Yuzc-001/vibe-101-publish&Date)

## 协作与沟通

- 合作联系：`zxyu24@outlook.com`
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
