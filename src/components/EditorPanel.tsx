import React from 'react';
import { Wand2 } from 'lucide-react';
import { handleSmartPaste } from '../lib/htmlToMarkdown';
import type { DocumentStats } from '../lib/documentMetrics';

interface EditorPanelProps {
    markdownInput: string;
    onInputChange: (value: string) => void;
    editorScrollRef: React.RefObject<HTMLTextAreaElement>;
    onEditorScroll: () => void;
    scrollSyncEnabled: boolean;
    stats: Pick<DocumentStats, 'characterCount' | 'lineCount' | 'readMinutes' | 'headingCount' | 'imageCount'>;
}

export default function EditorPanel({
    markdownInput,
    onInputChange,
    editorScrollRef,
    onEditorScroll,
    scrollSyncEnabled,
    stats
}: EditorPanelProps) {
    const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        handleSmartPaste(e, markdownInput, onInputChange);
    };

    return (
        <div className="border-r border-[#00000012] dark:border-[#ffffff12] flex flex-col relative z-30 bg-transparent flex-1 min-h-0">
            <textarea
                ref={editorScrollRef}
                className="w-full flex-1 p-7 md:p-9 resize-none bg-transparent outline-none no-scrollbar text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] dark:placeholder-[#6e6e73] font-['JetBrains_Mono','Fira_Code','Consolas','Menlo','monospace'] text-[14px] md:text-[15px] leading-[1.85]"
                value={markdownInput}
                onChange={(e) => onInputChange(e.target.value)}
                onPaste={onPaste}
                onScroll={scrollSyncEnabled ? onEditorScroll : undefined}
                placeholder="在这里粘贴或输入 Markdown..."
                spellCheck={false}
            />

            <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-2.5 border-t border-[#00000010] dark:border-[#ffffff10] bg-[#fbfbfd]/60 dark:bg-[#17171a]/70 backdrop-blur-md">
                <div className="flex items-center gap-2 min-w-0">
                    <Wand2 size={14} className="text-[#0066cc] dark:text-[#0a84ff] shrink-0" />
                    <span className="text-[12px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                        <span className="hidden sm:inline">支持粘贴 <span className="text-[#86868b] dark:text-[#a1a1a6]">飞书 / Notion / Word</span> 内容并自动净化</span>
                        <span className="sm:hidden">支持富文本粘贴净化</span>
                    </span>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-1.5 text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">
                    <span className="ui-chip">{stats.characterCount} 字</span>
                    <span className="ui-chip">{stats.lineCount} 行</span>
                    <span className="ui-chip">{stats.headingCount} 标题</span>
                    <span className="ui-chip">{stats.imageCount} 图片</span>
                    <span className="ui-chip">约 {stats.readMinutes} 分钟</span>
                </div>
            </div>
        </div>
    );
}
