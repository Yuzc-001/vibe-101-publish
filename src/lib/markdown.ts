import MarkdownIt from 'markdown-it';
import katex from 'katex';
import texmath from 'markdown-it-texmath';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import css from 'highlight.js/lib/languages/css';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import markdownLang from 'highlight.js/lib/languages/markdown';
import python from 'highlight.js/lib/languages/python';
import rust from 'highlight.js/lib/languages/rust';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';
import { THEMES, type ThemeCustomConfig } from './themes';
import { resolveThemeStyles } from './themes/customize';

hljs.registerLanguage('bash', bash);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('css', css);
hljs.registerLanguage('go', go);
hljs.registerLanguage('java', java);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('markdown', markdownLang);
hljs.registerLanguage('python', python);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('md', markdownLang);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('yml', yaml);

export const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: false,
    highlight: function (str, lang) {
        let codeContent = '';
        if (lang && hljs.getLanguage(lang)) {
            try {
                codeContent = hljs.highlight(str, { language: lang }).value;
            } catch {
                codeContent = md.utils.escapeHtml(str);
            }
        } else {
            codeContent = md.utils.escapeHtml(str);
        }

        const dots = '<div style="margin-bottom: 12px; white-space: nowrap;"><span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #ff5f56; margin-right: 6px;"></span><span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #ffbd2e; margin-right: 6px;"></span><span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #27c93f;"></span></div>';

        return `<pre>${dots}<code class="hljs">${codeContent}</code></pre>`;
    }
});

md.use(texmath, {
    engine: katex,
    delimiters: 'dollars',
    katexOptions: {
        throwOnError: false,
        strict: 'ignore',
        output: 'htmlAndMathml'
    }
});

function looksLikeInlineMath(content: string): boolean {
    if (!content) return false;

    // Avoid treating pure currency/number chunks as formulas.
    if (/^[+-]?\d+(?:[.,]\d+)?(?:[%a-zA-Z]{0,4})?$/.test(content)) return false;

    return /\\|[_^{}]|[=+\-*/<>]/.test(content);
}

function normalizeInlineMathDelimiters(content: string): string {
    let output = '';
    let index = 0;

    const isEscapedDollar = (input: string, position: number): boolean => {
        if (input[position] !== '$') return false;
        let slashCount = 0;
        for (let cursor = position - 1; cursor >= 0 && input[cursor] === '\\'; cursor -= 1) {
            slashCount += 1;
        }
        return slashCount % 2 === 1;
    };

    while (index < content.length) {
        const currentChar = content[index];
        const isSingleDollar =
            currentChar === '$' &&
            content[index + 1] !== '$' &&
            content[index - 1] !== '$' &&
            !isEscapedDollar(content, index);

        if (!isSingleDollar) {
            output += currentChar;
            index += 1;
            continue;
        }

        const start = index;
        let end = index + 1;
        let matched = false;
        while (end < content.length) {
            const atSingleDollar =
                content[end] === '$' &&
                content[end + 1] !== '$' &&
                content[end - 1] !== '$' &&
                !isEscapedDollar(content, end);
            if (atSingleDollar) {
                matched = true;
                break;
            }
            end += 1;
        }

        if (!matched) {
            output += currentChar;
            index += 1;
            continue;
        }

        const innerRaw = content.slice(start + 1, end);
        const trimmed = innerRaw.trim();
        const hasHardParagraphBreak = /\r?\n\s*\r?\n/.test(innerRaw);
        if (!trimmed || hasHardParagraphBreak || !looksLikeInlineMath(trimmed)) {
            output += content.slice(start, end + 1);
            index = end + 1;
            continue;
        }

        const normalizedInner = normalizeEscapedLatexCommands(trimmed).replace(/\s*\r?\n\s*/g, ' ');
        output += `$${normalizedInner}$`;
        index = end + 1;
    }

    return output;
}

function normalizeEscapedLatexCommands(latexRaw: string): string {
    return String(latexRaw || '')
        .replace(/\\\\(?=[A-Za-z])/g, '\\')
        .replace(/\\_/g, '_')
        .replace(/\\\^/g, '^');
}

function extractInlineMathSegment(text: string): string | null {
    const source = String(text || '');
    const match = source.match(/\$([^$]+)\$/);
    if (!match) return null;
    return match[1]?.trim() || null;
}

function normalizeBlockMathDelimiters(content: string): string {
    return content.replace(/\$\$([\s\S]*?)\$\$/g, (_fullMatch: string, innerRaw: string) => {
        const inner = normalizeEscapedLatexCommands(String(innerRaw || ''));
        return `$$${inner}$$`;
    });
}

function repairDetachedImageTitles(content: string): string {
    // Recover malformed image markdown generated by legacy logic:
    // ![alt](src) "title"  ->  ![alt](src "title")
    return content.replace(
        /!\[([^\]]*)\]\(([^)]+)\)\s+"([^"]*)"/g,
        (_fullMatch: string, altRaw: string, srcRaw: string, titleRaw: string) => {
            const alt = String(altRaw || '');
            const src = String(srcRaw || '').trim();
            const title = String(titleRaw || '')
                .replace(/\s*\r?\n\s*/g, ' ')
                .trim()
                .replace(/"/g, '\\"');
            if (!src) return _fullMatch;
            return `![${alt}](${src}${title ? ` "${title}"` : ''})`;
        }
    );
}

function restoreLatexImagesToMath(content: string): string {
    // Convert formula image markdown back to TeX, including legacy pasted forms.
    return content.replace(
        /!\[([^\]]*)\]\(([^)]*)\)/g,
        (_fullMatch: string, altRaw: string, srcAndTitleRaw: string) => {
            const alt = String(altRaw || '').trim();
            const srcAndTitle = String(srcAndTitleRaw || '').trim();

            const parsed = srcAndTitle.match(/^(\S+)(?:\s+"([^"]*)")?\s*$/);
            if (!parsed) return _fullMatch;

            const src = String(parsed[1] || '').trim();
            const title = String(parsed[2] || '').trim();

            const titleNormalized = normalizeEscapedLatexCommands(title);
            const altWithoutPrefix = alt.replace(/^LaTeX:\s*/i, '').trim();
            const altNormalized = normalizeEscapedLatexCommands(altWithoutPrefix);

            let latexRaw = '';
            if (titleNormalized && looksLikeInlineMath(titleNormalized)) {
                latexRaw = titleNormalized;
            } else if (/^LaTeX:/i.test(alt) && altNormalized && looksLikeInlineMath(altNormalized)) {
                latexRaw = altNormalized;
            } else if (src.startsWith('data:image/') || src.startsWith('vibe-asset://')) {
                const inlineMath = extractInlineMathSegment(alt);
                if (inlineMath) {
                    const inlineMathNormalized = normalizeEscapedLatexCommands(inlineMath);
                    if (inlineMathNormalized && looksLikeInlineMath(inlineMathNormalized)) {
                        latexRaw = inlineMathNormalized;
                    }
                }
            }

            if (!latexRaw) return _fullMatch;

            let titleLatex = '';
            if (title && looksLikeInlineMath(titleNormalized)) {
                titleLatex = titleNormalized;
            }

            const normalizedLatex = normalizeEscapedLatexCommands(latexRaw).replace(/\s*\r?\n\s*/g, ' ').trim();
            if (!normalizedLatex) return _fullMatch;

            const preferDisplay = /\r?\n/.test(alt) || /\r?\n/.test(titleLatex) || normalizedLatex.length >= 92;
            if (preferDisplay) {
                return `\n\n$$\n${normalizedLatex}\n$$\n\n`;
            }
            return `$${normalizedLatex}$`;
        }
    );
}

function removeUnrecoverableDataImagePlaceholders(content: string): string {
    // Old buggy conversions may contain data:image/...,... placeholders that cannot render anywhere.
    // Remove them to prevent broken-image alt lines from showing up in WeChat editor.
    return content.replace(
        /!\[[^\]]*\]\((data:image\/[a-zA-Z0-9.+-]+;base64,\.\.\.)(?:\s+"[^"]*")?\)/g,
        ''
    );
}

// Avoid bold fragmentation when pasting from certain apps
export function preprocessMarkdown(content: string) {
    content = repairDetachedImageTitles(content);
    content = restoreLatexImagesToMath(content);
    content = removeUnrecoverableDataImagePlaceholders(content);
    content = normalizeBlockMathDelimiters(content);

    // Normalize "$ ... $" to "$...$" for inline formulas.
    // markdown-it-texmath does not parse inline math when delimiters keep surrounding spaces/newlines.
    content = normalizeInlineMathDelimiters(content);

    content = content.replace(/^[ ]{0,3}(\*[ ]*\*[ ]*\*[* ]*)[ \t]*$/gm, '***');
    content = content.replace(/^[ ]{0,3}(-[ ]*-[ ]*-[- ]*)[ \t]*$/gm, '---');
    content = content.replace(/^[ ]{0,3}(_[ ]*_[ ]*_[_ ]*)[ \t]*$/gm, '___');
    content = content.replace(/\*\*\s+\*\*/g, ' ');
    content = content.replace(/\*{4,}/g, '');
    content = content.replace(/\*\*([）」』》〉】〕〗］｝"'。，、；？！])/g, '**\u200B$1');
    content = content.replace(/([（「『《〈【〔〖［｛"'])\*\*/g, '$1\u200B**');
    return content;
}

export function applyTheme(html: string, themeId: string, customTheme?: ThemeCustomConfig) {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    const style = resolveThemeStyles(theme, customTheme);

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Specific inline overrides to prevent headings from uninheriting styles
    const headingInlineOverrides: Record<string, string> = {
        strong: 'font-weight: 700; color: inherit !important; background-color: transparent !important;',
        em: 'font-style: italic; color: inherit !important; background-color: transparent !important;',
        a: 'color: inherit !important; text-decoration: none !important; border-bottom: 1px solid currentColor !important; background-color: transparent !important;',
        code: 'color: inherit !important; background-color: transparent !important; border: none !important; padding: 0 !important;',
    };


    const getSingleImageNode = (p: HTMLParagraphElement): HTMLElement | null => {
        const children = Array.from(p.childNodes).filter(n =>
            !(n.nodeType === Node.TEXT_NODE && !(n.textContent || '').trim()) &&
            !(n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName === 'BR')
        );
        if (children.length !== 1) return null;
        const onlyChild = children[0];
        if (onlyChild.nodeName === 'IMG') return onlyChild as HTMLElement;
        if (onlyChild.nodeName === 'A' && onlyChild.childNodes.length === 1 && onlyChild.childNodes[0].nodeName === 'IMG') {
            return onlyChild as HTMLElement;
        }
        return null;
    };

    // Merge consecutive single-image paragraphs (same parent) into pair-wise side-by-side grids.
    const paragraphSnapshot = Array.from(doc.querySelectorAll('p'));
    for (const paragraph of paragraphSnapshot) {
        if (!paragraph.isConnected) continue;
        const parent = paragraph.parentElement;
        if (!parent) continue;
        if (!getSingleImageNode(paragraph)) continue;

        const run: HTMLParagraphElement[] = [paragraph];
        let cursor = paragraph.nextElementSibling;
        while (cursor && cursor.tagName === 'P') {
            const p = cursor as HTMLParagraphElement;
            if (!getSingleImageNode(p)) break;
            run.push(p);
            cursor = p.nextElementSibling;
        }

        if (run.length < 2) continue;

        // Pair images two by two, leaving an odd tail image as-is.
        for (let i = 0; i + 1 < run.length; i += 2) {
            const first = run[i];
            const second = run[i + 1];
            if (!first.isConnected || !second.isConnected) continue;

            const firstImageNode = getSingleImageNode(first);
            const secondImageNode = getSingleImageNode(second);
            if (!firstImageNode || !secondImageNode) continue;

            const gridParagraph = doc.createElement('p');
            gridParagraph.classList.add('image-grid');
            gridParagraph.setAttribute('style', 'display: flex; justify-content: center; gap: 8px; margin: 24px 0; align-items: flex-start;');
            gridParagraph.appendChild(firstImageNode);
            gridParagraph.appendChild(secondImageNode);

            first.before(gridParagraph);
            first.remove();
            second.remove();
        }
    }

    // Process image grids
    const paragraphs = doc.querySelectorAll('p');
    paragraphs.forEach(p => {
        const children = Array.from(p.childNodes).filter(n => !(n.nodeType === Node.TEXT_NODE && !(n.textContent || '').trim()));
        const isAllImages = children.length > 1 && children.every(n => n.nodeName === 'IMG' || (n.nodeName === 'A' && n.childNodes.length === 1 && n.childNodes[0].nodeName === 'IMG'));

        if (isAllImages) {
            p.classList.add('image-grid');
            p.setAttribute('style', 'display: flex; justify-content: center; gap: 8px; margin: 24px 0; align-items: flex-start;');

            p.querySelectorAll('img').forEach(img => {
                img.classList.add('grid-img');
                const w = 100 / children.length;
                img.setAttribute('style', `width: calc(${w}% - ${8 * (children.length - 1) / children.length}px); margin: 0; border-radius: 8px; height: auto;`);
            });
        }
    });

    Object.keys(style).forEach((selector) => {

        if (selector === 'pre code') return;
        const elements = doc.querySelectorAll(selector);
        elements.forEach(el => {
            if (selector === 'code' && el.parentElement?.tagName === 'PRE') return;
            if (el.tagName === 'IMG' && el.closest('.image-grid')) return;
            const currentStyle = el.getAttribute('style') || '';
            el.setAttribute('style', currentStyle + '; ' + style[selector as keyof typeof style]);
        });
    });

    // Tailwind preflight removes native list markers. Restore explicit markers.
    doc.querySelectorAll('ul').forEach(ul => {
        const currentStyle = ul.getAttribute('style') || '';
        ul.setAttribute('style', `${currentStyle}; list-style-type: disc !important; list-style-position: outside;`);
    });
    doc.querySelectorAll('ul ul').forEach(ul => {
        const currentStyle = ul.getAttribute('style') || '';
        ul.setAttribute('style', `${currentStyle}; list-style-type: circle !important;`);
    });
    doc.querySelectorAll('ul ul ul').forEach(ul => {
        const currentStyle = ul.getAttribute('style') || '';
        ul.setAttribute('style', `${currentStyle}; list-style-type: square !important;`);
    });
    doc.querySelectorAll('ol').forEach(ol => {
        const currentStyle = ol.getAttribute('style') || '';
        ol.setAttribute('style', `${currentStyle}; list-style-type: decimal !important; list-style-position: outside;`);
    });

    const hljsLight: Record<string, string> = {
        'hljs-comment': 'color: #6a737d; font-style: italic;',
        'hljs-quote': 'color: #6a737d; font-style: italic;',
        'hljs-keyword': 'color: #d73a49; font-weight: 600;',
        'hljs-selector-tag': 'color: #d73a49; font-weight: 600;',
        'hljs-string': 'color: #032f62;',
        'hljs-title': 'color: #6f42c1; font-weight: 600;',
        'hljs-section': 'color: #6f42c1; font-weight: 600;',
        'hljs-type': 'color: #005cc5; font-weight: 600;',
        'hljs-number': 'color: #005cc5;',
        'hljs-literal': 'color: #005cc5;',
        'hljs-built_in': 'color: #005cc5;',
        'hljs-variable': 'color: #e36209;',
        'hljs-template-variable': 'color: #e36209;',
        'hljs-tag': 'color: #22863a;',
        'hljs-name': 'color: #22863a;',
        'hljs-attr': 'color: #6f42c1;',
    };

    const codeTokens = doc.querySelectorAll('.hljs span');
    codeTokens.forEach(span => {
        let inlineStyle = span.getAttribute('style') || '';
        if (inlineStyle && !inlineStyle.endsWith(';')) inlineStyle += '; ';
        span.classList.forEach(cls => {
            if (hljsLight[cls]) {
                inlineStyle += hljsLight[cls] + '; ';
            }
        });
        if (inlineStyle) {
            span.setAttribute('style', inlineStyle);
        }
    });

    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
        Object.keys(headingInlineOverrides).forEach(tag => {
            heading.querySelectorAll(tag).forEach(node => {
                const override = headingInlineOverrides[tag];
                node.setAttribute('style', `${node.getAttribute('style') || ''}; ${override}`);
            });
        });
    });

    // Unify image look-and-feel across themes.
    doc.querySelectorAll('img').forEach(img => {
        const inGrid = Boolean(img.closest('.image-grid'));
        const currentStyle = img.getAttribute('style') || '';
        const appendedStyle = inGrid
            ? 'display:block; max-width:100%; height:auto; margin:0 !important; padding:8px !important; border-radius:14px !important; box-sizing:border-box; box-shadow:0 12px 28px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.12); border:1px solid rgba(255,255,255,0.75);'
            : 'display:block; width:100%; max-width:100%; height:auto; margin:30px auto !important; padding:8px !important; border-radius:14px !important; box-sizing:border-box; box-shadow:0 16px 34px rgba(15,23,42,0.22), 0 4px 10px rgba(15,23,42,0.12); border:1px solid rgba(15,23,42,0.12);';
        img.setAttribute('style', `${currentStyle}; ${appendedStyle}`);
    });

    const container = doc.createElement('div');
    container.setAttribute('style', style.container);
    container.innerHTML = doc.body.innerHTML;

    return container.outerHTML;
}
