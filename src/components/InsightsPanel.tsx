import { FileText, Heading, Image as ImageIcon, Link2, Timer } from 'lucide-react';
import type { DocumentStats, HeadingItem } from '../lib/documentMetrics';

interface InsightsPanelProps {
    documentTitle: string;
    stats: DocumentStats;
    headings: HeadingItem[];
    onJumpToHeading: (line: number) => void;
    onClose?: () => void;
}

function buildHints(stats: DocumentStats): string[] {
    const hints: string[] = [];

    if (stats.headingCount < 3) hints.push('建议增加小标题，结构会更清晰。');
    if (stats.imageCount === 0) hints.push('建议加入至少 1 张配图，阅读节奏更稳。');
    if (stats.linkCount > 6) hints.push('外链偏多，建议保留关键链接。');
    if (stats.codeBlockCount > 0 && stats.paragraphCount < stats.codeBlockCount * 2) {
        hints.push('代码段较密，建议补充解释文字。');
    }
    if (stats.readMinutes > 8) hints.push('预估阅读时长较长，可拆为上下篇。');

    if (hints.length === 0) hints.push('结构与长度均衡，可以直接进入发布环节。');
    return hints.slice(0, 3);
}

export default function InsightsPanel({
    documentTitle,
    stats,
    headings,
    onJumpToHeading,
    onClose
}: InsightsPanelProps) {
    const hints = buildHints(stats);

    return (
        <aside className="glass-panel h-full flex flex-col">
            <div className="px-4 py-3 border-b border-[#00000010] dark:border-[#ffffff10]">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="ui-caption">Typesetting Metrics</p>
                        <h2 className="mt-1 text-[14px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] truncate">{documentTitle}</h2>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="xl:hidden ui-chip"
                            title="关闭侧栏"
                        >
                            关闭
                        </button>
                    )}
                </div>
            </div>

            <div className="p-4 overflow-y-auto no-scrollbar space-y-4">
                <section className="grid grid-cols-2 gap-2">
                    <div className="metric-card">
                        <p className="metric-label">总字数</p>
                        <p className="metric-value">{stats.characterCount}</p>
                    </div>
                    <div className="metric-card">
                        <p className="metric-label">预计阅读</p>
                        <p className="metric-value">{stats.readMinutes} 分钟</p>
                    </div>
                    <div className="metric-card">
                        <p className="metric-label">段落 / 标题</p>
                        <p className="metric-value">{stats.paragraphCount} / {stats.headingCount}</p>
                    </div>
                    <div className="metric-card">
                        <p className="metric-label">图片 / 链接</p>
                        <p className="metric-value">{stats.imageCount} / {stats.linkCount}</p>
                    </div>
                </section>

                <section>
                    <div className="section-title">
                        <Heading size={14} />
                        结构目录
                    </div>
                    <div className="mt-2 space-y-1">
                        {headings.length === 0 && (
                            <p className="ui-empty-note">还没有标题，建议先写一个 `# 一级标题`。</p>
                        )}
                        {headings.map((heading) => (
                            <button
                                key={`${heading.line}-${heading.text}`}
                                onClick={() => onJumpToHeading(heading.line)}
                                className="toc-item"
                                style={{ paddingLeft: `${(heading.level - 1) * 12 + 10}px` }}
                                title={`跳转到第 ${heading.line} 行`}
                            >
                                {heading.text}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="ui-tip-panel">
                    <div className="section-title !mb-1 text-[#7a4a19] dark:text-[#ffd3a7]">
                        <FileText size={14} />
                        发布建议
                    </div>
                    <div className="text-[11.5px] leading-[1.65] text-[#7a4a19] dark:text-[#ffd3a7] space-y-1">
                        {hints.map((hint) => (
                            <p key={hint}>- {hint}</p>
                        ))}
                    </div>
                </section>

                <section className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="metric-mini">
                        <Timer size={12} />
                        {stats.lineCount} 行
                    </div>
                    <div className="metric-mini">
                        <ImageIcon size={12} />
                        {stats.imageCount} 图
                    </div>
                    <div className="metric-mini">
                        <Link2 size={12} />
                        {stats.linkCount} 链
                    </div>
                </section>
            </div>
        </aside>
    );
}
