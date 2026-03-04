export interface Theme {
  id: string;
  name: string;
  description: string;
  styles: Record<string, string>;
}

export type ThemeStyleMode = 'simple' | 'focus' | 'refined' | 'vivid';

export interface ThemeCustomConfig {
  enabled: boolean;
  primaryColor: string;
  styleMode: ThemeStyleMode;
}
