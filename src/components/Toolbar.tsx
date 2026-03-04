import {
    ChevronDown,
    CheckCircle2,
    Copy,
    Download,
    FileText,
    Link2,
    Loader2,
    Monitor,
    PanelRightClose,
    PanelRightOpen,
    Smartphone,
    Tablet,
    Unlink2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';

interface ToolbarProps {
    previewDevice: 'mobile' | 'tablet' | 'pc';
    onDeviceChange: (device: 'mobile' | 'tablet' | 'pc') => void;
    onExportPdf: () => void;
    onExportHtml: () => void;
    onExportWordDoc: () => void;
    onExportWordDocx: () => void;
    onCopyWord: () => void;
    wordCopied: boolean;
    onCopy: () => void;
    copied: boolean;
    isCopying: boolean;
    scrollSyncEnabled: boolean;
    onToggleScrollSync: () => void;
    insightsOpen: boolean;
    onToggleInsights: () => void;
}

function DeviceButton({
    active,
    title,
    onClick,
    children
}: {
    active: boolean;
    title: string;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={`ui-icon-btn ${active ? 'ui-icon-btn-active' : ''}`}
            title={title}
        >
            {children}
        </button>
    );
}

export default function Toolbar({
    previewDevice,
    onDeviceChange,
    onExportPdf,
    onExportHtml,
    onExportWordDoc,
    onExportWordDocx,
    onCopyWord,
    wordCopied,
    onCopy,
    copied,
    isCopying,
    scrollSyncEnabled,
    onToggleScrollSync,
    insightsOpen,
    onToggleInsights
}: ToolbarProps) {
    const [isWordExportMenuOpen, setIsWordExportMenuOpen] = useState(false);
    const wordExportButtonRef = useRef<HTMLButtonElement>(null);
    const wordExportMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isWordExportMenuOpen) return;
        const onMouseDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (wordExportButtonRef.current?.contains(target)) return;
            if (wordExportMenuRef.current?.contains(target)) return;
            setIsWordExportMenuOpen(false);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsWordExportMenuOpen(false);
            }
        };

        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [isWordExportMenuOpen]);

    const wordMenuRect = wordExportButtonRef.current?.getBoundingClientRect();

    return (
        <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 min-w-0">
            <div className="hidden md:flex ui-chip-group shrink-0">
                <DeviceButton
                    active={previewDevice === 'mobile'}
                    title="手机视图 (480px)"
                    onClick={() => onDeviceChange('mobile')}
                >
                    <Smartphone size={15} />
                </DeviceButton>
                <DeviceButton
                    active={previewDevice === 'tablet'}
                    title="平板视图 (768px)"
                    onClick={() => onDeviceChange('tablet')}
                >
                    <Tablet size={15} />
                </DeviceButton>
                <DeviceButton
                    active={previewDevice === 'pc'}
                    title="桌面视图 (PC)"
                    onClick={() => onDeviceChange('pc')}
                >
                    <Monitor size={15} />
                </DeviceButton>
            </div>

            <div className="ml-auto flex items-center gap-2 min-w-0 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 shrink-0">
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onToggleInsights}
                        className={`ui-tool-btn ${insightsOpen ? 'ui-tool-btn-active' : ''}`}
                        title={insightsOpen ? '隐藏排版信息面板' : '显示排版信息面板'}
                    >
                        {insightsOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
                        <span className="hidden xl:inline">{insightsOpen ? '隐藏信息' : '显示信息'}</span>
                        <span className="xl:hidden">{insightsOpen ? '隐藏' : '信息'}</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onToggleScrollSync}
                        className={`ui-tool-btn ${scrollSyncEnabled ? 'ui-tool-btn-active' : ''}`}
                        title={scrollSyncEnabled ? '关闭滚动同步' : '开启滚动同步'}
                    >
                        {scrollSyncEnabled ? <Link2 size={14} /> : <Unlink2 size={14} />}
                        <span className="hidden xl:inline">{scrollSyncEnabled ? '同步滚动' : '独立滚动'}</span>
                        <span className="xl:hidden">{scrollSyncEnabled ? '同步' : '独立'}</span>
                    </motion.button>
                </div>

                <div className="h-5 w-px bg-[#00000012] dark:bg-[#ffffff18] shrink-0" />

                <div className="flex items-center gap-2 shrink-0">
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onExportPdf}
                        className="ui-tool-btn hidden sm:flex"
                    >
                        <Download size={14} />
                        <span className="hidden xl:inline">导出 PDF</span>
                        <span className="xl:hidden">PDF</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onExportHtml}
                        className="ui-tool-btn hidden lg:flex"
                    >
                        <Download size={14} />
                        <span className="hidden xl:inline">导出 HTML</span>
                        <span className="xl:hidden">HTML</span>
                    </motion.button>

                    <motion.button
                        ref={wordExportButtonRef}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsWordExportMenuOpen((previous) => !previous)}
                        className={`ui-tool-btn ${isWordExportMenuOpen ? 'ui-tool-btn-active' : ''}`}
                        title="导出 Word（选择 DOCX 或 DOC）"
                    >
                        <FileText size={14} />
                        <span className="hidden xl:inline">导出 Word</span>
                        <span className="xl:hidden">Word</span>
                        <ChevronDown size={12} className={`transition-transform ${isWordExportMenuOpen ? 'rotate-180' : ''}`} />
                    </motion.button>
                </div>

                <div className="h-5 w-px bg-[#00000012] dark:bg-[#ffffff18] shrink-0" />

                <div className="flex items-center gap-2 shrink-0">
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onCopyWord}
                        className={wordCopied ? 'ui-tool-btn ui-tool-btn-active' : 'ui-tool-btn'}
                        title="复制到 Word"
                    >
                        <Copy size={14} />
                        <span className="hidden xl:inline">{wordCopied ? '已复制到 Word' : '复制 Word'}</span>
                        <span className="xl:hidden">{wordCopied ? '已复制' : 'Word'}</span>
                    </motion.button>
                </div>

                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onCopy}
                    disabled={isCopying}
                    className={
                        copied
                            ? 'ui-primary-btn ui-primary-btn-success'
                            : isCopying
                              ? 'ui-primary-btn opacity-85 cursor-not-allowed'
                              : 'ui-primary-btn'
                    }
                >
                    {copied ? <CheckCircle2 size={16} /> : isCopying ? <Loader2 className="animate-spin" size={16} /> : <Copy size={16} />}
                    <span className="hidden xl:inline">
                        {copied ? '已复制，可粘贴到公众号' : isCopying ? '正在处理图片...' : '复制到公众号'}
                    </span>
                    <span className="xl:hidden">
                        {copied ? '已复制' : isCopying ? '处理中' : '复制'}
                    </span>
                </motion.button>
            </div>

            {isWordExportMenuOpen && wordMenuRect && (
                <div
                    ref={wordExportMenuRef}
                    className="fixed z-[140] min-w-[172px] rounded-[14px] border border-[#00000012] dark:border-[#ffffff18] bg-white dark:bg-[#1d1d21] shadow-apple-lg p-1.5"
                    style={{
                        top: wordMenuRect.bottom + 8,
                        left: Math.max(12, wordMenuRect.right - 172)
                    }}
                >
                    <button
                        onClick={() => {
                            onExportWordDocx();
                            setIsWordExportMenuOpen(false);
                        }}
                        className="w-full ui-tool-btn !justify-start !h-[32px]"
                    >
                        <FileText size={13} />
                        导出 .docx（推荐）
                    </button>
                    <button
                        onClick={() => {
                            onExportWordDoc();
                            setIsWordExportMenuOpen(false);
                        }}
                        className="w-full ui-tool-btn !justify-start !h-[32px] mt-1"
                    >
                        <Download size={13} />
                        导出 .doc
                    </button>
                </div>
            )}
        </div>
    );
}
