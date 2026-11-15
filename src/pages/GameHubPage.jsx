import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n';

/*
 * Pusat Misi Radar — pilih game.
 * Gaya mengikuti halaman lain: latar kertas dari Layout, judul seperti bab di Beranda,
 * dan kartu ala "Field Board" di menu Map (header hijau hutan/bata + garis kuningan, badan krem).
 */
function RadarRescuePreview({ isId }) {
  return (
    <div className="relative mb-3 h-28 sm:h-32 w-full overflow-hidden rounded-xl border-2 border-[#1b5e3a]/50 bg-[#071a16] shadow-inner">
      {/* Subtle forest map grid */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(to right, #1f6f54 1px, transparent 1px), linear-gradient(to bottom, #1f6f54 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Radar sweep rings & beam */}
      <svg
        viewBox="0 0 320 160"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {/* Radar circles */}
        <circle cx="160" cy="82" r="24" fill="none" stroke="#34d399" strokeOpacity="0.35" strokeWidth="1" />
        <circle cx="160" cy="82" r="48" fill="none" stroke="#34d399" strokeOpacity="0.28" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="160" cy="82" r="72" fill="none" stroke="#34d399" strokeOpacity="0.2" strokeWidth="1" />

        {/* Radar sweep cone */}
        <path
          d="M160 82 L222 34 A78 78 0 0 1 236 96 Z"
          fill="#34d399"
          fillOpacity="0.2"
        />
        <line x1="160" y1="82" x2="222" y2="34" stroke="#6ee7b7" strokeWidth="1.5" strokeOpacity="0.8" />

        {/* Wildfire smoke & thermal glow */}
        <circle cx="86" cy="54" r="22" fill="#f97316" fillOpacity="0.18" />
        <circle cx="86" cy="54" r="10" fill="#ef4444" fillOpacity="0.35" />
        <circle cx="248" cy="116" r="24" fill="#f97316" fillOpacity="0.16" />
        <circle cx="248" cy="116" r="11" fill="#ef4444" fillOpacity="0.32" />

        {/* Center Ranger / Drone */}
        <circle cx="160" cy="82" r="6" fill="#34d399" stroke="#ecfdf5" strokeWidth="2" />
      </svg>

      {/* Wildlife & fire blips */}
      <span className="absolute top-6 left-16 flex h-7 w-7 items-center justify-center rounded-full border border-red-400/70 bg-red-950/80 text-sm shadow">
        🔥
      </span>
      <span className="absolute top-7 right-16 flex h-8 w-8 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-950/90 text-base shadow-[0_0_12px_rgba(52,211,153,0.65)]">
        🦧
      </span>
      <span className="absolute bottom-6 left-20 flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-300 bg-amber-950/90 text-base shadow-[0_0_10px_rgba(251,191,36,0.5)]">
        🐅
      </span>
      <span className="absolute bottom-5 right-14 flex h-7 w-7 items-center justify-center rounded-full border border-red-400/70 bg-red-950/80 text-sm shadow">
        🔥
      </span>

      {/* Mini HUD overlay */}
      <div className="absolute top-2 left-2.5 rounded-md border border-emerald-400/35 bg-[#061813]/85 px-2 py-0.5 font-mono text-[9.5px] font-bold text-emerald-300">
        📡 {isId ? 'PULSA SAR L-BAND' : 'L-BAND SAR PULSE'}
      </div>
      <div className="absolute bottom-2 right-2.5 rounded-md border border-amber-400/35 bg-[#061813]/85 px-2 py-0.5 font-mono text-[9.5px] font-bold text-amber-200">
        {isId ? 'TEMUKAN & SELAMATKAN SATWA' : 'SCAN & RESCUE WILDLIFE'}
      </div>
    </div>
  );
}

function WaterBombArcadePreview({ isId }) {
  return (
    <div className="relative mb-3 h-28 sm:h-32 w-full overflow-hidden rounded-xl border-2 border-[#5c4033]/70 bg-[#1e3a28] shadow-inner">
      {/* Peatland checkerboard grid */}
      <div
        className="absolute inset-0 opacity-65"
        style={{
          backgroundImage:
            'repeating-conic-gradient(#1e3a28 0% 25%, #244430 0% 50%)',
          backgroundSize: '36px 36px',
        }}
      />

      {/* Top stone wall strip with vines */}
      <div className="absolute inset-x-0 top-0 h-4 border-b-2 border-[#475569] bg-[#78716c]">
        <div className="flex h-full justify-around">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="h-full w-px bg-[#44403c]" />
          ))}
        </div>
        <span className="absolute top-0.5 left-4 h-2 w-8 rounded-full bg-[#22c55e]" />
        <span className="absolute top-0.5 right-6 h-2 w-10 rounded-full bg-[#16a34a]" />
      </div>

      {/* Stone pillars & destructible peat blocks */}
      <div className="absolute top-9 left-8 h-7 w-7 rounded-sm border-2 border-[#44403c] bg-[#78716c] shadow-sm">
        <span className="absolute top-1 left-1 h-2 w-2 rounded-full bg-[#22c55e]" />
      </div>
      <div className="absolute top-9 right-10 h-7 w-7 rounded-sm border-2 border-[#44403c] bg-[#78716c] shadow-sm">
        <span className="absolute right-1 bottom-1 h-2 w-2 rounded-full bg-[#a855f7]" />
      </div>

      {/* Water Splash Cross (+) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative flex items-center justify-center">
          <div className="h-5 w-28 rounded-full bg-sky-400/75 blur-[1px]" />
          <div className="absolute h-24 w-5 rounded-full bg-sky-400/75 blur-[1px]" />
          {/* Center water bomb */}
          <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-sky-500 text-base shadow-[0_0_14px_rgba(56,189,248,0.9)]">
            💧
          </span>
        </div>
      </div>

      {/* Chibi Ranger + Trapped Orangutan + Fire Enemy */}
      <span className="absolute bottom-5 left-8 flex h-8 w-8 items-center justify-center rounded-full border-2 border-sky-200 bg-blue-600 text-base shadow-md">
        🧑‍🚒
      </span>
      <span className="absolute top-9 left-1/2 -translate-x-1/2 flex h-7 w-7 items-center justify-center rounded-md border border-orange-400/80 bg-orange-900/85 text-sm shadow">
        🔥
      </span>
      <span className="absolute bottom-5 right-8 flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-300 bg-amber-900/85 text-base shadow-md">
        🦧
      </span>

      {/* Mini HUD overlay */}
      <div className="absolute top-5 left-2.5 rounded-md border border-white/20 bg-[#2a1d17]/85 px-2 py-0.5 font-mono text-[9.5px] font-bold text-[#fef3c7]">
        💧 {isId ? 'BOM AIR GRID' : 'WATER-BOMB GRID'}
      </div>
      <div className="absolute bottom-2 right-2.5 rounded-md border border-amber-300/35 bg-[#2a1d17]/85 px-2 py-0.5 font-mono text-[9.5px] font-bold text-amber-200">
        {isId ? 'PADAMKAN API & BEBASKAN SATWA' : 'EXTINGUISH & SAVE'}
      </div>
    </div>
  );
}

const GAMES = [
  {
    id: 'radar-rescue',
    path: '/game/radar-rescue',
    badgeEn: 'GAME 01 • SAR STEALTH RADAR',
    badgeId: 'GAME 01 • RADAR STEALTH SAR',
    titleEn: 'SAR Radar Rescue',
    titleId: 'Misi Radar Penyelamatan',
    subtitleEn: 'Sweep through thick wildfire smoke using Sentinel-1 SAR radar pulses to locate and rescue endangered wildlife.',
    subtitleId: 'Sisir kabut asap karhutla menggunakan pulsa radar SAR Sentinel-1 untuk menemukan dan menyelamatkan satwa terancam.',
    goalEn: 'Goal: Scan smoke zones, avoid active hotspots, and extract trapped wildlife before time runs out.',
    goalId: 'Misi: Pindai zona asap, hindari titik api aktif, dan evakuasi satwa sebelum waktu habis.',
    tagsEn: ['Sentinel-1 SAR Pulse', 'Stealth & Thermal Fog', '3 Forest Biomes'],
    tagsId: ['Pulsa Radar SAR', 'Kabut Asap & Termal', '3 Bioma Hutan'],
    emoji: '📡',
    // Hijau hutan — sama dengan header Field Board di menu Map
    header: 'from-[#163a28] via-[#1c4732] to-[#112d1f]',
    cta: 'border-[#1b5e3a] bg-[#18442e] hover:bg-[#1f5638]',
    ctaEn: 'Play SAR Radar Rescue',
    ctaId: 'Mainkan SAR Radar Rescue',
  },
  {
    id: 'karhutla-arcade',
    path: '/game/karhutla-arcade',
    badgeEn: 'GAME 02 • CRAZY ARCADE STYLE',
    badgeId: 'GAME 02 • GAYA CRAZY ARCADE',
    titleEn: 'Karhutla Water-Bomb Arcade',
    titleId: 'Arcade Bom Air Karhutla',
    subtitleEn: 'Classic grid-based Crazy Arcade action! Drop water bombs, blast burning peat blocks, dodge fireballs, and save trapped animals.',
    subtitleId: 'Aksi grid ala Crazy Arcade klasik! Pasang bom air, padamkan blok gambut terbakar, hindari bola api, dan bebaskan satwa.',
    goalEn: 'Goal: Blast burning peat obstacles, collect water power-ups, and rescue every animal in 3 stages.',
    goalId: 'Misi: Ledakkan rintangan gambut terbakar, kumpulkan power-up air, dan selamatkan semua satwa di 3 stage.',
    tagsEn: ['Water-Bomb Grid', 'Power-ups & Enemies', '5 Karhutla Stages'],
    tagsId: ['Grid Bom Air', 'Power-up & Musuh Api', '5 Stage Karhutla'],
    emoji: '💦',
    // Merah bata — warna pin api di menu Map
    header: 'from-[#6e2419] via-[#983226] to-[#5a1d14]',
    cta: 'border-[#7f2a1f] bg-[#983226] hover:bg-[#a83a2c]',
    ctaEn: 'Play Water-Bomb Arcade',
    ctaId: 'Mainkan Arcade Bom Air',
  },
];

const SDG_TAGS = [
  { n: 15, color: '#56C02B', labelId: 'Habitat', labelEn: 'Life on Land' },
  { n: 13, color: '#3F7E44', labelId: 'Iklim', labelEn: 'Climate' },
];

export default function GameHubPage() {
  const { locale } = useTranslation();
  const isId = locale === 'id';

  return (
    <div className="w-full">
      {/* Full-Bleed Compact Mission Briefing Hero Banner */}
      <div className="relative w-full overflow-hidden border-b-2 border-[#c89d54]/75 bg-gradient-to-br from-[#163a28] via-[#1c4732] to-[#0f291c] text-[#faf6ee] shadow-md">
        {/* Subtle Topographic / Radar Grid Backdrop */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'radial-gradient(circle at 82% 50%, rgba(110, 231, 183, 0.35) 0, rgba(110, 231, 183, 0.35) 1px, transparent 1px), linear-gradient(to right, rgba(229, 199, 135, 0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(229, 199, 135, 0.25) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3.5 sm:px-6 sm:py-4 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e5c787]/40 bg-[#0e271b]/80 px-2.5 py-0.5 font-mono text-[9.5px] font-bold tracking-[0.18em] text-[#e5c787] uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>{isId ? 'PUSAT MISI RADAR • PILIH GAME' : 'RADAR MISSION HUB • SELECT GAME'}</span>
              </div>
              <span className="rounded-md border border-white/15 bg-white/10 px-2 py-0.5 font-mono text-[9.5px] font-semibold text-[#f3ead6]">
                🛰️ Sentinel-1 &amp; MODIS
              </span>
              <span className="rounded-md border border-white/15 bg-white/10 px-2 py-0.5 font-mono text-[9.5px] font-semibold text-[#f3ead6]">
                🎮 {isId ? '2 Mode Permainan' : '2 Playable Modes'}
              </span>
            </div>

            <h1 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {isId ? 'Misi Radar & Penyelamatan Karhutla' : 'Radar Mission & Karhutla Rescue'}
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-[#dce8e0] sm:text-sm">
              {isId
                ? 'Dua misi konservasi interaktif yang terinspirasi dari observasi Bumi NASA — sapu kabut asap dengan radar SAR atau padamkan api gambut lewat aksi arcade klasik.'
                : 'Two interactive conservation missions inspired by NASA Earth observation — sweep through wildfire smoke with SAR radar or extinguish peatland fires in classic arcade action.'}
            </p>
          </div>

          {/* Compact Wildlife Dispatch Badge */}
          <div className="hidden shrink-0 items-center gap-3 rounded-xl border border-[#e5c787]/35 bg-[#0e261a]/85 px-3.5 py-2 shadow-inner md:flex">
            <div>
              <div className="font-mono text-[8.5px] font-bold tracking-[0.16em] text-[#e5c787] uppercase">
                {isId ? 'TIM PENYELAMAT SATWA' : 'WILDLIFE RESCUE CAST'}
              </div>
              <div className="mt-0.5 font-mono text-[10px] font-semibold text-emerald-200">
                {isId ? 'Siap Diterjunkan' : 'Ready for Dispatch'}
              </div>
            </div>
            <div className="flex items-center gap-1 text-xl">
              <span title="Orangutan">🦧</span>
              <span title="Sumatran Tiger">🐅</span>
              <span title="Hornbill">🦅</span>
              <span title="Sun Bear">🐻</span>
              <span title="Pangolin">🦔</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
      {/* 2 kartu game — gaya Field Board menu Map */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {GAMES.map((game) => (
          <div
            key={game.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-[#cbbba0] bg-[#f8f3e8] text-[#1d2621] shadow-[0_14px_36px_rgba(0,0,0,0.16),3px_3px_0_#ded4be] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(0,0,0,0.22),3px_3px_0_#ded4be]"
          >
            {/* Header berwarna + garis kuningan */}
            <div className={`relative border-b-2 border-[#c89d54]/70 bg-gradient-to-br ${game.header} px-5 py-3 text-[#faf6ee]`}>
              <span className="absolute top-2 left-2 h-1.5 w-1.5 rounded-full bg-[#d8b26a]/70 shadow-xs" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#d8b26a]/70 shadow-xs" />
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-[#e5c787] uppercase">
                  {isId ? game.badgeId : game.badgeEn}
                </span>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-[#faf6ee]/95 text-xl shadow-sm select-none"
                  role="img"
                  aria-hidden="true"
                >
                  {game.emoji}
                </span>
              </div>
            </div>

            {/* Badan kartu krem bertitik */}
            <div
              className="flex flex-1 flex-col justify-between p-4 sm:p-5"
              style={{
                backgroundImage: 'radial-gradient(rgba(140, 125, 98, 0.12) 1px, transparent 1px)',
                backgroundSize: '14px 14px',
              }}
            >
              <div>
                {game.id === 'radar-rescue' ? (
                  <RadarRescuePreview isId={isId} />
                ) : (
                  <WaterBombArcadePreview isId={isId} />
                )}

                <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#1a221d]">
                  {isId ? game.titleId : game.titleEn}
                </h2>
                <p className="mt-2 mb-3 text-sm leading-relaxed text-[#333d37]">
                  {isId ? game.subtitleId : game.subtitleEn}
                </p>

                <div className="mb-4 rounded-lg border border-[#d6c8ad] bg-white/70 px-3 py-2 text-xs font-medium text-[#2d3b32]">
                  {isId ? game.goalId : game.goalEn}
                </div>

                <div className="mb-5 flex flex-wrap gap-2">
                  {(isId ? game.tagsId : game.tagsEn).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg border border-[#dcd0b8] bg-white/75 px-2.5 py-1 font-mono text-[11px] font-semibold text-[#333d37]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <Link
                to={game.path}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold text-[#faf6ee] shadow-sm transition-colors ${game.cta}`}
              >
                <span>{isId ? game.ctaId : game.ctaEn}</span>
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Catatan SDG — kartu krem seperti Beranda */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-paper-edge bg-cream-50/90 px-5 py-3 text-xs text-charcoal-700 shadow-sm">
        {SDG_TAGS.map((g) => (
          <span
            key={g.n}
            className="rounded-md px-2 py-0.5 font-mono text-[10px] font-extrabold text-white"
            style={{ backgroundColor: g.color }}
          >
            SDG {g.n} · {isId ? g.labelId : g.labelEn}
          </span>
        ))}
        <span>
          {isId
            ? 'Didukung data observasi Bumi NASA & kesadaran konservasi satwa endemik Indonesia.'
            : 'Powered by NASA Earth observation concepts & Indonesian endemic wildlife conservation.'}
        </span>
      </div>
      </div>
    </div>
  );
}
