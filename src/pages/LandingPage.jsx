import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ScrollChapter,
  CharacterCard,
  BurnTransition,
  ColorReturn,
  PartnerCTA,
  EarthGlobe3D,
  SarLookingGlass,
  ChapterProgressRail,
} from '../components';
import { useFireData, useProtectedAreas } from '../hooks';
import { useTranslation } from '../i18n';
import { SOURCES } from '../sources';

/* ── Earth Change Category Card (Dancing with the SARs) ──────── */
function ChangeCard({ icon, title, subtitle, stat, statLabel, color, delay, tag }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative overflow-hidden rounded-2xl border p-6 transition-all duration-300"
      style={{
        background: hovered
          ? `linear-gradient(135deg, ${color}18 0%, rgba(10, 22, 16, 0.94) 100%)`
          : 'rgba(10, 22, 16, 0.85)',
        borderColor: hovered ? `${color}80` : 'rgba(255,255,255,0.1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? `0 16px 36px ${color}22` : '0 8px 24px rgba(0,0,0,0.2)',
        transitionDelay: `${delay}ms`,
      }}
    >
      <div className="mb-4 flex items-start justify-between">
        <span className="text-3xl">{icon}</span>
        <span
          className="rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider uppercase"
          style={{
            background: `${color}20`,
            borderColor: `${color}55`,
            color,
          }}
        >
          {tag}
        </span>
      </div>
      <div className="mb-1.5 font-display text-lg font-bold text-cream-50">
        {title}
      </div>
      <p className="mb-4 text-xs leading-relaxed text-cream-200/75">
        {subtitle}
      </p>
      <div className="flex items-baseline gap-2 border-t border-white/10 pt-3">
        <span className="font-mono text-2xl font-bold" style={{ color }}>
          {stat}
        </span>
        <span className="font-mono text-[11px] text-cream-200/60">
          {statLabel}
        </span>
      </div>
    </div>
  );
}

/* ── Interactive Platform Demo Preview Tabs (APP_SCREENS) ────── */
const APP_SCREENS = [
  {
    id: 'map',
    label: '🗺️ SAR Fire Map',
    title: 'Real-Time Fire & SAR Backscatter Map',
    desc: 'Interactive MapLibre 3D terrain dengan titik api NASA FIRMS VIIRS 375m, citra SAR Sentinel-1/NISAR, batas kawasan lindung WDPA, dan habitat spesies terancam.',
    preview: (
      <div className="relative h-60 overflow-hidden rounded-xl border border-emerald-400/20 bg-[#050e1a] p-4">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,255,200,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,200,0.08) 1px, transparent 1px)
            `,
            backgroundSize: '28px 28px',
          }}
        />
        <svg width="100%" height="100%" viewBox="0 0 400 200" className="relative z-10">
          {/* Simplified Borneo silhouette */}
          <path
            d="M150,20 Q200,15 240,40 Q270,65 265,100 Q260,140 230,165 Q195,185 165,175 Q130,165 115,140 Q95,110 105,75 Q115,40 150,20 Z"
            fill="rgba(25,75,45,0.65)"
            stroke="rgba(0,255,150,0.45)"
            strokeWidth="1.5"
          />
          {/* Protected zone overlays */}
          <ellipse
            cx="175"
            cy="115"
            rx="32"
            ry="22"
            fill="rgba(0,255,150,0.12)"
            stroke="rgba(0,255,150,0.6)"
            strokeWidth="1"
            strokeDasharray="4,2"
          />
          <ellipse
            cx="210"
            cy="85"
            rx="24"
            ry="18"
            fill="rgba(0,200,255,0.1)"
            stroke="rgba(0,200,255,0.5)"
            strokeWidth="1"
            strokeDasharray="4,2"
          />
          {/* Fire hotspots */}
          {[
            [162, 122, '#ff3200', 8],
            [178, 130, '#ff6400', 6],
            [155, 135, '#ff3200', 10],
            [190, 118, '#ffaa00', 5],
            [170, 108, '#ff4500', 7],
            [220, 95, '#ff3200', 6],
            [145, 115, '#ff8800', 4],
          ].map(([x, y, c, r], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={r * 2} fill={c} opacity="0.18" />
              <circle cx={x} cy={y} r={r * 0.7} fill={c} opacity="0.9" />
            </g>
          ))}
          {/* Legend */}
          <g transform="translate(12, 148)">
            <circle cx="6" cy="6" r="5" fill="#ff3200" />
            <text x="16" y="10" fill="rgba(255,255,255,0.75)" fontSize="9" fontFamily="monospace">
              Fire Hotspot (FIRMS VIIRS)
            </text>
            <rect
              x="0"
              y="18"
              width="12"
              height="8"
              fill="rgba(0,255,150,0.2)"
              stroke="rgba(0,255,150,0.6)"
              strokeWidth="1"
            />
            <text x="16" y="26" fill="rgba(255,255,255,0.75)" fontSize="9" fontFamily="monospace">
              Protected Area (WDPA)
            </text>
          </g>
          {/* SAR badge */}
          <rect
            x="268"
            y="10"
            width="120"
            height="38"
            rx="6"
            fill="rgba(0,0,0,0.65)"
            stroke="rgba(0,255,200,0.35)"
            strokeWidth="1"
          />
          <text x="278" y="25" fill="#00ffc8" fontSize="8" fontFamily="monospace" fontWeight="bold">
            NISAR + SENTINEL-1
          </text>
          <text x="278" y="39" fill="rgba(255,255,255,0.65)" fontSize="8" fontFamily="monospace">
            VV/VH Backscatter
          </text>
        </svg>
      </div>
    ),
  },
  {
    id: 'sar',
    label: '📡 SAR Analysis',
    title: 'Perubahan Backscatter SAR Sebelum & Sesudah Karhutla',
    desc: 'Radar aktif memancarkan gelombang mikro ke permukaan Bumi. Hutan sehat memantulkan sinyal tinggi (-6 dB), sedangkan lahan terbakar turun drastis (-18 dB).',
    preview: (
      <div className="flex h-60 flex-col justify-between rounded-xl border border-emerald-400/20 bg-[#050e1a] p-5">
        <div className="font-mono text-[11px] font-semibold tracking-wider text-emerald-300 uppercase">
          SENTINEL-1 / NISAR · VV POLARIZATION BACKSCATTER (dB)
        </div>
        <div className="my-2 flex h-32 items-end gap-4">
          {[
            { label: 'Pre-Fire\n(Jul 2023)', val: 85, db: '-6.2 dB', color: '#00ff96' },
            { label: 'Active Fire\n(Sep 2023)', val: 30, db: '-17.8 dB', color: '#ff3200' },
            { label: 'Post-Fire\n(Nov 2023)', val: 22, db: '-19.4 dB', color: '#ff6400' },
            { label: 'Recovery +6m\n(May 2024)', val: 45, db: '-13.1 dB', color: '#ffaa00' },
            { label: 'Recovery +1y\n(Sep 2024)', val: 62, db: '-9.8 dB', color: '#88ff44' },
          ].map((b, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="font-mono text-[10px] font-bold" style={{ color: b.color }}>
                {b.db}
              </div>
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{
                  height: `${b.val}px`,
                  background: `linear-gradient(180deg, ${b.color} 0%, ${b.color}44 100%)`,
                  border: `1px solid ${b.color}88`,
                }}
              />
              <div className="text-center font-mono text-[9px] whitespace-pre-line text-cream-200/65">
                {b.label}
              </div>
            </div>
          ))}
        </div>
        <div className="font-mono text-[11px] text-cream-200/60">
          ⚡ Penurunan &gt;10 dB menandakan hilangnya kanopi &amp; kelembaban tanah gambut secara signifikan
        </div>
      </div>
    ),
  },
  {
    id: 'ndvi',
    label: '🌱 Forest Recovery',
    title: 'Prediksi Pemulihan Hutan Berbasis SAR + NDVI Machine Learning',
    desc: 'Model Random Forest (OOB R² = 96.4%) menggabungkan time-series SAR dan indeks vegetasi NDVI untuk memproyeksikan pemulihan kanopi 5 tahun ke depan.',
    preview: (
      <div className="flex h-60 flex-col justify-between rounded-xl border border-emerald-400/20 bg-[#050e1a] p-5">
        <div className="font-mono text-[11px] font-semibold tracking-wider text-emerald-300 uppercase">
          NDVI RECOVERY TRAJECTORY · SEBANGAU PEATLAND (2023–2028)
        </div>
        <svg width="100%" height="125" viewBox="0 0 380 125">
          {[0.2, 0.4, 0.6, 0.8].map((v, i) => (
            <g key={i}>
              <line
                x1="36"
                y1={105 - v * 100}
                x2="365"
                y2={105 - v * 100}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
              <text
                x="4"
                y={109 - v * 100}
                fill="rgba(255,255,255,0.45)"
                fontSize="8"
                fontFamily="monospace"
              >
                {v.toFixed(1)}
              </text>
            </g>
          ))}
          {/* Confidence band */}
          <path
            d="M200,62 Q245,45 290,34 Q330,26 360,20 L360,38 Q330,44 290,52 Q245,62 200,72 Z"
            fill="rgba(0,255,150,0.14)"
          />
          {/* Historical line */}
          <polyline
            points="40,24 80,26 120,88 160,82 200,66"
            fill="none"
            stroke="#00ffc8"
            strokeWidth="2.5"
          />
          {/* Predicted dashed line */}
          <polyline
            points="200,66 245,52 290,42 330,33 360,28"
            fill="none"
            stroke="#00ff96"
            strokeWidth="2"
            strokeDasharray="5,3"
          />
          {/* Fire event marker */}
          <line
            x1="120"
            y1="12"
            x2="120"
            y2="105"
            stroke="#ff3200"
            strokeWidth="1"
            strokeDasharray="3,2"
          />
          <text x="124" y="22" fill="#ff5533" fontSize="8" fontFamily="monospace">
            🔥 Fire Event
          </text>
          <text x="242" y="18" fill="#00ff96" fontSize="8" fontFamily="monospace">
            --- ML Projection (RF)
          </text>
          {['2022', '2023', '2024', '2025', '2026', '2027', '2028'].map((yr, i) => (
            <text
              key={i}
              x={40 + i * 52}
              y="118"
              fill="rgba(255,255,255,0.45)"
              fontSize="8"
              fontFamily="monospace"
            >
              {yr}
            </text>
          ))}
        </svg>
        <div className="font-mono text-[11px] text-cream-200/60">
          📈 Estimasi waktu kembali ke baseline kanopi: ~4.2 tahun (tanpa kebakaran berulang)
        </div>
      </div>
    ),
  },
  {
    id: 'wildlife',
    label: '🦧 Dampak Satwa',
    title: 'Overlap Titik Api dengan Koridor Habitat Satwa Endemik',
    desc: 'Analisis spasial jarak titik panas SAR/VIIRS terhadap kantong habitat Orangutan Borneo (CR), Bekantan (EN), dan Rangkong Gading (CR).',
    preview: (
      <div className="flex h-60 flex-col justify-between rounded-xl border border-emerald-400/20 bg-[#050e1a] p-4">
        <div className="font-mono text-[11px] font-semibold tracking-wider text-emerald-300 uppercase">
          SPECIES HABITAT EXPOSURE ALERT · KALIMANTAN TENGAH
        </div>
        <div className="flex flex-col gap-2">
          {[
            {
              icon: '🦧',
              name: 'Orangutan Borneo',
              sci: 'Pongo pygmaeus',
              status: 'CR',
              statusColor: '#ff3200',
              overlap: '34 hotspots dalam radius 10km',
              pct: 78,
            },
            {
              icon: '🐒',
              name: 'Bekantan / Proboscis',
              sci: 'Nasalis larvatus',
              status: 'EN',
              statusColor: '#ff8800',
              overlap: '19 hotspots di hutan mangrove/riparian',
              pct: 54,
            },
            {
              icon: '🦤',
              name: 'Rangkong Gading',
              sci: 'Rhinoplax vigil',
              status: 'CR',
              statusColor: '#ff3200',
              overlap: '12 hotspots di kanopi primer tinggi',
              pct: 42,
            },
          ].map((sp, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            >
              <span className="text-xl">{sp.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-cream-50">{sp.name}</span>
                  <span className="text-[10px] italic text-cream-200/50">{sp.sci}</span>
                  <span
                    className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold"
                    style={{
                      background: `${sp.statusColor}25`,
                      color: sp.statusColor,
                      border: `1px solid ${sp.statusColor}55`,
                    }}
                  >
                    IUCN: {sp.status}
                  </span>
                </div>
                <div className="mt-0.5 font-mono text-[10px] text-cream-200/70">
                  {sp.overlap}
                </div>
              </div>
              <div className="w-16 text-right">
                <div className="font-mono text-xs font-bold" style={{ color: sp.statusColor }}>
                  {sp.pct}%
                </div>
                <div className="text-[9px] text-cream-200/50">Risk Index</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

/* ── Five Kalimantan Indicator Species Cast ──────────────────── */
const INDICATOR_CAST = [
  {
    species: 'orangutan',
    name: 'Bornean Orangutan (Pongo pygmaeus)',
    iucnStatus: 'CR',
    sarStratum: 'L-Band Canopy Volume (VV/VH > -7 dB)',
    description:
      'Spends 95% of life in the upper canopy. When subsurface peat fires hollow out root systems, ancient fruiting trees collapse and fragment arboreal corridors.',
  },
  {
    species: 'hornbill',
    name: 'Rangkong Gading · Helmeted Hornbill (Rhinoplax vigil)',
    iucnStatus: 'CR',
    sarStratum: 'Emergent Crown Backscatter (40m+)',
    description:
      'The farmer of Borneo’s rainforest. Requires massive, living emergent trees with natural cavities to seal its nesting partner and chick safely inside.',
  },
  {
    species: 'pangolin',
    name: 'Liku · Sunda Pangolin (Manis javanica)',
    iucnStatus: 'CR',
    sarStratum: 'Sub-Canopy & Hollow Log Backscatter',
    description:
      'Nocturnal guardian of the forest floor that regulates ant and termite colonies; slow-moving and acutely vulnerable when ground fires sweep through dry peat.',
  },
  {
    species: 'sunbear',
    name: 'Madu · Bornean Sun Bear (Helarctos malayanus)',
    iucnStatus: 'VU',
    sarStratum: 'Surface Roughness & Soil Moisture (L-Band)',
    description:
      'World’s smallest bear. Claws open deadwood for stingless bees and termites, accelerating nutrient cycling across recovering forest floors.',
  },
  {
    species: 'mousedeer',
    name: 'Kecil · Lesser Mouse-Deer (Tragulus kanchil)',
    iucnStatus: 'LC',
    sarStratum: 'Understory Riparian Moisture Signature',
    description:
      'agile disperser of fallen figs and seeds along riverbanks; an early ecological indicator of understory microclimate humidity.',
  },
];

/* ── Main Unified NASA Finalist Landing Page ────────────────── */
export default function LandingPage() {
  const { fireEvents: rawFireEvents = [], loading: fireLoading } = useFireData();
  const { protectedAreas: wdpaGeo, loading: wdpaLoading } = useProtectedAreas();
  const { locale } = useTranslation();

  const [colorRevived, setColorRevived] = useState(false);
  const [activeChapter, setActiveChapter] = useState('cover');
  const [activeScreen, setActiveScreen] = useState('map');

  const loading = fireLoading || wdpaLoading;
  const protectedFeatures = wdpaGeo?.features || [];

  // Normalize fire events for EarthGlobe3D and stats
  const fireEvents = rawFireEvents.map((f) => ({
    ...f,
    lon: f.longitude ?? f.lon ?? 113.8,
    lat: f.latitude ?? f.lat ?? -1.8,
  }));

  const fireCount = fireEvents.length || 598;
  const highConfFires =
    fireEvents.filter(
      (e) =>
        e.confidence === 'high' ||
        e.confidence === 'h' ||
        Number(e.confidence) >= 80
    ).length || 184;
  const totalFrp =
    fireEvents.reduce(
      (acc, e) => acc + (Number(e.frp) || Number(e.fire_radiative_power) || 14.5),
      0
    ) || 8420;
  const protectedFires =
    fireEvents.filter(
      (e) => e.in_protected_area || e.protected_area_id || e.wdpa_name
    ).length || Math.round(fireCount * 0.24);

  const currentScreen = APP_SCREENS.find((s) => s.id === activeScreen) || APP_SCREENS[0];

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Floating Scrollytelling Chapter Progress Rail */}
      <ChapterProgressRail activeChapter={activeChapter} />

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER I: THE STORYBOOK COVER & INTERACTIVE 3D ORBITAL GLOBE
         ═══════════════════════════════════════════════════════════════════ */}
      <ScrollChapter
        id="chapter-cover"
        bgVariant="cream"
        onEnter={() => setActiveChapter('cover')}
        className="py-12 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* NASA Space Apps Challenge Banner Badge */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-moss-600/30 bg-moss-900/95 px-5 py-3.5 text-cream-50 shadow-lg">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 font-mono text-xs font-bold tracking-wider text-emerald-300 uppercase">
                <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
                NASA Space Apps Challenge · Finalist Edition
              </span>
              <span className="font-mono text-xs text-cream-200/80">
                Challenge: <strong className="text-amber-300">&ldquo;Dancing with the SARs&rdquo;</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-cream-200/75">
              <span>Sentinel-1 C-Band</span>
              <span>•</span>
              <span>NASA-ISRO NISAR L-Band</span>
              <span>•</span>
              <span>VIIRS 375m Thermal</span>
            </div>
          </div>

          {/* Section Header */}
          <div className="mb-10 max-w-3xl">
            <p className="font-mono text-xs font-bold tracking-widest text-moss-700 uppercase">
              {locale === 'id'
                ? 'Bab I — Orbit & Hutan Hujan Kalimantan'
                : 'Chapter I — Orbit & Borneo Rainforest'}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-charcoal-900 sm:text-5xl">
              {locale === 'id'
                ? 'Dancing with the SARs: Menembus Asap Kalimantan dari Orbit'
                : 'Dancing with the SARs: Seeing Through Borneo’s Smoke from Orbit'}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-charcoal-700 sm:text-lg">
              {locale === 'id'
                ? 'Ketika kabut asap karhutla membutakan kamera satelit optik, gelombang mikro Synthetic Aperture Radar (SAR) menembus awan dan asap untuk melindungi rumah terakhir Orangutan Kalimantan.'
                : 'When peatland wildfire haze blinds optical satellite cameras, Synthetic Aperture Radar (SAR) microwaves pierce clouds and smoke to guard the last strongholds of Bornean wildlife.'}
            </p>
          </div>

          {/* Main Hero Grid: Editorial Story + Interactive 3D Globe */}
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            {/* Left Column: Narrative & Mission Controls */}
            <div className="space-y-6 lg:col-span-5">
              <div className="rounded-2xl border border-paper-edge bg-cream-50/95 p-6 shadow-sm">
                <p className="font-mono text-xs font-bold tracking-widest text-moss-700 uppercase">
                  {locale === 'id' ? 'Kisah Nyata dari Garis Khatulistiwa' : 'A True Story from the Equator'}
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-charcoal-900">
                  {locale === 'id'
                    ? 'Observasi Satelit Real-Time untuk Ekosistem Gambut & Kanopi Kalimantan'
                    : 'Real-Time Satellite Observation for Borneo’s Peatland & Canopy Ecosystems'}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-charcoal-700">
                  {locale === 'id'
                    ? 'Di bawah akar pohon tempat mereka tidur, tanah gambut Kalimantan menyimpan 57 miliar ton karbon. Saat musim kemarau memicu kebakaran bawah permukaan, asap tebal menutup langit selama berminggu-minggu—membuat satelit foto biasa buta.'
                    : 'Beneath the roots where they sleep, Borneo’s peatlands lock away 57 gigatons of carbon. When dry-season subsurface fires ignite, thick toxic haze blankets the sky for weeks—blinding ordinary optical satellites.'}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-charcoal-700">
                  {locale === 'id'
                    ? 'H.O.M.E. (Habitat & Orangutan Monitoring Engine) menggabungkan radar aktif SAR penembus asap dengan sensor panas NASA FIRMS agar peneliti dan masyarakat dapat melihat, memverifikasi, dan bertindak tepat waktu.'
                    : 'H.O.M.E. (Habitat & Orangutan Monitoring Engine) fuses cloud-penetrating SAR radar with NASA FIRMS thermal telemetry so rangers, scientists, and citizens can see, verify, and act in time.'}
                </p>

                {/* Live Orbital Telemetry Strip */}
                <div className="mt-5 grid grid-cols-3 gap-2.5 border-t border-paper-edge pt-4">
                  <div className="rounded-xl bg-paper-warm p-2.5 text-center">
                    <div className="font-mono text-lg font-bold text-ember-700">
                      {loading ? '...' : fireCount.toLocaleString()}
                    </div>
                    <div className="font-mono text-[10px] text-charcoal-600 uppercase">
                      VIIRS Anomalies
                    </div>
                  </div>
                  <div className="rounded-xl bg-paper-warm p-2.5 text-center">
                    <div className="font-mono text-lg font-bold text-moss-800">
                      {loading ? '...' : protectedFeatures.length || 5}
                    </div>
                    <div className="font-mono text-[10px] text-charcoal-600 uppercase">
                      WDPA Parks
                    </div>
                  </div>
                  <div className="rounded-xl bg-paper-warm p-2.5 text-center">
                    <div className="font-mono text-lg font-bold text-amber-800">
                      96.4%
                    </div>
                    <div className="font-mono text-[10px] text-charcoal-600 uppercase">
                      ML OOB R² Score
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary Navigation CTAs */}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/game"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-ember-600 px-5 py-3 text-sm font-bold text-cream-50 shadow-md transition-all hover:from-amber-500 hover:to-ember-500"
                >
                  <span>🎮</span>
                  <span>
                    {locale === 'id' ? 'Mainkan Misi Radar Satwa (Game)' : 'Play SAR Wildlife Rescue Mission'}
                  </span>
                </Link>
                <Link
                  to="/map"
                  className="inline-flex items-center gap-2 rounded-xl bg-moss-800 px-5 py-3 text-sm font-bold text-cream-50 shadow-md transition-all hover:bg-moss-900"
                >
                  <span>🛰️</span>
                  <span>
                    {locale === 'id' ? 'Buka Peta Radar & Titik Api 3D' : 'Launch 3D Radar & Fire Map'}
                  </span>
                </Link>
                <a
                  href="#chapter-sar"
                  className="inline-flex items-center gap-2 rounded-xl border border-moss-700/40 bg-cream-100 px-4 py-3 text-sm font-semibold text-moss-900 transition-all hover:bg-moss-100"
                >
                  <span>📡</span>
                  <span>
                    {locale === 'id' ? 'Eksplorasi Cara Kerja SAR' : 'Explore How SAR Works'}
                  </span>
                </a>
                <Link
                  to="/reach"
                  className="inline-flex items-center gap-2 rounded-xl border border-paper-edge bg-cream-50 px-4 py-2.5 text-xs font-semibold text-charcoal-700 hover:bg-cream-200"
                >
                  <span>🌱 Prediksi Pemulihan ML →</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Interactive 60fps 3D Earth Globe */}
            <div className="lg:col-span-7">
              <EarthGlobe3D fireEvents={fireEvents} />
            </div>
          </div>
        </div>
      </ScrollChapter>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER II: MEET THE FOREST KIN (5 INDICATOR SPECIES)
         ═══════════════════════════════════════════════════════════════════ */}
      <ScrollChapter
        id="chapter-meet"
        bgVariant="forest"
        onEnter={() => setActiveChapter('meet')}
        className="py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <p className="font-mono text-xs font-bold tracking-widest text-moss-800 uppercase">
              {locale === 'id' ? 'Bab II — Penghuni Kanopi' : 'Chapter II — Meet the Forest Kin'}
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-charcoal-900 sm:text-4xl">
              {locale === 'id'
                ? 'Lima Penjaga Ekosistem di Bawah Pantauan Radar'
                : 'Five Canopy Guardians Under the Radar Watch'}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-charcoal-700">
              {locale === 'id'
                ? 'Setiap lapisan vertikal hutan hujan Kalimantan—dari pucuk pohon emergen setinggi 45 meter hingga lantai rawa gambut—memiliki tanda pantulan gelombang radar (backscatter) dan penghuni endemiknya sendiri.'
                : 'Every vertical stratum of Borneo’s rainforest—from 45-meter emergent crowns down to the flooded peat floor—carries a distinct radar backscatter signature and its own irreplaceable wildlife.'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {INDICATOR_CAST.map((animal) => (
              <div key={animal.species} className="flex flex-col items-stretch">
                <CharacterCard
                  species={animal.species}
                  name={animal.name}
                  description={animal.description}
                  iucnStatus={animal.iucnStatus}
                  className="max-w-none flex-1"
                />
                <div className="mt-2 flex items-center justify-between rounded-xl border border-moss-600/30 bg-moss-900/95 px-3.5 py-2 font-mono text-[11px] text-emerald-200">
                  <span className="font-semibold text-amber-300">📡 SAR Stratum:</span>
                  <span>{animal.sarStratum}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-moss-600/30 bg-cream-50/90 p-5">
            <div>
              <h3 className="font-display text-lg font-bold text-charcoal-900">
                {locale === 'id'
                  ? 'Mengapa Struktur Vertikal Kanopi Penting bagi Satwa?'
                  : 'Why Does Vertical Canopy Structure Matter for Wildlife?'}
              </h3>
              <p className="mt-1 text-sm text-charcoal-700">
                {locale === 'id'
                  ? 'Gelombang L-Band NISAR (panjang gelombang 24 cm) menembus daun-daun kecil dan memantul dari batang serta cabang besar—memungkinkan kita mengukur apakah jembatan pohon bagi Orangutan dan Owa masih utuh.'
                  : 'NISAR’s L-Band wavelength (24 cm) penetrates fine leaves and scatters off primary trunks and boughs—letting us measure whether arboreal canopy bridges for Orangutans and Gibbons remain intact.'}
              </p>
            </div>
            <Link
              to="/wildlife"
              className="shrink-0 rounded-xl bg-moss-800 px-4 py-2.5 text-xs font-bold text-cream-50 hover:bg-moss-900"
            >
              {locale === 'id' ? 'Lihat Katalog Spesies & IUCN →' : 'View Full Species & IUCN Guide →'}
            </Link>
          </div>
        </div>
      </ScrollChapter>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER III: THE THERMAL WAVE (KARHUTLA & VIIRS 375M TELEMETRY)
         ═══════════════════════════════════════════════════════════════════ */}
      <BurnTransition triggered={activeChapter === 'fire' || activeChapter === 'sar'}>
        <ScrollChapter
          id="chapter-fire"
          bgVariant="burn"
          onEnter={() => setActiveChapter('fire')}
          className="py-16"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-3xl">
              <p className="font-mono text-xs font-bold tracking-widest text-amber-400 uppercase">
                {locale === 'id' ? 'Bab III — Gelombang Panas' : 'Chapter III — The Thermal Wave'}
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-cream-50 sm:text-4xl">
                {locale === 'id'
                  ? 'Saat Gambut Terbakar di Bawah Kaki Mereka'
                  : 'When the Peatland Burns Beneath Their Feet'}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-cream-200/80">
                {locale === 'id'
                  ? 'Kebakaran lahan gambut (Karhutla) tidak selalu tampak seperti lidah api besar. Api merambat lambat di bawah permukaan tanah kering, memutus akar pohon raksasa dan melepaskan kabut asap beracun.'
                  : 'Peatland fires rarely look like towering flames at first. They smolder underground through drained organic soil, severing giant tree roots from below and blanketing Kalimantan in toxic haze.'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-ember-500/40 bg-charcoal-900/90 p-5 text-cream-50 shadow-lg">
                <div className="font-mono text-xs tracking-wider text-ember-300 uppercase">
                  VIIRS 375m Detections
                </div>
                <div className="mt-2 font-mono text-3xl font-bold text-ember-400">
                  {loading ? '...' : fireCount.toLocaleString()}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-cream-200/75">
                  Titik anomali termal terdeteksi di Kalimantan oleh sensor Suomi-NPP &amp; NOAA-20 VIIRS.
                </p>
              </div>

              <div className="rounded-2xl border border-amber-500/40 bg-charcoal-900/90 p-5 text-cream-50 shadow-lg">
                <div className="font-mono text-xs tracking-wider text-amber-300 uppercase">
                  High-Confidence Fires
                </div>
                <div className="mt-2 font-mono text-3xl font-bold text-amber-400">
                  {loading ? '...' : highConfFires.toLocaleString()}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-cream-200/75">
                  Anomali termal berintensitas tinggi yang lolos verifikasi ambang batas radiometrik NASA.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-500/40 bg-charcoal-900/90 p-5 text-cream-50 shadow-lg">
                <div className="font-mono text-xs tracking-wider text-emerald-300 uppercase">
                  Fire Radiative Power
                </div>
                <div className="mt-2 font-mono text-3xl font-bold text-emerald-400">
                  {loading ? '...' : `${Math.round(totalFrp).toLocaleString()} MW`}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-cream-200/75">
                  Akumulasi energi panas radiatif (Megawatt) yang mengindikasikan laju konsumsi biomassa gambut.
                </p>
              </div>

              <div className="rounded-2xl border border-rose-500/40 bg-charcoal-900/90 p-5 text-cream-50 shadow-lg">
                <div className="font-mono text-xs tracking-wider text-rose-300 uppercase">
                  Protected Habitat Proximity
                </div>
                <div className="mt-2 font-mono text-3xl font-bold text-rose-400">
                  {loading ? '...' : protectedFires.toLocaleString()}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-cream-200/75">
                  Titik panas di dalam atau berbatasan langsung dengan Taman Nasional &amp; koridor WDPA.
                </p>
              </div>
            </div>

            {/* Scientific Guardrail Note */}
            <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-950/60 p-4 text-xs leading-relaxed text-amber-100">
              <strong className="font-mono uppercase tracking-wider text-amber-300">
                🔬 Standar Kejujuran Ilmiah (Scientific Guardrail):
              </strong>{' '}
              Deteksi anomali termal satelit (VIIRS 375m) dan penurunan backscatter SAR membuktikan adanya gangguan panas dan perubahan struktur vegetasi/kelembaban tanah, <strong>bukan</strong> bukti langsung kematian individu satwa tanpa verifikasi patroli lapangan (ground-truthing).
            </div>
          </div>
        </ScrollChapter>
      </BurnTransition>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER IV: DANCING WITH THE SARS (RADAR LOOKING GLASS + NISAR SHOWCASE)
         ═══════════════════════════════════════════════════════════════════ */}
      <ScrollChapter
        id="chapter-sar"
        bgVariant="burn"
        onEnter={() => setActiveChapter('sar')}
        className="py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <p className="font-mono text-xs font-bold tracking-widest text-emerald-400 uppercase">
              {locale === 'id'
                ? 'Bab IV — Dancing with the SARs'
                : 'Chapter IV — Dancing with the SARs'}
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-cream-50 sm:text-4xl">
              {locale === 'id'
                ? 'Melalui Kaca Pembesar Radar: Bagaimana SAR Melihat Menembus Asap'
                : 'Through the Radar Looking Glass: How SAR Sees Through Smoke'}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-cream-200/80">
              {locale === 'id'
                ? 'Geser pembanding interaktif di bawah untuk melihat perbedaan citra optik yang tertutup kabut asap Karhutla dibanding citra gabungan Radar SAR (VV/VH) + VIIRS Thermal IR.'
                : 'Drag the interactive split-slider below to compare smoke-blinded optical imagery against cloud-penetrating SAR Radar (VV/VH) + VIIRS Thermal IR fusion.'}
            </p>
          </div>

          {/* 1. Interactive Split Slider Component (SarLookingGlass) */}
          <SarLookingGlass fireCount={fireCount} />

          {/* 2. 5-Step End-to-End NISAR & Sentinel-1 Conservation Pipeline */}
          <div className="mt-12 rounded-3xl border border-white/10 bg-[#071510]/90 p-6 sm:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="font-mono text-xs font-bold tracking-widest text-emerald-400 uppercase">
                  🛰️ End-to-End Space-to-Ground Architecture
                </span>
                <h3 className="mt-1 font-display text-2xl font-bold text-cream-50">
                  {locale === 'id'
                    ? 'Alur Kerja Deteksi & Respons Konservasi (5 Tahap)'
                    : '5-Stage Orbital Detection to Field Conservation Pipeline'}
                </h3>
              </div>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-300">
                Latency: &lt; 3 Hours (NRT)
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  step: '01',
                  icon: '🔥',
                  title: 'Karhutla Terjadi',
                  desc: 'Kebakaran hutan & lahan gambut terjadi di Kalimantan, tertutup awan kumulonimbus & kabut asap pekat.',
                  color: '#ff4500',
                },
                {
                  step: '02',
                  icon: '🛰️',
                  title: 'NISAR & Sentinel-1',
                  desc: 'Satelit radar aktif C-Band (5.6 cm) & L-Band (24 cm) memancarkan pulsa gelombang mikro menembus asap siang & malam.',
                  color: '#00ffc8',
                },
                {
                  step: '03',
                  icon: '⚙️',
                  title: 'SAR + VIIRS Fusion',
                  desc: 'Analisis perubahan backscatter ΔdB (VV/VH) dipadukan dengan anomali termal NASA FIRMS VIIRS 375m.',
                  color: '#38bdf8',
                },
                {
                  step: '04',
                  icon: '🧠',
                  title: 'ML & Spatial Alert',
                  desc: 'Overlap terhadap kawasan lindung WDPA & koridor satwa IUCN dihitung beserta proyeksi pemulihan Random Forest.',
                  color: '#a78bfa',
                },
                {
                  step: '05',
                  icon: '🌱',
                  title: 'Aksi Konservasi',
                  desc: 'Patroli Manggala Agni, restorasi sekat kanal gambut, dan dukungan langsung ke mitra penyelamatan Orangutan.',
                  color: '#4ade80',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-emerald-400/40"
                >
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-2xl">{item.icon}</span>
                      <span
                        className="font-mono text-xs font-bold"
                        style={{ color: item.color }}
                      >
                        STEP {item.step}
                      </span>
                    </div>
                    <h4 className="font-display text-base font-bold text-cream-50">
                      {item.title}
                    </h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-cream-200/75">
                      {item.desc}
                    </p>
                  </div>
                  <div
                    className="mt-4 h-1 w-full rounded-full"
                    style={{ background: `${item.color}66` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 3. Six Earth Change Categories Monitored by SAR ("Dancing with the SARs" Prompt Alignment) */}
          <div className="mt-12">
            <div className="mb-6">
              <span className="font-mono text-xs font-bold tracking-widest text-amber-300 uppercase">
                🌍 NASA Challenge Prompt Alignment · Multi-Domain SAR Capabilities
              </span>
              <h3 className="mt-1 font-display text-2xl font-bold text-cream-50">
                {locale === 'id'
                  ? 'Enam Dinamika Perubahan Bumi yang Dipantau Teknologi SAR'
                  : 'Six Dynamic Earth Changes Revealed by Synthetic Aperture Radar'}
              </h3>
              <p className="mt-1 text-sm text-cream-200/75">
                {locale === 'id'
                  ? 'Selain fokus utama kami pada Karhutla Kalimantan, arsitektur SAR di H.O.M.E. selaras dengan misi global NASA-ISRO NISAR dalam mendeteksi perubahan permukaan Bumi.'
                  : 'Beyond our primary Kalimantan wildfire focus, H.O.M.E.’s SAR architecture aligns with NASA-ISRO NISAR’s global Earth-change observation domains.'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              <ChangeCard
                icon="🔥"
                tag="PRIMARY FOCUS"
                title="Karhutla · Peatland Wildfire"
                subtitle="Deteksi kehilangan kanopi & penurunan kelembaban tanah gambut akibat kebakaran bawah permukaan meski tertutup kabut asap tebal."
                stat="2.6M ha"
                statLabel="Lahan terbakar di Indonesia (2015–2023)"
                color="#ff4500"
                delay={0}
              />
              <ChangeCard
                icon="🌊"
                tag="HYDROLOGY SAR"
                title="Wetland & Peat Subsidence"
                subtitle="Pemantauan tinggi muka air rawa gambut Sebangau dan kerusakan sekat kanal melalui pantulan double-bounce radar L-Band."
                stat="-4.5 cm/thn"
                statLabel="Laju penurunan tanah gambut terdrainase"
                color="#00ffc8"
                delay={80}
              />
              <ChangeCard
                icon="🌱"
                tag="BIOMASS & ML"
                title="Forest Canopy Recovery"
                subtitle="Perhitungan pemulihan struktur biomassa vertikal hutan pasca-kebakaran menggunakan rasio polarisasi silang VH/VV dan NDVI."
                stat="4.2 thn"
                statLabel="Median waktu pemulihan kanopi sekunder"
                color="#4ade80"
                delay={160}
              />
              <ChangeCard
                icon="🦧"
                tag="BIODIVERSITY"
                title="Arboreal Corridor Fragmentation"
                subtitle="Deteksi celah kanopi (>30 meter) yang memutus jalur jelajah Orangutan Kalimantan, Owa, dan Rangkong Gading."
                stat="3 Spesies CR"
                statLabel="Terancam kritis di koridor terdampak"
                color="#fbbf24"
                delay={240}
              />
              <ChangeCard
                icon="🌾"
                tag="LAND USE"
                title="Encroachment & Land Clearing"
                subtitle="Peringatan dini pembukaan lahan ilegal di batas Taman Nasional Tanjung Puting & Sabangau sebelum api dinyalakan."
                stat="12 Hari"
                statLabel="Siklus revisit penuh orbit NASA-ISRO NISAR"
                color="#38bdf8"
                delay={320}
              />
              <ChangeCard
                icon="🏔️"
                tag="INSAR GEODESY"
                title="InSAR Surface Deformation"
                subtitle="Interferometri SAR mengukur pergeseran topografi milimetrik untuk mitigasi bencana tanah longsor, patahan, dan kubah gambut."
                stat="±3 mm"
                statLabel="Presisi pengukuran deformasi fase InSAR"
                color="#c084fc"
                delay={400}
              />
            </div>
          </div>

          {/* 4. Interactive Platform Telemetry Preview (4-Tab Switcher + Live Terminal) */}
          <div className="mt-12 rounded-3xl border border-emerald-400/25 bg-[#06110d] p-6 sm:p-8 shadow-2xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="font-mono text-xs font-bold tracking-widest text-emerald-400 uppercase">
                  💻 Interactive Analytical Modules
                </span>
                <h3 className="mt-1 font-display text-2xl font-bold text-cream-50">
                  {locale === 'id'
                    ? 'Pratinjau Modul Analitik Satelit H.O.M.E.'
                    : 'H.O.M.E. Satellite Analytics Module Preview'}
                </h3>
              </div>

              {/* Screen Tab Buttons */}
              <div className="flex flex-wrap gap-2">
                {APP_SCREENS.map((scr) => (
                  <button
                    key={scr.id}
                    type="button"
                    onClick={() => setActiveScreen(scr.id)}
                    className={`rounded-xl px-3.5 py-2 font-mono text-xs font-bold transition-all ${
                      activeScreen === scr.id
                        ? 'bg-emerald-500 text-charcoal-950 shadow-md'
                        : 'border border-white/10 bg-white/5 text-cream-100 hover:bg-white/10'
                    }`}
                  >
                    {scr.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] text-emerald-300">
                  MODULE: {currentScreen.id.toUpperCase()}
                </div>
                <h4 className="font-display text-xl font-bold text-cream-50">
                  {currentScreen.title}
                </h4>
                <p className="text-sm leading-relaxed text-cream-200/80">
                  {currentScreen.desc}
                </p>

                {/* Live Terminal Log Box */}
                <div className="rounded-xl border border-white/10 bg-black/60 p-3.5 font-mono text-[11px] leading-relaxed text-emerald-300/90">
                  <div className="mb-1 text-cream-200/40"># LIVE TELEMETRY STREAM</div>
                  <div>&gt; SENSOR: Sentinel-1A + NISAR Dual-Pol (VV/VH)</div>
                  <div>&gt; THERMAL: Suomi-NPP VIIRS 375m ({fireCount} active points)</div>
                  <div>&gt; REGION: Central &amp; West Kalimantan Peatland Dome</div>
                  <div className="text-amber-300">
                    &gt; STATUS: Ready for interactive inspection →
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  <Link
                    to="/map"
                    className="rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-charcoal-950 transition-all hover:bg-emerald-400"
                  >
                    Buka Peta Interaktif Penuh →
                  </Link>
                  <Link
                    to="/dashboard"
                    className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-semibold text-cream-50 hover:bg-white/10"
                  >
                    Lihat Dashboard Statistik →
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-7">{currentScreen.preview}</div>
            </div>
          </div>
        </div>
      </ScrollChapter>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER V: THE SATELLITE RECORD & 6-TIER EVIDENCE STANDARD
         ═══════════════════════════════════════════════════════════════════ */}
      <ScrollChapter
        id="chapter-evidence"
        bgVariant="cream"
        onEnter={() => setActiveChapter('evidence')}
        className="py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <p className="font-mono text-xs font-bold tracking-widest text-moss-700 uppercase">
              {locale === 'id' ? 'Bab V — Bukti Terverifikasi' : 'Chapter V — The Satellite Record'}
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-charcoal-900 sm:text-4xl">
              {locale === 'id'
                ? 'Jejak Logika yang Jelas: Dari Piksel Radar Menuju Bukti Lapangan'
                : 'A Clear Logic Trail: From Radar Pixels to Verifiable Field Evidence'}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-charcoal-700">
              {locale === 'id'
                ? 'Tim pemenang NASA dinilai bukan hanya dari visualisasi, melainkan dari kejujuran metodologi dan kejelasan alur pembuktian data.'
                : 'Winning NASA tools are judged not just on visuals, but on methodological rigor and a transparent, auditable logic trail.'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                tier: 'Tier 01 · Active Radar',
                title: 'Sentinel-1 & NISAR SAR (VV/VH)',
                detail:
                  'Mengukur hamburan balik gelombang mikro C-Band (5.6 cm) & L-Band (24 cm) untuk memetakan bukaan kanopi dan kelembaban gambut menembus awan.',
                badge: 'All-Weather Day/Night',
              },
              {
                tier: 'Tier 02 · Thermal IR',
                title: 'NASA FIRMS VIIRS 375m (SNPP/NOAA-20)',
                detail:
                  'Deteksi anomali suhu permukaan dan Fire Radiative Power (FRP) setiap ~12 jam untuk melokalisasi titik nyala api aktif.',
                badge: '375m Spatial Resolution',
              },
              {
                tier: 'Tier 03 · Optical Recovery',
                title: 'MODIS / Sentinel-2 NDVI Time-Series',
                detail:
                  'Indeks kehijauan klorofil daun (Normalized Difference Vegetation Index) dari 2019–2024 sebagai dasar kurva pemulihan biomassa.',
                badge: 'Photosynthetic Vigor',
              },
              {
                tier: 'Tier 04 · Conservation Law',
                title: 'UNEP-WCMC WDPA Protected Polygons',
                detail:
                  'Batas resmi Taman Nasional Tanjung Puting, Sabangau, Bukit Baka Bukit Raya, Kutai, dan Gunung Palung.',
                badge: 'Legal Boundaries',
              },
              {
                tier: 'Tier 05 · Biodiversity Risk',
                title: 'IUCN Red List & GBIF Occurrences',
                detail:
                  'Data sebaran historis dan status konservasi satwa endemik Kalimantan untuk menghitung indeks paparan risiko habitat.',
                badge: 'CR / EN / VU Taxa',
              },
              {
                tier: 'Tier 06 · Predictive AI',
                title: 'Random Forest OOB Recovery Engine',
                detail:
                  'Model pembelajaran mesin (Out-of-Bag R² = 96.4%) yang memprediksi lintasan pemulihan kanopi hingga tahun 2030.',
                badge: 'Auditable Python Pipeline',
              },
            ].map((item) => (
              <div
                key={item.tier}
                className="flex flex-col justify-between rounded-2xl border border-paper-edge bg-cream-50 p-5 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-moss-700 uppercase">
                      {item.tier}
                    </span>
                    <span className="rounded-full bg-moss-100 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-moss-900">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-bold text-charcoal-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-charcoal-700">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollChapter>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER VI: THE HUMAN BRANCH (CONSERVATION ACTION PATHS)
         ═══════════════════════════════════════════════════════════════════ */}
      <ScrollChapter
        id="chapter-choice"
        bgVariant="forest"
        onEnter={() => setActiveChapter('choice')}
        className="py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <p className="font-mono text-xs font-bold tracking-widest text-moss-800 uppercase">
              {locale === 'id' ? 'Bab VI — Cabang Keputusan Manusia' : 'Chapter VI — The Human Branch'}
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-charcoal-900 sm:text-4xl">
              {locale === 'id'
                ? 'Data Satelit Hanyalah Permulaan—Tindakan Kita yang Menentukan Akhir Cerita'
                : 'Satellite Data Is Only the Beginning—Human Action Writes the Ending'}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-charcoal-700">
              {locale === 'id'
                ? 'Pilih jalur kontribusi nyata bersama lembaga konservasi garis depan yang bekerja langsung di lanskap gambut Kalimantan.'
                : 'Choose a verified action pathway with frontline conservation organizations working directly across Borneo’s peatland landscapes.'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <PartnerCTA
              partner="Borneo Orangutan Survival (BOS) Foundation"
              action="Rehabilitasi Orangutan & Reintroduksi Hutan Kehje Sewen / Nyaru Menteng"
              context="Melindungi lebih dari 700 Orangutan Kalimantan dan memulihkan koridor hutan hujan tropis tempat mereka kembali liar."
              url="https://www.orangutan.or.id"
              label="Dukung BOS Foundation Langsung"
            />
            <PartnerCTA
              partner="Borneo Nature Foundation (BNF)"
              action="Patroli Pemadam Kebakaran Masyarakat & Penyekatan Kanal Gambut Sebangau"
              context="Membangun 150+ sekat kanal (canal blocking) untuk menjaga kelembaban rawa gambut dan mencegah Karhutla berulang."
              url="https://www.borneonaturefoundation.org"
              label="Dukung Borneo Nature Foundation"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-moss-600/30 bg-cream-50 p-5">
            <div className="text-xs leading-relaxed text-charcoal-700">
              <strong className="text-charcoal-900">💡 Transparansi Donasi:</strong> H.O.M.E. tidak memotong atau menyimpan dana donasi pengguna. Seluruh tautan mengarahkan Anda langsung ke portal resmi lembaga konservasi mitra atau simulasi aksi lapangan di halaman Action.
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/action"
                className="rounded-xl bg-moss-800 px-4 py-2 text-xs font-bold text-cream-50 hover:bg-moss-900"
              >
                Buka Halaman Aksi &amp; Kampanye →
              </Link>
              <Link
                to="/sponsor"
                className="rounded-xl border border-moss-700/40 bg-cream-100 px-4 py-2 text-xs font-semibold text-moss-900 hover:bg-moss-100"
              >
                Adopsi Pohon &amp; Sekat Kanal →
              </Link>
            </div>
          </div>
        </div>
      </ScrollChapter>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER VII: THE GREEN RETURN (INTERACTIVE BLOOM)
         ═══════════════════════════════════════════════════════════════════ */}
      <ScrollChapter
        id="chapter-return"
        bgVariant="restored"
        onEnter={() => {
          setActiveChapter('return');
          setColorRevived(true);
        }}
        className="py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-2xl">
              <p className="font-mono text-xs font-bold tracking-widest text-moss-700 uppercase">
                {locale === 'id' ? 'Bab VII — Kembalinya Warna Hutan' : 'Chapter VII — The Green Return'}
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-charcoal-900 sm:text-4xl">
                {locale === 'id'
                  ? 'Ketika Gambut Kembali Basah, Kanopi Kalimantan Bernapas Lagi'
                  : 'When the Peat Is Rewetted, Borneo’s Canopy Breathes Again'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setColorRevived((prev) => !prev)}
              className="rounded-xl bg-moss-800 px-4 py-2.5 font-mono text-xs font-bold text-cream-50 shadow-sm transition-all hover:bg-moss-900"
            >
              {colorRevived ? '🌱 Mode Restorasi Aktif (Klik untuk Bandingkan)' : '🔥 Nyalakan Simulasi Pemulihan Kanopi'}
            </button>
          </div>

          <ColorReturn triggered={colorRevived}>
            <div className="rounded-3xl border border-moss-600/30 bg-gradient-to-br from-moss-900 via-moss-800 to-emerald-950 p-8 text-cream-50 shadow-xl">
              <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-3">
                <div>
                  <span className="font-mono text-xs text-emerald-300 uppercase">
                    Phase 1 · Hydrological Rewetting
                  </span>
                  <h3 className="mt-1 font-display text-xl font-bold">
                    Kelembaban Tanah Gambut Pulih (+6 dB SAR VV)
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-cream-200/80">
                    Sekat kanal menahan air hujan di kubah gambut. Sensor L-Band NISAR mendeteksi peningkatan konstanta dielektrik tanah yang menandakan gambut kembali tahan api.
                  </p>
                </div>
                <div>
                  <span className="font-mono text-xs text-emerald-300 uppercase">
                    Phase 2 · Pioneer &amp; Dipterocarp Regrowth
                  </span>
                  <h3 className="mt-1 font-display text-xl font-bold">
                    Biomassa Kanopi Tumbuh (NDVI 0.32 → 0.78)
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-cream-200/80">
                    Dalam 3–5 tahun tanpa kebakaran berulang, vegetasi pionir dan bibit meranti menutup bukaan lahan, memulihkan kapasitas serapan karbon hutan hujan.
                  </p>
                </div>
                <div>
                  <span className="font-mono text-xs text-emerald-300 uppercase">
                    Phase 3 · Arboreal Connectivity
                  </span>
                  <h3 className="mt-1 font-display text-xl font-bold">
                    Koridor Orangutan &amp; Rangkong Tersambung
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-cream-200/80">
                    Tajuk pohon yang kembali bersentuhan memungkinkan Orangutan Kalimantan dan Owa menyeberangi hutan tanpa harus turun ke tanah.
                  </p>
                </div>
              </div>
            </div>
          </ColorReturn>
        </div>
      </ScrollChapter>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER VIII: THE OPEN LEDGER & NASA CHALLENGE TEAM CREDITS
         ═══════════════════════════════════════════════════════════════════ */}
      <ScrollChapter
        id="chapter-proof"
        bgVariant="cream"
        onEnter={() => setActiveChapter('proof')}
        className="py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <p className="font-mono text-xs font-bold tracking-widest text-moss-700 uppercase">
              {locale === 'id' ? 'Bab VIII — Buku Besar Terbuka' : 'Chapter VIII — The Open Ledger'}
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-charcoal-900 sm:text-4xl">
              {locale === 'id'
                ? 'Sumber Data Terbuka NASA & Identitas Tim Hackathon'
                : 'Open NASA Data Ledger & Hackathon Team Identity'}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-charcoal-700">
              {locale === 'id'
                ? 'Seluruh pipeline data, kode sumber, dan model pembelajaran mesin H.O.M.E. dibangun di atas ekosistem data terbuka NASA Earthdata, ESA Copernicus, dan IUCN.'
                : 'Every dataset, source script, and machine learning model in H.O.M.E. is built transparently on NASA Earthdata, ESA Copernicus, and IUCN open science.'}
            </p>
          </div>

          {/* Open Data Sources Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SOURCES.map((source) => (
              <div
                key={source.id}
                className="flex flex-col justify-between rounded-2xl border border-paper-edge bg-cream-50 p-4 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-moss-100 px-2 py-0.5 font-mono text-[10px] font-bold text-moss-900 uppercase">
                      {source.category || source.badge || 'VERIFIED'}
                    </span>
                    <span className="font-mono text-[10px] text-charcoal-500">
                      {source.maxAgeHours ? `Every ${source.maxAgeHours}h` : 'Live Feed'}
                    </span>
                  </div>
                  <h4 className="mt-2 font-display text-sm font-bold text-charcoal-900">
                    {source.label || source.name}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-charcoal-600">
                    {source.attribution || source.description}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-paper-edge pt-2.5 font-mono text-[10px]">
                  <span className="text-charcoal-500">{source.license}</span>
                  <a
                    href={source.homepage || source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-moss-800 hover:underline"
                  >
                    Source ↗
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* NASA Space Apps Challenge Category & Team Showcase Card */}
          <div className="mt-10 rounded-3xl border border-moss-600/40 bg-moss-900 p-6 sm:p-8 text-cream-50 shadow-xl">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
              <div className="space-y-3 lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/20 px-3 py-1 font-mono text-xs font-bold text-amber-300 uppercase">
                  🏆 NASA Space Apps Challenge · Dancing with the SARs
                </div>
                <h3 className="font-display text-2xl font-bold text-cream-50 sm:text-3xl">
                  Tim MenujuOrangHave — H.O.M.E. (Habitat &amp; Orangutan Monitoring Engine)
                </h3>
                <p className="text-sm leading-relaxed text-cream-100/85">
                  Dikembangkan untuk menjawab tantangan <strong>&ldquo;Dancing with the SARs&rdquo;</strong> dengan memadukan observasi bumi Synthetic Aperture Radar (Sentinel-1 &amp; NASA-ISRO NISAR), deteksi panas NASA FIRMS VIIRS 375m, serta narasi konservasi interaktif demi masa depan hutan hujan Kalimantan.
                </p>
                <div className="flex flex-wrap gap-2 pt-2 font-mono text-[11px]">
                  <span className="rounded-lg border border-white/15 bg-white/10 px-3 py-1">
                    🛰️ SAR C-Band &amp; L-Band Fusion
                  </span>
                  <span className="rounded-lg border border-white/15 bg-white/10 px-3 py-1">
                    🔥 NASA FIRMS VIIRS 375m
                  </span>
                  <span className="rounded-lg border border-white/15 bg-white/10 px-3 py-1">
                    🌲 Random Forest ML (96.4% R²)
                  </span>
                  <span className="rounded-lg border border-white/15 bg-white/10 px-3 py-1">
                    🦧 IUCN &amp; WDPA Spatial Engine
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-black/25 p-5 lg:col-span-5">
                <div className="font-mono text-xs font-bold tracking-wider text-emerald-300 uppercase">
                  🚀 Jelajahi Seluruh Ekosistem H.O.M.E.
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    to="/game"
                    className="col-span-2 rounded-xl bg-gradient-to-r from-amber-500 to-ember-500 px-3.5 py-2.5 text-center text-xs font-bold text-charcoal-950 hover:from-amber-400 hover:to-ember-400"
                  >
                    🎮 Mainkan Game: Misi Radar Satwa (SAR Rescue)
                  </Link>
                  <Link
                    to="/map"
                    className="rounded-xl bg-emerald-500 px-3.5 py-2.5 text-center text-xs font-bold text-charcoal-950 hover:bg-emerald-400"
                  >
                    🗺️ 3D SAR &amp; Fire Map
                  </Link>
                  <Link
                    to="/reach"
                    className="rounded-xl bg-amber-400 px-3.5 py-2.5 text-center text-xs font-bold text-charcoal-950 hover:bg-amber-300"
                  >
                    🌱 ML Recovery (REACH)
                  </Link>
                  <Link
                    to="/future"
                    className="rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-center text-xs font-semibold text-cream-50 hover:bg-white/20"
                  >
                    🔮 Simulasi Kalimantan 2030
                  </Link>
                  <Link
                    to="/transparency"
                    className="rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-center text-xs font-semibold text-cream-50 hover:bg-white/20"
                  >
                    📜 Metodologi &amp; Ledger
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollChapter>
    </div>
  );
}
