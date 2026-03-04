declare module 'markdown-it-texmath' {
    import type MarkdownIt from 'markdown-it';

    interface TexmathOptions {
        engine?: unknown;
        delimiters?: 'dollars' | 'brackets' | 'gitlab' | string;
        katexOptions?: Record<string, unknown>;
        outerSpace?: boolean;
    }

    type TexmathPlugin = (md: MarkdownIt, options?: TexmathOptions) => void;

    const texmath: TexmathPlugin;
    export default texmath;
}
