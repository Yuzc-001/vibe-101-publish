import { useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { md, preprocessMarkdown, applyTheme } from '../lib/markdown';
import { resolveImageAssetUrls, type ImageAssetMap } from '../lib/imageAssets';
import type { Card } from '../lib/cardSplitter';
import type { ThemeCustomConfig } from '../lib/themes';

export interface CardRenderMeta {
    captureWidth: number;
    captureHeight: number;
    imageCount: number;
    scaleApplied: number;
    hasOverflow: boolean;
}

interface CardRendererProps {
    card: Card;
    activeTheme: string;
    customTheme?: ThemeCustomConfig;
    imageAssets: ImageAssetMap;
    cardWidth?: number;
    cardHeight?: number;
    cardPadding?: number;
    renderMode?: 'wechat' | 'social';
    showPageNumber?: boolean;
    pageLabel?: string;
    onRenderComplete: (cardId: string, dataUrl: string, meta: CardRenderMeta) => void;
}

function appendInlineStyle(element: HTMLElement, styleText: string) {
    const currentStyle = element.getAttribute('style') || '';
    element.setAttribute('style', `${currentStyle}; ${styleText}`);
}

function isLikelyBrokenImageSrc(src: string | null): boolean {
    const value = String(src || '').trim();
    if (!value) return true;
    if (/^vibe-asset:\/\//i.test(value)) return true;
    if (/^data:image\/[a-zA-Z0-9.+-]+;base64,\.\.\.$/i.test(value)) return true;
    if (/[\\$]/.test(value)) return true;
    return false;
}

function removeImageNodeWithContainerFallback(image: HTMLImageElement) {
    const anchorParent = image.parentElement?.tagName === 'A' ? image.parentElement : null;
    const candidate = anchorParent ?? image;
    const parent = candidate.parentElement;

    if (
        parent &&
        ['P', 'SPAN', 'DIV'].includes(parent.tagName) &&
        Array.from(parent.childNodes).every((node) => {
            if (node === candidate) return true;
            return node.nodeType === Node.TEXT_NODE && !(node.textContent || '').trim();
        })
    ) {
        parent.remove();
        return;
    }

    candidate.remove();
}

function pruneEmptyContainers(contentRoot: HTMLDivElement) {
    const selectors = ['p', 'div', 'span', 'a'];
    selectors.forEach((selector) => {
        Array.from(contentRoot.querySelectorAll(selector)).forEach((node) => {
            const element = node as HTMLElement;
            if (element.querySelector('img, table, pre, blockquote, ul, ol, hr, h1, h2, h3, h4, h5, h6')) return;
            if ((element.textContent || '').trim()) return;
            if (element === contentRoot.firstElementChild) return;
            element.remove();
        });
    });

    Array.from(contentRoot.querySelectorAll('.image-grid')).forEach((grid) => {
        if (!grid.querySelector('img')) {
            grid.remove();
        }
    });
}

function sanitizeBrokenImages(contentRoot: HTMLDivElement): number {
    const images = Array.from(contentRoot.querySelectorAll('img')) as HTMLImageElement[];

    images.forEach((image) => {
        const src = image.getAttribute('src');
        const failed =
            isLikelyBrokenImageSrc(src) ||
            image.naturalWidth === 0 ||
            image.naturalHeight === 0 ||
            (image.complete && !image.currentSrc);

        if (failed) {
            removeImageNodeWithContainerFallback(image);
        }
    });

    pruneEmptyContainers(contentRoot);
    return contentRoot.querySelectorAll('img').length;
}

function applySocialImageLayout(contentRoot: HTMLDivElement): number {
    const imageGrids = Array.from(contentRoot.querySelectorAll('.image-grid'));
    imageGrids.forEach((grid) => {
        appendInlineStyle(grid as HTMLElement, 'gap: 10px !important; align-items: stretch !important; margin: 18px 0 !important;');
    });

    const images = Array.from(contentRoot.querySelectorAll('img')) as HTMLImageElement[];
    images.forEach((image) => {
        const ratio =
            image.naturalWidth > 0 && image.naturalHeight > 0
                ? image.naturalWidth / image.naturalHeight
                : 1;

        if (image.closest('.image-grid')) {
            appendInlineStyle(
                image,
                [
                    'width: calc(50% - 5px) !important',
                    'max-width: calc(50% - 5px) !important',
                    'height: 136px !important',
                    'max-height: 136px !important',
                    'object-fit: contain !important',
                    'object-position: center center !important',
                    'background: rgba(255, 255, 255, 0.72) !important',
                    'padding: 8px !important',
                    'margin: 0 !important',
                    'border-radius: 16px !important'
                ].join('; ')
            );
            return;
        }

        if (ratio >= 1.4) {
            appendInlineStyle(
                image,
                [
                    'width: 100% !important',
                    'max-width: 100% !important',
                    'height: 188px !important',
                    'max-height: 188px !important',
                    'object-fit: contain !important',
                    'object-position: center center !important',
                    'background: rgba(255, 255, 255, 0.7) !important',
                    'padding: 10px !important',
                    'margin: 16px auto !important',
                    'border-radius: 18px !important'
                ].join('; ')
            );
            return;
        }

        if (ratio <= 0.85) {
            appendInlineStyle(
                image,
                [
                    'width: 74% !important',
                    'max-width: 220px !important',
                    'height: 220px !important',
                    'max-height: 220px !important',
                    'object-fit: contain !important',
                    'object-position: center center !important',
                    'background: rgba(255, 255, 255, 0.76) !important',
                    'padding: 8px !important',
                    'margin: 16px auto !important',
                    'border-radius: 18px !important'
                ].join('; ')
            );
            return;
        }

        appendInlineStyle(
            image,
            [
                'width: 82% !important',
                'max-width: 240px !important',
                'height: 196px !important',
                'max-height: 196px !important',
                'object-fit: contain !important',
                'object-position: center center !important',
                'background: rgba(255, 255, 255, 0.74) !important',
                'padding: 8px !important',
                'margin: 16px auto !important',
                'border-radius: 18px !important'
            ].join('; ')
        );
    });

    return images.length;
}

function fitSocialCardContent(contentRoot: HTMLDivElement) {
    const themedRoot = contentRoot.firstElementChild as HTMLElement | null;
    if (!themedRoot) {
        return {
            scaleApplied: 1,
            hasOverflow: false
        };
    }

    themedRoot.style.transform = '';
    themedRoot.style.transformOrigin = '';
    themedRoot.style.width = '100%';

    const availableHeight = contentRoot.clientHeight;
    const requiredHeight = Math.ceil(themedRoot.scrollHeight);

    if (requiredHeight <= availableHeight) {
        return {
            scaleApplied: 1,
            hasOverflow: false
        };
    }

    const rawScale = availableHeight / requiredHeight;
    const scaleApplied = Math.max(0.82, Math.min(1, Number(rawScale.toFixed(3))));

    themedRoot.style.transform = `scale(${scaleApplied})`;
    themedRoot.style.transformOrigin = 'top center';
    themedRoot.style.width = `${(100 / scaleApplied).toFixed(3)}%`;

    return {
        scaleApplied,
        hasOverflow: requiredHeight * scaleApplied > availableHeight + 6
    };
}

export function CardRenderer({
    card,
    activeTheme,
    customTheme,
    imageAssets,
    cardWidth = 750,
    cardHeight,
    cardPadding = 40,
    renderMode = 'wechat',
    showPageNumber = false,
    pageLabel,
    onRenderComplete
}: CardRendererProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;

        const renderCard = async () => {
            if (!cardRef.current || !contentRef.current) return;

            try {
                const resolvedMarkdown = resolveImageAssetUrls(card.markdown, imageAssets);
                const rawHtml = md.render(preprocessMarkdown(resolvedMarkdown));
                const styledHtml = applyTheme(rawHtml, activeTheme, customTheme);
                contentRef.current.innerHTML = styledHtml;

                const imagePromises = Array.from(contentRef.current.querySelectorAll('img')).map((image) => {
                    if (image.complete) return Promise.resolve();
                    return new Promise<void>((resolve) => {
                        const finish = () => resolve();
                        image.addEventListener('load', finish, { once: true });
                        image.addEventListener('error', finish, { once: true });
                        window.setTimeout(finish, 3000);
                    });
                });

                const fontsReady =
                    'fonts' in document && document.fonts
                        ? document.fonts.ready.then(() => undefined).catch(() => undefined)
                        : Promise.resolve();

                await Promise.all([fontsReady, ...imagePromises]);

                if (cancelled || !cardRef.current) return;

                let imageCount = sanitizeBrokenImages(contentRef.current);
                let scaleApplied = 1;
                let hasOverflow = false;

                if (renderMode === 'social') {
                    imageCount = applySocialImageLayout(contentRef.current);
                    const fitResult = fitSocialCardContent(contentRef.current);
                    scaleApplied = fitResult.scaleApplied;
                    hasOverflow = fitResult.hasOverflow;
                }

                const captureHeight = Math.ceil(cardHeight ?? cardRef.current.scrollHeight);
                const canvas = await html2canvas(cardRef.current, {
                    backgroundColor: null,
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    width: cardWidth,
                    height: captureHeight,
                    windowWidth: cardWidth,
                    windowHeight: captureHeight
                });

                if (cancelled) {
                    canvas.width = 0;
                    canvas.height = 0;
                    return;
                }

                const dataUrl = canvas.toDataURL('image/png');
                onRenderComplete(card.id, dataUrl, {
                    captureWidth: cardWidth,
                    captureHeight,
                    imageCount,
                    scaleApplied,
                    hasOverflow
                });

                canvas.width = 0;
                canvas.height = 0;
            } catch (error) {
                console.error(`Card ${card.id} render failed:`, error);
                if (!cancelled) {
                    onRenderComplete(card.id, '', {
                        captureWidth: cardWidth,
                        captureHeight: cardHeight ?? 0,
                        imageCount: 0,
                        scaleApplied: 1,
                        hasOverflow: false
                    });
                }
            }
        };

        void renderCard();

        return () => {
            cancelled = true;
        };
    }, [
        card,
        activeTheme,
        customTheme,
        imageAssets,
        cardWidth,
        cardHeight,
        cardPadding,
        renderMode,
        showPageNumber,
        pageLabel,
        onRenderComplete
    ]);

    const badgeStyle =
        renderMode === 'social'
            ? {
                  background: 'rgba(255, 255, 255, 0.86)',
                  color: '#4b3627',
                  border: '1px solid rgba(255, 255, 255, 0.72)',
                  boxShadow: '0 12px 24px rgba(74, 54, 39, 0.12)'
              }
            : {
                  background: 'rgba(255, 255, 255, 0.96)',
                  color: '#4b5563',
                  border: '1px solid rgba(15, 23, 42, 0.08)',
                  boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)'
              };

    return (
        <div
            ref={cardRef}
            style={{
                position: 'fixed',
                left: '-20000px',
                top: '0',
                width: `${cardWidth}px`,
                height: cardHeight ? `${cardHeight}px` : 'auto',
                minHeight: cardHeight ? `${cardHeight}px` : undefined,
                padding: `${cardPadding}px`,
                boxSizing: 'border-box',
                background:
                    renderMode === 'social'
                        ? 'linear-gradient(180deg, #f7f3eb 0%, #efe9df 100%)'
                        : '#ffffff',
                pointerEvents: 'none',
                overflow: 'hidden'
            }}
            aria-hidden="true"
        >
            <div
                ref={contentRef}
                style={{
                    height: cardHeight ? '100%' : 'auto'
                }}
            />

            {showPageNumber && pageLabel ? (
                <div
                    style={{
                        position: 'absolute',
                        right: `${Math.max(16, cardPadding - 4)}px`,
                        bottom: `${Math.max(16, cardPadding - 6)}px`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '60px',
                        padding: '6px 12px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        backdropFilter: 'blur(10px)',
                        ...badgeStyle
                    }}
                >
                    {pageLabel}
                </div>
            ) : null}
        </div>
    );
}
