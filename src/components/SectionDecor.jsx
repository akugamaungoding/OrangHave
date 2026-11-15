import React from 'react';

/* ════════════════════════════════════════════════════════════════════
   SectionDecor — light, decorative backgrounds for the Home sections.
   Four styles (one per section for comparison):
     A  'watercolor' → watercolor vines & leaves at the edges + a hanging orangutan
     B  'contour'    → soft solid colour + topographic contour lines (satellite-map feel)
     C  'dayak'      → Dayak-inspired curling-vine pattern as a faint texture
     D  'banner'     → pale watercolor landscape banner at the top, fading into cream
   Everything is aria-hidden and sits behind the content (-z-10).
   ════════════════════════════════════════════════════════════════════ */

export const SECTION_BG = {
  watercolor: '#f6f0e3',
  contour: '#ece5d8',
  dayak: '#f1f0e3',
  banner: '#faf6ec',
};

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* Shared watercolor filter: wobbly edges + soft bleed */
function WatercolorDefs({ id }) {
  return (
    <defs>
      <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="4" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="9" result="d" />
        <feGaussianBlur in="d" stdDeviation="1.4" />
      </filter>
    </defs>
  );
}

const LEAF = 'M0 0 C 18 -24 54 -30 84 -12 C 66 6 30 12 0 0 Z';

/* ── A. Watercolor edges ─────────────────────────────────────────── */
function Watercolor() {
  return (
    <>
      {/* top-left vines */}
      <svg className="absolute top-0 left-0 w-44 sm:w-72" viewBox="0 0 300 420" aria-hidden="true">
        <WatercolorDefs id="wc-a1" />
        <g filter="url(#wc-a1)" opacity=".75">
          <path d="M30 0 Q 60 120 34 230 Q 16 320 46 410" stroke="#6f8f5e" strokeWidth="4" fill="none" />
          <path d="M96 0 Q 120 80 100 160 Q 88 210 104 260" stroke="#86a372" strokeWidth="3" fill="none" />
          {[[34, 60, -30], [52, 130, 25], [30, 200, -40], [44, 290, 30], [36, 360, -20], [104, 50, 30], [96, 120, -25], [108, 200, 35]].map(([x, y, r], i) => (
            <path key={i} d={LEAF} transform={`translate(${x} ${y}) rotate(${r}) scale(${0.45 + (i % 3) * 0.12})`} fill={i % 2 ? '#9cbf7f' : '#7ea468'} opacity=".8" />
          ))}
          <path d={LEAF} transform="translate(-20 20) rotate(15) scale(1.4)" fill="#7ea468" opacity=".55" />
          <path d={LEAF} transform="translate(-10 90) rotate(-10) scale(1.1)" fill="#a7c98b" opacity=".5" />
        </g>
      </svg>
      {/* top-right: vine + Tuki hanging */}
      <svg className="absolute top-0 right-6 w-24 sm:right-16 sm:w-36" viewBox="0 0 140 200" aria-hidden="true">
        <WatercolorDefs id="wc-a2" />
        <g filter="url(#wc-a2)">
          <path d="M70 0 Q 82 50 70 100" stroke="#6f8f5e" strokeWidth="4" fill="none" opacity=".8" />
          <path d={LEAF} transform="translate(72 30) rotate(30) scale(.45)" fill="#86a372" opacity=".8" />
          <path d={LEAF} transform="translate(70 60) rotate(160) scale(.4)" fill="#9cbf7f" opacity=".8" />
        </g>
      </svg>
      <img
        src="/assets/art/orangutan.svg"
        alt=""
        aria-hidden="true"
        className="absolute top-14 right-0 w-28 opacity-90 sm:top-20 sm:right-8 sm:w-40"
        style={{ transform: 'rotate(-8deg)' }}
      />
      {/* bottom corners: leaf clusters */}
      <svg className="absolute bottom-0 left-0 w-40 sm:w-64" viewBox="0 0 260 200" aria-hidden="true">
        <WatercolorDefs id="wc-a3" />
        <g filter="url(#wc-a3)" opacity=".6">
          {[[0, 200, -60, 1.6], [40, 210, -80, 1.3], [-10, 160, -30, 1.2], [80, 215, -95, 1]].map(([x, y, r, s], i) => (
            <path key={i} d={LEAF} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} fill={['#7ea468', '#9cbf7f', '#6f8f5e', '#a7c98b'][i]} />
          ))}
        </g>
      </svg>
      <svg className="absolute right-0 bottom-0 w-40 sm:w-64" viewBox="0 0 260 200" aria-hidden="true">
        <WatercolorDefs id="wc-a4" />
        <g filter="url(#wc-a4)" opacity=".6" transform="translate(260 0) scale(-1 1)">
          {[[0, 200, -60, 1.6], [40, 210, -80, 1.3], [-10, 160, -30, 1.2], [80, 215, -95, 1]].map(([x, y, r, s], i) => (
            <path key={i} d={LEAF} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} fill={['#9cbf7f', '#7ea468', '#a7c98b', '#6f8f5e'][i]} />
          ))}
        </g>
      </svg>
    </>
  );
}

/* ── B. Contour lines (topographic map) ──────────────────────────── */
function contourTile() {
  const r = rng(11);
  const paths = [];
  const centers = [[120, 140], [430, 330], [250, 520]];
  centers.forEach(([cx, cy]) => {
    for (let k = 1; k <= 9; k++) {
      const base = k * 22;
      let d = '';
      const pts = 48;
      const ph = r() * 6;
      for (let i = 0; i <= pts; i++) {
        const a = (i / pts) * Math.PI * 2;
        const rr = base * (1 + 0.18 * Math.sin(a * 3 + ph) + 0.08 * Math.sin(a * 5 + ph * 2));
        const x = cx + Math.cos(a) * rr * 1.3;
        const y = cy + Math.sin(a) * rr;
        d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)} `;
      }
      paths.push(d + 'Z');
    }
  });
  return paths;
}
const CONTOURS = contourTile();
function Contour() {
  return (
    <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <pattern id="contour-tile" width="600" height="640" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#9a8569" strokeWidth="1" opacity=".28">
            {CONTOURS.map((d, i) => <path key={i} d={d} />)}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#contour-tile)" />
    </svg>
  );
}

/* ── C. Dayak-inspired curling vine pattern ─────────────────────── */
function Dayak() {
  // An original motif in the spirit of Dayak art: mirrored S-curls ending in spirals (aso / vine hooks)
  const curl = 'M0 40 C 0 18 18 6 34 12 C 48 18 48 36 36 40 C 28 43 22 36 26 30';
  return (
    <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <pattern id="dayak-tile" width="180" height="180" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#5f7a4c" strokeWidth="2.2" strokeLinecap="round" opacity=".16">
            <g transform="translate(90 90)">
              <path d={curl} transform="translate(0 -40)" />
              <path d={curl} transform="scale(-1 1) translate(0 -40)" />
              <path d={curl} transform="rotate(180) translate(0 -40)" />
              <path d={curl} transform="rotate(180) scale(-1 1) translate(0 -40)" />
              <path d="M0 -50 L0 50 M-50 0 L50 0" strokeWidth="1.4" />
              <circle r="6" />
            </g>
            {/* small curls on the tile corners so neighbours interlock */}
            {[[0, 0], [180, 0], [0, 180], [180, 180]].map(([x, y]) => (
              <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
                <path d="M-20 0 C -20 -12 -8 -18 0 -12 C 6 -8 4 0 -2 0" />
                <path d="M20 0 C 20 12 8 18 0 12 C -6 8 -4 0 2 0" />
              </g>
            ))}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dayak-tile)" />
    </svg>
  );
}

/* ── D. Pale watercolor landscape banner ─────────────────────────── */
function Banner() {
  return (
    <div
      className="absolute inset-x-0 top-0 h-[300px] sm:h-[380px]"
      style={{
        WebkitMaskImage: 'linear-gradient(to bottom, #000 45%, transparent)',
        maskImage: 'linear-gradient(to bottom, #000 45%, transparent)',
      }}
      aria-hidden="true"
    >
      <svg className="h-full w-full" viewBox="0 0 1600 380" preserveAspectRatio="xMidYMid slice">
        <WatercolorDefs id="wc-d" />
        <rect width="1600" height="380" fill="#fbe9d2" />
        <circle cx="1180" cy="170" r="70" fill="#f7c58a" opacity=".55" filter="url(#wc-d)" />
        <circle cx="1180" cy="170" r="140" fill="#f7c58a" opacity=".18" />
        <g filter="url(#wc-d)">
          <path d="M-20 230 Q 200 170 420 205 T 860 190 T 1300 200 T 1620 185 L1620 380 L-20 380 Z" fill="#c9d8b4" opacity=".75" />
          <path d="M-20 270 Q 240 220 480 255 T 960 245 T 1400 255 T 1620 240 L1620 380 L-20 380 Z" fill="#a9c391" opacity=".75" />
          <path d="M-20 310 Q 260 275 540 300 T 1060 292 T 1620 300 L1620 380 L-20 380 Z" fill="#8fb27a" opacity=".7" />
        </g>
        {/* young trees growing back on the near hill */}
        <g filter="url(#wc-d)" opacity=".8">
          {[220, 380, 560, 980, 1150, 1380].map((x, i) => (
            <g key={x}>
              <rect x={x - 2} y={268 - (i % 2) * 8} width="4" height="34" fill="#7a6a52" />
              <circle cx={x} cy={262 - (i % 2) * 8} r={14 + (i % 3) * 4} fill={i % 2 ? '#7fa96a' : '#94bb7c'} />
            </g>
          ))}
        </g>
        {/* birds */}
        <g fill="none" stroke="#7a6a52" strokeWidth="2" strokeLinecap="round" opacity=".5">
          <path d="M700 110 q 8 -8 16 0 q 8 -8 16 0" />
          <path d="M760 90 q 6 -6 12 0 q 6 -6 12 0" />
          <path d="M1320 120 q 7 -7 14 0 q 7 -7 14 0" />
        </g>
      </svg>
    </div>
  );
}

export default function SectionDecor({ variant }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" style={{ background: SECTION_BG[variant] }}>
      {variant === 'watercolor' && <Watercolor />}
      {variant === 'contour' && <Contour />}
      {variant === 'dayak' && <Dayak />}
      {variant === 'banner' && <Banner />}
    </div>
  );
}
