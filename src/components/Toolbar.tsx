import {
    ChevronDown,
    CheckCircle2,
    Copy,
    Download,
    FileText,
    Image as ImageIcon,
    Link2,
    Loader2,
    Monitor,
    MoreHorizontal,
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
    onCopyZhihu: () => void;
    zhihuCopied: boolean;
    isZhihuCopying: boolean;
    onCopy: () => void;
    copied: boolean;
    isCopying: boolean;
    onToggleCardMode: () => void;
    cardModeOpen: boolean;
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
    onCopyZhihu,
    zhihuCopied,
    isZhihuCopying,
    onCopy,
    copied,
    isCopying,
    onToggleCardMode,
    cardModeOpen,
    scrollSyncEnabled,
    onToggleScrollSync,
    insightsOpen,
    onToggleInsights
}: ToolbarProps) {
    const [openMenu, setOpenMenu] = useState<'export' | 'more' | null>(null);
    const exportButtonRef = useRef<HTMLButtonElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const moreButtonRef = useRef<HTMLButtonElement>(null);
    const moreMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!openMenu) return;
        const onMouseDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (exportButtonRef.current?.contains(target)) return;
            if (exportMenuRef.current?.contains(target)) return;
            if (moreButtonRef.current?.contains(target)) return;
            if (moreMenuRef.current?.contains(target)) return;
            setOpenMenu(null);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpenMenu(null);
            }
        };

        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [openMenu]);

    const exportMenuRect = exportButtonRef.current?.getBoundingClientRect();
    const moreMenuRect = moreButtonRef.current?.getBoundingClientRect();

    const getMenuLeft = (rect: DOMRect | undefined, width: number) => {
        if (!rect) return 12;
        if (typeof window === 'undefined') return Math.max(12, rect.right - width);
        return Math.max(12, Math.min(window.innerWidth - width - 12, rect.right - width));
    };

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
                <div className="hidden lg:flex items-center gap-2 shrink-0">
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onToggleInsights}
                        className={`ui-tool-btn ${insightsOpen ? 'ui-tool-btn-active' : ''}`}
                        title={insightsOpen ? '隐藏排版信息面板' : '显示排版信息面板'}
                    >
                        {insightsOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
                        <span>排版信息</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onToggleCardMode}
                        className={`ui-tool-btn ${cardModeOpen ? 'ui-tool-btn-active' : ''}`}
                        title="打开卡片模式"
                    >
                        <ImageIcon size={14} />
                        <span>卡片模式</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onToggleScrollSync}
                        className={`ui-tool-btn ${scrollSyncEnabled ? 'ui-tool-btn-active' : ''}`}
                        title={scrollSyncEnabled ? '关闭滚动同步' : '开启滚动同步'}
                    >
                        {scrollSyncEnabled ? <Link2 size={14} /> : <Unlink2 size={14} />}
                        <span>滚动同步</span>
                    </motion.button>
                </div>

                <div className="h-5 w-px bg-[#00000012] dark:bg-[#ffffff18] shrink-0" />

                <div className="flex items-center gap-2 shrink-0">
                    <motion.button
                        ref={exportButtonRef}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setOpenMenu((previous) => (previous === 'export' ? null : 'export'))}
                        className={`ui-tool-btn ${openMenu === 'export' ? 'ui-tool-btn-active' : ''}`}
                        title="导出文件"
                    >
                        <Download size={14} />
                        <span>导出</span>
                        <ChevronDown size={12} className={`transition-transform ${openMenu === 'export' ? 'rotate-180' : ''}`} />
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
                        <span>{wordCopied ? '已复制到 Word' : '复制到 Word'}</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onCopyZhihu}
                        disabled={isZhihuCopying}
                        className={
                            zhihuCopied
                                ? 'ui-tool-btn ui-tool-btn-active'
                                : isZhihuCopying
                                  ? 'ui-tool-btn opacity-85 cursor-not-allowed'
                                  : 'ui-tool-btn'
                        }
                        title="复制到知乎（Ctrl+Shift+Z）"
                    >
                        {isZhihuCopying ? <Loader2 className="animate-spin" size={14} /> : <Copy size={14} />}
                        <span>{zhihuCopied ? '已复制到知乎' : isZhihuCopying ? '正在适配知乎...' : '复制到知乎'}</span>
                    </motion.button>
                </div>

                <motion.button
                    ref={moreButtonRef}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setOpenMenu((previous) => (previous === 'more' ? null : 'more'))}
                    className={`ui-tool-btn lg:hidden ${openMenu === 'more' ? 'ui-tool-btn-active' : ''}`}
                    title="更多设置"
                >
                    <MoreHorizontal size={14} />
                    <span>更多</span>
                </motion.button>

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

            {openMenu === 'export' && exportMenuRect && (
                <div
                    ref={exportMenuRef}
                    className="fixed z-[140] min-w-[188px] rounded-[14px] border border-[#00000012] dark:border-[#ffffff18] bg-white dark:bg-[#1d1d21] shadow-apple-lg p-1.5"
                    style={{
                        top: exportMenuRect.bottom + 8,
                        left: getMenuLeft(exportMenuRect, 188)
                    }}
                >
                    <button
                        onClick={() => {
                            onExportPdf();
                            setOpenMenu(null);
                        }}
                        className="w-full ui-tool-btn !justify-start !h-[32px]"
                    >
                        <Download size={13} />
                        导出 PDF
                    </button>
                    <button
                        onClick={() => {
                            onExportHtml();
                            setOpenMenu(null);
                        }}
                        className="w-full ui-tool-btn !justify-start !h-[32px] mt-1"
                    >
                        <Download size={13} />
                        导出 HTML
                    </button>
                    <button
                        onClick={() => {
                            onExportWordDocx();
                            setOpenMenu(null);
                        }}
                        className="w-full ui-tool-btn !justify-start !h-[32px] mt-1"
                    >
                        <FileText size={13} />
                        导出 .docx（推荐）
                    </button>
                    <button
                        onClick={() => {
                            onExportWordDoc();
                            setOpenMenu(null);
                        }}
                        className="w-full ui-tool-btn !justify-start !h-[32px] mt-1"
                    >
                        <Download size={13} />
                        导出 .doc
                    </button>
                </div>
            )}

            {openMenu === 'more' && moreMenuRect && (
                <div
                    ref={moreMenuRef}
                    className="fixed z-[140] min-w-[220px] rounded-[14px] border border-[#00000012] dark:border-[#ffffff18] bg-white dark:bg-[#1d1d21] shadow-apple-lg p-1.5"
                    style={{
                        top: moreMenuRect.bottom + 8,
                        left: getMenuLeft(moreMenuRect, 220)
                    }}
                >
                    <div className="px-2 py-1 ui-caption">预览设备</div>
                    <button
                        onClick={() => {
                            onDeviceChange('mobile');
                            setOpenMenu(null);
                        }}
                        className={`w-full ui-tool-btn !justify-start !h-[32px] ${previewDevice === 'mobile' ? 'ui-tool-btn-active' : ''}`}
                    >
                        <Smartphone size={13} />
                        手机预览
                    </button>
                    <button
                        onClick={() => {
                            onDeviceChange('tablet');
                            setOpenMenu(null);
                        }}
                        className={`w-full ui-tool-btn !justify-start !h-[32px] mt-1 ${previewDevice === 'tablet' ? 'ui-tool-btn-active' : ''}`}
                    >
                        <Tablet size={13} />
                        平板预览
                    </button>
                    <button
                        onClick={() => {
                            onDeviceChange('pc');
                            setOpenMenu(null);
                        }}
                        className={`w-full ui-tool-btn !justify-start !h-[32px] mt-1 ${previewDevice === 'pc' ? 'ui-tool-btn-active' : ''}`}
                    >
                        <Monitor size={13} />
                        桌面预览
                    </button>

                    <div className="mx-1 my-2 h-px bg-[#00000010] dark:bg-[#ffffff10]" />
                    <div className="px-2 py-1 ui-caption">工作区</div>

                    <button
                        onClick={() => {
                            onToggleInsights();
                            setOpenMenu(null);
                        }}
                        className={`w-full ui-tool-btn !justify-start !h-[32px] ${insightsOpen ? 'ui-tool-btn-active' : ''}`}
                    >
                        {insightsOpen ? <PanelRightClose size={13} /> : <PanelRightOpen size={13} />}
                        排版信息
                    </button>
                    <button
                        onClick={() => {
                            onToggleScrollSync();
                            setOpenMenu(null);
                        }}
                        className={`w-full ui-tool-btn !justify-start !h-[32px] mt-1 ${scrollSyncEnabled ? 'ui-tool-btn-active' : ''}`}
                    >
                        {scrollSyncEnabled ? <Link2 size={13} /> : <Unlink2 size={13} />}
                        滚动同步
                    </button>
                    <button
                        onClick={() => {
                            onToggleCardMode();
                            setOpenMenu(null);
                        }}
                        className={`w-full ui-tool-btn !justify-start !h-[32px] mt-1 ${cardModeOpen ? 'ui-tool-btn-active' : ''}`}
                    >
                        <ImageIcon size={13} />
                        卡片模式
                    </button>
                </div>
            )}
        </div>
    );
}
