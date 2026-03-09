<p align="center">
  <img src="./favicon.svg" width="92" alt="vibe-101-publish logo" />
</p>

<h1 align="center">vibe-101-publish</h1>

<p align="center">
  面向公众号、知乎、Word 与社交卡片的 Markdown 排版与发布工作台
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
  <a href="./PROMO.md">宣传文案</a>
  ·
  <a href="./docs/implementation-plan.md">实施进展</a>
</p>

---

## 一句话定位

`vibe-101-publish` 不是“只在编辑区里好看”的 Markdown 工具。  
它已经进化成一个围绕真实发布链路设计的工作台，让一份稿子可以更稳地去公众号、知乎、Word 和社交平台。

## 现在它能做什么

### 1. 写作与排版

- 富文本智能粘贴为干净 Markdown
- 多套主题快速切换，并支持自定义主色与风格微调
- 手机 / 平板 / 桌面三种预览视图
- 编辑区与预览区滚动同步
- 排版信息面板帮助检查标题、字数、阅读时长与图片数量

### 2. 发布与复制

- `复制到公众号`：针对公众号链路做兼容处理与图片内联
- `复制到知乎`：走知乎专用剪贴板 HTML，兼顾公式、代码块、表格和链接
- `复制到 Word`：富文本粘贴后仍可继续编辑

### 3. 导出与交付

- 导出 `PDF`
- 导出 `HTML`
- 导出 `Word .docx`
- 导出 `Word .doc`

### 4. 卡片工作台

- 基于 `---` 将长文拆成多张卡片
- 支持 `公众号长图` 与 `社交卡片` 两种模式
- 社交卡片为 `440 x 586` 固定比例，更适合小红书 / 朋友圈 / 图文封面
- 支持封面卡、尾页卡、页码、当前卡预览、单张导出、全部导出和 ZIP 打包
- 社交卡片提供 6 套专属主题，强调气质、可读性和传播感

## 这次进化的重点

### 知乎复制链路重写

之前很多工具会把预览 DOM 直接塞进剪贴板，知乎往往并不会按预期识别。  
现在这里改成了 `Markdown -> 知乎专用 HTML` 的独立链路：

- 行内公式和块级公式转成知乎可识别结构
- 表格单元格中的公式、代码、链接单独处理
- 失败时提供 Markdown 导入兜底，而不是直接报错

### 卡片模式升级为卡片工作台

卡片功能已经不再是“把内容截图成 PNG”这么简单，而是完整的导出工作台：

- 先决定发布方式
- 再决定封面、尾页、页码和主题
- 最后逐张确认这张卡值不值得发出去

### 细节稳定性提升

- 表格渲染链修复，预览与复制结果更一致
- 图片坏链清理与空容器回收，避免卡片里出现大白块
- 长内容在社交卡片模式下会自动缩放，并提示“建议拆卡”
- 工具栏文案、分组与主次关系做了更符合习惯的整理

## 适合谁

- 高频写公众号、专栏、知识文章的人
- 需要把一份内容分发到多个平台的内容团队
- 既关心排版，也关心“粘贴之后别坏掉”的创作者
- 需要把长文切成社交图片卡片的品牌与运营团队

## 典型使用路径

1. 粘贴或写入 Markdown 内容
2. 选择主题并检查多端预览
3. 视需要开启卡片工作台，拆成适合发布的图片
4. 根据目标渠道执行：
   - 公众号：`复制到公众号`
   - 知乎：`复制到知乎`
   - Word：`复制到 Word` 或导出 Word
   - 社交平台：导出单张 PNG、全部 PNG 或 ZIP

## 快速开始

```bash
pnpm install
pnpm dev
```

## 构建

```bash
pnpm build
pnpm lint
```

## 文档

- 产品宣传文案：[`PROMO.md`](./PROMO.md)
- 当前实施进展：[`docs/implementation-plan.md`](./docs/implementation-plan.md)
- 第三方声明：[`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md)
- 资源说明：[`ASSET_NOTICE.md`](./ASSET_NOTICE.md)

## 最近进展

- 知乎复制链路重写，公式 / 代码 / 表格兼容明显提升
- Markdown 表格主渲染链修复，预览与复制表现更一致
- 卡片工作台支持公众号长图与社交卡片双模式
- 新增 6 套社交卡片主题、PNG 导出与 ZIP 打包
- 卡片工作台布局与预览交互持续优化

## 部署说明

项目使用 GitHub Actions 自动构建并发布到 GitHub Pages。

1. 推送到 `main` 分支后触发构建
2. 仓库 `Settings -> Pages -> Source` 选择 `GitHub Actions`

## 协作与沟通

- Issues：<https://github.com/Yuzc-001/vibe-101-publish/issues>
- 邮箱：`zxyu24@outlook.com`

## 致谢

本项目围绕内容排版与发布工作流独立演进。  
早期能力参考并继承了开源项目 [raphael-publish](https://github.com/liuxiaopai-ai/raphael-publish) 的部分基础能力，在此致谢。

## 许可与合规

- License: [MIT](./LICENSE)
- Third-party notices: [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)
- Asset notice: [ASSET_NOTICE.md](./ASSET_NOTICE.md)

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Yuzc-001/vibe-101-publish&type=Date)](https://www.star-history.com/#Yuzc-001/vibe-101-publish&Date)
