export interface HeadingItem {
    text: string;
    level: number;
    line: number;
}

export interface DocumentStats {
    lineCount: number;
    characterCount: number;
    englishWordCount: number;
    cjkCharacterCount: number;
    paragraphCount: number;
    headingCount: number;
    imageCount: number;
    codeBlockCount: number;
    linkCount: number;
    readMinutes: number;
}

const HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const IMAGE_PATTERN = /!\[[^\]]*]\([^)]+\)/g;
const CODE_BLOCK_PATTERN = /```[\s\S]*?```/g;
const LINK_PATTERN = /\[[^\]]+]\((?:https?:\/\/|\/)[^)]+\)/g;
const ENGLISH_WORD_PATTERN = /[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g;
const CJK_PATTERN = /[\u4e00-\u9fff]/g;

export function extractHeadings(markdown: string): HeadingItem[] {
    return markdown
        .split(/\r?\n/)
        .map((line, index) => {
            const match = line.match(HEADING_PATTERN);
            if (!match) return null;
            return {
                text: match[2].trim(),
                level: match[1].length,
                line: index + 1
            };
        })
        .filter((item): item is HeadingItem => Boolean(item));
}

export function extractDocumentTitle(markdown: string): string {
    const firstHeading = extractHeadings(markdown).find((heading) => heading.level === 1);
    if (firstHeading) return firstHeading.text;
    return 'untitled';
}

export function computeDocumentStats(markdown: string, headingCount: number): DocumentStats {
    const lineCount = markdown.length === 0 ? 0 : markdown.split(/\r?\n/).length;
    const characterCount = markdown.replace(/\s/g, '').length;
    const englishWordCount = (markdown.match(ENGLISH_WORD_PATTERN) || []).length;
    const cjkCharacterCount = (markdown.match(CJK_PATTERN) || []).length;
    const paragraphCount = markdown
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean).length;
    const imageCount = (markdown.match(IMAGE_PATTERN) || []).length;
    const codeBlockCount = (markdown.match(CODE_BLOCK_PATTERN) || []).length;
    const linkCount = (markdown.match(LINK_PATTERN) || []).length;
    const readingUnits = englishWordCount + cjkCharacterCount;
    const readMinutes = readingUnits === 0 ? 0 : Math.max(1, Math.ceil(readingUnits / 280));

    return {
        lineCount,
        characterCount,
        englishWordCount,
        cjkCharacterCount,
        paragraphCount,
        headingCount,
        imageCount,
        codeBlockCount,
        linkCount,
        readMinutes
    };
}

function sanitizeFileSegment(raw: string): string {
    return raw
        .trim()
        .toLowerCase()
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48);
}

export function createExportFilename(title: string, ext: 'html' | 'pdf' | 'doc' | 'docx' | 'md'): string {
    const safeTitle = sanitizeFileSegment(title) || 'article';
    const timestamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
    return `vibe-101-publish_${safeTitle}_${timestamp}.${ext}`;
}
