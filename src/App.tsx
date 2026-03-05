import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, PenLine } from 'lucide-react';
import { md, preprocessMarkdown, applyTheme } from './lib/markdown';
import { makeWeChatCompatible } from './lib/wechatCompat';
import { THEMES, type ThemeCustomConfig, type ThemeStyleMode } from './lib/themes';
import { createWordDocBlob, createWordDocxBlob, createWordHtmlDocument } from './lib/wordExport';
import { defaultContent } from './defaultContent';
import {
    type ImageAssetMap,
    collectImageAssetPreviews,
    createImageAsset,
    replaceDataUriImagesWithAssetUrls,
    resolveImageAssetUrls
} from './lib/imageAssets';
import Header from './components/Header';
import ThemeSelector from './components/ThemeSelector';
import Toolbar from './components/Toolbar';
import EditorPanel from './components/EditorPanel';
import PreviewPanel from './components/PreviewPanel';
import WorkspaceMetaBar from './components/WorkspaceMetaBar';
import InsightsPanel from './components/InsightsPanel';
import {
    computeDocumentStats,
    createExportFilename,
    extractDocumentTitle,
    extractHeadings
} from './lib/documentMetrics';

const isBrowser = typeof window !== 'undefined';

const STORAGE_MARKDOWN_KEY = 'vibe_101_publish_markdown_v3';
const STORAGE_TEMPLATE_VERSION_KEY = 'vibe_101_publish_template_version_v1';
const STORAGE_THEME_MODE_KEY = 'vibe_101_publish_theme_mode_v3';
const STORAGE_ACTIVE_THEME_KEY = 'vibe_101_publish_active_theme_v3';
const STORAGE_CUSTOM_THEME_ENABLED_KEY = 'vibe_101_publish_custom_theme_enabled_v1';
const STORAGE_CUSTOM_THEME_PRIMARY_KEY = 'vibe_101_publish_custom_theme_primary_v1';
const STORAGE_CUSTOM_THEME_STYLE_MODE_KEY = 'vibe_101_publish_custom_theme_style_mode_v1';
const STORAGE_DEVICE_KEY = 'vibe_101_publish_preview_device_v3';
const STORAGE_SCROLL_SYNC_KEY = 'vibe_101_publish_scroll_sync_v3';
const STORAGE_INSIGHTS_OPEN_KEY = 'vibe_101_publish_insights_open_v3';
const STORAGE_LAST_SAVED_AT_KEY = 'vibe_101_publish_last_saved_at_v3';
const STORAGE_IMAGE_ASSETS_KEY = 'vibe_101_publish_image_assets_v1';
const CURRENT_TEMPLATE_VERSION = '2026-03-03-default-content-v1';

const DEFAULT_CUSTOM_THEME: ThemeCustomConfig = {
    enabled: false,
    primaryColor: '#2bae85',
    styleMode: 'refined'
};

type ScrollPanel = 'editor' | 'preview';

const SCROLL_SYNC_PROGRAMMATIC_GUARD_MS = 140;
const SCROLL_SYNC_TOLERANCE_PX = 1;

function readStoredString(key: string, fallback: string): string {
    if (!isBrowser) return fallback;
    return localStorage.getItem(key) ?? fallback;
}

function parsePreviewDevice(raw: string): 'mobile' | 'tablet' | 'pc' {
    if (raw === 'mobile' || raw === 'tablet' || raw === 'pc') return raw;
    return 'pc';
}

function parseThemeStyleMode(raw: string): ThemeStyleMode {
    if (raw === 'simple' || raw === 'focus' || raw === 'refined' || raw === 'vivid') return raw;
    return DEFAULT_CUSTOM_THEME.styleMode;
}

function readStoredImageAssets(key: string): ImageAssetMap {
    if (!isBrowser) return {};
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== 'object') return {};

        const entries = Object.entries(parsed as Record<string, unknown>)
            .filter((entry): entry is [string, string] => typeof entry[0] === 'string' && typeof entry[1] === 'string');

        return Object.fromEntries(entries);
    } catch {
        return {};
    }
}

function isLegacyDefaultMarkdown(content: string): boolean {
    const legacySignals = [
        '# Raphael Publish - 公众号排版大师',
        '# vibe-101-publish - 公众号排版工作台',
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f',
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
        '## 新章节标题',
        '| 导出 | 支持 PDF 和 HTML 导出 |'
    ];
    const matchedSignals = legacySignals.filter((signal) => content.includes(signal)).length;
    return matchedSignals >= 2;
}

function escapeHtml(raw: string): string {
    return raw
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function collectPrintHeadMarkup(): string {
    return Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((node) => node.outerHTML)
        .join('\n');
}

function createPrintDocumentHtml(renderedHtml: string, title: string): string {
    const safeTitle = escapeHtml(title || 'article');
    const headMarkup = collectPrintHeadMarkup();

    return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${safeTitle}</title>
${headMarkup}
<style>
:root { color-scheme: light; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #ffffff !important; }
body {
    font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', 'Segoe UI', sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}
.pdf-export-root {
    width: min(186mm, calc(100vw - 24px));
    margin: 16px auto 24px;
    padding: 0;
}
.pdf-export-root img {
    max-width: 100% !important;
    height: auto !important;
    page-break-inside: avoid;
    break-inside: avoid;
}
.pdf-export-root pre,
.pdf-export-root table,
.pdf-export-root blockquote,
.pdf-export-root .image-grid {
    page-break-inside: avoid;
    break-inside: avoid;
}
@page { size: A4 portrait; margin: 12mm; }
@media print {
    .pdf-export-root {
        width: auto;
        margin: 0;
    }
}
</style>
</head>
<body>
<main class="pdf-export-root">
${renderedHtml}
</main>
</body>
</html>`;
}

async function waitForPrintAssets(printWindow: Window): Promise<void> {
    const printDocument = printWindow.document;
    const stylesheetPromises = Array.from(printDocument.querySelectorAll('link[rel="stylesheet"]')).map((linkNode) => {
        const link = linkNode as HTMLLinkElement;
        if (link.sheet) return Promise.resolve();
        return new Promise<void>((resolve) => {
            link.addEventListener('load', () => resolve(), { once: true });
            link.addEventListener('error', () => resolve(), { once: true });
        });
    });
    const imagePromises = Array.from(printDocument.images).map((image) => {
        if (image.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
            image.addEventListener('load', () => resolve(), { once: true });
            image.addEventListener('error', () => resolve(), { once: true });
        });
    });
    const fontsReady =
        'fonts' in printDocument && printDocument.fonts
            ? printDocument.fonts.ready.then(() => undefined).catch(() => undefined)
            : Promise.resolve();

    await Promise.all([fontsReady, ...stylesheetPromises, ...imagePromises]);
}

export default function App() {
    const [themeMode, setThemeMode] = useState<'light' | 'dark'>(
        () => (readStoredString(STORAGE_THEME_MODE_KEY, 'light') === 'dark' ? 'dark' : 'light')
    );
    const [markdownInput, setMarkdownInput] = useState<string>(() => readStoredString(STORAGE_MARKDOWN_KEY, defaultContent));
    const [imageAssets, setImageAssets] = useState<ImageAssetMap>(() => readStoredImageAssets(STORAGE_IMAGE_ASSETS_KEY));
    const [renderedHtml, setRenderedHtml] = useState<string>('');
    const [activeTheme, setActiveTheme] = useState<string>(() => {
        const storedThemeId = readStoredString(STORAGE_ACTIVE_THEME_KEY, THEMES[0].id);
        return THEMES.some((theme) => theme.id === storedThemeId) ? storedThemeId : THEMES[0].id;
    });
    const [customTheme, setCustomTheme] = useState<ThemeCustomConfig>(() => ({
        enabled: readStoredString(STORAGE_CUSTOM_THEME_ENABLED_KEY, '0') === '1',
        primaryColor: readStoredString(STORAGE_CUSTOM_THEME_PRIMARY_KEY, DEFAULT_CUSTOM_THEME.primaryColor),
        styleMode: parseThemeStyleMode(readStoredString(STORAGE_CUSTOM_THEME_STYLE_MODE_KEY, DEFAULT_CUSTOM_THEME.styleMode))
    }));
    const [copied, setCopied] = useState(false);
    const [wordCopied, setWordCopied] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'pc'>(
        () => parsePreviewDevice(readStoredString(STORAGE_DEVICE_KEY, 'pc'))
    );
    const [activePanel, setActivePanel] = useState<'editor' | 'preview'>('editor');
    const [scrollSyncEnabled, setScrollSyncEnabled] = useState<boolean>(
        () => readStoredString(STORAGE_SCROLL_SYNC_KEY, '1') === '1'
    );
    const [insightsOpen, setInsightsOpen] = useState<boolean>(
        () => readStoredString(STORAGE_INSIGHTS_OPEN_KEY, '1') === '1'
    );
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<string>(() => readStoredString(STORAGE_LAST_SAVED_AT_KEY, ''));
    const hasRunTemplateMigrationRef = useRef(false);
    const imageAssetsRef = useRef<ImageAssetMap>(imageAssets);

    const previewRef = useRef<HTMLDivElement>(null);
    const editorScrollRef = useRef<HTMLTextAreaElement>(null);
    const previewOuterScrollRef = useRef<HTMLDivElement>(null);
    const previewInnerScrollRef = useRef<HTMLDivElement>(null);
    const programmaticScrollUntilRef = useRef<Record<ScrollPanel, number>>({
        editor: 0,
        preview: 0
    });
    const pendingScrollSyncRef = useRef<{
        sourceElement: HTMLElement;
        targetElement: HTMLElement;
        sourcePanel: ScrollPanel;
    } | null>(null);
    const scrollSyncRafRef = useRef<number | null>(null);
    const lastManualScrollPanelRef = useRef<ScrollPanel>('editor');

    const headings = useMemo(() => extractHeadings(markdownInput), [markdownInput]);
    const documentTitle = useMemo(() => extractDocumentTitle(markdownInput), [markdownInput]);
    const resolvedMarkdownInput = useMemo(() => resolveImageAssetUrls(markdownInput, imageAssets), [markdownInput, imageAssets]);
    const imageAssetPreviews = useMemo(
        () => collectImageAssetPreviews(markdownInput, imageAssets),
        [markdownInput, imageAssets]
    );
    const stats = useMemo(
        () => computeDocumentStats(markdownInput, headings.length),
        [markdownInput, headings.length]
    );
    const activeThemeName = useMemo(() => {
        const baseThemeName = THEMES.find((theme) => theme.id === activeTheme)?.name || activeTheme;
        return customTheme.enabled ? `${baseThemeName} + 自定义` : baseThemeName;
    }, [activeTheme, customTheme.enabled]);
    const lastSavedLabel = useMemo(() => {
        if (!lastSavedAt) return '--:--';
        const parsed = new Date(lastSavedAt);
        if (Number.isNaN(parsed.getTime())) return '--:--';
        return parsed.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }, [lastSavedAt]);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', themeMode === 'dark');
    }, [themeMode]);

    useEffect(() => {
        if (!isBrowser || hasRunTemplateMigrationRef.current) return;
        hasRunTemplateMigrationRef.current = true;

        const storedTemplateVersion = readStoredString(STORAGE_TEMPLATE_VERSION_KEY, '');
        if (storedTemplateVersion === CURRENT_TEMPLATE_VERSION) return;

        const shouldUpgradeDefaultTemplate = isLegacyDefaultMarkdown(markdownInput);
        if (shouldUpgradeDefaultTemplate) {
            setMarkdownInput(defaultContent);
            localStorage.setItem(STORAGE_MARKDOWN_KEY, defaultContent);
        }
        localStorage.setItem(STORAGE_TEMPLATE_VERSION_KEY, CURRENT_TEMPLATE_VERSION);
    }, [markdownInput]);

    useEffect(() => {
        const rawHtml = md.render(preprocessMarkdown(resolvedMarkdownInput));
        const styledHtml = applyTheme(rawHtml, activeTheme, customTheme.enabled ? customTheme : undefined);
        setRenderedHtml(styledHtml);
    }, [resolvedMarkdownInput, activeTheme, customTheme]);

    useEffect(() => {
        imageAssetsRef.current = imageAssets;
    }, [imageAssets]);

    const handleCreateImageAsset = useCallback((dataUrl: string) => {
        const created = createImageAsset(imageAssetsRef.current, dataUrl);
        if (created.nextAssets !== imageAssetsRef.current) {
            imageAssetsRef.current = created.nextAssets;
            setImageAssets(created.nextAssets);
        }
        return created.id;
    }, []);

    useEffect(() => {
        const migrated = replaceDataUriImagesWithAssetUrls(markdownInput, imageAssetsRef.current);
        if (!migrated.changed) return;
        imageAssetsRef.current = migrated.nextAssets;
        setImageAssets(migrated.nextAssets);
        setMarkdownInput(migrated.nextMarkdown);
    }, [markdownInput]);

    useEffect(() => {
        if (!isBrowser) return;
        setIsSaving(true);
        const saveTimer = window.setTimeout(() => {
            localStorage.setItem(STORAGE_MARKDOWN_KEY, markdownInput);
            localStorage.setItem(STORAGE_THEME_MODE_KEY, themeMode);
            localStorage.setItem(STORAGE_ACTIVE_THEME_KEY, activeTheme);
            localStorage.setItem(STORAGE_CUSTOM_THEME_ENABLED_KEY, customTheme.enabled ? '1' : '0');
            localStorage.setItem(STORAGE_CUSTOM_THEME_PRIMARY_KEY, customTheme.primaryColor);
            localStorage.setItem(STORAGE_CUSTOM_THEME_STYLE_MODE_KEY, customTheme.styleMode);
            localStorage.setItem(STORAGE_DEVICE_KEY, previewDevice);
            localStorage.setItem(STORAGE_SCROLL_SYNC_KEY, scrollSyncEnabled ? '1' : '0');
            localStorage.setItem(STORAGE_INSIGHTS_OPEN_KEY, insightsOpen ? '1' : '0');
            localStorage.setItem(STORAGE_IMAGE_ASSETS_KEY, JSON.stringify(imageAssets));
            const nowIso = new Date().toISOString();
            localStorage.setItem(STORAGE_LAST_SAVED_AT_KEY, nowIso);
            setLastSavedAt(nowIso);
            setIsSaving(false);
        }, 280);

        return () => window.clearTimeout(saveTimer);
    }, [markdownInput, themeMode, activeTheme, customTheme, previewDevice, scrollSyncEnabled, insightsOpen, imageAssets]);

    const clearPendingScrollSync = useCallback(() => {
        pendingScrollSyncRef.current = null;
        if (scrollSyncRafRef.current !== null) {
            cancelAnimationFrame(scrollSyncRafRef.current);
            scrollSyncRafRef.current = null;
        }
    }, []);

    const resetScrollSyncRuntimeState = useCallback(() => {
        programmaticScrollUntilRef.current = { editor: 0, preview: 0 };
        clearPendingScrollSync();
    }, [clearPendingScrollSync]);

    useEffect(() => {
        if (!scrollSyncEnabled) {
            resetScrollSyncRuntimeState();
        }
    }, [scrollSyncEnabled, resetScrollSyncRuntimeState]);

    useEffect(() => {
        resetScrollSyncRuntimeState();
    }, [previewDevice, resetScrollSyncRuntimeState]);

    useEffect(() => {
        return () => {
            clearPendingScrollSync();
        };
    }, [clearPendingScrollSync]);

    const getActivePreviewScrollElement = useCallback(() => {
        if (previewDevice === 'pc') return previewOuterScrollRef.current;
        return previewInnerScrollRef.current;
    }, [previewDevice]);

    const schedulePendingScrollSync = useCallback(() => {
        if (scrollSyncRafRef.current !== null) return;
        scrollSyncRafRef.current = window.requestAnimationFrame(() => {
            scrollSyncRafRef.current = null;
            const pendingSync = pendingScrollSyncRef.current;
            pendingScrollSyncRef.current = null;
            if (!pendingSync || !scrollSyncEnabled) return;

            const sourceMaxScroll = pendingSync.sourceElement.scrollHeight - pendingSync.sourceElement.clientHeight;
            const targetMaxScroll = pendingSync.targetElement.scrollHeight - pendingSync.targetElement.clientHeight;

            const rawRatio = sourceMaxScroll <= 0 ? 0 : pendingSync.sourceElement.scrollTop / sourceMaxScroll;
            const scrollRatio = Math.max(0, Math.min(1, rawRatio));
            const targetScrollTop = scrollRatio * Math.max(targetMaxScroll, 0);

            if (Math.abs(pendingSync.targetElement.scrollTop - targetScrollTop) <= SCROLL_SYNC_TOLERANCE_PX) return;

            const targetPanel: ScrollPanel = pendingSync.sourcePanel === 'editor' ? 'preview' : 'editor';
            programmaticScrollUntilRef.current[targetPanel] = Date.now() + SCROLL_SYNC_PROGRAMMATIC_GUARD_MS;
            pendingSync.targetElement.scrollTop = targetScrollTop;
        });
    }, [scrollSyncEnabled]);

    const syncScrollPosition = useCallback(
        (sourceElement: HTMLElement, targetElement: HTMLElement, sourcePanel: ScrollPanel, force = false) => {
            if (!scrollSyncEnabled) return;
            if (!force && Date.now() < programmaticScrollUntilRef.current[sourcePanel]) return;

            lastManualScrollPanelRef.current = sourcePanel;
            pendingScrollSyncRef.current = { sourceElement, targetElement, sourcePanel };
            schedulePendingScrollSync();
        },
        [schedulePendingScrollSync, scrollSyncEnabled]
    );

    useEffect(() => {
        if (!scrollSyncEnabled || typeof ResizeObserver === 'undefined') return;

        const previewContentElement = previewRef.current;
        const editorElement = editorScrollRef.current;
        const previewElement = getActivePreviewScrollElement();
        if (!previewContentElement || !editorElement || !previewElement) return;

        let resizeRafId: number | null = null;
        const observer = new ResizeObserver(() => {
            if (resizeRafId !== null) cancelAnimationFrame(resizeRafId);
            resizeRafId = window.requestAnimationFrame(() => {
                if (lastManualScrollPanelRef.current === 'preview') {
                    syncScrollPosition(previewElement, editorElement, 'preview', true);
                    return;
                }
                syncScrollPosition(editorElement, previewElement, 'editor', true);
            });
        });

        observer.observe(previewContentElement);
        return () => {
            observer.disconnect();
            if (resizeRafId !== null) cancelAnimationFrame(resizeRafId);
        };
    }, [getActivePreviewScrollElement, previewDevice, renderedHtml, scrollSyncEnabled, syncScrollPosition]);

    const handleEditorScroll = useCallback(() => {
        const editorElement = editorScrollRef.current;
        const previewElement = getActivePreviewScrollElement();
        if (!editorElement || !previewElement) return;
        syncScrollPosition(editorElement, previewElement, 'editor');
    }, [getActivePreviewScrollElement, syncScrollPosition]);

    const handlePreviewOuterScroll = useCallback(() => {
        if (previewDevice !== 'pc') return;
        const previewElement = previewOuterScrollRef.current;
        const editorElement = editorScrollRef.current;
        if (!previewElement || !editorElement) return;
        syncScrollPosition(previewElement, editorElement, 'preview');
    }, [previewDevice, syncScrollPosition]);

    const handlePreviewInnerScroll = useCallback(() => {
        if (previewDevice === 'pc') return;
        const previewElement = previewInnerScrollRef.current;
        const editorElement = editorScrollRef.current;
        if (!previewElement || !editorElement) return;
        syncScrollPosition(previewElement, editorElement, 'preview');
    }, [previewDevice, syncScrollPosition]);

    const handleCopy = useCallback(async () => {
        if (!previewRef.current) return;
        setIsCopying(true);
        try {
            const finalHtmlForCopy = await makeWeChatCompatible(renderedHtml, activeTheme, previewRef.current);
            const htmlBlob = new Blob([finalHtmlForCopy], { type: 'text/html' });
            const textBlob = new Blob([previewRef.current.innerText], { type: 'text/plain' });
            const clipboardItem = new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob });
            await navigator.clipboard.write([clipboardItem]);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2200);
        } catch (err) {
            console.error('Copy failed', err);
            alert('复制失败，请检查浏览器剪贴板权限后重试。');
        } finally {
            setIsCopying(false);
        }
    }, [renderedHtml, activeTheme]);

    const handleExportHtml = useCallback(() => {
        const blob = new Blob([renderedHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = createExportFilename(documentTitle, 'html');
        anchor.click();
        URL.revokeObjectURL(url);
    }, [renderedHtml, documentTitle]);

    const downloadBlobFile = useCallback((blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    }, []);

    const handleCopyWord = useCallback(async () => {
        if (!previewRef.current) return;
        try {
            if (!navigator.clipboard) {
                throw new Error('Clipboard API unavailable');
            }

            if (typeof ClipboardItem === 'undefined' || typeof navigator.clipboard.write !== 'function') {
                await navigator.clipboard.writeText(previewRef.current.innerText);
                setWordCopied(true);
                window.setTimeout(() => setWordCopied(false), 2200);
                return;
            }

            const htmlForWord = createWordHtmlDocument(renderedHtml);
            const htmlBlob = new Blob([htmlForWord], { type: 'text/html' });
            const textBlob = new Blob([previewRef.current.innerText], { type: 'text/plain' });
            const clipboardItem = new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob });
            await navigator.clipboard.write([clipboardItem]);
            setWordCopied(true);
            window.setTimeout(() => setWordCopied(false), 2200);
        } catch (error) {
            console.error('Copy Word failed', error);
            alert('复制到 Word 失败，请检查剪贴板权限后重试。');
        }
    }, [renderedHtml]);

    const handleExportWordDoc = useCallback(() => {
        try {
            const blob = createWordDocBlob(renderedHtml);
            downloadBlobFile(blob, createExportFilename(documentTitle, 'doc'));
        } catch (error) {
            console.error('DOC export failed', error);
            alert('导出 DOC 失败，请稍后重试。');
        }
    }, [renderedHtml, documentTitle, downloadBlobFile]);

    const handleExportWordDocx = useCallback(() => {
        try {
            const blob = createWordDocxBlob(renderedHtml);
            downloadBlobFile(blob, createExportFilename(documentTitle, 'docx'));
        } catch (error) {
            console.error('DOCX export failed', error);
            alert('导出 DOCX 失败，请稍后重试。');
        }
    }, [renderedHtml, documentTitle, downloadBlobFile]);

    const handleExportPdf = useCallback(async () => {
        if (!previewRef.current) return;
        const filename = createExportFilename(documentTitle, 'pdf');
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('无法打开 PDF 导出窗口，请允许当前站点弹窗后重试。');
            return;
        }

        try {
            const printHtml = createPrintDocumentHtml(renderedHtml, documentTitle);
            printWindow.document.open();
            printWindow.document.write(printHtml);
            printWindow.document.close();

            const cleanup = () => {
                printWindow.removeEventListener('afterprint', cleanup);
                window.setTimeout(() => {
                    if (!printWindow.closed) {
                        printWindow.close();
                    }
                }, 120);
            };
            printWindow.addEventListener('afterprint', cleanup);

            await waitForPrintAssets(printWindow);
            printWindow.document.title = filename.replace(/\.pdf$/i, '');
            printWindow.focus();
            printWindow.print();
        } catch (error) {
            console.error('PDF export failed', error);
            if (!printWindow.closed) {
                printWindow.close();
            }
            alert('导出 PDF 失败，请稍后重试。');
        }
    }, [documentTitle, renderedHtml]);

    const handleJumpToHeading = useCallback(
        (line: number) => {
            const editor = editorScrollRef.current;
            if (!editor) return;

            const lines = markdownInput.split(/\r?\n/);
            const targetLine = Math.max(1, Math.min(line, lines.length));
            let cursorPosition = 0;
            for (let index = 0; index < targetLine - 1; index += 1) {
                cursorPosition += lines[index].length + 1;
            }

            editor.focus();
            editor.setSelectionRange(cursorPosition, cursorPosition);

            const lineHeight = Number.parseFloat(getComputedStyle(editor).lineHeight || '28');
            editor.scrollTop = Math.max(0, (targetLine - 3) * lineHeight);
            setActivePanel('editor');
        },
        [markdownInput]
    );

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const withModifier = event.ctrlKey || event.metaKey;
            if (!withModifier) return;

            const key = event.key.toLowerCase();
            if (key === 's') {
                event.preventDefault();
                void handleCopy();
                return;
            }
            if (event.shiftKey && key === 'p') {
                event.preventDefault();
                handleExportPdf();
                return;
            }
            if (event.shiftKey && key === 'h') {
                event.preventDefault();
                handleExportHtml();
                return;
            }
            if (event.shiftKey && key === 'w') {
                event.preventDefault();
                void handleCopyWord();
                return;
            }
            if (event.shiftKey && key === 'o') {
                event.preventDefault();
                handleExportWordDocx();
                return;
            }
            if (event.shiftKey && key === 'd') {
                event.preventDefault();
                handleExportWordDoc();
                return;
            }
            if (event.shiftKey && key === 'i') {
                event.preventDefault();
                setInsightsOpen((prev) => !prev);
                return;
            }
            if (key === '1') {
                event.preventDefault();
                setPreviewDevice('mobile');
                return;
            }
            if (key === '2') {
                event.preventDefault();
                setPreviewDevice('tablet');
                return;
            }
            if (key === '3') {
                event.preventDefault();
                setPreviewDevice('pc');
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleCopy, handleCopyWord, handleExportHtml, handleExportPdf, handleExportWordDoc, handleExportWordDocx]);

    const deviceWidthClass = useMemo(() => {
        if (previewDevice === 'mobile') return 'w-[520px] max-w-full';
        if (previewDevice === 'tablet') return 'w-[800px] max-w-full';
        return 'w-[840px] xl:w-[980px] max-w-[95%]';
    }, [previewDevice]);

    const workspaceGridClass = useMemo(() => {
        const twoColumn =
            previewDevice === 'mobile'
                ? 'md:grid-cols-[55fr_45fr]'
                : previewDevice === 'tablet'
                  ? 'md:grid-cols-[45fr_55fr]'
                  : 'md:grid-cols-[38.2fr_61.8fr]';
        if (!insightsOpen) return twoColumn;

        const threeColumn =
            previewDevice === 'mobile'
                ? 'xl:grid-cols-[34fr_47fr_19fr]'
                : previewDevice === 'tablet'
                  ? 'xl:grid-cols-[33fr_48fr_19fr]'
                  : 'xl:grid-cols-[32fr_50fr_18fr]';
        return `${twoColumn} ${threeColumn}`;
    }, [previewDevice, insightsOpen]);

    const toolbarGridClass = 'md:grid-cols-[minmax(360px,max-content)_1fr]';

    const shouldShowDesktopInsights = insightsOpen;

    return (
        <div className="flex flex-col h-screen overflow-hidden antialiased bg-[#f8f8fa] dark:bg-[#0d0d0f] transition-colors duration-300">
            <Header
                themeMode={themeMode}
                onToggleTheme={() => setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'))}
            />

            <div className="md:hidden glass-toolbar flex items-center z-[90]">
                <button
                    onClick={() => setActivePanel('editor')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-semibold transition-colors border-b-2 ${
                        activePanel === 'editor'
                            ? 'text-[#0066cc] dark:text-[#0a84ff] border-[#0066cc] dark:border-[#0a84ff]'
                            : 'text-[#86868b] dark:text-[#a1a1a6] border-transparent'
                    }`}
                >
                    <PenLine size={15} />
                    稿件
                </button>
                <button
                    onClick={() => setActivePanel('preview')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-semibold transition-colors border-b-2 ${
                        activePanel === 'preview'
                            ? 'text-[#0066cc] dark:text-[#0a84ff] border-[#0066cc] dark:border-[#0a84ff]'
                            : 'text-[#86868b] dark:text-[#a1a1a6] border-transparent'
                    }`}
                >
                    <Eye size={15} />
                    预览
                </button>
            </div>

            <div className={`glass-toolbar hidden md:grid ${toolbarGridClass} px-0 z-[90] transition-all duration-300`}>
                <ThemeSelector
                    activeTheme={activeTheme}
                    onThemeChange={setActiveTheme}
                    customTheme={customTheme}
                    onCustomThemeChange={setCustomTheme}
                />
                <Toolbar
                    previewDevice={previewDevice}
                    onDeviceChange={setPreviewDevice}
                    onExportPdf={handleExportPdf}
                    onExportHtml={handleExportHtml}
                    onExportWordDoc={handleExportWordDoc}
                    onExportWordDocx={handleExportWordDocx}
                    onCopyWord={handleCopyWord}
                    wordCopied={wordCopied}
                    onCopy={handleCopy}
                    copied={copied}
                    isCopying={isCopying}
                    scrollSyncEnabled={scrollSyncEnabled}
                    onToggleScrollSync={() => setScrollSyncEnabled((prev) => !prev)}
                    insightsOpen={insightsOpen}
                    onToggleInsights={() => setInsightsOpen((prev) => !prev)}
                />
            </div>

            <div className="md:hidden glass-toolbar flex items-center z-[90]">
                <ThemeSelector
                    activeTheme={activeTheme}
                    onThemeChange={setActiveTheme}
                    customTheme={customTheme}
                    onCustomThemeChange={setCustomTheme}
                />
                <Toolbar
                    previewDevice={previewDevice}
                    onDeviceChange={setPreviewDevice}
                    onExportPdf={handleExportPdf}
                    onExportHtml={handleExportHtml}
                    onExportWordDoc={handleExportWordDoc}
                    onExportWordDocx={handleExportWordDocx}
                    onCopyWord={handleCopyWord}
                    wordCopied={wordCopied}
                    onCopy={handleCopy}
                    copied={copied}
                    isCopying={isCopying}
                    scrollSyncEnabled={scrollSyncEnabled}
                    onToggleScrollSync={() => setScrollSyncEnabled((prev) => !prev)}
                    insightsOpen={insightsOpen}
                    onToggleInsights={() => setInsightsOpen((prev) => !prev)}
                />
            </div>

            <WorkspaceMetaBar
                documentTitle={documentTitle}
                activeThemeName={activeThemeName}
                stats={stats}
                isSaving={isSaving}
                lastSavedLabel={lastSavedLabel}
                insightsOpen={insightsOpen}
                onToggleInsights={() => setInsightsOpen((prev) => !prev)}
            />

            <main className={`flex-1 overflow-hidden grid grid-cols-1 ${workspaceGridClass} relative transition-all duration-500`}>
                <div className={`${activePanel === 'editor' ? 'flex' : 'hidden'} md:flex flex-col overflow-hidden`}>
                    <EditorPanel
                        markdownInput={markdownInput}
                        onInputChange={setMarkdownInput}
                        editorScrollRef={editorScrollRef}
                        onEditorScroll={handleEditorScroll}
                        scrollSyncEnabled={scrollSyncEnabled}
                        imageAssetPreviews={imageAssetPreviews}
                        onCreateImageAsset={handleCreateImageAsset}
                        stats={{
                            characterCount: stats.characterCount,
                            lineCount: stats.lineCount,
                            readMinutes: stats.readMinutes,
                            headingCount: stats.headingCount,
                            imageCount: stats.imageCount
                        }}
                    />
                </div>

                <div className={`${activePanel === 'preview' ? 'flex' : 'hidden'} md:flex flex-col overflow-hidden`}>
                    <PreviewPanel
                        renderedHtml={renderedHtml}
                        deviceWidthClass={deviceWidthClass}
                        previewDevice={previewDevice}
                        previewRef={previewRef}
                        previewOuterScrollRef={previewOuterScrollRef}
                        previewInnerScrollRef={previewInnerScrollRef}
                        onPreviewOuterScroll={handlePreviewOuterScroll}
                        onPreviewInnerScroll={handlePreviewInnerScroll}
                        scrollSyncEnabled={scrollSyncEnabled}
                    />
                </div>

                {shouldShowDesktopInsights && (
                    <div className="hidden xl:flex min-h-0 border-l border-[#00000012] dark:border-[#ffffff12]">
                        <InsightsPanel
                            documentTitle={documentTitle}
                            stats={stats}
                            headings={headings}
                            onJumpToHeading={handleJumpToHeading}
                        />
                    </div>
                )}
            </main>

            {insightsOpen && (
                <>
                    <button
                        onClick={() => setInsightsOpen(false)}
                        className="fixed inset-0 bg-black/35 z-[109] xl:hidden"
                        aria-label="关闭排版信息侧栏"
                    />
                    <div className="fixed right-0 top-[134px] md:top-[176px] bottom-0 w-[min(94vw,380px)] z-[110] xl:hidden p-3">
                        <InsightsPanel
                            documentTitle={documentTitle}
                            stats={stats}
                            headings={headings}
                            onJumpToHeading={handleJumpToHeading}
                            onClose={() => setInsightsOpen(false)}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
