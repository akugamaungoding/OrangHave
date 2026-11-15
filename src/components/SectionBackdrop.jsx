import React from 'react';

/* ════════════════════════════════════════════════════════════════════
   SectionBackdrop — the dusk-forest backdrop used behind every Home
   section, in the same palette as the Welcome illustration.
   Each variant adds its own illustrated details:
     story    → hanging lianas + an orangutan swinging from a vine
     reach    → drifting haze and wind streaks
     wildlife → hornbills flying across, leaves in the corners
     action   → dawn glow on the horizon + seedlings growing back
   All layers are decorative (aria-hidden) and pause for reduced motion.
   ════════════════════════════════════════════════════════════════════ */

// Small deterministic random so the art is identical on every render
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function canopyPath(seed, base, amp, width = 1600, height = 260) {
  const r = rng(seed);
  let d = `M-20 ${height} L-20 ${base}`;
  let x = -20;
  while (x < width + 20) {
    const w = 30 + r() * 60;
    const h = amp * (0.5 + r() * 0.8);
    d += ` q ${(w / 2).toFixed(0)} ${(-h * 1.4).toFixed(0)} ${w.toFixed(0)} 0`;
    x += w;
  }
  return `${d} L${width + 20} ${height} Z`;
}

function stars(seed, n = 70) {
  const r = rng(seed);
  return Array.from({ length: n }, () => ({
    x: r() * 1600,
    y: r() * 380,
    rad: 0.5 + r() * 1.4,
    delay: r() * 5,
    dur: 2.5 + r() * 4,
  }));
}

function fireflies(seed, n = 12) {
  const r = rng(seed);
  return Array.from({ length: n }, () => ({ x: 40 + r() * 1520, y: 120 + r() * 120, delay: r() * 4, dur: 2.6 + r() * 2.4 }));
}

const GRADIENTS = {
  story: 'linear-gradient(180deg, #0b1d22 0%, #12292b 45%, #1b3630 100%)',
  reach: 'linear-gradient(180deg, #0d1c22 0%, #23302f 45%, #4d3f33 100%)',
  wildlife: 'linear-gradient(180deg, #0b1c1b 0%, #132e27 50%, #1a3a2d 100%)',
  action: 'linear-gradient(180deg, #0c1c22 0%, #1d3532 50%, #5b4a37 100%)',
};

const CSS = `
@keyframes sb-tw { 0%,100% { opacity: .15 } 50% { opacity: .9 } }
@keyframes sb-ff { 0%,100% { opacity: 0; transform: translate(0,0) } 50% { opacity: .9; transform: translate(6px,-10px) } }
@keyframes sb-haze { from { transform: translateX(-60px) } to { transform: translateX(60px) } }
@keyframes sb-wind { to { stroke-dashoffset: -400 } }
@keyframes sb-sway { 0%,100% { transform: rotate(-4deg) } 50% { transform: rotate(4deg) } }
@keyframes sb-bird { from { transform: translateX(110vw) } to { transform: translateX(-30vw) } }
@keyframes sb-flap { 0%,100% { transform: scaleY(1) } 50% { transform: scaleY(-.55) } }
@keyframes sb-grow { 0%,100% { transform: scaleY(.92) } 50% { transform: scaleY(1.04) } }
@keyframes sb-glow { 0%,100% { opacity: .55 } 50% { opacity: .85 } }
.sb-anim { animation-play-state: running }
@media (prefers-reduced-motion: reduce) { .sb-anim { animation: none !important } }
`;

const LEAF = 'M0 0 C 30 -40 90 -50 140 -20 C 110 10 50 20 0 0 Z';

function Hornbill({ y, scale = 1, delay = 0, dur = 38 }) {
  return (
    <div className="sb-anim absolute left-0" style={{ top: y, animation: `sb-bird ${dur}s linear ${delay}s infinite` }}>
      <svg width={80 * scale} height={40 * scale} viewBox="-22 -36 100 46" fill="#0a1310" opacity=".8">
        <path d="M0 0 Q 26 -6 52 0 Q 40 6 26 6 Q 12 6 0 0 Z" />
        <path d="M-2 -1 L -20 2 L -2 3 Z" fill="#c8702a" />
        <path className="sb-anim" style={{ transformBox: 'fill-box', transformOrigin: '50% 100%', animation: 'sb-flap .7s ease-in-out infinite' }} d="M18 -1 Q 30 -30 52 -34 Q 44 -14 36 -1 Z" />
        <path d="M50 -1 L 74 -6 L 74 6 L 50 3 Z" />
      </svg>
    </div>
  );
}

export default function SectionBackdrop({ variant = 'story', seed = 1 }) {
  const st = stars(seed * 7 + 3);
  const ff = fireflies(seed * 11 + 5);
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" style={{ background: GRADIENTS[variant] }}>
      <style>{CSS}</style>

      {/* Stars */}
      <svg className="absolute inset-x-0 top-0 h-[380px] w-full" viewBox="0 0 1600 380" preserveAspectRatio="xMidYMin slice">
        <g fill="#fdf6e3">
          {st.map((s, i) => (
            <circle key={i} className="sb-anim" cx={s.x} cy={s.y} r={s.rad} style={{ animation: `sb-tw ${s.dur}s ease-in-out ${s.delay}s infinite` }} />
          ))}
        </g>
      </svg>

      {/* Soft haze drifting across the middle */}
      <div
        className="sb-anim absolute inset-x-[-10%] top-[35%] h-48 rounded-full blur-3xl"
        style={{ background: variant === 'reach' ? 'rgba(170,140,115,.35)' : 'rgba(120,150,120,.14)', animation: 'sb-haze 40s ease-in-out infinite alternate' }}
      />

      {/* ── Variant details ─────────────────────────────── */}
      {variant === 'story' && (
        <>
          {/* lianas from the top corners */}
          <svg className="absolute top-0 left-0 h-[420px] w-[260px]" viewBox="0 0 260 420">
            <g fill="none" stroke="#0e1f15" strokeWidth="3">
              <path d="M20 0 Q 40 120 18 240 Q 4 320 30 400" />
              <path d="M70 0 Q 96 90 76 180 Q 64 240 84 300" />
              <path d="M130 0 Q 140 60 126 120" />
            </g>
            <g fill="#14301e">
              {[60, 140, 220, 300, 380].map((y, i) => <ellipse key={y} cx={i % 2 ? 26 : 12} cy={y} rx="16" ry="6" transform={`rotate(${i % 2 ? 30 : -30} ${i % 2 ? 26 : 12} ${y})`} />)}
              {[50, 120, 200, 270].map((y, i) => <ellipse key={y} cx={i % 2 ? 90 : 72} cy={y} rx="14" ry="5" transform={`rotate(${i % 2 ? 25 : -25} ${i % 2 ? 90 : 72} ${y})`} />)}
            </g>
          </svg>
          <svg className="absolute top-0 right-0 h-[360px] w-[220px]" viewBox="0 0 220 360">
            <path d="M150 0 Q 160 90 150 170" stroke="#0e1f15" strokeWidth="3" fill="none" />
            <g className="sb-anim" style={{ transformOrigin: '150px 170px', animation: 'sb-sway 6s ease-in-out infinite' }} fill="#0a120d">
              <path d="M150 170 L 150 190" stroke="#0a120d" strokeWidth="6" strokeLinecap="round" />
              <circle cx="152" cy="202" r="12" />
              <ellipse cx="154" cy="226" rx="14" ry="20" />
              <path d="M142 218 Q 128 230 126 250 M160 242 Q 166 260 160 272 M148 244 Q 142 260 146 272" stroke="#0a120d" strokeWidth="6" strokeLinecap="round" fill="none" />
            </g>
          </svg>
        </>
      )}

      {variant === 'reach' && (
        <svg className="absolute inset-x-0 top-[12%] h-[420px] w-full" viewBox="0 0 1600 420" preserveAspectRatio="none">
          <g fill="none" stroke="#e8c9a8" strokeOpacity=".22" strokeWidth="2" strokeLinecap="round">
            {[60, 130, 210, 300, 360].map((y, i) => (
              <path
                key={y}
                className="sb-anim"
                d={`M${-100 + i * 40} ${y} C 300 ${y - 40} 600 ${y + 40} 900 ${y} S 1500 ${y - 30} 1700 ${y}`}
                strokeDasharray="90 140"
                style={{ animation: `sb-wind ${9 + i * 2}s linear infinite` }}
              />
            ))}
          </g>
          <g style={{ filter: 'blur(28px)' }} fill="#8d7462" opacity=".45">
            <ellipse className="sb-anim" cx="300" cy="200" rx="320" ry="60" style={{ animation: 'sb-haze 30s ease-in-out infinite alternate' }} />
            <ellipse className="sb-anim" cx="1250" cy="260" rx="360" ry="70" style={{ animation: 'sb-haze 44s ease-in-out infinite alternate-reverse' }} />
          </g>
        </svg>
      )}

      {variant === 'wildlife' && (
        <>
          <Hornbill y="9%" scale={1} dur={36} />
          <Hornbill y="14%" scale={0.7} dur={44} delay={-18} />
          <svg className="absolute top-[-20px] left-[-30px] h-[260px] w-[300px]" viewBox="-40 -40 300 260">
            <g fill="#0e2016">
              <path d={LEAF} transform="translate(0 120) rotate(-30) scale(1.2)" />
              <path d={LEAF} transform="translate(-10 60) rotate(-5) scale(.9)" />
              <path d={LEAF} transform="translate(20 0) rotate(20) scale(1)" />
            </g>
          </svg>
          <svg className="absolute top-[-20px] right-[-30px] h-[260px] w-[300px]" viewBox="-40 -40 300 260">
            <g fill="#0e2016" transform="translate(220 0) scale(-1 1)">
              <path d={LEAF} transform="translate(0 120) rotate(-30) scale(1.2)" />
              <path d={LEAF} transform="translate(-10 60) rotate(-5) scale(.9)" />
              <path d={LEAF} transform="translate(20 0) rotate(20) scale(1)" />
            </g>
          </svg>
        </>
      )}

      {variant === 'action' && (
        <div
          className="sb-anim absolute inset-x-0 bottom-[120px] h-[340px]"
          style={{ background: 'radial-gradient(60% 100% at 50% 100%, rgba(247,190,120,.55), rgba(247,190,120,0) 70%)', animation: 'sb-glow 6s ease-in-out infinite' }}
        />
      )}

      {/* Forest silhouette along the bottom */}
      <svg className="absolute inset-x-0 bottom-0 h-[260px] w-full" viewBox="0 0 1600 260" preserveAspectRatio="xMidYMax slice">
        <path d={canopyPath(seed * 3 + 1, 120, 26)} fill="#1f3a2a" opacity=".55" />
        {/* emergent dipterocarps */}
        {[[220, 70, 46], [760, 60, 40], [1340, 66, 50]].map(([x, top, c]) => (
          <g key={x} fill="#173022">
            <rect x={x - 4} y={top} width="8" height={160 - top} fill="#9a917f" opacity=".55" />
            <ellipse cx={x} cy={top} rx={c} ry={c * 0.42} />
            <ellipse cx={x - c * 0.55} cy={top + 6} rx={c * 0.55} ry={c * 0.3} />
            <ellipse cx={x + c * 0.55} cy={top + 6} rx={c * 0.55} ry={c * 0.3} />
          </g>
        ))}
        <path d={canopyPath(seed * 5 + 2, 165, 30)} fill="#132a1c" />
        <path d={canopyPath(seed * 9 + 4, 210, 22)} fill="#0b1a10" />
        {variant === 'action' &&
          [300, 420, 640, 900, 1120, 1280].map((x, i) => (
            <g key={x} className="sb-anim" style={{ transformOrigin: `${x}px 250px`, transformBox: 'view-box', animation: `sb-grow ${4 + (i % 3)}s ease-in-out ${i * 0.4}s infinite` }}>
              <path d={`M${x} 252 L${x} ${222 - (i % 3) * 6}`} stroke="#6fae5e" strokeWidth="3" />
              <path d={`M${x} ${232 - (i % 3) * 6} q -14 -10 -20 2 q 12 4 20 -2 M${x} ${226 - (i % 3) * 6} q 14 -10 20 2 q -12 4 -20 -2`} fill="#7cc06a" />
            </g>
          ))}
        <g fill="#e9ff9a">
          {ff.map((f, i) => (
            <circle key={i} className="sb-anim" cx={f.x} cy={f.y} r="2.2" style={{ animation: `sb-ff ${f.dur}s ease-in-out ${f.delay}s infinite`, opacity: 0 }} />
          ))}
        </g>
      </svg>
    </div>
  );
}
