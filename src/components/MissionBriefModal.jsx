import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n';

const WINNING_TRAITS = [
  {
    code: 'TRAIT 01 // MISSION ALIGNMENT',
    titleEn: 'Dancing with the SARs: Multi-Sensor Space Application',
    titleId: 'Dancing with the SARs: Aplikasi Antariksa Multi-Sensor',
    descEn:
      'Tropical peat fires in Kalimantan produce dense smoke haze under persistent monsoon clouds, blinding optical cameras. H.O.M.E. pairs Cloud-Penetrating Synthetic Aperture Radar (Sentinel-1 C-Band & NISAR L-Band VV/VH backscatter) with NASA FIRMS VIIRS (375m Thermal IR) & GIBS tiles to reveal peat moisture drop and canopy structure loss right through the smoke.',
    descId:
      'Kebakaran gambut tropis di Kalimantan menghasilkan kabut asap pekat di bawah awan monsun yang membutakan kamera optik. H.O.M.E. memadukan Radar Apertur Sintetis Penembus Awan (Sentinel-1 C-Band & NISAR L-Band) dengan NASA FIRMS VIIRS (375m Termal IR) untuk mendeteksi pengeringan gambut dan kerusakan kanopi menembus asap.',
    metrics: ['NASA VIIRS 375m NRT', 'Sentinel-1 & NISAR SAR', 'WDPA & IUCN Red List'],
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
  },
  {
    code: 'TRAIT 02 // CLEAR LOGIC TRAIL',
    titleEn: 'Transparent 6-Tier Scientific Evidence Architecture',
    titleId: 'Arsitektur Bukti Ilmiah 6-Tingkat yang Transparan',
    descEn:
      'Judges evaluate not just what the app does, but how purposeful and honest its logic trail is. We never conflate a satellite thermal pixel with an animal death. Every claim is categorized into 6 strict tiers: 1) Verified Partner Rescue, 2) Species Range Overlap, 3) Satellite Fire Detection, 4) Mapped Burned Scar, 5) Random Forest OOB Exposure, or 6) Needs Field Verification.',
    descId:
      'Juri menilai kejelasan alur logika ilmiah. Kami tidak pernah menyamakan titik panas satelit dengan kematian satwa. Setiap klaim dikategorikan ke dalam 6 tingkat bukti ketat: 1) Evakuasi Terverifikasi, 2) Tumpang Tindih Sebaran, 3) Deteksi Api Satelit, 4) Area Terbakar, 5) Paparan Random Forest OOB, atau 6) Perlu Verifikasi Lapangan.',
    metrics: ['Zero False Mortality Claims', '6-Tier Evidence Ledger', 'Direct Partner Dispatch'],
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
  },
  {
    code: 'TRAIT 03 // TECHNICAL FLUENCY',
    titleEn: 'Resilient Offline-First Code & Reproducible ML Pipeline',
    titleId: 'Kode Tangguh Offline-First & Pipeline ML Reprodusibel',
    descEn:
      'Built on a 4-tier fault-tolerant data layer (Live API → IndexedDB Cache → Static GeoJSON Snapshot → Safe Empty State) plus an offline Python machine learning script (python ml/pipeline.py) computing NDVI greenness deltas and two Random Forest models (48 trees, 83.6% Out-of-Bag accuracy).',
    descId:
      'Dibangun di atas arsitektur data 4-lapis tahan gangguan (API Langsung → Cache IndexedDB → Snapshot GeoJSON → Mode Aman) serta pipeline Machine Learning Python luring (python ml/pipeline.py) yang menghitung delta NDVI dan dua model Random Forest (akurasi OOB 83,6%).',
    metrics: ['IndexedDB Caching', 'RF OOB Accuracy: 83.6%', '3D Globe + MapLibre 60° Pitch'],
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
  },
  {
    code: 'TRAIT 04 // COMPELLING STORYTELLING',
    titleEn: 'Bridging Watercolor Empathy with Orbital Telemetry',
    titleId: 'Menjembatani Empati Buku Cerita dengan Telemetri Orbit',
    descEn:
      'Raw satellite dashboards often feel cold and overwhelming, while emotional charity sites lack scientific proof. H.O.M.E. unites both: guiding users through the illustrated habitats of Tuki (Bornean Orangutan) and 4 forest kin, transitioning smoothly from living watercolor canopy to thermal burn and green restoration.',
    descId:
      'Dasbor satelit mentah sering terasa dingin, sedangkan situs donasi emosional sering kurang bukti ilmiah. H.O.M.E. menyatukan keduanya: memandu pengguna menyusuri kisah habitat Tuki (Orangutan Kalimantan) dan 4 satwa kerabatnya, bertransisi halus dari kanopi hidup menuju pemulihan hijau.',
    metrics: ['8 Smooth Story Tiers', 'Bilingual (EN / ID)', 'ASEAN Haze & 6 UN SDGs'],
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
  },
];

export default function MissionBriefModal({ isOpen, onClose, onReplaySplash }) {
  const { locale } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="NASA Space Apps Finalist Mission Brief & Logic Trail"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-charcoal-950/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-5xl rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-[#071612] via-[#0b1f1a] to-[#081317] text-cream-50 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between gap-4 border-b border-emerald-500/25 bg-[#040d0a] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-lg">
              🛰️
            </span>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-sky-300 block">
                NASA SPACE APPS CHALLENGE // JUDGE &amp; PITCH BRIEF
              </span>
              <h2 className="font-hand text-2xl sm:text-3xl font-bold text-cream-50 leading-none">
                H.O.M.E. — Dancing with the SARs Architecture
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onReplaySplash && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReplaySplash();
                }}
                className="rounded-xl border border-sky-400/40 bg-sky-950/60 px-3 py-1.5 text-xs font-mono font-semibold text-sky-200 hover:bg-sky-900 transition-colors cursor-pointer"
              >
                ▶ Replay 3D Splash
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-charcoal-700 bg-charcoal-900 px-3 py-1.5 text-xs font-semibold text-cream-200 hover:bg-charcoal-800 cursor-pointer"
              aria-label="Close Mission Brief"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8">
          {/* 4 NASA Winning Traits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {WINNING_TRAITS.map((trait) => (
              <div
                key={trait.code}
                className="rounded-2xl border border-emerald-500/25 bg-[#071512]/90 p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <span
                    className={`inline-block rounded-full border px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${trait.badgeColor}`}
                  >
                    {trait.code}
                  </span>
                  <h3 className="font-hand text-2xl sm:text-3xl font-bold text-cream-50">
                    {locale === 'id' ? trait.titleId : trait.titleEn}
                  </h3>
                  <p className="text-xs text-cream-200/85 leading-relaxed">
                    {locale === 'id' ? trait.descId : trait.descEn}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/10">
                  {trait.metrics.map((m) => (
                    <span
                      key={m}
                      className="rounded-md bg-white/5 border border-white/10 px-2.5 py-1 font-mono text-[10px] text-emerald-200"
                    >
                      ✓ {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Demo Pitch Navigation Bar for Presentations */}
          <div className="rounded-2xl border border-sky-500/30 bg-[#051218] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold">
                  LIVE DEMO PRESENTATION SHORTCUTS
                </span>
                <h4 className="font-hand text-2xl font-bold text-cream-50">
                  {locale === 'id'
                    ? 'Navigasi Cepat untuk Presentasi & Demo Video'
                    : 'One-Click Jump Links for Judges & Demo Video'}
                </h4>
              </div>
              <span className="font-mono text-[11px] text-emerald-300">
                100% Functional • Offline-Resilient
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-semibold">
              <a
                href="/#chapter-cover"
                onClick={onClose}
                className="rounded-xl border border-emerald-500/30 bg-emerald-950/60 p-3 text-center text-emerald-200 hover:bg-emerald-900 transition-colors"
              >
                🌍 1. 3D Earth Globe
              </a>
              <a
                href="/#chapter-sar"
                onClick={onClose}
                className="rounded-xl border border-sky-500/30 bg-sky-950/60 p-3 text-center text-sky-200 hover:bg-sky-900 transition-colors"
              >
                📡 2. SAR Scanner
              </a>
              <Link
                to="/map"
                onClick={onClose}
                className="rounded-xl border border-amber-500/30 bg-amber-950/60 p-3 text-center text-amber-200 hover:bg-amber-900 transition-colors"
              >
                🗺️ 3. 3D Tactical Map
              </Link>
              <Link
                to="/reach"
                onClick={onClose}
                className="rounded-xl border border-purple-500/30 bg-purple-950/60 p-3 text-center text-purple-200 hover:bg-purple-900 transition-colors"
              >
                🧠 4. RF ML &amp; SDGs
              </Link>
              <Link
                to="/dashboard"
                onClick={onClose}
                className="rounded-xl border border-teal-500/30 bg-teal-950/60 p-3 text-center text-teal-200 hover:bg-teal-900 transition-colors"
              >
                🛡️ 5. Sanctuary Vigil
              </Link>
              <Link
                to="/transparency"
                onClick={onClose}
                className="rounded-xl border border-rose-500/30 bg-rose-950/60 p-3 text-center text-rose-200 hover:bg-rose-900 transition-colors"
              >
                📜 6. Data Charter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

