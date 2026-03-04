import html2canvas from 'html2canvas';
import katex from 'katex';
import { THEMES } from './themes';

const FORMULA_CAPTURE_MIN_SCALE = 2;

interface FormulaImageData {
    latex: string;
    dataUrl: string;
    width: number;
    height: number;
    isDisplay: boolean;
}

// Helper to convert images to Base64
async function getBase64Image(imgUrl: string): Promise<string> {
    try {
        if (imgUrl.startsWith('data:')) return imgUrl;

        const response = await fetch(imgUrl, { mode: 'cors', cache: 'default' });
        if (!response.ok) return imgUrl;

        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(imgUrl);
            reader.readAsDataURL(blob);
        });
    } catch {
        return imgUrl;
    }
}

function extractLatexFromKatexNode(node: Element): string {
    const annotationNode = node.querySelector('annotation[encoding="application/x-tex"]');
    if (annotationNode?.textContent?.trim()) return annotationNode.textContent.trim();
    return node.textContent?.trim() || '';
}

function normalizeLatexForRender(latex: string): string {
    return latex.replace(/\s+/g, ' ').trim();
}

function createFormulaFallbackNode(doc: Document, latex: string, isDisplay: boolean): HTMLElement {
    const fallback = doc.createElement(isDisplay ? 'p' : 'span');
    const formulaText = latex ? (isDisplay ? `$$${latex}$$` : `$${latex}$`) : '[公式]';
    fallback.textContent = formulaText;
    fallback.setAttribute(
        'style',
        isDisplay
            ? 'display:block; margin: 16px 0; padding: 8px 10px; border-radius: 8px; background: #f5f5f5; color: #333; font-family: Menlo, Consolas, monospace;'
            : 'display:inline; padding: 0 2px; border-radius: 4px; background: #f5f5f5; color: #333; font-family: Menlo, Consolas, monospace;'
    );
    return fallback;
}

async function renderFormulaNodeToPng(
    formulaNode: HTMLElement,
    latex: string,
    captureRoot: HTMLDivElement
): Promise<{ dataUrl: string; width: number; height: number } | null> {
    const isDisplay = formulaNode.classList.contains('katex-display');
    const normalizedLatex = normalizeLatexForRender(latex);
    const wrapper = document.createElement('div');
    wrapper.style.background = '#ffffff';
    wrapper.style.color = '#111111';
    wrapper.style.display = isDisplay ? 'block' : 'inline-block';
    wrapper.style.width = 'fit-content';
    wrapper.style.maxWidth = '100%';
    wrapper.style.padding = isDisplay ? '6px 0' : '2px 4px';
    wrapper.style.margin = '0';
    wrapper.style.lineHeight = '1.4';
    wrapper.style.whiteSpace = 'normal';
    wrapper.style.boxSizing = 'border-box';

    // Re-render from TeX source to avoid failures caused by theme-mutated inline styles in preview DOM.
    if (normalizedLatex) {
        try {
            wrapper.innerHTML = katex.renderToString(normalizedLatex, {
                throwOnError: false,
                strict: 'ignore',
                output: 'htmlAndMathml',
                displayMode: isDisplay
            });
        } catch {
            wrapper.appendChild(formulaNode.cloneNode(true));
        }
    } else {
        wrapper.appendChild(formulaNode.cloneNode(true));
    }

    captureRoot.appendChild(wrapper);

    try {
        await new Promise<void>((resolve) => {
            window.requestAnimationFrame(() => resolve());
        });

        const rect = wrapper.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return null;

        const scales = [Math.max(FORMULA_CAPTURE_MIN_SCALE, window.devicePixelRatio || 1), 1.5, 1];
        for (const scale of scales) {
            try {
                const canvas = await html2canvas(wrapper, {
                    backgroundColor: '#ffffff',
                    scale,
                    useCORS: true,
                    logging: false
                });
                return {
                    dataUrl: canvas.toDataURL('image/png'),
                    width: Math.max(1, Math.ceil(rect.width)),
                    height: Math.max(1, Math.ceil(rect.height))
                };
            } catch {
                // Retry with a lower scale when formula is long/complex.
            }
        }

        return null;
    } finally {
        if (wrapper.parentNode === captureRoot) {
            captureRoot.removeChild(wrapper);
        }
    }
}

async function captureFormulasFromRealDom(sourceElement: HTMLElement): Promise<FormulaImageData[]> {
    if (typeof window === 'undefined' || typeof document === 'undefined') return [];

    const formulaRoots = Array.from(sourceElement.querySelectorAll<HTMLElement>('.katex-display, span.katex')).filter((node) => {
        if (node.classList.contains('katex') && node.closest('.katex-display')) return false;
        return true;
    });
    if (formulaRoots.length === 0) return [];

    const captureRoot = document.createElement('div');
    captureRoot.style.position = 'fixed';
    captureRoot.style.left = '-20000px';
    captureRoot.style.top = '0';
    captureRoot.style.width = 'max-content';
    captureRoot.style.maxWidth = 'none';
    captureRoot.style.opacity = '0';
    captureRoot.style.pointerEvents = 'none';
    captureRoot.style.zIndex = '-1';
    captureRoot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(captureRoot);

    const results: FormulaImageData[] = [];

    try {
        for (const formulaNode of formulaRoots) {
            const latex = extractLatexFromKatexNode(formulaNode);
            const isDisplay = formulaNode.classList.contains('katex-display');
            const renderedFormula = await renderFormulaNodeToPng(formulaNode, latex, captureRoot);

            if (renderedFormula && latex) {
                results.push({
                    latex,
                    dataUrl: renderedFormula.dataUrl,
                    width: renderedFormula.width,
                    height: renderedFormula.height,
                    isDisplay
                });
            }
        }
    } finally {
        if (captureRoot.parentNode === document.body) {
            document.body.removeChild(captureRoot);
        }
    }

    return results;
}

async function convertKatexNodesToImages(section: HTMLElement, doc: Document, formulaImageMap?: FormulaImageData[]): Promise<void> {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const formulaRoots = Array.from(section.querySelectorAll<HTMLElement>('.katex-display, span.katex')).filter((node) => {
        if (node.classList.contains('katex') && node.closest('.katex-display')) return false;
        return true;
    });
    if (formulaRoots.length === 0) return;

    // 如果提供了映射表，直接使用映射表中的图片
    if (formulaImageMap && formulaImageMap.length > 0) {
        let mapIndex = 0;
        for (const formulaNode of formulaRoots) {
            const latex = extractLatexFromKatexNode(formulaNode);
            const isDisplay = formulaNode.classList.contains('katex-display');

            // 从映射表中查找匹配的公式图片
            const matchedImage = formulaImageMap.find(
                (item) => item.latex === latex && item.isDisplay === isDisplay
            );

            if (!matchedImage) {
                // 如果映射表中没有找到，尝试使用索引匹配（作为后备方案）
                if (mapIndex < formulaImageMap.length) {
                    const fallbackImage = formulaImageMap[mapIndex];
                    mapIndex++;

                    const img = doc.createElement('img');
                    img.setAttribute('src', fallbackImage.dataUrl);
                    img.setAttribute('alt', fallbackImage.latex ? `LaTeX: ${fallbackImage.latex}` : 'LaTeX formula');
                    img.setAttribute('width', String(fallbackImage.width));
                    img.setAttribute('height', String(fallbackImage.height));
                    if (fallbackImage.latex) {
                        img.setAttribute('title', fallbackImage.latex);
                    }
                    img.setAttribute(
                        'style',
                        fallbackImage.isDisplay
                            ? `display:block; width:${fallbackImage.width}px; max-width:100%; height:auto; margin: 18px auto;`
                            : `display:inline-block; width:${fallbackImage.width}px; max-width:100%; height:auto; margin: 0 2px; vertical-align: -0.12em;`
                    );
                    formulaNode.parentNode?.replaceChild(img, formulaNode);
                } else {
                    formulaNode.parentNode?.replaceChild(createFormulaFallbackNode(doc, latex, isDisplay), formulaNode);
                }
                continue;
            }

            const img = doc.createElement('img');
            img.setAttribute('src', matchedImage.dataUrl);
            img.setAttribute('alt', matchedImage.latex ? `LaTeX: ${matchedImage.latex}` : 'LaTeX formula');
            img.setAttribute('width', String(matchedImage.width));
            img.setAttribute('height', String(matchedImage.height));
            if (matchedImage.latex) {
                img.setAttribute('title', matchedImage.latex);
            }
            img.setAttribute(
                'style',
                matchedImage.isDisplay
                    ? `display:block; width:${matchedImage.width}px; max-width:100%; height:auto; margin: 18px auto;`
                    : `display:inline-block; width:${matchedImage.width}px; max-width:100%; height:auto; margin: 0 2px; vertical-align: -0.12em;`
            );
            formulaNode.parentNode?.replaceChild(img, formulaNode);
        }
        return;
    }

    // 如果没有映射表，使用原来的逻辑（作为后备方案）
    const captureRoot = document.createElement('div');
    captureRoot.style.position = 'fixed';
    captureRoot.style.left = '-20000px';
    captureRoot.style.top = '0';
    captureRoot.style.width = 'max-content';
    captureRoot.style.maxWidth = 'none';
    captureRoot.style.opacity = '0';
    captureRoot.style.pointerEvents = 'none';
    captureRoot.style.zIndex = '-1';
    captureRoot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(captureRoot);

    try {
        for (const formulaNode of formulaRoots) {
            const latex = extractLatexFromKatexNode(formulaNode);
            const isDisplay = formulaNode.classList.contains('katex-display');
            const renderedFormula = await renderFormulaNodeToPng(formulaNode, latex, captureRoot);

            if (!renderedFormula) {
                formulaNode.parentNode?.replaceChild(createFormulaFallbackNode(doc, latex, isDisplay), formulaNode);
                continue;
            }

            const img = doc.createElement('img');
            img.setAttribute('src', renderedFormula.dataUrl);
            img.setAttribute('alt', latex ? `LaTeX: ${latex}` : 'LaTeX formula');
            img.setAttribute('width', String(renderedFormula.width));
            img.setAttribute('height', String(renderedFormula.height));
            if (latex) {
                img.setAttribute('title', latex);
            }
            img.setAttribute(
                'style',
                isDisplay
                    ? `display:block; width:${renderedFormula.width}px; max-width:100%; height:auto; margin: 18px auto;`
                    : `display:inline-block; width:${renderedFormula.width}px; max-width:100%; height:auto; margin: 0 2px; vertical-align: -0.12em;`
            );
            formulaNode.parentNode?.replaceChild(img, formulaNode);
        }
    } finally {
        if (captureRoot.parentNode === document.body) {
            document.body.removeChild(captureRoot);
        }
    }
}

function unwrapTexmathWrappers(section: HTMLElement, doc: Document): void {
    const wrappers = Array.from(section.querySelectorAll('eq, eqn'));
    wrappers.forEach((wrapper) => {
        const fragment = doc.createDocumentFragment();
        while (wrapper.firstChild) {
            fragment.appendChild(wrapper.firstChild);
        }
        wrapper.parentNode?.replaceChild(fragment, wrapper);
    });
}

export async function makeWeChatCompatible(
    html: string,
    themeId: string,
    sourceElement?: HTMLElement
): Promise<string> {
    // 如果提供了真实的 DOM 元素，先从中提取公式并生成图片
    let formulaImageMap: FormulaImageData[] | undefined;
    if (sourceElement) {
        formulaImageMap = await captureFormulasFromRealDom(sourceElement);
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    const containerStyle = theme.styles.container || '';

    // 1. WeChat prefers <section> as the root wrapper for overall styling
    // If the root is a div, let's wrap or convert it to a section.
    const rootNodes = Array.from(doc.body.children);

    // Create new wrap section
    const section = doc.createElement('section');
    section.setAttribute('style', containerStyle);

    rootNodes.forEach(node => {
        // If the original html came from applyTheme it already has a root div
        // We strip it regardless of exact style string match to avoid double layers
        if (node.tagName === 'DIV' && rootNodes.length === 1) {
            Array.from(node.childNodes).forEach(child => section.appendChild(child));
        } else {
            section.appendChild(node);
        }
    });

    // 2. WeChat ignores flex in many scenarios. Convert image flex wrappers to table layout.
    const flexLikeNodes = section.querySelectorAll('div, p.image-grid');
    flexLikeNodes.forEach(node => {
        // Keep code block internals untouched.
        if (node.closest('pre, code')) return;

        const style = node.getAttribute('style') || '';
        const isFlexNode = style.includes('display: flex') || style.includes('display:flex');
        const isImageGrid = node.classList.contains('image-grid');
        if (!isFlexNode && !isImageGrid) return;

        const flexChildren = Array.from(node.children);
        if (flexChildren.every(child => child.tagName === 'IMG' || child.querySelector('img'))) {
            const table = doc.createElement('table');
            table.setAttribute('style', 'width: 100%; border-collapse: collapse; margin: 16px 0; border: none !important;');
            const tbody = doc.createElement('tbody');
            const tr = doc.createElement('tr');
            tr.setAttribute('style', 'border: none !important; background: transparent !important;');

            flexChildren.forEach(child => {
                const td = doc.createElement('td');
                td.setAttribute('style', 'padding: 0 4px; vertical-align: top; border: none !important; background: transparent !important;');
                td.appendChild(child);
                // Update child width to 100% since it's now bound by TD
                if (child.tagName === 'IMG') {
                    const currentStyle = child.getAttribute('style') || '';
                    child.setAttribute('style', currentStyle.replace(/width:\s*[^;]+;?/g, '') + ' width: 100% !important; display: block; margin: 0 auto;');
                }
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
            table.appendChild(tbody);
            node.parentNode?.replaceChild(table, node);
        } else if (isFlexNode) {
            // Non-image flex items just get stripped of flex.
            node.setAttribute('style', style.replace(/display:\s*flex;?/g, 'display: block;'));
        }
    });

    // 3. List Item Flattening
    // WeChat notoriously misrenders heavily nested <li> formatting, flattening the inner structure helps
    const listItems = section.querySelectorAll('li');
    listItems.forEach(li => {
        const hasBlockChildren = Array.from(li.children).some(child =>
            ['P', 'DIV', 'UL', 'OL', 'BLOCKQUOTE'].includes(child.tagName)
        );
        if (hasBlockChildren) {
            // We only want to clean inner tags if it's overly complex, 
            // but flattening everything might kill <strong> or <em>.
            // Let's just strip 'p' inside 'li' by replacing <p> with <span>
            const ps = li.querySelectorAll('p');
            ps.forEach(p => {
                const span = doc.createElement('span');
                span.innerHTML = p.innerHTML;
                const pStyle = p.getAttribute('style');
                if (pStyle) span.setAttribute('style', pStyle);
                p.parentNode?.replaceChild(span, p);
            });
        }
    });

    // 4. Render KaTeX formulas to PNG images for stable WeChat rendering.
    await convertKatexNodesToImages(section, doc, formulaImageMap);
    unwrapTexmathWrappers(section, doc);

    // 5. Force Inheritance
    // WeChat's editor aggressively overrides inherited fonts on <p>, <li>, etc.
    // So we manually distribute the container's font properties to all individual blocks.
    const fontMatch = containerStyle.match(/font-family:\s*([^;]+);/);
    const sizeMatch = containerStyle.match(/font-size:\s*([^;]+);/);
    const colorMatch = containerStyle.match(/color:\s*([^;]+);/);
    const lineHeightMatch = containerStyle.match(/line-height:\s*([^;]+);/);

    // We only enforce on specific text tags that WeChat likes to hijack
    const textNodes = section.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, blockquote, span');
    textNodes.forEach(node => {
        // Preserve code highlighting tokens inside code blocks.
        if (node.tagName === 'SPAN' && node.closest('pre, code')) return;

        let currentStyle = node.getAttribute('style') || '';

        if (fontMatch && !currentStyle.includes('font-family:')) {
            currentStyle += ` font-family: ${fontMatch[1]};`;
        }
        if (lineHeightMatch && !currentStyle.includes('line-height:')) {
            currentStyle += ` line-height: ${lineHeightMatch[1]};`;
        }
        // Add font-size if not present (only for standard text nodes so we don't shrink headings)
        if (sizeMatch && !currentStyle.includes('font-size:') && ['P', 'LI', 'BLOCKQUOTE', 'SPAN'].includes(node.tagName)) {
            currentStyle += ` font-size: ${sizeMatch[1]};`;
        }
        if (colorMatch && !currentStyle.includes('color:')) {
            currentStyle += ` color: ${colorMatch[1]};`;
        }

        node.setAttribute('style', currentStyle.trim());
    });

    // Keep CJK punctuation attached to preceding inline emphasis in WeChat.
    // Example: <strong>标题</strong>：说明 -> <strong>标题：</strong>说明
    const inlineNodes = section.querySelectorAll('strong, b, em, span, a, code');
    inlineNodes.forEach(node => {
        const next = node.nextSibling;
        if (!next || next.nodeType !== Node.TEXT_NODE) return;
        const text = next.textContent || '';
        const match = text.match(/^\s*([：；，。！？、:])(.*)$/s);
        if (!match) return;

        const punct = match[1];
        const rest = match[2] || '';
        node.appendChild(doc.createTextNode(punct));
        if (rest) {
            next.textContent = rest;
        } else {
            next.parentNode?.removeChild(next);
        }
    });

    // 6. Convert all images to Base64 for safe WeChat pasting
    const imgs = Array.from(section.querySelectorAll('img'));
    await Promise.all(imgs.map(async img => {
        const src = img.getAttribute('src');
        if (src && !src.startsWith('data:')) {
            const base64 = await getBase64Image(src);
            img.setAttribute('src', base64);
        }
    }));

    doc.body.innerHTML = '';
    doc.body.appendChild(section);

    // Prevent WeChat from breaking lines between inline emphasis and leading CJK punctuation.
    // Example: </strong>： should stay on the same line.
    let outputHtml = doc.body.innerHTML;
    outputHtml = outputHtml.replace(/(<\/(?:strong|b|em|span|a|code)>)\s*([：；，。！？、])/g, '$1\u2060$2');

    return outputHtml;
}
