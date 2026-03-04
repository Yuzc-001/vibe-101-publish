import { useId } from 'react';

interface BrandMarkProps {
    size?: number;
    className?: string;
}

export default function BrandMark({ size = 32, className }: BrandMarkProps) {
    const gradientId = useId();
    const shineId = useId();

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            role="img"
            aria-label="vibe-101-publish logo"
        >
            <defs>
                <linearGradient id={gradientId} x1="4" y1="3" x2="28" y2="29" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#23B685" />
                    <stop offset="1" stopColor="#3D7FE8" />
                </linearGradient>
                <radialGradient id={shineId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(25 8) rotate(132) scale(10 8)">
                    <stop stopColor="white" stopOpacity="0.45" />
                    <stop offset="1" stopColor="white" stopOpacity="0" />
                </radialGradient>
            </defs>

            <rect x="1" y="1" width="30" height="30" rx="9" fill={`url(#${gradientId})`} />
            <rect x="1.5" y="1.5" width="29" height="29" rx="8.5" stroke="white" strokeOpacity="0.22" />
            <circle cx="25" cy="8" r="7" fill={`url(#${shineId})`} />

            <path
                d="M7.4 9.3L13.35 22.7H18.65L24.6 9.3H20.78L16 20.22L11.22 9.3H7.4Z"
                fill="white"
            />
            <rect x="18.7" y="18.8" width="6.1" height="1.8" rx="0.9" fill="white" fillOpacity="0.92" />
            <rect x="17.2" y="22" width="7.6" height="1.8" rx="0.9" fill="white" fillOpacity="0.82" />
        </svg>
    );
}
