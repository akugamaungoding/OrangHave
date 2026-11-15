import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n';

/*
 * Pusat Misi Radar — pilih game.
 * Gaya mengikuti halaman lain: latar kertas dari Layout, judul seperti bab di Beranda,
 * dan kartu ala "Field Board" di menu Map (header hijau hutan/bata + garis kuningan, badan krem).
 */
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
    tagsEn: ['Water-Bomb Grid', 'Power-ups & Bosses', '3 Karhutla Stages'],
    tagsId: ['Grid Bom Air', 'Power-up & Musuh Api', '3 Stage Karhutla'],
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
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header — seperti judul bab di Beranda */}
      <div className="mb-10 text-center">
        <p className="inline-flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-moss-700 uppercase">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span>{isId ? 'PUSAT MISI RADAR • PILIH GAME' : 'RADAR MISSION HUB • SELECT GAME'}</span>
        </p>

        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-charcoal-900 sm:text-5xl">
          {isId ? 'Misi Radar & Penyelamatan Karhutla' : 'Radar Mission & Karhutla Rescue'}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-charcoal-700 sm:text-base">
          {isId
            ? 'Pilih salah satu dari dua game di bawah ini. Setiap game berjalan di halaman terpisah agar tim dapat mengembangkan keduanya secara paralel.'
            : 'Choose one of the two playable missions below. Each game lives on its own dedicated page for independent parallel development.'}
        </p>
      </div>

      {/* 2 kartu game — gaya Field Board menu Map */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {GAMES.map((game) => (
          <div
            key={game.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-[#cbbba0] bg-[#f8f3e8] text-[#1d2621] shadow-[0_14px_36px_rgba(0,0,0,0.16),3px_3px_0_#ded4be] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(0,0,0,0.22),3px_3px_0_#ded4be]"
          >
            {/* Header berwarna + garis kuningan */}
            <div className={`relative border-b-2 border-[#c89d54]/70 bg-gradient-to-br ${game.header} px-5 py-4 text-[#faf6ee]`}>
              <span className="absolute top-2 left-2 h-1.5 w-1.5 rounded-full bg-[#d8b26a]/70 shadow-xs" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#d8b26a]/70 shadow-xs" />
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-[#e5c787] uppercase">
                  {isId ? game.badgeId : game.badgeEn}
                </span>
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/25 bg-[#faf6ee]/95 text-2xl shadow-sm select-none"
                  role="img"
                  aria-hidden="true"
                >
                  {game.emoji}
                </span>
              </div>
            </div>

            {/* Badan kartu krem bertitik */}
            <div
              className="flex flex-1 flex-col justify-between p-5 sm:p-6"
              style={{
                backgroundImage: 'radial-gradient(rgba(140, 125, 98, 0.12) 1px, transparent 1px)',
                backgroundSize: '14px 14px',
              }}
            >
              <div>
                <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#1a221d]">
                  {isId ? game.titleId : game.titleEn}
                </h2>
                <p className="mt-2 mb-5 text-sm leading-relaxed text-[#333d37]">
                  {isId ? game.subtitleId : game.subtitleEn}
                </p>

                <div className="mb-6 flex flex-wrap gap-2">
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
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-paper-edge bg-cream-50/90 px-5 py-3.5 text-xs text-charcoal-700 shadow-sm">
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
  );
}
