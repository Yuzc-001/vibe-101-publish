export const IMAGE_ASSET_URL_PREFIX = 'vibe-asset://';

export type ImageAssetMap = Record<string, string>;

export interface ImageAssetPreview {
    id: string;
    index: number;
    alt: string;
    src: string;
}

const IMAGE_TOKEN_PATTERN = /!\[([^\]]*)\]\((vibe-asset:\/\/([^) \t]+))(?:\s+"([^"]*)")?\)/g;
const DATA_URI_IMAGE_PATTERN = /!\[([^\]]*)\]\((data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+)(?:\s+"([^"]*)")?\)/g;
const MIN_DATA_URI_LENGTH_TO_CONVERT = 256;

function createAssetId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).slice(2, 10);
    return `img_${timestamp}_${randomPart}`;
}

function findAssetIdByDataUrl(assets: ImageAssetMap, dataUrl: string): string | null {
    const entries = Object.entries(assets);
    for (const [assetId, value] of entries) {
        if (value === dataUrl) return assetId;
    }
    return null;
}

export function createImageAsset(
    assets: ImageAssetMap,
    dataUrl: string
): { id: string; nextAssets: ImageAssetMap } {
    const existingId = findAssetIdByDataUrl(assets, dataUrl);
    if (existingId) {
        return { id: existingId, nextAssets: assets };
    }

    const assetId = createAssetId();
    return {
        id: assetId,
        nextAssets: {
            ...assets,
            [assetId]: dataUrl
        }
    };
}

export function replaceDataUriImagesWithAssetUrls(
    markdown: string,
    assets: ImageAssetMap
): { nextMarkdown: string; nextAssets: ImageAssetMap; changed: boolean } {
    let nextAssets = assets;
    let changed = false;

    const nextMarkdown = markdown.replace(
        DATA_URI_IMAGE_PATTERN,
        (fullMatch: string, altRaw: string, dataUrlRaw: string, titleRaw?: string) => {
            const dataUrl = String(dataUrlRaw || '');
            if (!dataUrl.startsWith('data:image/')) return fullMatch;
            if (dataUrl.length < MIN_DATA_URI_LENGTH_TO_CONVERT) return fullMatch;

            const created = createImageAsset(nextAssets, dataUrl);
            nextAssets = created.nextAssets;
            changed = true;

            const alt = String(altRaw || '图片');
            const title = titleRaw ? ` "${titleRaw}"` : '';
            return `![${alt}](${IMAGE_ASSET_URL_PREFIX}${created.id})${title}`;
        }
    );

    return { nextMarkdown, nextAssets, changed };
}

export function resolveImageAssetUrls(markdown: string, assets: ImageAssetMap): string {
    return markdown.replace(
        IMAGE_TOKEN_PATTERN,
        (fullMatch: string, altRaw: string, _assetUrl: string, assetIdRaw: string, titleRaw?: string) => {
            const assetId = String(assetIdRaw || '');
            const source = assets[assetId];
            if (!source) return fullMatch;

            const alt = String(altRaw || '图片');
            const title = titleRaw ? ` "${titleRaw}"` : '';
            return `![${alt}](${source})${title}`;
        }
    );
}

export function collectImageAssetPreviews(markdown: string, assets: ImageAssetMap): ImageAssetPreview[] {
    const previews: ImageAssetPreview[] = [];
    let match: RegExpExecArray | null;
    let order = 0;

    IMAGE_TOKEN_PATTERN.lastIndex = 0;
    while (true) {
        match = IMAGE_TOKEN_PATTERN.exec(markdown);
        if (!match) break;

        const alt = String(match[1] || '图片');
        const assetId = String(match[3] || '');
        const src = assets[assetId];
        if (!src) continue;

        order += 1;
        previews.push({
            id: assetId,
            index: order,
            alt,
            src
        });
    }

    return previews;
}
