import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n';
import SdgMark from '../components/SdgMark';

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
    accent: 'from-emerald-950 via-teal-950 to-slate-950',
    border: 'border-emerald-500/40 hover:border-emerald-400',
    pillBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    ctaBg: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
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
    accent: 'from-amber-950 via-orange-950 to-slate-950',
    border: 'border-amber-500/40 hover:border-amber-400',
    pillBg: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    ctaBg: 'bg-amber-400 hover:bg-amber-300 text-slate-950',
    ctaEn: 'Play Water-Bomb Arcade',
    ctaId: 'Mainkan Arcade Bom Air',
  },
];

export default function GamePage() {
  const { locale } = useTranslation();
  const isId = locale === 'id';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 text-xs font-mono font-semibold text-sky-300 mb-4">
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
            <span>{isId ? 'PUSAT MISI RADAR • PILIH GAME' : 'RADAR MISSION HUB • SELECT GAME'}</span>
          </div>

          <h1 className="font-hand text-4xl sm:text-5xl font-bold text-cream-50 tracking-wide">
            {isId ? 'Misi Radar & Penyelamatan Karhutla' : 'Radar Mission & Karhutla Rescue'}
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-sm sm:text-base text-slate-300">
            {isId
              ? 'Pilih salah satu dari dua game di bawah ini. Setiap game berjalan di halaman terpisah agar tim dapat mengembangkan keduanya secara paralel.'
              : 'Choose one of the two playable missions below. Each game lives on its own dedicated page for independent parallel development.'}
          </p>
        </div>

        {/* 2 Game Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GAMES.map((game) => (
            <div
              key={game.id}
              className={`group relative flex flex-col justify-between rounded-2xl border bg-gradient-to-br ${game.accent} ${game.border} p-6 sm:p-7 shadow-xl transition-all duration-200 hover:-translate-y-1`}
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-mono font-bold tracking-wider ${game.pillBg}`}
                  >
                    {isId ? game.badgeId : game.badgeEn}
                  </span>
                  <span className="text-4xl select-none" role="img" aria-hidden="true">
                    {game.emoji}
                  </span>
                </div>

                <h2 className="font-hand text-3xl font-bold text-white mb-2">
                  {isId ? game.titleId : game.titleEn}
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed mb-5">
                  {isId ? game.subtitleId : game.subtitleEn}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {(isId ? game.tagsId : game.tagsEn).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg bg-slate-900/80 border border-slate-700/80 px-2.5 py-1 text-xs font-mono text-slate-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <Link
                to={game.path}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-md transition-colors ${game.ctaBg}`}
              >
                <span>{isId ? game.ctaId : game.ctaEn}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          ))}
        </div>

        {/* Footer SDG Note */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
          <SdgMark goal={15} size="sm" />
          <SdgMark goal={13} size="sm" />
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
