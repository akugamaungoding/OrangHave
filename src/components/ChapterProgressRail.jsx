import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';

const CHAPTERS = [
  { id: 'chapter-cover', code: '01', labelEn: 'Cover & 3D Globe', labelId: 'Sampul & Bumi 3D' },
  { id: 'chapter-meet', code: '02', labelEn: 'Forest Kin (5 Species)', labelId: '5 Satwa Kunci' },
  { id: 'chapter-fire', code: '03', labelEn: 'Thermal Wave (VIIRS)', labelId: 'Gelombang Panas' },
  { id: 'chapter-sar', code: '04', labelEn: 'Dancing with the SARs', labelId: 'Lensa Radar SAR' },
  { id: 'chapter-evidence', code: '05', labelEn: 'Satellite Evidence', labelId: 'Bukti Satelit' },
  { id: 'chapter-choice', code: '06', labelEn: 'The Human Choice', labelId: 'Pilihan Manusia' },
  { id: 'chapter-return', code: '07', labelEn: 'Green Return', labelId: 'Pulihnya Kanopi' },
  { id: 'chapter-proof', code: '08', labelEn: 'Open Ledger Proof', labelId: 'Buku Besar Data' },
];

export default function ChapterProgressRail({ activeChapter }) {
  const { locale } = useTranslation();
  const [scrollPct, setScrollPct] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setScrollPct(Math.min(100, Math.max(0, Math.round((window.scrollY / docHeight) * 100))));
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside
      aria-label="Storybook & Orbital Tier Progress"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className="fixed right-3 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col items-end"
    >
      <div
        className={`rounded-2xl border border-moss-600/30 bg-charcoal-950/85 text-cream-50 backdrop-blur-md shadow-xl transition-all duration-300 p-2.5 ${
          expanded ? 'w-56' : 'w-12'
        }`}
      >
        {/* Top Scroll Percentage Indicator */}
        <div className="flex items-center justify-between border-b border-charcoal-800 pb-2 mb-2 px-1 font-mono text-[10px] text-emerald-300">
          {expanded && <span className="uppercase tracking-wider">Mission Trail</span>}
          <span className="font-bold">{scrollPct}%</span>
        </div>

        {/* Chapter Nodes */}
        <div className="flex flex-col gap-1.5">
          {CHAPTERS.map((chap) => {
            const isActive =
              activeChapter === chap.id.replace('chapter-', '') ||
              activeChapter === chap.id;
            return (
              <button
                key={chap.id}
                type="button"
                onClick={() => scrollToSection(chap.id)}
                title={locale === 'id' ? chap.labelId : chap.labelEn}
                className={`group flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 font-semibold'
                    : 'hover:bg-charcoal-800/80 text-cream-400 border border-transparent'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-[10px] ${
                    isActive
                      ? 'bg-emerald-400 text-charcoal-950 font-bold'
                      : 'bg-charcoal-900 text-cream-400 group-hover:text-cream-100'
                  }`}
                >
                  {chap.code}
                </span>
                {expanded && (
                  <span className="text-xs truncate">
                    {locale === 'id' ? chap.labelId : chap.labelEn}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

