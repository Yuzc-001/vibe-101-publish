import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Palette, RotateCcw, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    OTHER_THEME_GROUPS,
    RECOMMENDED_THEMES,
    REQUIRED_THEMES,
    THEMES,
    type ThemeCustomConfig,
    type ThemeStyleMode
} from '../lib/themes';

interface ThemeSelectorProps {
    activeTheme: string;
    onThemeChange: (themeId: string) => void;
    customTheme: ThemeCustomConfig;
    onCustomThemeChange: (next: ThemeCustomConfig) => void;
}

const CUSTOM_COLOR_PRESETS = ['#2bae85', '#4e6be3', '#f39a35', '#eb6259', '#2d5b99', '#c8a060', '#586274', '#3f7fca'];
const DEFAULT_CUSTOM_COLOR = '#2bae85';
const DEFAULT_STYLE_MODE: ThemeStyleMode = 'refined';

const STYLE_MODES: Array<{ id: ThemeStyleMode; label: string; helper: string }> = [
    { id: 'simple', label: '简约', helper: '更克制留白' },
    { id: 'focus', label: '聚焦', helper: '层级更清晰' },
    { id: 'refined', label: '精致', helper: '圆润更细腻' },
    { id: 'vivid', label: '醒目', helper: '强调更强烈' }
];

function extractStyle(styleStr: string, prop: string): string | null {
    const regex = new RegExp(`${prop}\\s*:\\s*([^;!]+)`, 'i');
    const match = styleStr.match(regex);
    return match ? match[1].trim() : null;
}

function ThemeSwatch({ styles }: { styles: Record<string, string> }) {
    const bg = extractStyle(styles.container || '', 'background-color') || '#ffffff';
    const textColor = extractStyle(styles.p || '', 'color') || '#333333';
    const h1Color = extractStyle(styles.h1 || '', 'color') || textColor;
    const accentColor = extractStyle(styles.a || styles.blockquote || '', 'color') || h1Color;

    return (
        <div className="flex gap-0.5 h-5 rounded-[8px] overflow-hidden border border-[#00000015] dark:border-[#ffffff15]" style={{ width: '46px' }}>
            <div className="flex-1" style={{ backgroundColor: bg }} />
            <div className="flex-1" style={{ backgroundColor: h1Color }} />
            <div className="flex-1" style={{ backgroundColor: accentColor }} />
            <div className="flex-1" style={{ backgroundColor: textColor }} />
        </div>
    );
}

function StyleModeButton({
    label,
    helper,
    active,
    onClick
}: {
    label: string;
    helper: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`theme-card p-2.5 ${active ? 'theme-card-active' : ''}`}
        >
            <span className="text-[12px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{label}</span>
            <span className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">{helper}</span>
        </button>
    );
}

function CustomToggle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
    return (
        <button
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-[#2bae85]' : 'bg-[#d1d1d6] dark:bg-[#4a4a4f]'}`}
            title={checked ? '关闭自定义' : '开启自定义'}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-[2px]'}`}
            />
        </button>
    );
}

export default function ThemeSelector({ activeTheme, onThemeChange, customTheme, onCustomThemeChange }: ThemeSelectorProps) {
    const [isThemeOpen, setIsThemeOpen] = useState(false);
    const [showBottomFade, setShowBottomFade] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const selectedTheme = THEMES.find((theme) => theme.id === activeTheme);
    const selectedThemeName = selectedTheme?.name ?? activeTheme;
    const activeInRequired = REQUIRED_THEMES.some((theme) => theme.id === activeTheme);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        setShowBottomFade(scrollHeight - scrollTop - clientHeight > 20);
    };

    useEffect(() => {
        if (!isThemeOpen || !scrollRef.current) return;
        handleScroll();
    }, [isThemeOpen]);

    const applyPresetTheme = (themeId: string) => {
        onThemeChange(themeId);
        onCustomThemeChange({
            ...customTheme,
            enabled: false
        });
    };

    const updateCustomTheme = (patch: Partial<ThemeCustomConfig>) => {
        onCustomThemeChange({
            ...customTheme,
            ...patch,
            enabled: patch.enabled ?? true
        });
    };

    const resetCustom = () => {
        onCustomThemeChange({
            enabled: false,
            primaryColor: DEFAULT_CUSTOM_COLOR,
            styleMode: DEFAULT_STYLE_MODE
        });
    };

    const modeLabel = STYLE_MODES.find((mode) => mode.id === customTheme.styleMode)?.label ?? '精致';

    return (
        <div className="flex items-center flex-wrap gap-2 lg:gap-3 px-4 lg:px-6 py-2.5 border-r border-transparent md:border-[#00000012] md:dark:border-[#ffffff12] shrink-0">
            <span className="ui-caption hidden xl:block shrink-0">排版主题</span>

            <div className="ui-chip-group shrink-0">
                {REQUIRED_THEMES.map((theme) => (
                    <button
                        key={theme.id}
                        onClick={() => applyPresetTheme(theme.id)}
                        className={`ui-chip ${activeTheme === theme.id && !customTheme.enabled ? 'ui-chip-active' : ''}`}
                    >
                        {theme.name.split(' ')[0]}
                    </button>
                ))}
            </div>

            <button
                onClick={() =>
                    updateCustomTheme({
                        enabled: !customTheme.enabled
                    })
                }
                className={`ui-tool-btn ${customTheme.enabled ? 'ui-tool-btn-active' : ''}`}
                title={customTheme.enabled ? '关闭自定义微调' : '开启自定义微调'}
            >
                <Palette size={14} />
                <span>自定义</span>
                {customTheme.enabled && (
                    <span className="h-2.5 w-2.5 rounded-full border border-white/70" style={{ backgroundColor: customTheme.primaryColor }} />
                )}
            </button>

            <div className="relative shrink-0">
                <button
                    onClick={() => setIsThemeOpen((previous) => !previous)}
                    className={`ui-tool-btn ${(!activeInRequired || customTheme.enabled) ? 'ui-tool-btn-active' : ''}`}
                >
                    {customTheme.enabled ? `自定义 · ${modeLabel}` : (!activeInRequired ? selectedThemeName : `精选 8 款`)}
                    <ChevronDown size={14} className={`transition-transform duration-300 ${isThemeOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {isThemeOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-40 bg-black/12 dark:bg-black/35"
                                onClick={() => setIsThemeOpen(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: 8 }}
                                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                className="fixed left-4 right-4 sm:absolute sm:left-0 sm:right-auto top-auto sm:top-11 w-auto sm:w-[560px] md:w-[680px] bg-white dark:bg-[#17171a] rounded-[18px] shadow-apple-lg border border-[#00000014] dark:border-[#ffffff14] z-50 overflow-hidden"
                                style={{ maxHeight: 'min(76vh, 680px)' }}
                            >
                                <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-[#00000008] dark:border-[#ffffff10]">
                                    <span className="text-[14px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">精选主题与自定义</span>
                                    <button
                                        onClick={() => setIsThemeOpen(false)}
                                        className="ui-icon-btn"
                                        title="关闭"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>

                                <div
                                    ref={scrollRef}
                                    onScroll={handleScroll}
                                    className="overflow-y-auto px-4 py-3"
                                    style={{ maxHeight: 'min(calc(76vh - 52px), 620px)' }}
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="ui-caption">必选主题</span>
                                            <span className="text-[11px] text-[#8b8b91] dark:text-[#9d9da3]">{REQUIRED_THEMES.length} 款</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                                            {REQUIRED_THEMES.map((theme) => (
                                                <button
                                                    key={theme.id}
                                                    onClick={() => {
                                                        applyPresetTheme(theme.id);
                                                        setIsThemeOpen(false);
                                                    }}
                                                    className={`theme-card ${activeTheme === theme.id ? 'theme-card-active' : ''}`}
                                                >
                                                    <div className="flex items-center justify-between w-full">
                                                        <ThemeSwatch styles={theme.styles} />
                                                        {activeTheme === theme.id && !customTheme.enabled && <Check size={14} className="text-[#0066cc] dark:text-[#0a84ff]" />}
                                                        {activeTheme === theme.id && customTheme.enabled && <Sparkles size={14} className="text-[#2bae85]" />}
                                                    </div>
                                                    <span className="text-[12px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] leading-tight">{theme.name}</span>
                                                    <span className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6] leading-snug line-clamp-2">{theme.description}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-[#0000000e] dark:border-[#ffffff10]">
                                        <div className="flex items-center gap-2">
                                            <span className="ui-caption">推荐补充</span>
                                            <span className="text-[11px] text-[#8b8b91] dark:text-[#9d9da3]">{RECOMMENDED_THEMES.length} 款</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                                            {RECOMMENDED_THEMES.map((theme) => (
                                                <button
                                                    key={theme.id}
                                                    onClick={() => {
                                                        applyPresetTheme(theme.id);
                                                        setIsThemeOpen(false);
                                                    }}
                                                    className={`theme-card ${activeTheme === theme.id ? 'theme-card-active' : ''}`}
                                                >
                                                    <div className="flex items-center justify-between w-full">
                                                        <ThemeSwatch styles={theme.styles} />
                                                        {activeTheme === theme.id && !customTheme.enabled && <Check size={14} className="text-[#0066cc] dark:text-[#0a84ff]" />}
                                                        {activeTheme === theme.id && customTheme.enabled && <Sparkles size={14} className="text-[#2bae85]" />}
                                                    </div>
                                                    <span className="text-[12px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] leading-tight">{theme.name}</span>
                                                    <span className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6] leading-snug line-clamp-2">{theme.description}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-[#0000000e] dark:border-[#ffffff10]">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="ui-caption">自定义微调</span>
                                                <span className="text-[11px] text-[#8b8b91] dark:text-[#9d9da3]">主色 + 风格</span>
                                            </div>
                                            <CustomToggle
                                                checked={customTheme.enabled}
                                                onToggle={() => updateCustomTheme({ enabled: !customTheme.enabled })}
                                            />
                                        </div>

                                        <div className={`theme-card mt-2 ${customTheme.enabled ? 'theme-card-active' : ''}`}>
                                            <div className="flex items-center justify-between w-full gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Palette size={14} className="text-[#5a5a60] dark:text-[#b4b4bb]" />
                                                    <span className="text-[12px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">当前主色</span>
                                                </div>
                                                <div className="inline-flex items-center gap-2 rounded-full border border-[#00000012] dark:border-[#ffffff18] px-2 py-1">
                                                    <span className="h-3 w-3 rounded-full border border-white/75" style={{ backgroundColor: customTheme.primaryColor }} />
                                                    <span className="text-[11px] font-medium text-[#55555b] dark:text-[#b7b7bf] uppercase">
                                                        {customTheme.primaryColor}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-4 gap-2 mt-2">
                                                {CUSTOM_COLOR_PRESETS.map((color) => (
                                                    <button
                                                        key={color}
                                                        onClick={() => updateCustomTheme({ primaryColor: color })}
                                                        className={`h-8 rounded-[10px] border transition-colors ${customTheme.primaryColor.toLowerCase() === color ? 'border-[#1d1d1f] dark:border-[#f5f5f7] ring-2 ring-[#0066cc3a] dark:ring-[#0a84ff42]' : 'border-[#00000012] dark:border-[#ffffff18]'}`}
                                                        style={{ backgroundColor: color }}
                                                        title={color}
                                                    />
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                                                {STYLE_MODES.map((mode) => (
                                                    <StyleModeButton
                                                        key={mode.id}
                                                        label={mode.label}
                                                        helper={mode.helper}
                                                        active={customTheme.styleMode === mode.id}
                                                        onClick={() => updateCustomTheme({ styleMode: mode.id })}
                                                    />
                                                ))}
                                            </div>

                                            <details className="mt-2">
                                                <summary className="cursor-pointer text-[11px] text-[#6e6e73] dark:text-[#a1a1a6] select-none">
                                                    高级设置
                                                </summary>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={customTheme.primaryColor}
                                                        onChange={(event) => updateCustomTheme({ primaryColor: event.target.value })}
                                                        className="h-9 w-12 rounded-[10px] border border-[#00000012] dark:border-[#ffffff18] bg-transparent cursor-pointer"
                                                        title="选择主色"
                                                    />
                                                    <button onClick={resetCustom} className="ui-tool-btn">
                                                        <RotateCcw size={14} />
                                                        恢复默认
                                                    </button>
                                                </div>
                                            </details>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-[#0000000e] dark:border-[#ffffff10]">
                                        <div className="flex items-center gap-2">
                                            <span className="ui-caption">更多风格</span>
                                            <span className="text-[11px] text-[#8b8b91] dark:text-[#9d9da3]">备用风格库</span>
                                        </div>
                                        {OTHER_THEME_GROUPS.map((group, index) => (
                                            <div key={group.label} className={index > 0 ? 'mt-3' : 'mt-2'}>
                                                <div className="text-[11px] font-medium text-[#8b8b91] dark:text-[#9d9da3] mb-2">
                                                    {group.label} · {group.themes.length} 款
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                    {group.themes.map((theme) => (
                                                        <button
                                                            key={theme.id}
                                                            onClick={() => {
                                                                applyPresetTheme(theme.id);
                                                                setIsThemeOpen(false);
                                                            }}
                                                            className={`theme-card ${activeTheme === theme.id ? 'theme-card-active' : ''}`}
                                                        >
                                                            <div className="flex items-center justify-between w-full">
                                                                <ThemeSwatch styles={theme.styles} />
                                                                {activeTheme === theme.id && !customTheme.enabled && <Check size={14} className="text-[#0066cc] dark:text-[#0a84ff]" />}
                                                                {activeTheme === theme.id && customTheme.enabled && <Sparkles size={14} className="text-[#2bae85]" />}
                                                            </div>
                                                            <span className="text-[12px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] leading-tight">{theme.name}</span>
                                                            <span className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6] leading-snug line-clamp-2">{theme.description}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className={`pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white dark:from-[#17171a] to-transparent transition-opacity duration-150 ${showBottomFade ? 'opacity-100' : 'opacity-0'}`} />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

        </div>
    );
}
