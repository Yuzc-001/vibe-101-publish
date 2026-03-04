import type { Theme, ThemeCustomConfig } from './types';

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
const DEFAULT_PRIMARY = '#2bae85';

function normalizeHexColor(rawColor: string, fallback: string = DEFAULT_PRIMARY): string {
  const value = rawColor.trim();
  if (!HEX_COLOR_PATTERN.test(value)) return fallback;

  if (value.length === 4) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`.toLowerCase();
  }

  return value.toLowerCase();
}

function hexToRgba(hexColor: string, alpha: number): string {
  const normalized = normalizeHexColor(hexColor).slice(1);
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function appendStyle(styles: Record<string, string>, selector: string, inlineStyle: string): void {
  const current = styles[selector] ?? '';
  styles[selector] = `${current} ${inlineStyle}`.trim();
}

export function resolveThemeStyles(theme: Theme, custom?: ThemeCustomConfig): Record<string, string> {
  const resolvedStyles: Record<string, string> = { ...theme.styles };
  if (!custom?.enabled) return resolvedStyles;

  const primary = normalizeHexColor(custom.primaryColor);
  const tintSoft = hexToRgba(primary, 0.08);
  const tintMedium = hexToRgba(primary, 0.14);
  const tintStrong = hexToRgba(primary, 0.22);

  appendStyle(resolvedStyles, 'h1', `color: ${primary} !important;`);
  appendStyle(resolvedStyles, 'h2', `color: ${primary} !important;`);
  appendStyle(resolvedStyles, 'a', `color: ${primary} !important; border-bottom-color: ${primary} !important;`);
  appendStyle(resolvedStyles, 'strong', `color: ${primary} !important;`);
  appendStyle(resolvedStyles, 'blockquote', `border-left-color: ${primary} !important;`);
  appendStyle(resolvedStyles, 'code', `color: ${primary} !important;`);

  if (custom.styleMode === 'simple') {
    appendStyle(resolvedStyles, 'p', 'margin: 14px 0 !important; line-height: 1.72 !important;');
    appendStyle(resolvedStyles, 'h1', 'letter-spacing: -0.01em !important;');
    appendStyle(resolvedStyles, 'h2', 'letter-spacing: -0.008em !important;');
    appendStyle(resolvedStyles, 'blockquote', 'background-color: transparent !important; border-left-width: 3px !important; border-radius: 0 !important;');
    appendStyle(resolvedStyles, 'pre', 'border-radius: 8px !important;');
  }

  if (custom.styleMode === 'focus') {
    appendStyle(resolvedStyles, 'p', 'line-height: 1.82 !important;');
    appendStyle(resolvedStyles, 'h2', `padding-left: 10px !important; border-left: 4px solid ${primary} !important;`);
    appendStyle(resolvedStyles, 'blockquote', `background-color: ${tintSoft} !important;`);
    appendStyle(resolvedStyles, 'hr', `background-color: ${tintMedium} !important;`);
  }

  if (custom.styleMode === 'refined') {
    appendStyle(resolvedStyles, 'blockquote', `background-color: ${tintSoft} !important; border-radius: 12px !important;`);
    appendStyle(resolvedStyles, 'code', `background-color: ${tintSoft} !important; border-radius: 8px !important;`);
    appendStyle(resolvedStyles, 'pre', `background-color: ${tintSoft} !important; border-radius: 14px !important;`);
    appendStyle(resolvedStyles, 'img', 'border-radius: 14px !important;');
    appendStyle(resolvedStyles, 'th', `background-color: ${hexToRgba(primary, 0.12)} !important;`);
  }

  if (custom.styleMode === 'vivid') {
    appendStyle(resolvedStyles, 'h1', `text-shadow: 0 5px 18px ${tintMedium};`);
    appendStyle(resolvedStyles, 'h2', `padding-bottom: 8px !important; border-bottom: 2px solid ${primary} !important;`);
    appendStyle(resolvedStyles, 'strong', `background-color: ${tintStrong} !important; padding: 0 5px !important; border-radius: 5px !important;`);
    appendStyle(resolvedStyles, 'blockquote', `background: linear-gradient(135deg, ${tintMedium} 0%, ${tintSoft} 100%) !important; border-left-width: 5px !important;`);
    appendStyle(resolvedStyles, 'code', `background-color: ${tintMedium} !important;`);
    appendStyle(resolvedStyles, 'hr', `height: 2px !important; background-color: ${primary} !important; opacity: 0.7;`);
  }

  return resolvedStyles;
}
