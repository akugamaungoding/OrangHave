import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getFact,
  getSource,
  ML_SOURCES,
  NISAR_FACTS,
  ML_NATIONAL_SOURCES,
  ML_ECOSYSTEM_SOURCES,
} from '../nisarKnowledge';

/* ════════════════════════════════════════════════════════════════════
   Science & Method — for judges, lecturers and researchers.
   Theme stays karhutla (forest & peatland fire). Every number comes from
   public/data-source/ml-scores.json (written by ml/pipeline.py), and every
   claim from a scraped document in ml/source with its own link.
   ════════════════════════════════════════════════════════════════════ */

const FEATURE_LABELS = {
  confidence: 'Detection confidence',
  ndvi_delta_workbook: 'NDVI change (Δ)',
  nearest_protected_area_km: 'Distance to protected area',
  longitude: 'Longitude',
  latitude: 'Latitude',
  hour: 'Overpass hour',
  inside_mapped_burn: 'Inside mapped burn scar',
  inside_protected_area: 'Inside protected area',
  nearest_burn_km: 'Distance to burn scar',
  nearest_fire_km: 'Distance to nearest fire',
  fires_within_50km: 'Fires within 50 km',
};

const pct = (v) => (typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : '–');

function SourceLink({ file, children }) {
  const src = getSource(file);
  if (!src) return null;
  return (
    <a
      href={src.url}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-moss-800 underline decoration-dotted underline-offset-2 hover:text-moss-950"
    >
      {children || src.title} ↗
    </a>
  );
}

function FactLine({ factKey }) {
  const fact = getFact(factKey, false);
  if (!fact) return null;
  return (
    <li className="flex gap-2 text-sm leading-relaxed text-charcoal-700">
      <span className="mt-0.5 text-moss-600" aria-hidden="true">▸</span>
      <span>
        {fact.text}{' '}
        <span className="whitespace-nowrap text-xs text-charcoal-500">
          [<SourceLink file={fact.file}>{fact.source?.title}</SourceLink>]
        </span>
      </span>
    </li>
  );
}

function ImportanceBars({ items }) {
  if (!Array.isArray(items)) return null;
  const max = Math.max(...items.map((i) => i.share), 0.01);
  return (
    <ul className="mt-3 space-y-1.5">
      {items.slice(0, 4).map((i) => (
        <li key={i.feature} className="text-xs">
          <div className="flex justify-between gap-2 text-charcoal-700">
            <span>{FEATURE_LABELS[i.feature] || i.feature}</span>
            <span className="font-mono text-charcoal-500">{pct(i.share)}</span>
          </div>
          <div className="mt-0.5 h-1.5 rounded-full bg-cream-200">
            <div className="h-1.5 rounded-full bg-moss-600" style={{ width: `${(i.share / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function SciencePage({ embedded = false }) {
  const Title = embedded ? 'h2' : 'h1';
  const [scores, setScores] = useState(null);

  useEffect(() => {
    let active = true;
    fetch('/data-source/ml-scores.json')
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
      .then((json) => {
        if (active) setScores(json);
      });
    return () => {
      active = false;
    };
  }, []);

  const frp = scores?.random_forest_frp;
  const hab = scores?.random_forest_habitat;
  const ndvi = scores?.ndvi;
  const ndviDeltas = (ndvi?.plots || []).map((p) =>
    typeof p.delta === 'number' ? p.delta : Number((p.ndvi_after - p.ndvi_before).toFixed(2)),
  );
  const ndviLargeDrops = ndviDeltas.filter((d) => d <= (ndvi?.threshold_large_drop ?? -0.15)).length;
  const generated = scores?.generated_at ? new Date(scores.generated_at).toISOString().slice(0, 10) : null;

  const glance = [
    {
      label: 'Random Forest · fire energy',
      value: pct(frp?.oob?.accuracy),
      note: frp ? `out-of-bag accuracy · ${frp.n_trees} trees · n=${frp.oob?.n_oob}` : 'loading…',
    },
    {
      label: 'Random Forest · habitat suitability',
      value: pct(hab?.oob?.accuracy),
      note: hab ? `out-of-bag accuracy · ${hab.n_trees} trees · n=${hab.oob?.n_oob}` : 'loading…',
    },
    {
      label: 'NDVI change detection',
      value: ndvi ? `${ndviLargeDrops} / ${ndviDeltas.length}` : '–',
      note: ndvi ? `plots with Δ ≤ ${ndvi.threshold_large_drop} (large greenness drop)` : 'loading…',
    },
    {
      label: 'Sourced evidence',
      value: `${Object.keys(NISAR_FACTS).length}`,
      note: `facts, each quoted from ${ML_SOURCES.length} scraped documents in ml/source`,
    },
  ];

  const steps = [
    {
      n: '01',
      title: 'Fire & habitat data in',
      body: 'NASA FIRMS VIIRS/MODIS hotspots, mapped burn scars, protected areas, GBIF wildlife occurrences and NDVI plots — cross-checked against BRIN’s national hotspot system.',
      tag: 'public/data-source + BRIN',
    },
    {
      n: '02',
      title: 'NDVI change detection',
      body: ndvi
        ? `${ndvi.formula}. A drop below ${ndvi.threshold_large_drop} flags a canopy that lost greenness between the dry-season windows.`
        : 'Δ = NDVI after − NDVI before, per plot.',
      tag: 'greenness loss',
    },
    {
      n: '03',
      title: 'Random Forest · fire energy',
      body: frp?.task || 'Is this detection’s FRP above the median of the snapshot?',
      tag: frp ? `median FRP ${frp.median_frp} MW` : 'FRP',
      bars: frp?.feature_importance,
    },
    {
      n: '04',
      title: 'Random Forest · habitat suitability',
      body: hab?.task || 'Does this coordinate resemble recorded wildlife occurrences more than random background?',
      tag: hab ? `${hab.training_rows?.presence} presence · ${hab.training_rows?.background} background · depth ${hab.max_depth}` : 'suitability',
      bars: hab?.feature_importance,
    },
    {
      n: '05',
      title: 'Map & rescue missions',
      body: 'Scores drive the Field Notes on the map and the difficulty of each Radar Rescue mission — high-energy fires become harder missions.',
      tag: 'H.O.M.E. app',
    },
  ];

  const itenas = ML_NATIONAL_SOURCES.filter((s) => /itenas/.test(s.file));
  const brin = ML_NATIONAL_SOURCES.filter((s) => /brin/.test(s.file));

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-xs font-bold tracking-widest text-moss-700 uppercase">Science &amp; Method · Karhutla</p>
        <Title className="mt-1 font-display text-3xl font-bold text-charcoal-900 sm:text-4xl">
          How H.O.M.E. reads a burning peatland.
        </Title>
        <p className="mt-3 text-base leading-relaxed text-charcoal-700 sm:text-lg">
          Forest and peatland fires (karhutla) are seen from space as heat, lost greenness, and changed radar echoes.
          H.O.M.E. combines all three with a small, open machine-learning pipeline — and shows every number, every
          limit, and every source.
        </p>
      </header>

      {/* At a glance */}
      <section aria-label="Model results at a glance" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {glance.map((g) => (
          <div key={g.label} className="rounded-2xl border border-paper-edge bg-cream-50 p-4 shadow-sm">
            <div className="text-[11px] font-bold tracking-wide text-moss-700 uppercase">{g.label}</div>
            <div className="mt-1 font-display text-3xl font-bold text-charcoal-900">{g.value}</div>
            <div className="mt-1 text-xs leading-snug text-charcoal-600">{g.note}</div>
          </div>
        ))}
      </section>

      {/* Pipeline */}
      <section className="rounded-3xl border border-paper-edge bg-paper-warm p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-bold text-charcoal-900">The ML pipeline (ml/pipeline.py)</h3>
            <p className="text-sm text-charcoal-700">
              Python, standard library only — a hand-written Random Forest with a fixed seed, so anyone can reproduce it offline.
            </p>
          </div>
          <code className="rounded-lg bg-moss-950 px-3 py-1.5 font-mono text-xs text-cream-50">python ml/pipeline.py</code>
        </div>

        <ol className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
          {steps.map((s) => (
            <li key={s.n} className="flex flex-col rounded-2xl border border-paper-edge bg-cream-50 p-4">
              <span className="font-mono text-xs font-bold text-amber-700">{s.n}</span>
              <h4 className="mt-1 font-display font-bold text-charcoal-900">{s.title}</h4>
              <p className="mt-1 text-sm leading-snug text-charcoal-700">{s.body}</p>
              {s.bars && <ImportanceBars items={s.bars} />}
              <span className="mt-auto pt-3">
                <span className="inline-block rounded-full bg-moss-100 px-2.5 py-0.5 text-[11px] font-semibold text-moss-900">
                  {s.tag}
                </span>
              </span>
            </li>
          ))}
        </ol>
        {generated && (
          <p className="mt-3 text-xs text-charcoal-500">
            Scores generated {generated} from {scores.inputs?.fires} fire rows, {scores.inputs?.occurrences} occurrence rows
            and {scores.inputs?.ndvi_plots} NDVI plots.
          </p>
        )}
      </section>

      {/* National evidence base */}
      <section>
        <h3 className="font-display text-xl font-bold text-charcoal-900">Built on Indonesian research &amp; national data</h3>
        <p className="mt-1 max-w-3xl text-sm text-charcoal-700">
          The radar and greenness methods behind H.O.M.E. follow published geodesy research, and the fire signal is
          checked against Indonesia&apos;s own monitoring systems.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <article className="overflow-hidden rounded-3xl border border-paper-edge bg-cream-50 shadow-md">
            <div className="bg-gradient-to-br from-moss-800 to-moss-950 p-5 text-cream-50">
              <p className="text-xs font-bold tracking-widest text-amber-200 uppercase">Geodesy &amp; remote sensing</p>
              <h4 className="mt-1 font-display text-2xl font-bold">ITENAS Bandung</h4>
              <p className="text-xs text-cream-200/80">Teknik Geodesi · SAR, NDVI, land-cover change</p>
            </div>
            <div className="p-5">
              <ul className="space-y-2">
                <FactLine factKey="itenasSar" />
                <FactLine factKey="itenasFusion" />
                <FactLine factKey="itenasJournal" />
              </ul>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {itenas.map((s) => (
                  <a
                    key={s.file}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-paper-edge bg-paper-warm px-3 py-1 font-semibold text-charcoal-800 hover:bg-cream-200"
                  >
                    {s.title} ↗
                  </a>
                ))}
              </div>
            </div>
          </article>

          <article className="overflow-hidden rounded-3xl border border-paper-edge bg-cream-50 shadow-md">
            <div className="bg-gradient-to-br from-amber-800 to-orange-950 p-5 text-cream-50">
              <p className="text-xs font-bold tracking-widest text-amber-200 uppercase">National monitoring &amp; data</p>
              <h4 className="mt-1 font-display text-2xl font-bold">BRIN</h4>
              <p className="text-xs text-cream-200/80">Hotspots · radar & optical catalogue · open research data</p>
            </div>
            <div className="p-5">
              <ul className="space-y-2">
                <FactLine factKey="brinHotspot" />
                <FactLine factKey="brinRadarCatalog" />
                <FactLine factKey="rinLulc" />
                <FactLine factKey="spbnHotspot" />
              </ul>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {brin.map((s) => (
                  <a
                    key={s.file}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-paper-edge bg-paper-warm px-3 py-1 font-semibold text-charcoal-800 hover:bg-cream-200"
                  >
                    {s.title} ↗
                  </a>
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Honest limits */}
      <section className="rounded-3xl border-2 border-dashed border-amber-700/40 bg-amber-50/70 p-5 sm:p-6">
        <h3 className="font-display text-lg font-bold text-charcoal-900">What these numbers are — and are not</h3>
        <ul className="mt-3 grid grid-cols-1 gap-2 text-sm text-charcoal-700 md:grid-cols-3">
          <li className="rounded-xl bg-cream-50 p-3">
            <strong className="text-charcoal-900">Hotspot ≠ burned forest.</strong> A thermal anomaly is a heat signal,
            not confirmed fire damage or wildlife loss.
          </li>
          <li className="rounded-xl bg-cream-50 p-3">
            <strong className="text-charcoal-900">Small samples.</strong> {frp?.not_claimed || 'The fire-energy class is about detection brightness.'}{' '}
            {hab?.not_claimed || 'Habitat suitability is not a sighting.'}
          </li>
          <li className="rounded-xl bg-cream-50 p-3">
            <strong className="text-charcoal-900">NDVI is a worked example.</strong> The plots are a workbook table, not a
            satellite extract. {getFact('brinOpenData', false)?.text}
          </li>
        </ul>
      </section>

      {/* From prototype to service */}
      <section className="rounded-3xl bg-moss-950 p-6 text-cream-50">
        <h3 className="font-display text-xl font-bold">From competition prototype to a karhutla early-warning service</h3>
        <p className="mt-1 max-w-3xl text-sm text-cream-200/80">
          The next step is to run this pipeline on real BRIN and NASA data every fire season, and grow it with
          Indonesia&apos;s climate-tech ecosystem.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { key: 'block71', step: 'Incubate & build' },
            { key: 'innofactory', step: 'Access & sustain' },
            { key: 'skala', step: 'Validate with metrics' },
          ].map(({ key, step }) => {
            const fact = getFact(key, false);
            return (
              <a
                key={key}
                href={fact?.source?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col rounded-2xl bg-white/5 p-4 hover:bg-white/10"
              >
                <span className="text-xs font-bold tracking-widest text-amber-200 uppercase">{step}</span>
                <h4 className="mt-1 font-bold">{fact?.source?.title} ↗</h4>
                <p className="mt-1 text-sm text-cream-200/80">{fact?.text}</p>
              </a>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-cream-200/60">
          H.O.M.E. is not affiliated with these organisations; they are listed as the ecosystem we aim to grow in.
          Sources: {ML_ECOSYSTEM_SOURCES.map((s) => s.title).join(' · ')}.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/map" className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-charcoal-900 hover:bg-amber-400">
            See the live karhutla map →
          </Link>
          <Link to="/game" className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-cream-50 hover:bg-white/10">
            Try a rescue mission →
          </Link>
        </div>
      </section>
    </div>
  );
}
