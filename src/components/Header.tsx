import { ExternalLink, Github, Moon, Sparkles, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import BrandMark from './BrandMark';

interface HeaderProps {
    themeMode: 'light' | 'dark';
    onToggleTheme: () => void;
}

export default function Header({ themeMode, onToggleTheme }: HeaderProps) {
    return (
        <header className="glass flex items-center justify-between px-4 sm:px-6 py-3 sticky top-0 z-[100]">
            <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="size-8 rounded-[10px] overflow-hidden shadow-[0_8px_20px_rgba(36,122,212,0.28)]">
                    <BrandMark size={32} />
                </div>
                <div className="min-w-0">
                    <p className="font-bold text-[15px] sm:text-[17px] tracking-tight text-black dark:text-white truncate">vibe-101-publish</p>
                    <p className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6] truncate">一键排版公众号 · 多端发布工作台</p>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden md:flex items-center gap-2">
                    <a
                        href="https://github.com/Yuzc-001"
                        target="_blank"
                        rel="noreferrer"
                        className="ui-chip"
                        title="访问 GitHub 主页"
                    >
                        <Github size={12} />
                        GitHub 主页
                    </a>
                    <a
                        href="https://github.com/Yuzc-001/vibe-101-publish"
                        target="_blank"
                        rel="noreferrer"
                        className="ui-chip ui-chip-strong"
                        title="访问 GitHub 仓库"
                    >
                        <ExternalLink size={12} />
                        GitHub 仓库
                    </a>
                </div>

                <div className="flex md:hidden items-center gap-1">
                    <a
                        href="https://github.com/Yuzc-001"
                        target="_blank"
                        rel="noreferrer"
                        className="ui-icon-btn"
                        title="访问 GitHub 主页"
                        aria-label="访问 GitHub 主页"
                    >
                        <Github size={18} />
                    </a>
                    <a
                        href="https://github.com/Yuzc-001/vibe-101-publish"
                        target="_blank"
                        rel="noreferrer"
                        className="ui-icon-btn ui-icon-btn-active"
                        title="访问 GitHub 仓库"
                        aria-label="访问 GitHub 仓库"
                    >
                        <ExternalLink size={16} />
                    </a>
                </div>

                <span className="ui-chip hidden xl:inline-flex">
                    <Sparkles size={12} />
                    Write · Style · Publish
                </span>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onToggleTheme}
                    className="ui-icon-btn"
                    title={themeMode === 'light' ? '切换到暗色' : '切换到亮色'}
                >
                    {themeMode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </motion.button>
            </div>
        </header>
    );
}
