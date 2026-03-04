import React from 'react';
import DeviceFrame from './DeviceFrame';

interface PreviewPanelProps {
    renderedHtml: string;
    deviceWidthClass: string;
    previewDevice: 'mobile' | 'tablet' | 'pc';
    previewRef: React.RefObject<HTMLDivElement>;
    previewOuterScrollRef: React.RefObject<HTMLDivElement>;
    previewInnerScrollRef: React.RefObject<HTMLDivElement>;
    onPreviewOuterScroll: () => void;
    onPreviewInnerScroll: () => void;
    scrollSyncEnabled: boolean;
}

export default function PreviewPanel({
    renderedHtml,
    deviceWidthClass,
    previewDevice,
    previewRef,
    previewOuterScrollRef,
    previewInnerScrollRef,
    onPreviewOuterScroll,
    onPreviewInnerScroll,
    scrollSyncEnabled
}: PreviewPanelProps) {
    const isFramedDevice = previewDevice !== 'pc';

    return (
        <div
            ref={previewOuterScrollRef}
            onScroll={scrollSyncEnabled && !isFramedDevice ? onPreviewOuterScroll : undefined}
            className="relative overflow-y-auto no-scrollbar bg-[linear-gradient(180deg,rgba(242,242,247,0.6)_0%,rgba(250,250,252,0.9)_36%,rgba(250,250,252,1)_100%)] dark:bg-[linear-gradient(180deg,rgba(0,0,0,0.9)_0%,rgba(12,12,14,1)_40%,rgba(16,16,18,1)_100%)] flex flex-col z-20 flex-1 min-h-0 w-full overflow-x-hidden"
        >
            <div className={`${deviceWidthClass} transition-all duration-500 ${isFramedDevice ? 'self-center my-12 px-4 lg:px-8' : 'mt-8 mb-20 ml-4 md:ml-6 mr-auto'} h-fit min-h-[calc(100%-48px)] flex items-start justify-center relative`}>
                {!isFramedDevice && (
                    <span className="absolute -top-8 left-1 ui-caption">
                        实时预览 · 桌面排版
                    </span>
                )}
                {isFramedDevice ? (
                    <DeviceFrame
                        device={previewDevice as 'mobile' | 'tablet'}
                        scrollRef={previewInnerScrollRef}
                        onScroll={scrollSyncEnabled ? onPreviewInnerScroll : undefined}
                    >
                        <div
                            ref={previewRef}
                            dangerouslySetInnerHTML={{ __html: renderedHtml }}
                            className={`preview-content min-w-full ${previewDevice === 'mobile' ? 'px-1 pt-1 pb-8' : 'px-2 pt-2 pb-10'}`}
                        />
                    </DeviceFrame>
                ) : (
                    <div className="bg-white rounded-[22px] overflow-hidden shadow-apple-lg transition-all duration-500 ring-1 ring-[#00000008] border border-white/70 dark:bg-[#17171a] dark:border-[#ffffff14] w-full">
                        <div
                            ref={previewRef}
                            dangerouslySetInnerHTML={{ __html: renderedHtml }}
                            className="preview-content min-w-full"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
