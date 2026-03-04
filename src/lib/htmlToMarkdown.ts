import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { IMAGE_ASSET_URL_PREFIX } from './imageAssets';

const turndownService = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined'
});

turndownService.use(gfm);

function normalizeInlineText(value: string): string {
    return String(value || '')
        .replace(/\r?\n+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function normalizeLatexCommands(latexRaw: string): string {
    const normalized = normalizeInlineText(latexRaw);
    if (!normalized) return '';
    return normalized
        .replace(/\\\\(?=[A-Za-z])/g, '\\')
        .replace(/\\_/g, '_')
        .replace(/\\\^/g, '^');
}

function sanitizeMarkdownAlt(alt: string): string {
    const normalized = normalizeInlineText(alt || '图片');
    return normalized
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]');
}

function sanitizeMarkdownTitle(title: string): string {
    return normalizeInlineText(title).replace(/"/g, '\\"');
}

function looksLikeLatex(input: string): boolean {
    if (!input) return false;
    return /\\[a-zA-Z]+|[_^{}]|[=+\-*/<>]/.test(input);
}

function extractLatexFromImageMeta(altRaw: string, titleRaw: string): string | null {
    const titleCandidate = String(titleRaw || '').trim();
    if (looksLikeLatex(titleCandidate)) return titleCandidate;

    const altCandidate = String(altRaw || '').trim().replace(/^LaTeX:\s*/i, '');
    if (looksLikeLatex(altCandidate)) return altCandidate;

    return null;
}

function shouldUseDisplayMath(imageNode: HTMLImageElement, latexRaw: string): boolean {
    if (/\r?\n/.test(latexRaw)) return true;

    const widthRaw = imageNode.getAttribute('width') || '';
    const width = Number.parseFloat(widthRaw);
    if (Number.isFinite(width) && width >= 220) return true;

    const styleRaw = imageNode.getAttribute('style') || '';
    if (/display\s*:\s*block/i.test(styleRaw)) return true;

    return normalizeInlineText(latexRaw).length >= 92;
}

function toMathMarkdown(latexRaw: string, isDisplay: boolean): string {
    const latex = normalizeLatexCommands(latexRaw);
    if (!latex) return '';
    if (isDisplay) {
        return `\n\n$$\n${latex}\n$$\n\n`;
    }
    return `$${latex}$`;
}

// Rule to optimize images
turndownService.addRule('image', {
    filter: 'img',
    replacement: (_content, node: Node) => {
        const imageNode = node as HTMLImageElement;
        const altRaw = imageNode.alt || '';
        const src = (imageNode.getAttribute('src') || imageNode.src || '').trim();
        const titleRaw = imageNode.title || imageNode.getAttribute('title') || '';

        const latexCandidate = extractLatexFromImageMeta(altRaw, titleRaw);
        if (latexCandidate) {
            return toMathMarkdown(latexCandidate, shouldUseDisplayMath(imageNode, latexCandidate));
        }

        if (!src) return '';

        const alt = sanitizeMarkdownAlt(altRaw || '图片');
        const title = sanitizeMarkdownTitle(titleRaw);
        const titleSegment = title ? ` "${title}"` : '';
        return `![${alt}](${src}${titleSegment})\n`;
    }
});

function isIDEFormattedHTML(htmlData: string, textData: string): boolean {
    if (!htmlData || !textData) return false;

    const ideSignatures = [
        /<meta\s+charset=['"]utf-8['"]/i,
        /<div\s+class=["']ace_line["']/,
        /style=["'][^"']*font-family:\s*['"]?(?:Consolas|Monaco|Menlo|Courier)/i,
        (html: string) => {
            const hasDivSpan = /<(?:div|span)[\s>]/.test(html);
            const hasSemanticTags = /<(?:p|h[1-6]|strong|em|ul|ol|li|blockquote)[\s>]/i.test(html);
            return hasDivSpan && !hasSemanticTags;
        },
        (html: string) => {
            const strippedHtml = html.replace(/<[^>]+>/g, '').trim();
            return strippedHtml === textData.trim();
        }
    ];

    let matchCount = 0;
    for (const signature of ideSignatures) {
        if (typeof signature === 'function') {
            if (signature(htmlData)) matchCount++;
        } else if (signature.test(htmlData)) {
            matchCount++;
        }
    }
    return matchCount >= 2;
}

function isMarkdown(text: string): boolean {
    if (!text) return false;
    const patterns = [
        /^#{1,6}\s+/m,
        /\*\*[^*]+\*\*/,
        /\*[^*\n]+\*/,
        /\[[^\]]+\]\([^)]+\)/,
        /!\[[^\]]*\]\([^)]+\)/,
        /^[-*+]\s+/m,
        /^\d+\.\s+/m,
        /^>\s+/m,
        /`[^`]+`/,
        /```[\s\S]*?```/,
        /^\|.*\|$/m,
        /<!--.*?-->/,
        /^---+$/m
    ];
    return patterns.filter(pattern => pattern.test(text)).length >= 2;
}

function getClipboardImageFiles(clipboardData: DataTransfer): File[] {
    const fromItems = Array.from(clipboardData.items || [])
        .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
        .map((item) => item.getAsFile())
        .filter((file): file is File => Boolean(file));

    if (fromItems.length > 0) return fromItems;

    return Array.from(clipboardData.files || []).filter((file) => file.type.startsWith('image/'));
}

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error || new Error('Failed to read clipboard image'));
        reader.readAsDataURL(file);
    });
}

function insertAtSelection(
    textarea: HTMLTextAreaElement,
    markdownInput: string,
    insertedText: string,
    setMarkdownInput: (val: string) => void
) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = markdownInput.substring(0, start) + insertedText + markdownInput.substring(end);
    setMarkdownInput(newValue);

    setTimeout(() => {
        const nextPos = start + insertedText.length;
        textarea.selectionStart = textarea.selectionEnd = nextPos;
        textarea.focus();
    }, 0);
}

interface SmartPasteOptions {
    createImageAsset?: (dataUrl: string, suggestedAlt: string) => string;
}

export function handleSmartPaste(
    e: React.ClipboardEvent<HTMLTextAreaElement>,
    markdownInput: string,
    setMarkdownInput: (val: string) => void,
    options?: SmartPasteOptions
): void {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const htmlData = clipboardData.getData('text/html');
    const textData = clipboardData.getData('text/plain');
    const imageFiles = getClipboardImageFiles(clipboardData);

    if (imageFiles.length > 0) {
        e.preventDefault();
        const textarea = e.currentTarget;

        Promise.all(imageFiles.map(fileToDataUrl))
            .then((dataUrls) => {
                const markdownImages = dataUrls
                    .filter(Boolean)
                    .map((src, index) => {
                        const alt = `图片${dataUrls.length > 1 ? ` ${index + 1}` : ''}`;
                        if (options?.createImageAsset) {
                            const assetId = options.createImageAsset(src, alt);
                            return `![${alt}](${IMAGE_ASSET_URL_PREFIX}${assetId})`;
                        }
                        return `![${alt}](${src})`;
                    })
                    .join('\n\n');

                if (!markdownImages) return;
                insertAtSelection(textarea, markdownInput, markdownImages, setMarkdownInput);
            })
            .catch((err) => {
                console.error('Clipboard image conversion failed:', err);
                alert('粘贴图片失败，请重试');
            });
        return;
    }

    if (textData && /^\[Image\s*#?\d*\]$/i.test(textData.trim())) {
        e.preventDefault();
        return;
    }

    const isFromIDE = isIDEFormattedHTML(htmlData, textData);
    if (isFromIDE && textData && isMarkdown(textData)) {
        return;
    }

    if (htmlData && htmlData.trim() !== '') {
        const hasPreTag = /<pre[\s>]/.test(htmlData);
        const hasCodeTag = /<code[\s>]/.test(htmlData);
        const isMainlyCode = (hasPreTag || hasCodeTag) && !htmlData.includes('<p') && !htmlData.includes('<div');

        if (isMainlyCode) {
            return;
        }

        if (htmlData.includes('file:///') || htmlData.includes('src="file:')) {
            e.preventDefault();
            return;
        }

        e.preventDefault();
        try {
            let markdown = turndownService.turndown(htmlData);
            markdown = markdown.replace(/\n{3,}/g, '\n\n');

            const textarea = e.currentTarget;
            insertAtSelection(textarea, markdownInput, markdown, setMarkdownInput);
        } catch (err) {
            console.error('HTML to Markdown conversion failed:', err);
            // Fallback to text
            const textarea = e.currentTarget;
            insertAtSelection(textarea, markdownInput, textData, setMarkdownInput);
        }
    } else if (textData && isMarkdown(textData)) {
        return;
    }
}
