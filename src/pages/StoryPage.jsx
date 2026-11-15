import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BurnTransition, ColorReturn, WatercolorCard } from '../components';

/* ════════════════════════════════════════════════════════════════════
   Interactive Story — a watercolor storybook about Indonesia's wildlife.
   The reader moves page by page: the forest is home, it burns, it is seen
   from space, and (if the reader chooses) it slowly turns green again.
   ════════════════════════════════════════════════════════════════════ */

const ART = '/assets/art';

/* Every member of the cast has been documented as a victim of Indonesia's
   forest & land fires (karhutla): evacuated, displaced or losing habitat. */
const CAST = [
  { id: 'orangutan', name: 'Tuki', kind: 'Bornean Orangutan', where: 'Kalimantan' },
  { id: 'proboscis', name: 'Kahau', kind: 'Proboscis Monkey', where: 'Kalimantan' },
  { id: 'sunbear', name: 'Madu', kind: 'Sun Bear', where: 'Kalimantan' },
  { id: 'pangolin', name: 'Liku', kind: 'Sunda Pangolin', where: 'Kalimantan' },
  { id: 'tiger', name: 'Datuk', kind: 'Sumatran Tiger', where: 'Sumatra' },
  { id: 'elephant', name: 'Rimba', kind: 'Sumatran Elephant', where: 'Sumatra' },
];

const ALSO_HIT = ['🦤 Helmeted Hornbill', '🦏 Sumatran Rhino', '🐾 Malayan Tapir', '🐒 Gibbons', '🐆 Clouded Leopard', '🐒 Slow Loris'];

const PAGES = [
  { id: 'home', label: 'Home' },
  { id: 'dry', label: 'Dry season' },
  { id: 'fire', label: 'Fire' },
  { id: 'space', label: 'Seen from space' },
  { id: 'choice', label: 'Your choice' },
  { id: 'return', label: 'The green return' },
];

function Scene({ src, alt, className = '' }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-paper-edge bg-cream-100 shadow-md ${className}`}>
      <img src={src} alt={alt} className="block aspect-[8/5] w-full object-cover" />
    </div>
  );
}

function CastRow({ grey = false, fleeing = false }) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
      {CAST.map((c, i) => (
        <figure
          key={c.id}
          className="text-center transition-all duration-700"
          style={{
            filter: grey ? 'grayscale(100%) brightness(0.85)' : 'none',
            transform: fleeing ? `translateX(${i % 2 ? 6 : -6}px)` : 'none',
          }}
        >
          <img src={`${ART}/${c.id}.svg`} alt={`${c.name} the ${c.kind}`} className="mx-auto h-16 w-16 sm:h-20 sm:w-20" />
          <figcaption className="mt-1 text-[11px] leading-tight text-charcoal-700">
            <strong className="block font-hand text-base text-charcoal-900">{c.name}</strong>
            {c.kind}
            <span className="block text-[10px] text-charcoal-500">{c.where}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export default function StoryPage({ embedded = false }) {
  const Title = embedded ? 'h2' : 'h1';
  const [page, setPage] = useState(0);
  const [dryness, setDryness] = useState(0);
  const autoDryRef = useRef(0); // rAF id of the automatic slide (0 = not running)
  const userTookOverRef = useRef(false);
  const [choice, setChoice] = useState(null);
  const [bloom, setBloom] = useState(false);

  const current = PAGES[page].id;
  const go = (n) => {
    setPage(Math.max(0, Math.min(PAGES.length - 1, n)));
    if (embedded) document.getElementById('story')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Any link that points at the story (/#story) always opens it on page 1,
  // even if the reader had already turned some pages earlier.
  const location = useLocation();
  useEffect(() => {
    if (!embedded || location.hash !== '#story') return;
    setPage(0);
    setChoice(null);
    setDryness(0);
    requestAnimationFrame(() =>
      document.getElementById('story')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    );
    // location.key changes on every click, even when the URL is already /#story
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // Dry-season page: slide the "dry the forest" control by itself every time the page opens.
  // The reader can grab the slider at any moment, which stops the automatic slide.
  useEffect(() => {
    if (current !== 'dry') return undefined;
    userTookOverRef.current = false;
    setDryness(0);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setDryness(1);
      return undefined;
    }
    const DELAY = 700;
    const DURATION = 4200;
    let startAt = 0;
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
    const step = (now) => {
      if (userTookOverRef.current) return;
      if (!startAt) startAt = now;
      const t = Math.min(1, (now - startAt) / DURATION);
      setDryness(Math.round(ease(t) * 100) / 100);
      autoDryRef.current = t < 1 ? requestAnimationFrame(step) : 0;
    };
    const timer = setTimeout(() => {
      autoDryRef.current = requestAnimationFrame(step);
    }, DELAY);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(autoDryRef.current);
      autoDryRef.current = 0;
    };
  }, [current]);

  const stopAutoDry = () => {
    userTookOverRef.current = true;
    if (autoDryRef.current) cancelAnimationFrame(autoDryRef.current);
    autoDryRef.current = 0;
  };

  // Let the colors return a moment after the last page opens
  useEffect(() => {
    if (current !== 'return') {
      setBloom(false);
      return undefined;
    }
    const t = setTimeout(() => setBloom(true), 400);
    return () => clearTimeout(t);
  }, [current]);

  // Keyboard: ← → to turn pages
  useEffect(() => {
    if (embedded) return undefined;
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea')) return;
      if (e.key === 'ArrowRight' && !(current === 'choice' && choice !== 'help')) go(page + 1);
      if (e.key === 'ArrowLeft') go(page - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const nextDisabled = page === PAGES.length - 1 || (current === 'choice' && choice !== 'help');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Header + progress */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-widest text-moss-700 uppercase">Interactive Story</p>
          <Title className="font-hand text-4xl font-bold text-charcoal-900 sm:text-5xl">When the Forest Burns</Title>
        </div>
        <ol className="flex gap-1.5" aria-label="Story pages">
          {PAGES.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => (i <= page || (i === page + 1 && !nextDisabled) ? go(i) : null)}
                aria-current={i === page ? 'step' : undefined}
                title={p.label}
                className={`h-2.5 rounded-full transition-all ${i === page ? 'w-8 bg-moss-700' : i < page ? 'w-2.5 bg-moss-400' : 'w-2.5 bg-cream-400'
                  }`}
              >
                <span className="sr-only">{p.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </header>

      <WatercolorCard variant={current === 'fire' || current === 'dry' ? 'burn' : current === 'space' ? 'cool' : 'warm'} className="p-5 sm:p-8">
        <p className="mb-1 text-xs font-semibold tracking-wide text-charcoal-500 uppercase">
          Page {page + 1} of {PAGES.length} · {PAGES[page].label}
        </p>

        {/* ── 1. Home ───────────────────────────────────── */}
        {current === 'home' && (
          <div className="grid gap-6 md:grid-cols-2 md:items-center">
            <Scene src={`${ART}/forest-home.svg`} alt="A lush watercolor rainforest in Kalimantan" />
            <div>
              <h2 className="font-display text-2xl font-bold text-charcoal-900">This forest is someone&apos;s home.</h2>
              <p className="mt-3 leading-relaxed text-charcoal-700">
                In the peat swamp forests of <strong>Indonesia</strong>, Tuki the
                orangutan builds a new nest every night, Kahau the proboscis monkey sleeps by the river, and Datuk the
                tiger walks the same trails his family always has. Below them, the ground is not soil but{' '}
                <strong>peat</strong>: thousands of years of soaked leaves, holding water like a giant sponge.
              </p>
              <p className="mt-3 leading-relaxed text-charcoal-700">
                These six, and many more, are the animals that lose their homes when Indonesia&apos;s forests burn:
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ALSO_HIT.map((c) => (
                  <span key={c} className="rounded-full bg-cream-200 px-2.5 py-1 text-xs text-charcoal-800">{c}</span>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <CastRow />
            </div>
          </div>
        )}

        {/* ── 2. Dry season (interactive burn) ─────────────── */}
        {current === 'dry' && (
          <div className="grid gap-6 md:grid-cols-2 md:items-center">
            <BurnTransition progress={dryness} className="rounded-2xl">
              <Scene src={`${ART}/forest-home.svg`} alt="The same forest, drying out" />
            </BurnTransition>
            <div>
              <h2 className="font-display text-2xl font-bold text-charcoal-900">Then the rain stops.</h2>
              <p className="mt-3 leading-relaxed text-charcoal-700">
                Canals drain the peat to clear land. In a long dry season the sponge dries out, and a single spark can
                smolder underground for weeks.
              </p>
              <label htmlFor="dryness" className="mt-5 block text-sm font-semibold text-charcoal-900">
                Drag to dry the forest: <span className="tabular-nums text-orange-700">{Math.round(dryness * 100)}%</span>
              </label>
              <input
                id="dryness"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={dryness}
                onPointerDown={stopAutoDry}
                onKeyDown={stopAutoDry}
                onChange={(e) => {
                  stopAutoDry();
                  setDryness(Number(e.target.value));
                }}
                className="mt-2 w-full accent-orange-600"
              />
              <div className="mt-1 flex justify-between text-[11px] text-charcoal-500">
                <span>Wet peat 💧</span>
                <span>Bone dry 🔥</span>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. Fire ──────────────────────────────────────── */}
        {current === 'fire' && (
          <div className="grid gap-6 md:grid-cols-2 md:items-center">
            <Scene src={`${ART}/forest-burning.svg`} alt="The forest burning under orange smoke" />
            <div>
              <h2 className="font-display text-2xl font-bold text-charcoal-900">The forest catches fire.</h2>
              <p className="mt-3 leading-relaxed text-charcoal-700">
                Smoke turns the sky orange. Tuki&apos;s fruit trees fall and Kahau&apos;s riverbank turns to ash. Liku the
                pangolin curls into a ball instead of running. In Sumatra, Datuk and Rimba&apos;s herd are pushed out of
                the forest, toward villages and plantations.
              </p>
              <p className="mt-3 leading-relaxed text-charcoal-700">
                The smoke does not stop at the forest edge. It drifts across borders to Malaysia, Singapore and Brunei.
              </p>
              <Link to="/#reach" className="mt-3 inline-block text-sm font-semibold text-orange-700 underline underline-offset-2">
                See where the haze travels →
              </Link>
            </div>
            <div className="md:col-span-2">
              <CastRow grey fleeing />
            </div>
          </div>
        )}

        {/* ── 4. Seen from space ───────────────────────────── */}
        {current === 'space' && (
          <div className="grid gap-6 md:grid-cols-2 md:items-center">
            <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-6 text-cream-50 shadow-md">
              <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, #34d399 0, transparent 40%)' }} />
              <div className="relative space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden="true">🛰️</span>
                  <div>
                    <p className="font-semibold">Optical camera</p>
                    <p className="text-sm text-cream-200/70">Sees only grey smoke. ☁️☁️☁️</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden="true">📡</span>
                  <div>
                    <p className="font-semibold text-emerald-300">Radar (SAR)</p>
                    <p className="text-sm text-cream-200/70">Microwaves pass through smoke and map the trees below.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden="true">🔥</span>
                  <div>
                    <p className="font-semibold text-amber-300">Heat sensor (VIIRS)</p>
                    <p className="text-sm text-cream-200/70">Spots the hot points where fire is burning.</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-charcoal-900">Someone is watching from orbit.</h2>
              <p className="mt-3 leading-relaxed text-charcoal-700">
                High above, NASA and partner satellites can see what people on the ground can&apos;t: where the fire is,
                and which animal homes it is reaching. That warning gives rangers time to act.
              </p>
              <Link to="/map" className="mt-3 inline-block text-sm font-semibold text-moss-800 underline underline-offset-2">
                Open the live fire map →
              </Link>
            </div>
          </div>
        )}

        {/* ── 5. Choice ───────────────────────────────────── */}
        {current === 'choice' && (
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-bold text-charcoal-900">What happens next is up to people.</h2>
            <p className="mt-3 leading-relaxed text-charcoal-700">
              A burned forest can grow back if its peat is re-wetted, its trees replanted and its animals protected.
              What do you choose?
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setChoice('ignore')}
                className={`rounded-2xl border-2 p-4 text-left transition-colors ${choice === 'ignore' ? 'border-charcoal-700 bg-charcoal-100' : 'border-paper-edge bg-cream-50 hover:border-charcoal-400'
                  }`}
              >
                <span className="text-2xl" aria-hidden="true">🙈</span>
                <strong className="mt-1 block text-charcoal-900">Look away</strong>
                <span className="text-sm text-charcoal-600">It&apos;s far away. Someone else will handle it.</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setChoice('help');
                  setTimeout(() => go(page + 1), 350);
                }}
                className={`rounded-2xl border-2 p-4 text-left transition-colors ${choice === 'help' ? 'border-moss-700 bg-moss-50' : 'border-paper-edge bg-cream-50 hover:border-moss-500'
                  }`}
              >
                <span className="text-2xl" aria-hidden="true">🌱</span>
                <strong className="mt-1 block text-charcoal-900">Help the forest heal</strong>
                <span className="text-sm text-charcoal-600">Learn, share and support the people on the ground.</span>
              </button>
            </div>
            {choice === 'ignore' && (
              <div className="mt-5 rounded-xl bg-charcoal-100 p-4 text-sm text-charcoal-800">
                <img src={`${ART}/forest-burning.svg`} alt="" className="mx-auto mb-3 h-28 rounded-lg object-cover grayscale" />
                The forest stays grey, and next dry season the fire comes back. <strong>Try the other choice?</strong>
              </div>
            )}
          </div>
        )}

        {/* ── 6. Return ───────────────────────────────────── */}
        {current === 'return' && (
          <div className="grid gap-6 md:grid-cols-2 md:items-center">
            <ColorReturn triggered={bloom} duration={2200} className="rounded-2xl">
              <Scene src={`${ART}/forest-restored.svg`} alt="The forest growing green again" />
            </ColorReturn>
            <div>
              <h2 className="font-display text-2xl font-bold text-charcoal-900">The colors come back.</h2>
              <p className="mt-3 leading-relaxed text-charcoal-700">
                Seedlings rise from the wet peat. Tuki builds her nest again, Kahau returns to the river, and Rimba&apos;s
                herd finds its old path. It takes years, but it starts with people who care.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to="/#action" className="rounded-xl bg-moss-800 px-4 py-2.5 text-sm font-bold text-cream-50 hover:bg-moss-900">
                  🤝 Take real action
                </Link>
                <Link to="/#wildlife" className="rounded-xl border border-moss-700/40 bg-cream-50 px-4 py-2.5 text-sm font-semibold text-moss-900 hover:bg-moss-50">
                  🐾 Meet more wildlife
                </Link>
              </div>
            </div>
            <div className="md:col-span-2">
              <CastRow grey={!bloom} />
            </div>
          </div>
        )}
      </WatercolorCard>

      {/* Page controls */}
      <nav className="mt-5 flex items-center justify-between" aria-label="Story navigation">
        <button
          type="button"
          onClick={() => go(page - 1)}
          disabled={page === 0}
          className="rounded-xl border border-paper-edge bg-cream-50 px-4 py-2.5 text-sm font-semibold text-charcoal-800 disabled:opacity-40"
        >
          ← Back
        </button>
        {!embedded && <span className="hidden text-xs text-charcoal-500 sm:block">Tip: use ← → keys</span>}
        {page < PAGES.length - 1 ? (
          <button
            type="button"
            onClick={() => go(page + 1)}
            disabled={nextDisabled}
            className="rounded-xl bg-moss-800 px-5 py-2.5 text-sm font-bold text-cream-50 hover:bg-moss-900 disabled:opacity-40"
          >
            {current === 'choice' ? 'Choose to continue' : 'Next →'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setChoice(null);
              setDryness(0);
              go(0);
            }}
            className="rounded-xl bg-moss-800 px-5 py-2.5 text-sm font-bold text-cream-50 hover:bg-moss-900"
          >
            ↺ Read again
          </button>
        )}
      </nav>
      <p className="mt-6 text-center text-[11px] text-charcoal-500">Illustrated characters, inspired by real species.</p>
    </div>
  );
}
