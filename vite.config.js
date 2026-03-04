var _a;
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vitejs.dev/config/
var isGitHubPages = process.env.GITHUB_PAGES === 'true';
var repoName = (_a = process.env.GITHUB_REPOSITORY) === null || _a === void 0 ? void 0 : _a.split('/')[1];
var pagesBase = repoName ? "/".concat(repoName, "/") : '/';
export default defineConfig({
    plugins: [react()],
    base: isGitHubPages ? pagesBase : '/',
    build: {
        chunkSizeWarningLimit: 900,
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (!id.includes('node_modules'))
                        return undefined;
                    if (id.includes('react') || id.includes('scheduler')) {
                        return 'react-vendor';
                    }
                    if (id.includes('framer-motion') || id.includes('lucide-react')) {
                        return 'ui-vendor';
                    }
                    if (id.includes('highlight.js')) {
                        return 'editor-highlight';
                    }
                    if (id.includes('markdown-it')) {
                        return 'editor-markdown';
                    }
                    if (id.includes('turndown')) {
                        return 'editor-convert';
                    }
                    if (id.includes('html2canvas')) {
                        return 'export-canvas';
                    }
                    if (id.includes('jspdf')) {
                        return 'export-jspdf';
                    }
                    if (id.includes('html2pdf.js')) {
                        return 'export-core';
                    }
                    return 'vendor';
                }
            }
        }
    }
});
