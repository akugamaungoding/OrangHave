import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFireData } from '../hooks';
import HazeRealMap from '../components/HazeRealMap';

/* ════════════════════════════════════════════════════════════════════
   Cross-Border Haze — how smoke from Indonesian fires reaches
   Malaysia, Singapore and Brunei.
   ════════════════════════════════════════════════════════════════════ */

const NEIGHBORS = [
  {
    id: 'sarawak',
    flag: '🇲🇾',
    place: 'Sarawak',
    country: 'Malaysia',
    cities: 'Kuching, Sibu',
    route: 'island',
    why: 'Shares the island of Borneo with West Kalimantan. Smoke can cross the land border and sit over towns for days.',
    pos: [252, 132],
  },
  {
    id: 'sabah',
    flag: '🇲🇾',
    place: 'Sabah',
    country: 'Malaysia',
    cities: 'Kota Kinabalu',
    route: 'island',
    why: 'Sits in the same Borneo airshed, so bad haze seasons reach Malaysian Borneo too, not only the mainland.',
    pos: [340, 70],
  },
  {
    id: 'brunei',
    flag: '🇧🇳',
    place: 'Brunei',
    country: 'Brunei Darussalam',
    cities: 'Bandar Seri Begawan',
    route: 'island',
    why: 'A small country wrapped by the Borneo airshed. Haze can arrive without a single fire inside Brunei.',
    pos: [298, 96],
  },
  {
    id: 'peninsular',
    flag: '🇲🇾',
    place: 'Peninsular Malaysia',
    country: 'Malaysia',
    cities: 'Kuala Lumpur, Johor Bahru',
    route: 'sea',
    why: 'In the southwest monsoon, winds carry smoke from Kalimantan and Sumatra across the sea to the peninsula.',
    pos: [62, 78],
  },
  {
    id: 'singapore',
    flag: '🇸🇬',
    place: 'Singapore',
    country: 'Singapore',
    cities: 'Singapore',
    route: 'sea',
    why: 'Has no peat fires of its own, yet issues haze advisories in bad seasons. The source can be hundreds of km upwind.',
    pos: [98, 150],
  },
];

const HISTORY = [
  {
    year: '2015',
    title: 'One of the worst haze crises on record',
    facts: [
      'About 2.6 million hectares burned in Indonesia between June and October, around 4.5 times the size of Bali.',
      'The World Bank estimated the cost to Indonesia at US$16.1 billion, 1.9% of its GDP.',
      'Schools closed in Malaysia, and sports events were cancelled in Kuala Lumpur and Singapore.',
      'One study linked the Sept–Oct 2015 haze to about 100,300 excess deaths in Indonesia, Malaysia and Singapore.',
    ],
  },
  {
    year: '2019',
    title: 'The haze returns',
    facts: [
      'Nearly 2,500 schools were ordered shut in Malaysia, including almost 300 in Kuala Lumpur.',
      'Brunei reported haze it linked to hotspots across the border in Kalimantan.',
      'The World Bank put the economic damage to Indonesia at about US$5.2 billion.',
    ],
  },
];

const SOURCES = [
  { label: 'World Bank — The cost of fire (2015 crisis)', url: 'https://documents.worldbank.org/en/publication/documents-reports/documentdetail/776101467990969768/The-cost-of-fire-an-economic-analysis-of-Indonesia-s-2015-fire-crisis' },
  { label: 'BenarNews — Wildfires cost $16.1 billion in 2015', url: 'https://www.benarnews.org/english/news/indonesian/indonesia-fires-12152015170230.html' },
  { label: 'Planetary Health Alliance — Health and Haze', url: 'https://planetaryhealthalliance.org/wp-content/uploads/2025/02/Health-and-Haze.pdf' },
  { label: 'Dawn / AFP — Malaysia shuts thousands of schools (2019)', url: 'https://www.dawn.com/news/1506111' },
  { label: 'Wikipedia — 2019 Southeast Asian haze', url: 'https://en.wikipedia.org/wiki/2019_Southeast_Asian_haze' },
  { label: 'The ASEAN Post — World Bank 2019 estimate', url: 'https://theaseanpost.com/node/5509' },
];

/* ── Animation helpers ───────────────────────────────────────────── */
const HAZE_CSS = `
@keyframes haze-flicker { 0%,100% { transform: scale(1) rotate(-4deg); } 50% { transform: scale(1.14) rotate(4deg); } }
@keyframes haze-sway { 0%,100% { transform: translateX(-7px); } 50% { transform: translateX(7px); } }
@keyframes haze-fog { 0%,100% { opacity: .15; } 50% { opacity: .75; } }
@keyframes haze-flow { to { stroke-dashoffset: -24; } }
@keyframes haze-travel { 0% { left: 0; opacity: 0; } 15%,85% { opacity: 1; } 100% { left: calc(100% - 1.5rem); opacity: 0; } }
@keyframes haze-drop { 0% { top: 0; opacity: 0; } 20%,80% { opacity: 1; } 100% { top: calc(100% - 1.5rem); opacity: 0; } }
@keyframes haze-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .haze-anim { animation: none !important; } }
`;

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return undefined;
    setReduced(mq.matches);
    const on = (e) => setReduced(e.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduced;
}

function useInView(threshold = 0.35) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return undefined;
    if (!('IntersectionObserver' in window)) {
      setSeen(true);
      return undefined;
    }
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return [ref, seen];
}

const JOURNEY = [
  {
    icon: '🔥',
    anim: 'haze-flicker 0.9s ease-in-out infinite',
    title: 'Peat burns',
    text: 'Fires smolder underground for weeks and make thick smoke.',
    tint: 'bg-orange-100',
  },
  {
    icon: '🌬️',
    anim: 'haze-sway 2.4s ease-in-out infinite',
    title: 'Wind carries it',
    text: 'June to October, monsoon winds blow it across the sea.',
    tint: 'bg-sky-100',
  },
  {
    icon: '🏙️',
    anim: null,
    title: 'Neighbors breathe it',
    text: 'Schools close, flights stop, people get sick.',
    tint: 'bg-stone-200',
  },
];

function Connector({ vertical = false }) {
  return (
    <div
      className={`relative ${vertical ? 'mx-auto h-14 w-8' : 'h-8 w-full min-w-12'}`}
      aria-hidden="true"
    >
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox={vertical ? '0 0 10 100' : '0 0 100 10'}>
        <line
          x1={vertical ? 5 : 0}
          y1={vertical ? 0 : 5}
          x2={vertical ? 5 : 100}
          y2={vertical ? 100 : 5}
          stroke="#c2410c"
          strokeWidth={vertical ? 1.5 : 1.5}
          strokeDasharray="6 6"
          vectorEffect="non-scaling-stroke"
          className="haze-anim"
          style={{ animation: 'haze-flow 0.8s linear infinite' }}
        />
      </svg>
      <span
        className="haze-anim absolute text-lg"
        style={
          vertical
            ? { left: '0.25rem', animation: 'haze-drop 2.2s ease-in-out infinite' }
            : { top: '0.1rem', animation: 'haze-travel 2.2s ease-in-out infinite' }
        }
      >
        💨
      </span>
    </div>
  );
}

/* Source → journey → impact, played once it scrolls into view */
function HazeJourney() {
  const [ref, seen] = useInView();
  return (
    <section ref={ref} className="rounded-3xl border border-paper-edge bg-cream-50 p-5 sm:p-7" aria-labelledby="journey-title">
      <h3 id="journey-title" className="text-center font-display text-xl font-bold text-charcoal-900 sm:text-2xl">
        How the smoke travels
      </h3>
      <ol className="mt-6 flex flex-col items-stretch sm:flex-row sm:items-start">
        {JOURNEY.map((step, i) => (
          <React.Fragment key={step.title}>
            <li
              className="flex flex-1 flex-col items-center text-center transition-all duration-700 ease-out"
              style={{
                opacity: seen ? 1 : 0,
                transform: seen ? 'translateY(0)' : 'translateY(18px)',
                transitionDelay: `${i * 550}ms`,
              }}
            >
              <div className="relative">
                <div className={`relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full ${step.tint} shadow-inner`}>
                  <span className="haze-anim text-5xl" style={step.anim ? { animation: step.anim, display: 'inline-block' } : undefined}>
                    {step.icon}
                  </span>
                  {i === 2 && (
                    <span
                      className="haze-anim absolute inset-0 rounded-full bg-stone-500"
                      style={{ animation: 'haze-fog 3s ease-in-out infinite' }}
                    />
                  )}
                </div>
                <span className="absolute -top-1 -left-1 flex h-7 w-7 items-center justify-center rounded-full bg-charcoal-900 text-sm font-bold text-cream-50 shadow">
                  {i + 1}
                </span>
              </div>
              <p className="mt-3 font-display text-lg font-bold text-charcoal-900">{step.title}</p>
              <p className="mt-1 max-w-[15rem] text-sm leading-snug text-charcoal-700">{step.text}</p>
            </li>
            {i < JOURNEY.length - 1 && (
              <li
                className="transition-opacity duration-700 sm:mt-8 sm:w-24 sm:flex-none"
                style={{ opacity: seen ? 1 : 0, transitionDelay: `${i * 550 + 300}ms` }}
                aria-hidden="true"
              >
                <div className="hidden sm:block"><Connector /></div>
                <div className="py-2 sm:hidden"><Connector vertical /></div>
              </li>
            )}
          </React.Fragment>
        ))}
      </ol>
    </section>
  );
}

/* Schematic (not to scale) map of the region */
function HazeMap({ active, onSelect }) {
  const reduced = useReducedMotion();
  const source = [205, 175]; // Kalimantan
  return (
    <svg viewBox="0 0 420 260" className="h-auto w-full" role="img" aria-label="Schematic map: haze routes from Kalimantan to neighboring countries">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#9a6b4f" />
        </marker>
        <radialGradient id="smoke" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8b7d70" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#8b7d70" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="420" height="260" rx="16" fill="#e6f0f2" />
      {/* Peninsular Malaysia */}
      <path d="M40,20 Q70,25 78,60 Q86,100 100,135 L88,140 Q66,110 52,70 Q40,40 40,20 Z" fill="#dfe7d6" stroke="#9fb39a" />
      {/* Singapore */}
      <circle cx="98" cy="150" r="5" fill="#dfe7d6" stroke="#9fb39a" />
      {/* Sumatra */}
      <path d="M10,90 Q40,120 80,175 Q110,215 130,250 L110,255 Q70,210 35,160 Q10,125 10,90 Z" fill="#f1e2c9" stroke="#c9b28c" />
      {/* Borneo: Malaysian/Brunei north + Kalimantan south */}
      <path d="M200,95 Q250,55 330,45 Q370,60 360,100 Q300,120 240,140 Q205,140 200,95 Z" fill="#dfe7d6" stroke="#9fb39a" />
      <path d="M200,95 Q205,140 240,140 Q300,120 360,100 Q370,160 330,215 Q270,250 215,230 Q170,200 175,150 Q180,115 200,95 Z" fill="#f1e2c9" stroke="#c9b28c" />
      {/* Smoke plume */}
      <ellipse cx={source[0]} cy={source[1]} rx="120" ry="75" fill="url(#smoke)" />
      {/* Fire source, pulsing */}
      {!reduced && (
        <circle cx={source[0]} cy={source[1]} r="10" fill="#ea580c" opacity="0.35">
          <animate attributeName="r" values="8;22;8" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.45;0;0.45" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      <text x={source[0] - 9} y={source[1] + 6} fontSize="18">🔥</text>
      <text x={source[0] - 40} y={source[1] + 30} fontSize="11" fontWeight="700" fill="#7c2d12">Kalimantan (Indonesia)</text>
      <text x="25" y="235" fontSize="10" fill="#7c2d12" transform="rotate(-55 25 235)">Sumatra</text>
      {/* Routes */}
      {NEIGHBORS.map((n) => {
        const isActive = active === 'all' || active === n.id;
        const [x, y] = n.pos;
        const mx = (source[0] + x) / 2;
        const my = (source[1] + y) / 2 - (n.route === 'sea' ? 30 : 10);
        return (
          <g key={n.id} className="cursor-pointer" onClick={() => onSelect(n.id)}>
            <path
              id={`route-${n.id}`}
              d={`M${source[0]},${source[1] - 8} Q${mx},${my} ${x},${y}`}
              fill="none"
              stroke={isActive ? '#c2410c' : '#9a6b4f'}
              strokeWidth={isActive ? 3 : 1.8}
              strokeDasharray={n.route === 'sea' ? '6 5' : '0'}
              markerEnd="url(#arrow)"
              opacity={!isActive ? 0.35 : 0.9}
            />
            {!reduced &&
              [0, 1, 2].map((k) => (
                <circle key={k} r={isActive ? 6 : 4} fill="#6b5e55" opacity="0">
                  <animateMotion dur={isActive ? '2.4s' : '3.6s'} begin={`${k * (isActive ? 0.8 : 1.2)}s`} repeatCount="indefinite">
                    <mpath href={`#route-${n.id}`} />
                  </animateMotion>
                  <animate
                    attributeName="opacity"
                    values={isActive ? '0;0.75;0.6;0' : '0;0.35;0.25;0'}
                    dur={isActive ? '2.4s' : '3.6s'}
                    begin={`${k * (isActive ? 0.8 : 1.2)}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
            <circle cx={x} cy={y} r={isActive ? 7 : 5} fill={isActive ? '#c2410c' : '#fff'} stroke="#7c2d12" strokeWidth="1.5" />
            <text x={x + 9} y={y - 6} fontSize="11" fontWeight={isActive ? 700 : 500} fill="#1f2937">
              {n.place}
            </text>
          </g>
        );
      })}
      {/* Legend */}
      <g transform="translate(250,232)" fontSize="9" fill="#374151">
        <line x1="0" y1="0" x2="18" y2="0" stroke="#9a6b4f" strokeWidth="1.8" />
        <text x="22" y="3">Over land (Borneo)</text>
        <line x1="0" y1="14" x2="18" y2="14" stroke="#9a6b4f" strokeWidth="1.8" strokeDasharray="6 5" />
        <text x="22" y="17">Across the sea (monsoon wind)</text>
      </g>
    </svg>
  );
}

export default function ReachPage({ embedded = false }) {
  const Title = embedded ? 'h2' : 'h1';
  const { fireEvents = [], loading } = useFireData();
  // 'all' shows every route at once (the default); a place id shows just that one
  const [active, setActive] = useState('all');
  const selected = NEIGHBORS.find((n) => n.id === active) || null;
  // Tapping the place that is already selected goes back to All
  const pick = (id) => setActive((cur) => (cur === id ? 'all' : id));

  // Live: how many current hotspots sit near each route
  const live = useMemo(() => {
    const kalimantan = fireEvents.filter((f) => /kalimantan/i.test(f.provinsi || ''));
    const borneoBorder = kalimantan.filter((f) => /west|north|east/i.test(f.provinsi || '')).length;
    const peat = kalimantan.filter((f) => f.peat_risk === true).length;
    return { kalimantan: kalimantan.length, borneoBorder, peat };
  }, [fireEvents]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <style>{HAZE_CSS}</style>
      <header className="max-w-3xl">
        <p className="text-xs font-bold tracking-widest text-orange-700 uppercase">Cross-Border Impact</p>
        <Title className="mt-1 font-display text-3xl font-bold text-charcoal-900 sm:text-4xl">Smoke has no passport.</Title>
        <p className="mt-3 text-base leading-relaxed text-charcoal-700 sm:text-lg">
          When peat burns in Indonesia, the haze rides the wind to <strong>Malaysia, Singapore and Brunei</strong>.
          Millions of people breathe the same smoke, far from the fire.
        </p>
      </header>

      {/* Map + selected country */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-paper-edge bg-cream-50 p-4 shadow-xs lg:col-span-3">
          <HazeRealMap
            neighbors={NEIGHBORS}
            active={active}
            onSelect={pick}
            fireEvents={fireEvents}
            fallback={<HazeMap active={active} onSelect={pick} />}
          />
          <p className="mt-2 text-[11px] text-charcoal-500">Real satellite view. Moving dots are puffs of smoke; orange dots are recent fires detected by NASA satellites. Tap a place to focus on it.</p>
        </div>
        <div className="flex flex-col gap-4 lg:col-span-2">
          {selected ? (
            <div key={selected.id} className="animate-[haze-in_.5s_ease-out] rounded-2xl bg-moss-950 p-5 text-cream-50 shadow-md">
              <p className="text-xs font-semibold tracking-wide text-cream-200/70 uppercase">
                {selected.route === 'sea' ? 'Across the sea' : 'Same island, Borneo'}
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold">
                {selected.place}
              </h2>
              <p className="text-sm text-cream-200/70">{selected.country === selected.place ? selected.country : `${selected.country} · ${selected.cities}`}</p>
              <p className="mt-3 text-sm leading-relaxed text-cream-100">{selected.why}</p>
            </div>
          ) : (
            <div key="all" className="animate-[haze-in_.5s_ease-out] rounded-2xl bg-moss-950 p-5 text-cream-50 shadow-md">
              <p className="text-xs font-semibold tracking-wide text-cream-200/70 uppercase">All neighbors · 3 countries</p>
              <h2 className="mt-1 font-display text-2xl font-bold">5 places breathe this smoke</h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                {NEIGHBORS.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => pick(n.id)}
                      className="flex w-full items-baseline justify-between gap-3 rounded-lg px-2 py-1 text-left hover:bg-white/10"
                    >
                      <span className="font-semibold text-cream-50">{n.place}</span>
                      <span className="shrink-0 text-xs text-cream-200/70">
                        {n.route === 'sea' ? 'across the sea' : 'over land'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-paper-edge bg-cream-50 p-4">
              <p className="text-xs font-semibold text-charcoal-600 uppercase">Fires in Kalimantan now</p>
              <p className="mt-1 font-display text-3xl font-bold text-charcoal-900 tabular-nums">{loading ? '…' : live.kalimantan}</p>
              <p className="text-[11px] text-charcoal-500">hotspots seen by NASA satellites</p>
            </div>
            <div className="rounded-2xl border border-paper-edge bg-cream-50 p-4">
              <p className="text-xs font-semibold text-charcoal-600 uppercase">Burning on peat</p>
              <p className="mt-1 font-display text-3xl font-bold text-orange-700 tabular-nums">{loading ? '…' : live.peat}</p>
              <p className="text-[11px] text-charcoal-500">peat smoke is the thickest</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setActive('all')}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                active === 'all' ? 'bg-orange-700 text-white' : 'bg-cream-200 text-charcoal-800 hover:bg-cream-300'
              }`}
            >
              All
            </button>
            {NEIGHBORS.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => pick(n.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  active === n.id ? 'bg-orange-700 text-white' : 'bg-cream-200 text-charcoal-800 hover:bg-cream-300'
                }`}
              >
                {n.place}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Why it travels: animated source → journey → impact */}
      <HazeJourney />

      {/* History */}
      <section className="rounded-2xl border border-paper-edge bg-cream-50 p-5">
        <h2 className="font-display text-xl font-bold text-charcoal-900">It has happened before</h2>
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
          {HISTORY.map((h) => (
            <div key={h.year} className="border-l-4 border-orange-600 pl-4">
              <p className="font-display text-3xl font-bold text-orange-700">{h.year}</p>
              <p className="font-semibold text-charcoal-900">{h.title}</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-charcoal-700">
                {h.facts.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-charcoal-700">
          ASEAN countries signed the <strong>Agreement on Transboundary Haze Pollution</strong> in 2002 to tackle the
          problem together, because no country can solve it alone.
        </p>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-moss-900 p-5 text-cream-50">
        <p className="font-display text-lg font-bold">Stopping the fire is the only way to stop the haze.</p>
        <div className="flex gap-2">
          <Link to="/map" className="rounded-xl bg-cream-50 px-4 py-2 text-sm font-bold text-moss-900">🗺️ See live fires</Link>
          <Link to="/#action" className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-charcoal-900">🤝 Take action</Link>
        </div>
      </section>

      <details className="text-xs text-charcoal-600">
        <summary className="cursor-pointer font-semibold">Sources</summary>
        <ul className="mt-2 space-y-1 pl-4">
          {SOURCES.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-charcoal-900">{s.label}</a>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
