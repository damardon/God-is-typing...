import { useId } from 'react';

type Size = 'sm' | 'md' | 'lg';

type Props = {
  size?: Size;
  className?: string;
  title?: string;
};

export function CelestialLogo({ size = 'md', className = '', title }: Props) {
  const label = title ?? 'God is typing...';
  const uid = useId().replace(/:/g, '');

  return (
    <svg
      className={`celestial-logo celestial-logo--${size}${className ? ` ${className}` : ''}`}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={label}
    >
      <defs>
        <radialGradient id={`celestial-moon-${uid}`} cx="42%" cy="38%" r="55%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#d8d8d8" />
          <stop offset="100%" stopColor="#9a9a9a" />
        </radialGradient>
        <radialGradient id={`celestial-halo-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(240, 240, 240, 0.9)" />
          <stop offset="70%" stopColor="rgba(200, 200, 200, 0.2)" />
          <stop offset="100%" stopColor="rgba(250, 250, 250, 0)" />
        </radialGradient>
        <linearGradient id={`celestial-ring-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#737373" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#a3a3a3" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#525252" stopOpacity="0.45" />
        </linearGradient>
        <filter id={`celestial-glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="60" cy="60" r="56" fill={`url(#celestial-halo-${uid})`} className="celestial-logo__halo" />

      <circle
        cx="60"
        cy="60"
        r="52"
        stroke={`url(#celestial-ring-${uid})`}
        strokeWidth="0.75"
        strokeDasharray="4 6"
        opacity="0.65"
        className="celestial-logo__orbit"
      />

      <g filter={`url(#celestial-glow-${uid})`} className="celestial-logo__moon-wrap">
        <circle cx="58" cy="56" r="22" fill={`url(#celestial-moon-${uid})`} />
        <circle cx="68" cy="50" r="20" fill="var(--parchment)" fillOpacity="0.98" />
      </g>

      <path
        className="celestial-logo__star celestial-logo__star--1"
        d="M24 28 L25.2 31.4 L28.8 31.4 L25.8 33.4 L26.9 37 L24 35 L21.1 37 L22.2 33.4 L19.2 31.4 L22.8 31.4 Z"
        fill="#0a0a0a"
      />
      <path
        className="celestial-logo__star celestial-logo__star--2"
        d="M92 22 L92.8 24.2 L95.2 24.2 L93.2 25.6 L94 28 L92 26.6 L90 28 L90.8 25.6 L88.8 24.2 L91.2 24.2 Z"
        fill="#525252"
      />
      <path
        className="celestial-logo__star celestial-logo__star--3"
        d="M88 88 L88.9 90.6 L91.6 90.6 L89.3 92.2 L90.2 95 L88 93.2 L85.8 95 L86.7 92.2 L84.4 90.6 L87.1 90.6 Z"
        fill="#737373"
      />
      <circle className="celestial-logo__dot" cx="34" cy="72" r="1.2" fill="#0a0a0a" />
      <circle className="celestial-logo__dot" cx="78" cy="68" r="0.9" fill="#525252" />
      <circle className="celestial-logo__dot" cx="48" cy="92" r="1" fill="#737373" opacity="0.85" />
    </svg>
  );
}
