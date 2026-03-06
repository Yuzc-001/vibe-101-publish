import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Archive,
    CheckCircle2,
    Download,
    FileImage,
    Loader2,
    Palette,
    Sparkles,
    X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { splitMarkdownToCards, type Card } from '../lib/cardSplitter';
import { CardRenderer, type CardRenderMeta } from './CardRenderer';
import { type ImageAssetMap } from '../lib/imageAssets';
import { extractDocumentTitle, extractHeadings } from '../lib/documentMetrics';
import { createZipBlob } from '../lib/simpleZip';
import { CURATED_THEMES, SOCIAL_THEMES, THEMES, type Theme, type ThemeCustomConfig } from '../lib/themes';

type CardMode = 'wechat' | 'social';
type CardKind = 'cover' | 'content' | 'outro';

interface CardModePanelProps {
    markdownInput: string;
    activeTheme: string;
    customTheme?: ThemeCustomConfig;
    imageAssets: ImageAssetMap;
    onClose: () => void;
}

interface ComposedCard extends Card {
    kind: CardKind;
    title: string;
    summary: string;
}

interface RenderedCardResult {
    dataUrl: string;
    meta: CardRenderMeta;
}

interface ModeOptions {
    themeId: string;
    includeCover: boolean;
    includeOutro: boolean;
    showPageNumber: boolean;
    accountName: string;
}

const CARD_MODE_CONFIG: Record<
    CardMode,
    {
        label: string;
        subtitle: string;
        badge: string;
        width: number;
        height?: number;
        padding: number;
        previewClassName: string;
        previewBackground: string;
        bestFor: string;
    }
> = {
    wechat: {
        label: '公众号长图',
        subtitle: '完整保留长内容，适合信息密度高的文章',
        badge: '750px 自适应长图',
        width: 750,
        padding: 40,
        previewClassName: 'aspect-[3/4]',
        previewBackground: 'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
        bestFor: '教程、复盘、深度长文'
    },
    social: {
        label: '社交卡片',
        subtitle: '固定比例更适合小红书、朋友圈和图文封面',
        badge: '440 x 586 竖版卡片',
        width: 440,
        height: 586,
        padding: 32,
        previewClassName: 'aspect-[440/586]',
        previewBackground: 'linear-gradient(180deg, #f9f1e7 0%, #efe5d9 100%)',
        bestFor: '观点表达、轻量笔记、内容切片'
    }
};

const DEFAULT_ACCOUNT_NAME = '你的账号名';

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

function stripMarkdown(markdown: string): string {
    return markdown
        .replace(/^---[\s\S]*?---/m, ' ')
        .replace(/```[\s\S]*?```/g, ' 代码片段 ')
        .replace(/!\[[^\]]*]\([^)]+\)/g, ' 图片 ')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/<\/?[^>]+>/g, ' ')
        .replace(/^[#>\-\s]+/gm, '')
        .replace(/[`*_~|]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function truncateText(text: string, limit: number) {
    if (text.length <= limit) return text;
    return `${text.slice(0, limit).trim()}...`;
}

function escapeHtml(text: string) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildThemePreviewMarkup(theme: Theme) {
    const containerStyle = `${theme.styles.container || ''}; padding: 16px; height: 148px; min-height: 148px; border-radius: 18px; overflow: hidden; box-sizing: border-box;`;
    const titleStyle = `${theme.styles.h3 || theme.styles.h2 || theme.styles.h1 || ''}; margin: 0 0 8px; font-size: 15px !important; line-height: 1.25 !important;`;
    const paragraphStyle = `${theme.styles.p || ''}; margin: 0; font-size: 12px !important; line-height: 1.55 !important;`;
    const strongStyle = theme.styles.strong || '';
    const quoteStyle = `${theme.styles.blockquote || ''}; margin: 10px 0 0; padding: 8px 10px; font-size: 11px !important; line-height: 1.4 !important;`;

    return `
        <div style="${escapeHtml(containerStyle)}">
            <div style="${escapeHtml(titleStyle)}">这张卡片适合被看见</div>
            <div style="${escapeHtml(paragraphStyle)}">让重点自然被捕捉，适合导出成 <strong style="${escapeHtml(strongStyle)}">真正想发出去</strong> 的图片。</div>
            <div style="${escapeHtml(quoteStyle)}">这是当前主题的真实氛围预览。</div>
        </div>
    `;
}

function buildCompactThemePreviewMarkup(theme: Theme) {
    const containerStyle = `${theme.styles.container || ''}; padding: 10px; height: 88px; min-height: 88px; border-radius: 16px; overflow: hidden; box-sizing: border-box;`;
    const titleStyle = `${theme.styles.h3 || theme.styles.h2 || theme.styles.h1 || ''}; margin: 0 0 6px; font-size: 13px !important; line-height: 1.2 !important;`;
    const paragraphStyle = `${theme.styles.p || ''}; margin: 0; font-size: 10px !important; line-height: 1.45 !important;`;

    return `
        <div style="${escapeHtml(containerStyle)}">
            <div style="${escapeHtml(titleStyle)}">这张卡适合被发出去</div>
            <div style="${escapeHtml(paragraphStyle)}">一眼先看气质，再决定要不要用它。</div>
        </div>
    `;
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
    const parts = dataUrl.split(',');
    const base64 = parts[1] ?? '';
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function buildCardFilename(title: string, cardMode: CardMode, card: ComposedCard) {
    const prefix = sanitizeFileSegment(title) || 'article';
    const page = String(card.index + 1).padStart(2, '0');
    const suffix =
        card.kind === 'cover'
            ? 'cover'
            : card.kind === 'outro'
              ? 'outro'
              : sanitizeFileSegment(card.title) || `card-${page}`;
    return `${prefix}-${cardMode}-${page}-${suffix}.png`;
}

function buildCoverCard(title: string, cardMode: CardMode, contentCount: number): ComposedCard {
    const normalizedTitle = title === 'untitled' ? '未命名文章' : title;
    const intro =
        cardMode === 'social'
            ? '把核心内容整理成可直接发布的社交图片卡片。'
            : '把核心内容整理成适合长图分发的公众号卡片。';

    return {
        id: `${cardMode}-cover`,
        html: '',
        kind: 'cover',
        index: 0,
        title: '封面卡',
        summary: intro,
        markdown: `# ${normalizedTitle}\n\n> ${intro}\n\n**${contentCount} 张内容卡片** 已准备完成。`
    };
}

function buildOutroCard(cardMode: CardMode, accountName: string): ComposedCard {
    const normalizedAccount = accountName.trim() || DEFAULT_ACCOUNT_NAME;
    const followLine =
        cardMode === 'social'
            ? '如果这组卡片对你有帮助，欢迎收藏、转发和关注。'
            : '如果这组图文对你有帮助，欢迎转发给更多朋友。';

    return {
        id: `${cardMode}-outro`,
        html: '',
        kind: 'outro',
        index: 0,
        title: '尾页卡',
        summary: `@${normalizedAccount}`,
        markdown: `## 收藏这组卡片\n\n${followLine}\n\n**@${normalizedAccount}**`
    };
}

function summarizeCard(markdown: string, fallbackTitle: string) {
    const firstHeading = extractHeadings(markdown)[0]?.text?.trim();
    const plainText = stripMarkdown(markdown);
    return {
        title: firstHeading || fallbackTitle,
        summary: plainText ? truncateText(plainText, 54) : '这张卡片还没有文案摘要。'
    };
}

function StatusPill({
    children,
    tone = 'neutral'
}: {
    children: ReactNode;
    tone?: 'neutral' | 'dark' | 'success' | 'warning';
}) {
    const toneClass =
        tone === 'dark'
            ? 'bg-[#111827] text-white dark:bg-white dark:text-[#111827]'
            : tone === 'success'
              ? 'bg-[#16a34a14] text-[#15803d] dark:bg-[#22c55e1f] dark:text-[#86efac]'
              : tone === 'warning'
                ? 'bg-[#f9731612] text-[#ea580c] dark:bg-[#f973161f] dark:text-[#fdba74]'
                : 'bg-[#11182708] text-[#6b7280] dark:bg-[#ffffff10] dark:text-[#cbd5e1]';

    return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium ${toneClass}`}>{children}</span>;
}

function SectionCard({
    step,
    title,
    helper,
    children
}: {
    step: string;
    title: string;
    helper: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-[26px] border border-[#00000010] bg-white/88 p-4 shadow-sm dark:border-[#ffffff12] dark:bg-[#1d1e22]">
            <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">{step}</div>
                <h3 className="mt-2 text-[16px] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-[#f5f5f7]">{title}</h3>
                <p className="mt-1 text-[12px] leading-6 text-[#6e6e73] dark:text-[#a1a1a6]">{helper}</p>
            </div>
            <div className="mt-4">{children}</div>
        </section>
    );
}

function ModeChoiceCard({
    active,
    recommended,
    title,
    subtitle,
    badge,
    bestFor,
    onClick
}: {
    active: boolean;
    recommended: boolean;
    title: string;
    subtitle: string;
    badge: string;
    bestFor: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`rounded-[24px] border p-4 text-left transition ${
                active
                    ? 'border-[#111827] bg-[#111827] text-white shadow-[0_18px_40px_rgba(17,24,39,0.18)] dark:border-white dark:bg-white dark:text-[#111827]'
                    : 'border-[#00000010] bg-[#fbfaf6] hover:border-[#00000018] hover:bg-white dark:border-[#ffffff12] dark:bg-[#17181c] dark:hover:border-[#ffffff1f] dark:hover:bg-[#202127]'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className={`text-[14px] font-semibold ${active ? 'text-white dark:text-[#111827]' : 'text-[#1d1d1f] dark:text-[#f5f5f7]'}`}>{title}</div>
                    <div className={`mt-1 text-[12px] leading-6 ${active ? 'text-white/78 dark:text-[#111827]/72' : 'text-[#6e6e73] dark:text-[#a1a1a6]'}`}>{subtitle}</div>
                </div>
                {active ? <CheckCircle2 size={18} className="shrink-0 text-white dark:text-[#111827]" /> : recommended ? <StatusPill tone="warning">推荐</StatusPill> : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                <StatusPill tone={active ? 'dark' : 'neutral'}>{badge}</StatusPill>
                <StatusPill tone={active ? 'dark' : 'neutral'}>{bestFor}</StatusPill>
            </div>
        </button>
    );
}

function ToggleRow({
    label,
    helper,
    checked,
    onToggle
}: {
    label: string;
    helper: string;
    checked: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            onClick={onToggle}
            className="flex items-center justify-between gap-3 rounded-[20px] border border-[#00000010] bg-[#faf9f5] px-4 py-3 text-left transition hover:border-[#00000018] hover:bg-white dark:border-[#ffffff12] dark:bg-[#18191d] dark:hover:border-[#ffffff20] dark:hover:bg-[#202127]"
        >
            <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{label}</span>
                <span className="mt-1 block text-[11px] leading-5 text-[#6e6e73] dark:text-[#a1a1a6]">{helper}</span>
            </span>
            <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-[#111827] dark:bg-white' : 'bg-[#d1d5db] dark:bg-[#43434d]'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform dark:bg-[#111827] ${checked ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
            </span>
        </button>
    );
}

function QuickThemeChoiceCard({
    theme,
    active,
    onClick
}: {
    theme: Theme;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`overflow-hidden rounded-[18px] border text-left transition ${
                active
                    ? 'border-[#111827] bg-[#111827] text-white shadow-[0_14px_30px_rgba(17,24,39,0.18)] dark:border-white dark:bg-white dark:text-[#111827]'
                    : 'border-[#00000010] bg-[#fbfaf6] hover:border-[#00000018] hover:bg-white dark:border-[#ffffff12] dark:bg-[#17181c] dark:hover:border-[#ffffff1f] dark:hover:bg-[#202127]'
            }`}
        >
            <div
                className={`border-b p-2.5 ${active ? 'border-white/12 dark:border-[#111827]/10' : 'border-[#00000008] dark:border-[#ffffff10]'}`}
                dangerouslySetInnerHTML={{ __html: buildCompactThemePreviewMarkup(theme) }}
            />
            <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                    <span className={`truncate text-[12px] font-semibold ${active ? 'text-white dark:text-[#111827]' : 'text-[#1d1d1f] dark:text-[#f5f5f7]'}`}>
                        {theme.name}
                    </span>
                    {active ? (
                        <span className="rounded-full bg-white/14 px-2 py-0.5 text-[10px] font-semibold text-white dark:bg-[#111827]/10 dark:text-[#111827]">
                            当前
                        </span>
                    ) : null}
                </div>
                <div className={`mt-1 line-clamp-2 text-[10px] leading-5 ${active ? 'text-white/72 dark:text-[#111827]/70' : 'text-[#6e6e73] dark:text-[#a1a1a6]'}`}>
                    {theme.description}
                </div>
            </div>
        </button>
    );
}

function formatScaleLabel(scale: number) {
    return `缩放 ${Math.round(scale * 100)}%`;
}

export default function CardModePanel({
    markdownInput,
    activeTheme,
    customTheme,
    imageAssets,
    onClose
}: CardModePanelProps) {
    const baseCards = useMemo(() => splitMarkdownToCards(markdownInput), [markdownInput]);
    const documentTitle = useMemo(() => extractDocumentTitle(markdownInput), [markdownInput]);
    const [cardMode, setCardMode] = useState<CardMode>('wechat');
    const [modeOptions, setModeOptions] = useState<Record<CardMode, ModeOptions>>({
        wechat: {
            themeId: activeTheme,
            includeCover: false,
            includeOutro: false,
            showPageNumber: false,
            accountName: DEFAULT_ACCOUNT_NAME
        },
        social: {
            themeId: SOCIAL_THEMES[0]?.id || activeTheme,
            includeCover: true,
            includeOutro: true,
            showPageNumber: true,
            accountName: DEFAULT_ACCOUNT_NAME
        }
    });
    const [selectedCardId, setSelectedCardId] = useState<string>('');
    const [renderedCards, setRenderedCards] = useState<Map<string, RenderedCardResult>>(new Map());
    const [isRendering, setIsRendering] = useState(false);
    const [isZipping, setIsZipping] = useState(false);
    const themeGalleryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setModeOptions((previous) => ({
            ...previous,
            wechat: {
                ...previous.wechat,
                themeId: THEMES.some((theme) => theme.id === previous.wechat.themeId)
                    ? previous.wechat.themeId
                    : activeTheme
            }
        }));
    }, [activeTheme]);

    const activeOptions = modeOptions[cardMode];
    const activeThemeId = activeOptions.themeId;
    const modeConfig = CARD_MODE_CONFIG[cardMode];
    const themeList = cardMode === 'social' ? SOCIAL_THEMES : THEMES;
    const appliedCustomTheme = cardMode === 'wechat' ? customTheme : undefined;
    const selectedTheme = themeList.find((theme) => theme.id === activeThemeId) ?? themeList[0];
    const quickThemeList = useMemo(() => {
        if (cardMode === 'social') {
            return SOCIAL_THEMES;
        }

        const curatedThemes = CURATED_THEMES.slice(0, 6);
        if (!selectedTheme) return curatedThemes;
        if (curatedThemes.some((theme) => theme.id === selectedTheme.id)) return curatedThemes;
        return [selectedTheme, ...curatedThemes].slice(0, 6);
    }, [cardMode, selectedTheme]);

    const cards = useMemo(() => {
        const nextCards: ComposedCard[] = [];
        let runningIndex = 0;

        if (activeOptions.includeCover) {
            nextCards.push({
                ...buildCoverCard(documentTitle, cardMode, baseCards.length),
                index: runningIndex
            });
            runningIndex += 1;
        }

        baseCards.forEach((card, index) => {
            const details = summarizeCard(card.markdown, `卡片 ${index + 1}`);
            nextCards.push({
                ...card,
                id: `${cardMode}-${card.id}`,
                kind: 'content',
                index: runningIndex,
                title: details.title,
                summary: details.summary
            });
            runningIndex += 1;
        });

        if (activeOptions.includeOutro) {
            nextCards.push({
                ...buildOutroCard(cardMode, activeOptions.accountName),
                index: runningIndex
            });
        }

        return nextCards;
    }, [activeOptions.accountName, activeOptions.includeCover, activeOptions.includeOutro, baseCards, cardMode, documentTitle]);

    useEffect(() => {
        if (cards.length === 0) {
            setSelectedCardId('');
            return;
        }

        if (!cards.some((card) => card.id === selectedCardId)) {
            setSelectedCardId(cards[0].id);
        }
    }, [cards, selectedCardId]);

    const renderSignature = useMemo(
        () =>
            JSON.stringify({
                cardMode,
                activeThemeId,
                cardIds: cards.map((card) => card.id),
                showPageNumber: activeOptions.showPageNumber,
                cardWidth: modeConfig.width,
                cardHeight: modeConfig.height ?? null,
                cardPadding: modeConfig.padding,
                customTheme: appliedCustomTheme ?? null
            }),
        [activeOptions.showPageNumber, activeThemeId, appliedCustomTheme, cardMode, cards, modeConfig.height, modeConfig.padding, modeConfig.width]
    );

    useEffect(() => {
        setRenderedCards(new Map());
        setIsRendering(cards.length > 0);
    }, [renderSignature, cards.length]);

    useEffect(() => {
        if (cards.length === 0) {
            setIsRendering(false);
            return;
        }

        if (renderedCards.size >= cards.length) {
            setIsRendering(false);
        }
    }, [cards.length, renderedCards.size]);

    const handleCardRenderComplete = useCallback((cardId: string, dataUrl: string, meta: CardRenderMeta) => {
        setRenderedCards((previous) => {
            if (previous.has(cardId)) return previous;
            const next = new Map(previous);
            next.set(cardId, {
                dataUrl,
                meta
            });
            return next;
        });
    }, []);

    const updateModeOptions = useCallback((mode: CardMode, patch: Partial<ModeOptions>) => {
        setModeOptions((previous) => ({
            ...previous,
            [mode]: {
                ...previous[mode],
                ...patch
            }
        }));
    }, []);
    const scrollToThemeGallery = useCallback(() => {
        themeGalleryRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }, []);

    const selectedCard = cards.find((card) => card.id === selectedCardId) ?? cards[0];
    const selectedRendered = selectedCard ? renderedCards.get(selectedCard.id) : undefined;
    const selectedDataUrl = selectedRendered?.dataUrl ?? '';
    const selectedMeta = selectedRendered?.meta;
    const selectedFailed = selectedCard ? renderedCards.has(selectedCard.id) && !selectedDataUrl : false;
    const renderOrder = useMemo(() => {
        if (!selectedCard) return cards;
        return [selectedCard, ...cards.filter((card) => card.id !== selectedCard.id)];
    }, [cards, selectedCard]);
    const cardsToRender = useMemo(
        () => renderOrder.filter((card) => !renderedCards.has(card.id)).slice(0, 1),
        [renderOrder, renderedCards]
    );

    const readyCardCount = Array.from(renderedCards.values()).filter((item) => item.dataUrl).length;
    const overflowCardCount = Array.from(renderedCards.values()).filter((item) => item.meta.hasOverflow).length;
    const imageCardCount = Array.from(renderedCards.values()).filter((item) => item.meta.imageCount > 0).length;
    const recommendedMode: CardMode = baseCards.length > 6 ? 'wechat' : 'social';

    const downloadSingleCard = useCallback(
        (card: ComposedCard) => {
            const dataUrl = renderedCards.get(card.id)?.dataUrl;
            if (!dataUrl) return;
            const bytes = dataUrlToBytes(dataUrl);
            const blob = new Blob([bytes], { type: 'image/png' });
            downloadBlob(blob, buildCardFilename(documentTitle, cardMode, card));
        },
        [cardMode, documentTitle, renderedCards]
    );

    const downloadAllCards = useCallback(() => {
        cards.forEach((card, index) => {
            window.setTimeout(() => {
                downloadSingleCard(card);
            }, index * 140);
        });
    }, [cards, downloadSingleCard]);

    const downloadZip = useCallback(async () => {
        if (cards.length === 0 || isRendering) return;

        setIsZipping(true);
        try {
            const zipEntries = cards
                .map((card) => {
                    const dataUrl = renderedCards.get(card.id)?.dataUrl;
                    if (!dataUrl) return null;
                    return {
                        name: buildCardFilename(documentTitle, cardMode, card),
                        data: dataUrlToBytes(dataUrl)
                    };
                })
                .filter((entry): entry is { name: string; data: Uint8Array } => Boolean(entry));

            if (zipEntries.length === 0) return;

            const blob = createZipBlob(zipEntries);
            const zipName = `${sanitizeFileSegment(documentTitle) || 'article'}-${cardMode}-cards.zip`;
            downloadBlob(blob, zipName);
        } finally {
            setIsZipping(false);
        }
    }, [cardMode, cards, documentTitle, isRendering, renderedCards]);

    const strategyHint =
        cardMode === 'social'
            ? '固定尺寸卡片更适合被快速浏览。内容偏长时，优先保留一张卡一个观点。'
            : '长图模式适合完整信息表达。图片和长段落会尽量按原始结构保留下来。';

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(9,10,14,0.58)] p-2 md:p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative flex h-[93vh] w-full max-w-[1560px] flex-col overflow-hidden rounded-[34px] border border-[#00000012] bg-[#f4efe5] shadow-[0_30px_90px_rgba(15,23,42,0.28)] dark:border-[#ffffff14] dark:bg-[#101114]"
            >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[220px] bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.12),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(96,165,250,0.12),_transparent_24%)]" />

                <header className="relative border-b border-[#00000010] px-5 pb-5 pt-5 dark:border-[#ffffff10] md:px-7">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <StatusPill tone="dark">卡片工作台</StatusPill>
                                <StatusPill>{modeConfig.badge}</StatusPill>
                                <StatusPill>{selectedTheme?.name || '未选择主题'}</StatusPill>
                                {isRendering ? (
                                    <StatusPill tone="warning">
                                        <Loader2 className="animate-spin" size={12} />
                                        渲染中 {readyCardCount}/{cards.length}
                                    </StatusPill>
                                ) : cards.length > 0 ? (
                                    <StatusPill tone="success">
                                        <CheckCircle2 size={12} />
                                        已准备完成
                                    </StatusPill>
                                ) : null}
                            </div>

                            <h2 className="mt-4 max-w-[880px] text-[26px] font-semibold tracking-[-0.04em] text-[#16181d] dark:text-[#f8fafc] md:text-[32px]">
                                把文章整理成更适合发布的图片，而不是单纯截图
                            </h2>
                            <p className="mt-2 max-w-[820px] text-[14px] leading-7 text-[#5f6470] dark:text-[#9ca3af]">
                                先选导出方式，再确认封面、页码和尾页，最后在大预览里判断这张卡值不值得发出去。整个面板会尽量帮你把“制作”变成“判断”。
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <StatusPill>{documentTitle === 'untitled' ? '未命名文章' : documentTitle}</StatusPill>
                                <StatusPill>{cards.length} 张待导出卡片</StatusPill>
                                <StatusPill>{readyCardCount} 张已生成预览</StatusPill>
                                {imageCardCount > 0 ? <StatusPill>{imageCardCount} 张含图片</StatusPill> : null}
                                {overflowCardCount > 0 ? <StatusPill tone="warning">{overflowCardCount} 张建议拆卡</StatusPill> : null}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                            <button
                                onClick={() => selectedCard && downloadSingleCard(selectedCard)}
                                disabled={!selectedCard || !selectedDataUrl}
                                className={`ui-tool-btn ${!selectedCard || !selectedDataUrl ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                                <FileImage size={14} />
                                下载当前 PNG
                            </button>

                            <button
                                onClick={downloadAllCards}
                                disabled={isRendering || cards.length === 0}
                                className={`ui-tool-btn ${isRendering || cards.length === 0 ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                                <Download size={14} />
                                下载全部 PNG
                            </button>

                            <button
                                onClick={() => void downloadZip()}
                                disabled={isRendering || cards.length <= 1 || isZipping}
                                className={`ui-primary-btn ${isRendering || cards.length <= 1 || isZipping ? 'cursor-not-allowed opacity-55' : ''}`}
                            >
                                {isZipping ? <Loader2 className="animate-spin" size={15} /> : <Archive size={15} />}
                                {cards.length > 1 ? '打包下载 ZIP' : '导出图片'}
                            </button>

                            <button onClick={onClose} className="ui-icon-btn" title="关闭卡片工作台">
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                {cards.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center px-6">
                        <div className="max-w-md text-center">
                            <h3 className="text-xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">还没有可导出的卡片</h3>
                            <p className="mt-3 text-sm leading-7 text-[#6e6e73] dark:text-[#a1a1a6]">
                                先在编辑区输入 Markdown，再回来决定是做完整长图，还是做适合社交平台传播的图片卡片。
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 xl:grid-cols-[296px_minmax(0,1fr)] 2xl:grid-cols-[312px_minmax(0,1fr)]">
                        <aside className="min-h-0 overflow-y-auto border-b border-[#00000010] px-4 py-4 dark:border-[#ffffff10] xl:border-b-0 xl:border-r xl:px-5 xl:py-5">
                            <div className="grid gap-4">
                                <SectionCard step="Step 1" title="先决定要发成什么样" helper="选择导出方式时，优先考虑读者看到它的场景，而不是你写作时的格式。">
                                    <div className="grid gap-3">
                                        {(Object.keys(CARD_MODE_CONFIG) as CardMode[]).map((mode) => (
                                            <ModeChoiceCard
                                                key={mode}
                                                active={cardMode === mode}
                                                recommended={recommendedMode === mode && cardMode !== mode}
                                                title={CARD_MODE_CONFIG[mode].label}
                                                subtitle={CARD_MODE_CONFIG[mode].subtitle}
                                                badge={CARD_MODE_CONFIG[mode].badge}
                                                bestFor={CARD_MODE_CONFIG[mode].bestFor}
                                                onClick={() => setCardMode(mode)}
                                            />
                                        ))}
                                    </div>
                                </SectionCard>

                                <SectionCard step="Step 2" title="再决定这组卡怎么导出" helper={strategyHint}>
                                    <div className="rounded-[22px] border border-[#00000010] bg-[#faf8f2] p-4 dark:border-[#ffffff12] dark:bg-[#17181c]">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">当前方案</div>
                                                <div className="mt-2 text-[15px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                                                    {modeConfig.label} · {selectedTheme?.name || '未选择主题'}
                                                </div>
                                            </div>
                                            <Sparkles size={18} className="text-[#f59e0b]" />
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <StatusPill>{modeConfig.badge}</StatusPill>
                                            <StatusPill>{cards.length} 张卡</StatusPill>
                                            {activeOptions.includeCover ? <StatusPill>含封面</StatusPill> : null}
                                            {activeOptions.includeOutro ? <StatusPill>含尾页</StatusPill> : null}
                                            {activeOptions.showPageNumber ? <StatusPill>带页码</StatusPill> : null}
                                        </div>
                                    </div>

                                    <div className="mt-3 rounded-[22px] border border-[#00000010] bg-[#faf8f2] p-4 dark:border-[#ffffff12] dark:bg-[#17181c]">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">快速选主题</div>
                                                <div className="mt-2 text-[13px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                                                    先在这里定气质，再去右边看大预览
                                                </div>
                                                <div className="mt-1 text-[11px] leading-5 text-[#6e6e73] dark:text-[#a1a1a6]">
                                                    点一下就会刷新当前卡片。选中了，再去下面精细对比完整主题库。
                                                </div>
                                            </div>
                                            <button
                                                onClick={scrollToThemeGallery}
                                                className="shrink-0 rounded-full border border-[#00000010] px-3 py-1 text-[11px] font-semibold text-[#4b5563] transition hover:border-[#00000018] hover:bg-white dark:border-[#ffffff12] dark:text-[#d1d5db] dark:hover:bg-[#202127]"
                                            >
                                                查看全部
                                            </button>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-2.5">
                                            {quickThemeList.map((theme) => (
                                                <QuickThemeChoiceCard
                                                    key={theme.id}
                                                    theme={theme}
                                                    active={activeThemeId === theme.id}
                                                    onClick={() => updateModeOptions(cardMode, { themeId: theme.id })}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-3 grid gap-2.5">
                                        <ToggleRow
                                            label="自动封面"
                                            helper="第一张卡自动提取标题，适合让整组图看起来更完整。"
                                            checked={activeOptions.includeCover}
                                            onToggle={() => updateModeOptions(cardMode, { includeCover: !activeOptions.includeCover })}
                                        />
                                        <ToggleRow
                                            label="自动尾页"
                                            helper="最后一张卡做收尾，适合补账号名和关注动作。"
                                            checked={activeOptions.includeOutro}
                                            onToggle={() => updateModeOptions(cardMode, { includeOutro: !activeOptions.includeOutro })}
                                        />
                                        <ToggleRow
                                            label="显示页码"
                                            helper="右下角显示 01/05，更适合成组发布和读者浏览。"
                                            checked={activeOptions.showPageNumber}
                                            onToggle={() => updateModeOptions(cardMode, { showPageNumber: !activeOptions.showPageNumber })}
                                        />
                                    </div>

                                    <div className="mt-3">
                                        <label className="text-[12px] font-semibold text-[#4b5563] dark:text-[#d1d5db]">尾页账号名</label>
                                        <input
                                            value={activeOptions.accountName}
                                            onChange={(event) => updateModeOptions(cardMode, { accountName: event.target.value })}
                                            placeholder={DEFAULT_ACCOUNT_NAME}
                                            className="mt-2 w-full rounded-[18px] border border-[#00000012] bg-[#fafaf8] px-4 py-3 text-sm text-[#1d1d1f] outline-none transition focus:border-[#111827] dark:border-[#ffffff12] dark:bg-[#17181c] dark:text-[#f5f5f7] dark:focus:border-white"
                                        />
                                    </div>
                                </SectionCard>

                                <SectionCard step="Step 3" title="确认每张卡值不值得发出去" helper="卡片列表不是技术视图，而是你的发布队列。点一张，就去右边认真看一张。">
                                    <div className="mb-3 flex flex-wrap gap-2">
                                        <StatusPill>{cards.length} 张导出卡片</StatusPill>
                                        <StatusPill>{readyCardCount} 张已就绪</StatusPill>
                                        {overflowCardCount > 0 ? <StatusPill tone="warning">{overflowCardCount} 张偏长</StatusPill> : null}
                                    </div>

                                    <div className="grid gap-2.5">
                                        {cards.map((card) => {
                                            const rendered = renderedCards.get(card.id);
                                            const dataUrl = rendered?.dataUrl ?? '';
                                            const meta = rendered?.meta;
                                            const hasRendered = renderedCards.has(card.id);
                                            const isFailed = hasRendered && !dataUrl;
                                            const isSelected = selectedCard?.id === card.id;

                                            return (
                                                <button
                                                    key={card.id}
                                                    onClick={() => setSelectedCardId(card.id)}
                                                    className={`rounded-[22px] border p-3 text-left transition ${
                                                        isSelected
                                                            ? 'border-[#111827] bg-[#111827] text-white shadow-[0_18px_40px_rgba(17,24,39,0.18)] dark:border-white dark:bg-white dark:text-[#111827]'
                                                            : 'border-[#00000010] bg-[#fbfaf6] hover:border-[#00000018] hover:bg-white dark:border-[#ffffff12] dark:bg-[#17181c] dark:hover:border-[#ffffff1f] dark:hover:bg-[#202127]'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`relative w-[72px] shrink-0 overflow-hidden rounded-[16px] border ${modeConfig.previewClassName} ${
                                                                isSelected ? 'border-white/15 dark:border-[#111827]/10' : 'border-[#00000010] dark:border-[#ffffff10]'
                                                            }`}
                                                        >
                                                            {dataUrl ? (
                                                                <img src={dataUrl} alt={card.title} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center text-[11px]" style={{ background: modeConfig.previewBackground }}>
                                                                    {isFailed ? '失败' : '生成中'}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[11px] font-semibold tracking-[0.14em] ${isSelected ? 'text-white/72 dark:text-[#111827]/70' : 'text-[#9ca3af]'}`}>
                                                                    {String(card.index + 1).padStart(2, '0')}
                                                                </span>
                                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isSelected ? 'bg-white/14 text-white dark:bg-[#111827]/10 dark:text-[#111827]' : 'bg-[#1118270a] text-[#6b7280] dark:bg-[#ffffff10] dark:text-[#cbd5e1]'}`}>
                                                                    {card.kind === 'cover' ? '封面' : card.kind === 'outro' ? '尾页' : '内容'}
                                                                </span>
                                                            </div>
                                                            <div className={`mt-1 truncate text-[13px] font-semibold ${isSelected ? 'text-white dark:text-[#111827]' : 'text-[#1d1d1f] dark:text-[#f5f5f7]'}`}>
                                                                {card.title}
                                                            </div>
                                                            <div className={`mt-1 line-clamp-2 text-[11px] leading-5 ${isSelected ? 'text-white/72 dark:text-[#111827]/70' : 'text-[#6e6e73] dark:text-[#a1a1a6]'}`}>
                                                                {card.summary}
                                                            </div>
                                                            {meta ? (
                                                                <div className={`mt-2 flex flex-wrap gap-1.5 text-[10px] ${isSelected ? 'text-white/72 dark:text-[#111827]/72' : 'text-[#9ca3af]'}`}>
                                                                    <span>{meta.captureWidth} x {meta.captureHeight}px</span>
                                                                    {meta.imageCount > 0 ? <span>{meta.imageCount} 图</span> : null}
                                                                    {meta.scaleApplied < 0.999 ? <span>{formatScaleLabel(meta.scaleApplied)}</span> : null}
                                                                    {meta.hasOverflow ? <span className="text-[#f59e0b]">建议拆卡</span> : null}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </SectionCard>
                            </div>
                        </aside>

                        <section className="min-h-0 overflow-y-auto px-3 py-3 md:px-4 md:py-4 xl:overflow-hidden xl:px-5 xl:py-4">
                            <div className="grid gap-4 xl:h-full xl:min-h-0 xl:grid-rows-[minmax(0,1.5fr)_minmax(220px,272px)]">
                                <section className="rounded-[30px] border border-[#00000010] bg-white/90 p-3 shadow-sm dark:border-[#ffffff10] dark:bg-[#17181d] md:p-4 xl:flex xl:min-h-0 xl:flex-col">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div className="min-w-0">
                                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">预览舞台</div>
                                            <h3 className="mt-2 truncate text-[22px] font-semibold tracking-[-0.03em] text-[#1d1d1f] dark:text-[#f5f5f7]">
                                                {selectedCard?.title || '当前卡片'}
                                            </h3>
                                            <p className="mt-1 max-w-[720px] text-[13px] leading-6 text-[#6e6e73] dark:text-[#a1a1a6]">
                                                {selectedCard?.summary || '正在准备当前卡片内容。'}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <StatusPill>{selectedMeta ? `${selectedMeta.captureWidth} x ${selectedMeta.captureHeight}px` : modeConfig.badge}</StatusPill>
                                            {selectedMeta?.imageCount ? <StatusPill>{selectedMeta.imageCount} 张图片</StatusPill> : null}
                                            {selectedMeta && selectedMeta.scaleApplied < 0.999 ? <StatusPill tone="warning">{formatScaleLabel(selectedMeta.scaleApplied)}</StatusPill> : null}
                                            {selectedMeta?.hasOverflow ? <StatusPill tone="warning">内容过长，建议拆卡</StatusPill> : null}
                                            {activeOptions.showPageNumber ? (
                                                <StatusPill>
                                                    页码 {selectedCard ? `${String(selectedCard.index + 1).padStart(2, '0')}/${String(cards.length).padStart(2, '0')}` : '--/--'}
                                                </StatusPill>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="mt-4 rounded-[28px] border border-[#0000000e] bg-[#f7f3eb] p-2.5 dark:border-[#ffffff10] dark:bg-[#121317] md:p-3 xl:flex-1 xl:min-h-0">
                                        <div
                                            className={`mx-auto flex max-w-[1120px] items-center justify-center rounded-[30px] border border-white/60 ${modeConfig.previewClassName} xl:h-full xl:max-w-none`}
                                            style={{
                                                background: `${modeConfig.previewBackground}, linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 100%)`,
                                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)'
                                            }}
                                        >
                                            {selectedDataUrl ? (
                                                cardMode === 'wechat' ? (
                                                    <div className="max-h-[78vh] w-full overflow-auto rounded-[24px] no-scrollbar xl:h-full xl:max-h-full">
                                                        <img
                                                            src={selectedDataUrl}
                                                            alt={selectedCard?.title || '当前卡片'}
                                                            className="mx-auto w-full max-w-[750px] rounded-[24px] shadow-[0_28px_60px_rgba(15,23,42,0.16)]"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="max-h-[78vh] w-full overflow-auto rounded-[24px] no-scrollbar xl:flex xl:h-full xl:max-h-full xl:items-center xl:justify-center">
                                                        <img
                                                            src={selectedDataUrl}
                                                            alt={selectedCard?.title || '当前卡片'}
                                                            className="mx-auto max-h-[78vh] w-auto rounded-[24px] object-contain shadow-[0_28px_60px_rgba(15,23,42,0.16)] xl:max-h-full"
                                                        />
                                                    </div>
                                                )
                                            ) : (
                                                <div className="flex h-full min-h-[360px] w-full flex-col items-center justify-center gap-3 text-center xl:min-h-0">
                                                    {selectedFailed ? (
                                                        <>
                                                            <span className="text-sm font-semibold text-rose-500">当前卡片渲染失败</span>
                                                            <span className="max-w-sm text-xs leading-6 text-[#6e6e73] dark:text-[#a1a1a6]">
                                                                可能是图片跨域、素材异常或某些极端样式导致的。你可以先回到对应卡片检查资源。
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Loader2 className="animate-spin text-[#6e6e73]" size={28} />
                                                            <span className="text-sm text-[#6e6e73] dark:text-[#a1a1a6]">正在生成这一张卡片的真实预览...</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <section
                                    ref={themeGalleryRef}
                                    className="rounded-[30px] border border-[#00000010] bg-white/90 p-4 shadow-sm dark:border-[#ffffff10] dark:bg-[#17181d] md:p-4 xl:flex xl:min-h-0 xl:flex-col"
                                >
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">
                                                <Palette size={13} />
                                                完整主题库
                                            </div>
                                            <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.03em] text-[#1d1d1f] dark:text-[#f5f5f7]">
                                                细一点看，再决定最终要发哪种感觉
                                            </h3>
                                            <p className="mt-1 text-[13px] leading-6 text-[#6e6e73] dark:text-[#a1a1a6]">
                                                {cardMode === 'social'
                                                    ? '上面先快速定风格，这里再细看 6 套社交主题的真实气质差异。'
                                                    : '上面先快速试精选主题，这里保留完整主题库，方便你慢慢对比。'}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <StatusPill>{themeList.length} 套可选主题</StatusPill>
                                            {selectedTheme ? <StatusPill>{selectedTheme.name}</StatusPill> : null}
                                        </div>
                                    </div>

                                    <div className="mt-4 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1 no-scrollbar">
                                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                                            {themeList.map((theme) => {
                                                const isActive = activeThemeId === theme.id;
                                                return (
                                                    <button
                                                        key={theme.id}
                                                        onClick={() => updateModeOptions(cardMode, { themeId: theme.id })}
                                                        className={`overflow-hidden rounded-[24px] border text-left transition ${
                                                            isActive
                                                                ? 'border-[#111827] bg-[#111827] text-white shadow-[0_18px_40px_rgba(17,24,39,0.18)] dark:border-white dark:bg-white dark:text-[#111827]'
                                                                : 'border-[#00000010] bg-[#faf9f5] hover:border-[#00000018] hover:bg-white dark:border-[#ffffff12] dark:bg-[#17181c] dark:hover:border-[#ffffff1f] dark:hover:bg-[#202127]'
                                                        }`}
                                                    >
                                                        <div
                                                            className="border-b border-[#00000008] p-3 dark:border-[#ffffff10]"
                                                            dangerouslySetInnerHTML={{ __html: buildThemePreviewMarkup(theme) }}
                                                        />
                                                        <div className="p-4">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className={`text-[15px] font-semibold ${isActive ? 'text-white dark:text-[#111827]' : 'text-[#1d1d1f] dark:text-[#f5f5f7]'}`}>
                                                                    {theme.name}
                                                                </div>
                                                                {isActive ? <StatusPill tone="dark">当前使用</StatusPill> : <StatusPill>{cardMode === 'social' ? '适合社交发布' : '适合长图阅读'}</StatusPill>}
                                                            </div>
                                                            <div className={`mt-2 text-[12px] leading-6 ${isActive ? 'text-white/78 dark:text-[#111827]/72' : 'text-[#6e6e73] dark:text-[#a1a1a6]'}`}>
                                                                {theme.description}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </section>
                    </div>
                )}

                {cardsToRender.map((card) => (
                    <CardRenderer
                        key={`${renderSignature}-${card.id}`}
                        card={card}
                        activeTheme={activeThemeId}
                        customTheme={appliedCustomTheme}
                        imageAssets={imageAssets}
                        cardWidth={modeConfig.width}
                        cardHeight={modeConfig.height}
                        cardPadding={modeConfig.padding}
                        renderMode={cardMode}
                        showPageNumber={activeOptions.showPageNumber}
                        pageLabel={`${String(card.index + 1).padStart(2, '0')}/${String(cards.length).padStart(2, '0')}`}
                        onRenderComplete={handleCardRenderComplete}
                    />
                ))}
            </motion.div>
        </div>
    );
}
