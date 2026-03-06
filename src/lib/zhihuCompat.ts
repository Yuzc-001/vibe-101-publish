import MarkdownIt from 'markdown-it';

const zhihuClipboardRenderer = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: false,
    highlight(code: string) {
        return `<pre><code>${escapeHtml(code)}</code></pre>`;
    }
});

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeText(value: string): string {
    return String(value || '')
        .replace(/\u00a0/g, ' ')
        .replace(/\r\n/g, '\n');
}

function appendStyle(existing: string | null, addition: string): string {
    const base = String(existing || '').trim();
    if (!base) return addition;
    return `${base}${base.endsWith(';') ? '' : ';'} ${addition}`;
}

function stripFrontmatter(markdown: string): string {
    if (!markdown.startsWith('---\n')) return markdown;
    const end = markdown.indexOf('\n---\n', 4);
    if (end === -1) return markdown;
    return markdown.slice(end + 5);
}

function toZhihuEquationTag(latexRaw: string): string {
    const latex = String(latexRaw || '').trim();
    const encoded = encodeURIComponent(latex);
    return `<img src="https://www.zhihu.com/equation?tex=${encoded}" alt="${escapeHtml(latex)}" class="ee_img tr_noresize" eeimg="1" data-eeimg="1">`;
}

function convertMathOutsideCode(content: string): string {
    let output = content;

    output = output.replace(/\$\$([\s\S]*?)\$\$/g, (_match, body: string) => {
        const latex = body.trim();
        if (!latex) return '';
        return `\n\n${toZhihuEquationTag(`${latex}\\\\`)}\n\n`;
    });

    output = output.replace(/(?<!\\)\$([^\n$]+?)\$/g, (_match, body: string) => {
        const latex = body.trim();
        if (!latex) return _match;
        return toZhihuEquationTag(latex);
    });

    return output;
}

function splitByCodeFences(markdown: string): string[] {
    return markdown.split(/(```[\s\S]*?```)/g);
}

function parseTableRow(raw: string): string[] {
    let line = raw.trim();
    if (line.startsWith('|')) line = line.slice(1);
    if (line.endsWith('|')) line = line.slice(0, -1);
    return line.split('|').map((cell) => cell.trim());
}

function isTableSeparator(raw: string): boolean {
    const line = raw.trim();
    if (!line.includes('|')) return false;
    const normalized = line.replace(/\|/g, '').replace(/:/g, '').replace(/-/g, '').replace(/\s/g, '');
    return normalized.length === 0 && line.includes('-');
}

function convertCellInlineMarkdown(cell: string): string {
    return zhihuClipboardRenderer.renderInline(cell.trim());
}

function buildHtmlTable(header: string[], rows: string[][]): string {
    const head = `<thead><tr>${header.map((cell) => `<th>${convertCellInlineMarkdown(cell)}</th>`).join('')}</tr></thead>`;
    const bodyRows = rows
        .map((row) => `<tr>${row.map((cell) => `<td>${convertCellInlineMarkdown(cell)}</td>`).join('')}</tr>`)
        .join('');
    const body = `<tbody>${bodyRows}</tbody>`;
    return `<table>\n${head}\n${body}\n</table>`;
}

function convertMarkdownTables(content: string): string {
    const lines = content.split('\n');
    const output: string[] = [];

    let index = 0;
    while (index < lines.length) {
        const line = lines[index];
        const next = lines[index + 1] ?? '';
        const looksLikeHeader = line.includes('|');
        const looksLikeSeparator = isTableSeparator(next);

        if (!looksLikeHeader || !looksLikeSeparator) {
            output.push(line);
            index += 1;
            continue;
        }

        const header = parseTableRow(line);
        const rows: string[][] = [];
        index += 2;

        while (index < lines.length) {
            const rowLine = lines[index];
            if (!rowLine.includes('|') || !rowLine.trim()) break;
            rows.push(parseTableRow(rowLine));
            index += 1;
        }

        output.push(buildHtmlTable(header, rows));
    }

    return output.join('\n');
}

export function makeZhihuImportMarkdown(markdown: string): string {
    let output = normalizeText(markdown);
    output = stripFrontmatter(output);

    const segments = splitByCodeFences(output).map((segment) => {
        if (segment.startsWith('```')) return segment;
        const withMath = convertMathOutsideCode(segment);
        return convertMarkdownTables(withMath);
    });

    output = segments.join('');
    output = output.replace(/^[ \t]*-{3,}[ \t]*$/gm, '---');
    output = output.replace(/\s+$/g, '').trimEnd();
    return `${output}\n`;
}

function styleParagraphs(root: HTMLElement): void {
    Array.from(root.querySelectorAll('p')).forEach((paragraph) => {
        paragraph.setAttribute('style', appendStyle(paragraph.getAttribute('style'), 'margin:1em 0; color:#1f2329; font-size:15px; line-height:1.75;'));
    });
}

function styleHeadings(root: HTMLElement): void {
    const headingStyles: Record<string, string> = {
        H1: 'margin:1.4em 0 0.8em; color:#1f2329; font-size:28px; line-height:1.3; font-weight:700;',
        H2: 'margin:1.3em 0 0.75em; color:#1f2329; font-size:24px; line-height:1.35; font-weight:700;',
        H3: 'margin:1.2em 0 0.7em; color:#1f2329; font-size:20px; line-height:1.4; font-weight:700;',
        H4: 'margin:1.1em 0 0.65em; color:#1f2329; font-size:18px; line-height:1.45; font-weight:700;',
        H5: 'margin:1em 0 0.6em; color:#1f2329; font-size:16px; line-height:1.5; font-weight:700;',
        H6: 'margin:1em 0 0.55em; color:#1f2329; font-size:15px; line-height:1.55; font-weight:700;'
    };

    Array.from(root.querySelectorAll('h1, h2, h3, h4, h5, h6')).forEach((heading) => {
        heading.setAttribute('style', headingStyles[heading.tagName]);
    });
}

function styleLists(root: HTMLElement): void {
    Array.from(root.querySelectorAll('ul')).forEach((list) => {
        list.setAttribute('style', appendStyle(list.getAttribute('style'), 'margin:1em 0; padding-left:1.5em; list-style:disc; color:#1f2329; font-size:15px; line-height:1.75;'));
    });

    Array.from(root.querySelectorAll('ol')).forEach((list) => {
        list.setAttribute('style', appendStyle(list.getAttribute('style'), 'margin:1em 0; padding-left:1.6em; list-style:decimal; color:#1f2329; font-size:15px; line-height:1.75;'));
    });

    Array.from(root.querySelectorAll('li')).forEach((item) => {
        item.setAttribute('style', appendStyle(item.getAttribute('style'), 'margin:0.38em 0;'));
    });
}

function styleBlockquotes(root: HTMLElement): void {
    Array.from(root.querySelectorAll('blockquote')).forEach((blockquote) => {
        blockquote.setAttribute(
            'style',
            'margin:1.25em 0; padding:0.9em 1em; border-left:4px solid #1d7dfa; background:#f7fbff; color:#445066; border-radius:0 10px 10px 0;'
        );
    });
}

function styleCode(root: HTMLElement): void {
    Array.from(root.querySelectorAll('pre')).forEach((preNode) => {
        preNode.setAttribute(
            'style',
            'margin:1.25em 0; padding:14px 16px; border-radius:12px; background:#0f172a; color:#e5eefc; font-family:Menlo,Consolas,Monaco,monospace; font-size:13px; line-height:1.7; white-space:pre-wrap; word-break:break-word; overflow-wrap:anywhere;'
        );
    });

    Array.from(root.querySelectorAll('pre code')).forEach((codeNode) => {
        codeNode.setAttribute('style', 'font-family:inherit; font-size:inherit; line-height:inherit; white-space:inherit;');
    });

    Array.from(root.querySelectorAll('p code, li code, blockquote code, td code, th code')).forEach((codeNode) => {
        if (codeNode.closest('pre')) return;
        codeNode.setAttribute(
            'style',
            'display:inline-block; padding:0.08em 0.38em; border-radius:6px; background:#f4f7fb; color:#bf2c66; font-family:Menlo,Consolas,Monaco,monospace; font-size:0.92em;'
        );
    });
}

function styleLinks(root: HTMLElement): void {
    Array.from(root.querySelectorAll('a')).forEach((anchor) => {
        const href = (anchor.getAttribute('href') || '').trim();
        if (!href || /^javascript:/i.test(href)) {
            anchor.removeAttribute('href');
        }
        anchor.removeAttribute('target');
        anchor.setAttribute('rel', 'noopener noreferrer');
        anchor.setAttribute(
            'style',
            'color:#175199; text-decoration:none; border-bottom:1px solid rgba(23,81,153,0.28);'
        );
    });
}

function styleTables(root: HTMLElement): void {
    Array.from(root.querySelectorAll('table')).forEach((table) => {
        table.setAttribute(
            'style',
            'width:100%; margin:1.2em 0; border-collapse:collapse; table-layout:auto; font-size:14px; line-height:1.7;'
        );
    });

    Array.from(root.querySelectorAll('th')).forEach((cell) => {
        cell.setAttribute(
            'style',
            'padding:10px 12px; border:1px solid #d9e2f0; background:#f6f9fc; color:#22324d; font-weight:700; text-align:left;'
        );
    });

    Array.from(root.querySelectorAll('td')).forEach((cell) => {
        cell.setAttribute(
            'style',
            'padding:10px 12px; border:1px solid #d9e2f0; background:#ffffff; color:#1f2329; text-align:left; vertical-align:top;'
        );
    });
}

function styleHorizontalRules(root: HTMLElement): void {
    Array.from(root.querySelectorAll('hr')).forEach((rule) => {
        rule.setAttribute('style', 'margin:1.4em 0; border:none; border-top:1px solid #e5eaf3;');
    });
}

function hasOnlyMeaningfulChild(parent: Element, target: Element): boolean {
    const children = Array.from(parent.childNodes).filter((node) => {
        if (node === target) return true;
        if (node.nodeType === Node.TEXT_NODE) return Boolean(node.textContent?.trim());
        if (node.nodeType === Node.ELEMENT_NODE) return (node as Element).tagName !== 'BR';
        return false;
    });
    return children.length === 1 && children[0] === target;
}

function styleImages(root: HTMLElement): void {
    Array.from(root.querySelectorAll('img')).forEach((image) => {
        const src = String(image.getAttribute('src') || '').trim();
        if (!src || /^vibe-asset:\/\//i.test(src) || /^blob:/i.test(src) || /^file:/i.test(src)) {
            image.remove();
            return;
        }

        if (image.getAttribute('eeimg') === '1') {
            const alt = String(image.getAttribute('alt') || '');
            const isBlockFormula = /\\\\\s*$/.test(alt);
            image.setAttribute(
                'style',
                isBlockFormula
                    ? 'display:block; max-width:100%; height:auto; margin:1.25em auto;'
                    : 'display:inline-block; max-width:100%; height:auto; vertical-align:-0.12em; margin:0 0.12em;'
            );
            const parent = image.parentElement;
            if (isBlockFormula && parent && ['P', 'DIV'].includes(parent.tagName) && hasOnlyMeaningfulChild(parent, image)) {
                parent.setAttribute('style', 'margin:1.25em 0; text-align:center;');
            }
            return;
        }

        const parent = image.parentElement;
        const isStandalone = parent && ['P', 'DIV'].includes(parent.tagName) && hasOnlyMeaningfulChild(parent, image);
        image.setAttribute(
            'style',
            isStandalone
                ? 'display:block; max-width:100%; height:auto; margin:1.2em auto; border-radius:10px;'
                : 'display:inline-block; max-width:100%; height:auto; vertical-align:middle;'
        );
    });
}

function stripRedundantAttributes(root: HTMLElement): void {
    Array.from(root.querySelectorAll<HTMLElement>('*')).forEach((node) => {
        Array.from(node.attributes).forEach((attribute) => {
            const name = attribute.name;
            if (name === 'style') return;
            if (name === 'href') return;
            if (name === 'src') return;
            if (name === 'alt') return;
            if (name === 'title') return;
            if (name === 'rel') return;
            if (name === 'eeimg') return;
            if (name === 'data-eeimg') return;
            if (name === 'class' && node.tagName === 'IMG' && node.getAttribute('eeimg') === '1') return;
            node.removeAttribute(name);
        });
    });
}

function cleanupEmptyNodes(root: HTMLElement): void {
    Array.from(root.querySelectorAll<HTMLElement>('p, div, span')).forEach((node) => {
        if (!node.isConnected) return;
        if (node.querySelector('img, table, pre, blockquote, ul, ol, hr')) return;
        if (!normalizeText(node.textContent || '').trim()) {
            node.remove();
        }
    });
}

export async function makeZhihuCompatibleHtml(markdown: string): Promise<string> {
    const sourceMarkdown = makeZhihuImportMarkdown(markdown);
    const rawHtml = zhihuClipboardRenderer.render(sourceMarkdown);
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');
    const root = doc.body as HTMLElement;

    styleParagraphs(root);
    styleHeadings(root);
    styleLists(root);
    styleBlockquotes(root);
    styleCode(root);
    styleLinks(root);
    styleTables(root);
    styleHorizontalRules(root);
    styleImages(root);
    stripRedundantAttributes(root);
    cleanupEmptyNodes(root);

    return root.innerHTML.trim();
}

export function extractZhihuPlainText(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body as HTMLElement;
    const text = body.innerText || body.textContent || '';
    return normalizeText(text)
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
