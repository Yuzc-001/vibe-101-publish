# Third-Party Notices

本文件用于记录本项目主要第三方依赖及其许可证信息，便于发布时审阅。
许可证信息来自对应依赖包的 `package.json`（`node_modules/<pkg>/package.json`）。

## 主要运行时依赖

| 依赖 | 版本（当前安装） | 许可证 | 项目主页 |
|---|---:|---|---|
| react | 18.3.1 | MIT | https://reactjs.org/ |
| react-dom | 18.3.1 | MIT | https://reactjs.org/ |
| markdown-it | 14.1.1 | MIT | https://github.com/markdown-it/markdown-it |
| turndown | 7.2.2 | MIT | https://github.com/mixmark-io/turndown |
| turndown-plugin-gfm | 1.0.2 | MIT | https://github.com/domchristie/turndown-plugin-gfm |
| highlight.js | 11.11.1 | BSD-3-Clause | https://highlightjs.org/ |
| framer-motion | 11.18.2 | MIT | https://github.com/motiondivision/motion |
| html2pdf.js | 0.14.0 | MIT | https://ekoopmans.github.io/html2pdf.js/ |
| lucide-react | 0.460.0 | ISC | https://lucide.dev/ |

## 主要开发与构建依赖

| 依赖 | 版本（当前安装） | 许可证 | 项目主页 |
|---|---:|---|---|
| vite | 5.4.21 | MIT | https://vite.dev |
| @vitejs/plugin-react | 4.7.0 | MIT | https://github.com/vitejs/vite-plugin-react |
| typescript | 5.6.3 | Apache-2.0 | https://www.typescriptlang.org/ |
| tailwindcss | 3.4.19 | MIT | https://tailwindcss.com |
| postcss | 8.5.6 | MIT | https://postcss.org/ |
| autoprefixer | 10.4.27 | MIT | https://github.com/postcss/autoprefixer |
| eslint | 9.39.3 | MIT | https://eslint.org |
| @eslint/js | 9.39.3 | MIT | https://eslint.org |
| typescript-eslint | 8.56.1 | MIT | https://typescript-eslint.io/packages/typescript-eslint |

## 说明

- 本清单聚焦“主要依赖”，不代表完整的传递依赖列表。
- 发布时请同时保留根目录 [LICENSE](./LICENSE)。
- 如需完整依赖树许可证，建议在 CI 中增加自动化许可证扫描。
