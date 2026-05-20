type Props = {
  label?: string;
  compact?: boolean;
};

export function HeavenlyWriting({ label, compact }: Props) {
  return (
    <div
      className={`heavenly-writing${compact ? ' heavenly-writing--compact' : ''}`}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <div className="heavenly-writing__sky" />
      <svg className="heavenly-writing__svg" viewBox="0 0 240 360" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path className="heavenly-writing__ray heavenly-writing__ray--1" d="M120 0 L120 120" />
        <path className="heavenly-writing__ray heavenly-writing__ray--2" d="M80 0 L100 100" />
        <path className="heavenly-writing__ray heavenly-writing__ray--3" d="M160 0 L140 100" />
        <path
          className="heavenly-writing__stroke"
          d="M120 28 C132 72 98 108 112 148 C126 188 104 228 118 268 C128 302 116 332 120 348"
          pathLength={100}
        />
        <circle className="heavenly-writing__glow" cx="120" cy="36" r="28" />
        <circle className="heavenly-writing__quill" cx="120" cy="348" r="4" />
      </svg>
    </div>
  );
}
