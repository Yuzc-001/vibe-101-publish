import type { Theme } from './types';
import { classicThemes } from './classic';
import { modernThemes } from './modern';
import { extraThemes } from './extra';
import { socialThemes } from './social';

export type { Theme, ThemeCustomConfig, ThemeStyleMode } from './types';
export const THEMES: Theme[] = [...classicThemes, ...modernThemes, ...extraThemes];
export const SOCIAL_THEMES: Theme[] = socialThemes;
export const ALL_THEMES: Theme[] = [...THEMES, ...SOCIAL_THEMES];
export const SOCIAL_THEME_IDS = SOCIAL_THEMES.map((theme) => theme.id) as readonly string[];

export interface ThemeGroup {
  label: string;
  themes: Theme[];
}

export const THEME_GROUPS: ThemeGroup[] = [
  { label: '经典', themes: classicThemes },
  { label: '潮流', themes: modernThemes },
  { label: '更多风格', themes: extraThemes },
];

function pickThemesByIds(ids: readonly string[]): Theme[] {
  return ids
    .map((id) => THEMES.find((theme) => theme.id === id))
    .filter((theme): theme is Theme => Boolean(theme));
}

export const REQUIRED_THEME_IDS = ['claude', 'wechat', 'notion', 'github'] as const;
export const RECOMMENDED_THEME_IDS = ['apple', 'sspai', 'medium', 'linear'] as const;
export const CURATED_THEME_IDS = [...REQUIRED_THEME_IDS, ...RECOMMENDED_THEME_IDS] as const;

export const REQUIRED_THEMES = pickThemesByIds(REQUIRED_THEME_IDS);
export const RECOMMENDED_THEMES = pickThemesByIds(RECOMMENDED_THEME_IDS);
export const CURATED_THEMES = pickThemesByIds(CURATED_THEME_IDS);

const curatedIdSet = new Set<string>(CURATED_THEME_IDS);

export const OTHER_THEME_GROUPS: ThemeGroup[] = THEME_GROUPS
  .map((group) => ({
    label: group.label,
    themes: group.themes.filter((theme) => !curatedIdSet.has(theme.id)),
  }))
  .filter((group) => group.themes.length > 0);
