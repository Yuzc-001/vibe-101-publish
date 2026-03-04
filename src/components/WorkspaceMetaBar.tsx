import { BookText, Clock3, PanelRight, Save } from 'lucide-react';
import type { DocumentStats } from '../lib/documentMetrics';

interface WorkspaceMetaBarProps {
    documentTitle: string;
    activeThemeName: string;
    stats: DocumentStats;
    isSaving: boolean;
    lastSavedLabel: string;
    insightsOpen: boolean;
    onToggleInsights: () => void;
}

export default function WorkspaceMetaBar({
    documentTitle,
    activeThemeName,
    stats,
    isSaving,
    lastSavedLabel,
    insightsOpen,
    onToggleInsights
}: WorkspaceMetaBarProps) {
    const hasExplicitTitle = documentTitle && documentTitle !== 'untitled';

    return (
        <div className="glass-toolbar border-b border-[#00000010] dark:border-[#ffffff10] px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0 flex items-center gap-2">
                {hasExplicitTitle && (
                    <span className="ui-chip ui-chip-strong min-w-0 max-w-[52vw] sm:max-w-none">
                        <BookText size={13} />
                        <span className="truncate">{documentTitle}</span>
                    </span>
                )}
                <span className="ui-chip hidden lg:inline-flex">
                    主题: {activeThemeName}
                </span>
                <span className="ui-chip hidden md:inline-flex">
                    {stats.characterCount} 字 · 约 {stats.readMinutes} 分钟
                </span>
            </div>

            <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[12px] text-[#6e6e73] dark:text-[#a1a1a6]">
                    <Save size={12} />
                    {isSaving ? '保存中...' : `已保存 ${lastSavedLabel}`}
                </span>
                <button
                    onClick={onToggleInsights}
                    className={`ui-chip ${insightsOpen ? 'ui-chip-active' : ''}`}
                    title={insightsOpen ? '关闭排版信息面板' : '打开排版信息面板'}
                >
                    <PanelRight size={13} />
                    信息
                </button>
                <span className="ui-chip hidden sm:inline-flex">
                    <Clock3 size={12} />
                    {stats.lineCount} 行
                </span>
            </div>
        </div>
    );
}
