declare module 'turndown-plugin-gfm' {
    import type TurndownService from 'turndown';

    export const gfm: (service: TurndownService) => void;
    export const tables: (service: TurndownService) => void;
    export const strikethrough: (service: TurndownService) => void;
}
