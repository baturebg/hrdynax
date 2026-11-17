// Brand illustrations drawn in SVG so they ship with the app (no stock photos needed).
// To use a real photo instead, put it in /public and set it as the hero background in global.css.

import { useId } from 'react';

/** Open-pit mine at dusk with a haul truck and excavator, faded in from the left so text stays readable. */
export function HeroArt({ detail = true }: { detail?: boolean }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className="hero-art" viewBox="0 0 1200 300" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a3f78" />
          <stop offset="0.55" stopColor="#8a6a63" />
          <stop offset="1" stopColor="#e2a35a" />
        </linearGradient>
        <linearGradient id={`fade${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.28" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.62" stopColor="#fff" stopOpacity="0.95" />
        </linearGradient>
        <mask id={`m${id}`}>
          <rect width="1200" height="300" fill={`url(#fade${id})`} />
        </mask>
      </defs>
      <g mask={`url(#m${id})`}>
        <rect width="1200" height="300" fill={`url(#sky${id})`} />
        <path d="M380 150 L520 92 L610 120 L720 70 L820 110 L930 60 L1050 100 L1200 80 L1200 300 L380 300Z" fill="#5c4a52" opacity="0.75" />
        <path d="M380 190 L1200 150 L1200 300 L380 300Z" fill="#6e5546" />
        <path d="M430 210 L1200 178 L1200 300 L430 300Z" fill="#7e6150" />
        <path d="M480 232 L1200 206 L1200 300 L480 300Z" fill="#8f6e58" />
        <path d="M540 254 L1200 234 L1200 300 L540 300Z" fill="#a07a60" />
        <path d="M600 274 L1200 262 L1200 300 L600 300Z" fill="#6b5244" />
        {detail && (
          <g>
            {/* haul truck */}
            <g transform="translate(990 222) scale(0.72)">
              <path d="M0 22 L18 0 L118 0 L132 22Z" fill="#f2a516" />
              <rect x="-6" y="22" width="148" height="18" rx="3" fill="#2b2b2b" />
              <rect x="112" y="4" width="30" height="20" rx="3" fill="#e39a12" />
              <rect x="118" y="8" width="16" height="9" rx="2" fill="#2e4a7a" />
              <circle cx="22" cy="46" r="15" fill="#1b1b1b" />
              <circle cx="22" cy="46" r="6" fill="#555" />
              <circle cx="112" cy="46" r="15" fill="#1b1b1b" />
              <circle cx="112" cy="46" r="6" fill="#555" />
            </g>
            {/* excavator */}
            <g transform="translate(860 196) scale(0.72)">
              <rect x="0" y="52" width="92" height="22" rx="6" fill="#2b2b2b" />
              <rect x="8" y="24" width="72" height="30" rx="4" fill="#f2a516" />
              <rect x="56" y="8" width="26" height="22" rx="3" fill="#e39a12" />
              <rect x="61" y="12" width="15" height="10" rx="2" fill="#2e4a7a" />
              <path d="M20 30 L-40 -30 L-48 -22 L10 38Z" fill="#f2a516" />
              <path d="M-44 -26 L-88 18 L-80 24 L-36 -18Z" fill="#e39a12" />
              <path d="M-96 14 L-70 14 L-66 34 L-100 34Z" fill="#2b2b2b" />
            </g>
          </g>
        )}
      </g>
    </svg>
  );
}

export function Logo({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.62} viewBox="0 0 100 62" aria-hidden="true">
      <path d="M4 58 L36 10 L52 34 L64 18 L96 58Z" fill="none" stroke="#f5b21b" strokeWidth="6" strokeLinejoin="round" />
      <path d="M36 10 L44 22 L38 20 L32 26 L28 22Z" fill="#fff" />
      <path d="M64 18 L70 27 L65 25 L60 29 L58 26Z" fill="#fff" />
    </svg>
  );
}

export function Robot() {
  const id = useId().replace(/:/g, '');
  return (
    <svg className="robot" viewBox="0 0 160 128" aria-hidden="true">
      <defs>
        <radialGradient id={`h${id}`} cx="40%" cy="30%" r="75%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#aeb8d8" />
        </radialGradient>
        <radialGradient id={`g${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#5fd1ff" />
          <stop offset="1" stopColor="#5fd1ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="80" cy="64" r="60" fill="#4c5df0" opacity="0.25" />
      <rect x="62" y="104" width="36" height="20" rx="8" fill="#c9d1ea" />
      <circle cx="80" cy="60" r="44" fill={`url(#h${id})`} />
      <circle cx="34" cy="62" r="10" fill="#d4dbf0" />
      <circle cx="126" cy="62" r="10" fill="#d4dbf0" />
      <rect x="48" y="44" width="64" height="36" rx="18" fill="#0e1540" />
      <circle cx="66" cy="62" r="14" fill={`url(#g${id})`} />
      <circle cx="94" cy="62" r="14" fill={`url(#g${id})`} />
      <circle cx="66" cy="62" r="6" fill="#7fe0ff" />
      <circle cx="94" cy="62" r="6" fill="#7fe0ff" />
      <rect x="76" y="10" width="8" height="10" rx="3" fill="#c9d1ea" />
    </svg>
  );
}
