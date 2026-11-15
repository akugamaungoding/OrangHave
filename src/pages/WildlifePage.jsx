import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { INDONESIA_WILDLIFE_HABITATS } from '../nasaScraper';
import { WILDLIFE_SPECIES_PROFILES } from '../mapShared';

/* ════════════════════════════════════════════════════════════════════
   Wildlife — Indonesia's threatened species and their IUCN status.
   Built from the habitat corridors the Map watches, enriched with the
   IUCN profiles shipped in /data-source/iucn-species.json.
   ════════════════════════════════════════════════════════════════════ */

const STATUS = {
  CR: { label: 'Critically Endangered', short: 'Critically endangered', color: '#b91c1c', badge: 'bg-red-100 text-red-800 border-red-200' },
  EN: { label: 'Endangered', short: 'Endangered', color: '#ea580c', badge: 'bg-orange-100 text-orange-800 border-orange-200' },
  VU: { label: 'Vulnerable', short: 'Vulnerable', color: '#d9a531', badge: 'bg-amber-100 text-amber-900 border-amber-200' },
  LC: { label: 'Least Concern', short: 'Least concern', color: '#4d8649', badge: 'bg-moss-100 text-moss-800 border-moss-200' },
};
const STATUS_ORDER = ['CR', 'EN', 'VU', 'LC'];
const PREVIEW_COUNT = 8; // two rows on desktop

const REGIONS = ['Kalimantan', 'Sumatra', 'Java', 'Nusa Tenggara', 'Sulawesi', 'Papua'];
const regionOf = (island = '') => {
  if (/kalimantan|borneo/i.test(island)) return 'Kalimantan';
  if (/java/i.test(island)) return 'Java';
  if (/papua/i.test(island)) return 'Papua';
  return REGIONS.find((r) => island.toLowerCase().includes(r.toLowerCase())) || island;
};

const ART = {
  'bornean orangutan': '/assets/art/orangutan.svg',
  'sunda pangolin': '/assets/art/pangolin.svg',
  'sun bear': '/assets/art/sunbear.svg',
  'helmeted hornbill': '/assets/art/hornbill.svg',
  'lesser mouse deer': '/assets/art/mousedeer.svg',
};

const ICONS = { 'sunda pangolin': '🦔', 'lesser mouse deer': '🦌' };

function useSpeciesCatalog() {
  const [iucn, setIucn] = useState([]);
  useEffect(() => {
    let alive = true;
    fetch('/data-source/iucn-species.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => alive && setIucn(Array.isArray(d) ? d : []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return useMemo(() => {
    const map = new Map();
    const add = (name, data) => {
      const key = name.toLowerCase().trim();
      const prev = map.get(key) || { key, name, regions: new Set(), places: new Set() };
      map.set(key, { ...prev, ...data, regions: prev.regions, places: prev.places });
      return map.get(key);
    };

    INDONESIA_WILDLIFE_HABITATS.forEach((hab) => {
      (hab.speciesList || []).forEach((s) => {
        const entry = add(s.name, { icon: s.icon, sci: s.sci, status: s.status });
        entry.regions.add(regionOf(hab.island));
        entry.places.add(hab.corridorName.split(/\s[–-]\s/)[0]);
      });
    });

    iucn.forEach((s) => {
      const key = s.common_name.toLowerCase();
      const entry = add(s.common_name, {
        sci: s.scientific_name,
        status: s.red_list_status,
        icon: map.get(key)?.icon || ICONS[key] || '🐾',
        trend: s.population_trend,
        habitat: s.habitat,
        description: s.description,
        threats: s.threats,
        role: s.story_role,
      });
      entry.regions.add('Kalimantan');
    });

    Object.entries(WILDLIFE_SPECIES_PROFILES).forEach(([key, p]) => {
      const entry = map.get(key);
      if (!entry) return;
      Object.assign(entry, {
        trend: entry.trend || p.population_trend,
        habitat: entry.habitat || p.habitat,
        description: entry.description || p.description,
        threats: entry.threats || p.threats,
        role: entry.role || p.story_role,
      });
    });

    return [...map.values()]
      .map((e) => ({ ...e, art: ART[e.key], regions: [...e.regions], places: [...e.places] }))
      .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || a.name.localeCompare(b.name));
  }, [iucn]);
}

function StatusBar({ species, filter, onFilter }) {
  const counts = STATUS_ORDER.map((k) => ({ k, n: species.filter((s) => s.status === k).length }));
  const total = species.length || 1;
  return (
    <div>
      <div className="flex h-5 w-full gap-[2px] overflow-hidden rounded-full" role="img"
        aria-label={counts.map((c) => `${STATUS[c.k].label}: ${c.n}`).join(', ')}>
        {counts.filter((c) => c.n).map((c) => (
          <button
            key={c.k}
            type="button"
            onClick={() => onFilter(filter === c.k ? 'all' : c.k)}
            title={`${STATUS[c.k].label}: ${c.n}`}
            className="h-full transition-opacity"
            style={{ width: `${(c.n / total) * 100}%`, background: STATUS[c.k].color, opacity: filter !== 'all' && filter !== c.k ? 0.35 : 1 }}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {counts.map((c) => (
          <button
            key={c.k}
            type="button"
            onClick={() => onFilter(filter === c.k ? 'all' : c.k)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors ${
              filter === c.k ? 'border-charcoal-800 bg-cream-50' : 'border-transparent hover:bg-cream-50'
            }`}
          >
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: STATUS[c.k].color }} />
            <span>
              <strong className="block font-display text-xl text-charcoal-900 tabular-nums">{c.n}</strong>
              <span className="text-xs text-charcoal-600">{STATUS[c.k].short}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SpeciesDetail({ s, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={s.name}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-cream-50 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {s.art ? <img src={s.art} alt="" className="h-16 w-16" /> : <span className="text-5xl" aria-hidden="true">{s.icon}</span>}
            <div>
              <h2 className="font-display text-2xl font-bold text-charcoal-900">{s.name}</h2>
              <p className="text-sm text-charcoal-600 italic">{s.sci}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full px-2 text-2xl text-charcoal-500 hover:text-charcoal-900" aria-label="Close">×</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className={`rounded-full border px-2.5 py-1 font-bold ${STATUS[s.status]?.badge || ''}`}>{STATUS[s.status]?.label || s.status}</span>
          {s.trend && <span className="rounded-full bg-cream-200 px-2.5 py-1 text-charcoal-800">Population {s.trend === 'decreasing' ? '↘ decreasing' : s.trend}</span>}
          {s.regions.map((r) => <span key={r} className="rounded-full bg-moss-100 px-2.5 py-1 text-moss-900">📍 {r}</span>)}
        </div>
        {s.role && <p className="mt-4 font-hand text-xl text-moss-800">{s.role}</p>}
        {s.description && <p className="mt-2 text-sm leading-relaxed text-charcoal-700">{s.description}</p>}
        {s.habitat && (
          <p className="mt-3 text-sm text-charcoal-700"><strong className="text-charcoal-900">Habitat: </strong>{s.habitat}</p>
        )}
        {s.threats?.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-bold text-charcoal-900">Main threats</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {s.threats.map((t) => <span key={t} className="rounded-full bg-red-50 px-2.5 py-1 text-xs text-red-800">{t}</span>)}
            </div>
          </div>
        )}
        {s.places.length > 0 && (
          <p className="mt-3 text-xs text-charcoal-600"><strong>Watched on the map in:</strong> {s.places.join(', ')}</p>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/map" className="rounded-xl bg-moss-800 px-4 py-2 text-sm font-bold text-cream-50">🗺️ See fires near its home</Link>
          <a
            href={`https://www.iucnredlist.org/search?query=${encodeURIComponent(s.sci || s.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-paper-edge px-4 py-2 text-sm font-semibold text-charcoal-800"
          >
            IUCN Red List ↗
          </a>
        </div>
      </div>
    </div>
  );
}

export default function WildlifePage({ embedded = false }) {
  const Title = embedded ? 'h2' : 'h1';
  const species = useSpeciesCatalog();
  const [status, setStatus] = useState('all');
  const [region, setRegion] = useState('all');
  const [open, setOpen] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const gridRef = useRef(null);

  const inRegion = region === 'all' ? species : species.filter((s) => s.regions.includes(region));
  const matching = status === 'all' ? inRegion : inRegion.filter((s) => s.status === status);
  const shown = showAll ? matching : matching.slice(0, PREVIEW_COUNT);
  const hiddenCount = matching.length - shown.length;
  const collapse = () => {
    setShowAll(false);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const threatened = species.filter((s) => ['CR', 'EN', 'VU'].includes(s.status)).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header className="grid grid-cols-1 items-end gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <p className="text-xs font-bold tracking-widest text-moss-700 uppercase">Wildlife Profiles</p>
          <Title className="mt-1 font-display text-3xl font-bold text-charcoal-900 sm:text-4xl">Indonesia&apos;s rarest neighbors</Title>
          <p className="mt-3 text-base leading-relaxed text-charcoal-700">
            <strong>{threatened}</strong> of the {species.length} species we track live on the edge of extinction.
            These are the animals whose homes sit inside the fire-prone areas on our map.
          </p>
        </div>
        <div className="rounded-2xl border border-paper-edge bg-paper-warm p-4 lg:col-span-2">
          <p className="mb-2 text-xs font-semibold tracking-wide text-charcoal-600 uppercase">IUCN Red List status</p>
          <StatusBar species={inRegion} filter={status} onFilter={setStatus} />
        </div>
      </header>

      {/* Region filter */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by region">
        {['all', ...REGIONS].map((r) => {
          const n = r === 'all' ? species.length : species.filter((s) => s.regions.includes(r)).length;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                region === r ? 'bg-moss-800 text-cream-50' : 'bg-cream-200 text-charcoal-800 hover:bg-cream-300'
              }`}
            >
              {r === 'all' ? 'All Indonesia' : r} <span className="opacity-60">{n}</span>
            </button>
          );
        })}
        {status !== 'all' && (
          <button type="button" onClick={() => setStatus('all')} className="rounded-full border border-charcoal-300 px-3 py-1.5 text-sm text-charcoal-700">
            {STATUS[status].label} ×
          </button>
        )}
      </div>

      {/* Grid */}
      <ul ref={gridRef} className="grid scroll-mt-20 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((s) => (
          <li key={s.key}>
            <button
              type="button"
              onClick={() => setOpen(s)}
              className="group flex h-full w-full flex-col rounded-2xl border border-paper-edge bg-cream-50 p-4 text-left shadow-xs transition-transform hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                {s.art ? <img src={s.art} alt="" className="h-14 w-14" /> : <span className="text-4xl" aria-hidden="true">{s.icon}</span>}
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS[s.status]?.badge || ''}`} title={STATUS[s.status]?.label}>
                  {s.status}
                </span>
              </div>
              <h2 className="mt-3 font-display text-base leading-tight font-bold text-charcoal-900">{s.name}</h2>
              <p className="text-xs text-charcoal-500 italic">{s.sci}</p>
              <p className="mt-auto pt-2 text-[11px] text-charcoal-600">📍 {s.regions.join(', ')}</p>
            </button>
          </li>
        ))}
      </ul>
      {!matching.length && <p className="py-10 text-center text-charcoal-500">No species match these filters.</p>}

      {(hiddenCount > 0 || (showAll && matching.length > PREVIEW_COUNT)) && (
        <div className="flex justify-center">
          {hiddenCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="rounded-xl border border-moss-700/40 bg-cream-50 px-5 py-2.5 text-sm font-bold text-moss-900 shadow-xs hover:bg-moss-50"
            >
              See all {matching.length} species ↓
            </button>
          ) : (
            <button
              type="button"
              onClick={collapse}
              className="rounded-xl border border-paper-edge bg-cream-50 px-5 py-2.5 text-sm font-semibold text-charcoal-700 hover:bg-cream-200"
            >
              Show less ↑
            </button>
          )}
        </div>
      )}

      <p className="text-center text-[11px] text-charcoal-500">
        Status from the IUCN Red List as stored in this app&apos;s data files. Tap any animal for details.
      </p>

      {open && <SpeciesDetail s={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
