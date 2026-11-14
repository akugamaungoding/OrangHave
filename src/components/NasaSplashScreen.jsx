import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';

const BOOT_STAGES = [
  {
    id: 'orbit',
    threshold: 0,
    code: 'SYS-01 // ORBITAL TELEMETRY LOCK',
    titleEn: 'Synchronizing NASA Earth Observation Constellation',
    titleId: 'Sinkronisasi Konstelasi Observasi Bumi NASA',
    detailEn: 'Linking Suomi-NPP / NOAA-20 (VIIRS 375m) & GIBS Thermal Anomaly Streams...',
    detailId: 'Menghubungkan Suomi-NPP / NOAA-20 (VIIRS 375m) & Aliran Anomali Termal GIBS...',
  },
  {
    id: 'sar',
    threshold: 28,
    code: 'SAR-02 // DANCING WITH THE SARs',
    titleEn: 'Calibrating Synthetic Aperture Radar Looking Glass',
    titleId: 'Kalibrasi Lensa Radar Apertur Sintetis (SAR)',
    detailEn: 'Penetrating tropical monsoon clouds & peat smoke via C-Band & L-Band VV/VH backscatter...',
    detailId: 'Menembus awan monsun tropis & kabut asap gambut melalui hamburan balik VV/VH C-Band & L-Band...',
  },
  {
    id: 'bioshield',
    threshold: 58,
    code: 'BIO-03 // KALIMANTAN HABITAT MATRIX',
    titleEn: 'Mapping 5 Protected Reserves & 5 Endangered Species',
    titleId: 'Memetakan 5 Taman Nasional & 5 Spesies Kunci Kalimantan',
    detailEn: 'Cross-referencing WDPA boundaries, GBIF occurrences & Random Forest OOB suitability...',
    detailId: 'Menyilangkan batas kawasan lindung WDPA, titik temuan GBIF & model Random Forest OOB...',
  },
  {
    id: 'story',
    threshold: 85,
    code: 'STORY-04 // EMPATHY-SCIENCE BRIDGE READY',
    titleEn: 'Opening Tuki’s Living Forest Storybook',
    titleId: 'Membuka Buku Cerita Hutan Tuki',
    detailEn: 'Target Locked: Kalimantan, Borneo [113.8°E, 0.2°S] • All Systems Nominal.',
    detailId: 'Target Terkunci: Kalimantan, Borneo [113.8°BT, 0.2°LS] • Seluruh Sistem Siap.',
  },
];

export default function NasaSplashScreen({ onComplete, forceOpen = false }) {
  const { locale } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [visible, setVisible] = useState(() => {
    if (forceOpen) return true;
    try {
      return sessionStorage.getItem('home_nasa_splash_seen') !== 'true';
    } catch {
      return true;
    }
  });

  const canvasRef = useRef(null);

  useEffect(() => {
    if (forceOpen) {
      setVisible(true);
      setIsExiting(false);
      setProgress(0);
    }
  }, [forceOpen]);

  // Starfield & radar sweep canvas animation
  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let angle = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const stars = Array.from({ length: 140 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.6 + 0.4,
      alpha: Math.random() * 0.7 + 0.2,
      speed: Math.random() * 0.015 + 0.004,
      phase: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Deep space radial gradient
      const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.45, 20, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
      bgGrad.addColorStop(0, '#0f241d');
      bgGrad.addColorStop(0.45, '#091412');
      bgGrad.addColorStop(1, '#040808');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Twinkling stars
      angle += 0.018;
      for (const s of stars) {
        const twinkle = s.alpha + Math.sin(angle * 2 + s.phase) * 0.25;
        ctx.fillStyle = `rgba(235, 248, 242, ${Math.max(0.08, Math.min(1, twinkle))})`;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Center radar / orbital rings
      const cx = w * 0.5;
      const cy = h * 0.42;
      const baseRadius = Math.min(w, h) * 0.26;

      [0.55, 0.85, 1.15, 1.45].forEach((mult, idx) => {
        ctx.strokeStyle = idx === 1 ? 'rgba(74, 222, 128, 0.22)' : 'rgba(251, 191, 36, 0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash(idx % 2 === 0 ? [4, 6] : []);
        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius * mult, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // SAR Radar Sweep Cone
      const sweepGrad = ctx.createConicGradient(angle, cx, cy);
      sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0.28)');
      sweepGrad.addColorStop(0.15, 'rgba(74, 222, 128, 0.08)');
      sweepGrad.addColorStop(0.3, 'rgba(0, 0, 0, 0)');
      sweepGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // Orbiting satellite dots ("Dancing with the SARs")
      const sat1X = cx + Math.cos(angle * 1.4) * (baseRadius * 0.85);
      const sat1Y = cy + Math.sin(angle * 1.4) * (baseRadius * 0.85);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(sat1X, sat1Y, 4, 0, Math.PI * 2);
      ctx.fill();

      const sat2X = cx + Math.cos(-angle * 1.1 + 2.1) * (baseRadius * 1.15);
      const sat2Y = cy + Math.sin(-angle * 1.1 + 2.1) * (baseRadius * 1.15);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(sat2X, sat2Y, 4, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [visible]);

  // Smooth progress counter
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 45);

    return () => clearInterval(interval);
  }, [visible]);

  const handleEnterMission = () => {
    setIsExiting(true);
    try {
      sessionStorage.setItem('home_nasa_splash_seen', 'true');
    } catch {
      // ignore storage errors
    }
    setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 650);
  };

  // Auto-transition shortly after reaching 100% unless user already clicked
  useEffect(() => {
    if (progress === 100 && visible && !isExiting) {
      const timer = setTimeout(() => {
        handleEnterMission();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [progress, visible, isExiting]);

  if (!visible) return null;

  const currentStage =
    [...BOOT_STAGES].reverse().find((s) => progress >= s.threshold) || BOOT_STAGES[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="H.O.M.E. Orbital Mission Splash Screen"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden bg-[#050b09] text-cream-50 px-4 py-8 sm:py-12 transition-all duration-700 ease-out ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Starfield & SAR Radar Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      />

      {/* Subtle Tactical HUD Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(74, 222, 128, 0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(74, 222, 128, 0.14) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
        aria-hidden="true"
      />

      {/* Top HUD Telemetry Bar */}
      <div className="relative z-10 w-full max-w-6xl flex flex-wrap items-center justify-between gap-4 border-b border-emerald-500/20 pb-4 text-xs font-mono text-emerald-300/90">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="tracking-widest uppercase font-semibold">
            NASA SPACE APPS CHALLENGE // DANCING WITH THE SARs
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-sky-300/90">
            SAR: SENTINEL-1 &amp; NISAR (VV/VH)
          </span>
          <span className="text-amber-300/90">
            THERMAL: NASA VIIRS 375M
          </span>
          <button
            type="button"
            onClick={handleEnterMission}
            className="rounded-lg border border-emerald-400/40 bg-emerald-950/60 px-3 py-1 text-[11px] font-sans font-semibold text-emerald-200 hover:bg-emerald-800/60 hover:text-white transition-colors cursor-pointer"
          >
            {locale === 'id' ? 'Lewati Intro →' : 'Skip Intro →'}
          </button>
        </div>
      </div>

      {/* Center Emblem & Mission Title */}
      <div className="relative z-10 my-auto flex flex-col items-center text-center max-w-3xl mx-auto px-4 space-y-6">
        {/* Orbital Target Reticle */}
        <div className="relative flex h-28 w-28 sm:h-36 sm:w-36 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-950/40 shadow-[0_0_60px_rgba(16,185,129,0.25)] backdrop-blur-md">
          <div className="absolute inset-1.5 rounded-full border border-dashed border-sky-400/40 animate-spin" style={{ animationDuration: '18s' }} />
          <div className="absolute inset-4 rounded-full border border-amber-400/30" />
          <img
            src="/assets/art/orangutan.svg"
            alt="Tuki the Bornean Orangutan"
            className="h-20 w-20 sm:h-24 sm:w-24 object-contain drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]"
          />
          <span className="absolute -bottom-2 rounded-full bg-sky-500/20 border border-sky-400/50 px-2.5 py-0.5 font-mono text-[10px] font-bold text-sky-300 uppercase tracking-wider">
            113.8°E • 0.2°S
          </span>
        </div>

        {/* Mission Kicker */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-sky-400/30 bg-sky-950/50 px-4 py-1.5 text-[11px] font-mono uppercase tracking-widest text-sky-200 shadow-inner">
          <span>🛰️ Through the Radar Looking Glass</span>
          <span className="text-emerald-400">•</span>
          <span>Synthetic Aperture Radar + Thermal IR</span>
        </div>

        {/* Main Title */}
        <div className="space-y-2">
          <h1 className="font-hand text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cream-50 via-emerald-200 to-amber-200 drop-shadow-sm">
            H.O.M.E.
          </h1>
          <p className="font-serif text-lg sm:text-2xl text-emerald-100/90 italic">
            {locale === 'id'
              ? 'Habitat of Our Missing Endangered — Menari Bersama Radar SAR & Bintang Satelit'
              : 'Habitat of Our Missing Endangered — Dancing with the SARs over Borneo'}
          </p>
        </div>

        {/* Active Telemetry Stage Readout Box */}
        <div className="w-full max-w-xl rounded-2xl border border-emerald-500/30 bg-[#081512]/90 p-5 text-left shadow-2xl backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-sky-400 font-bold">{currentStage.code}</span>
            <span className="text-amber-300 font-bold">{progress}%</span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-charcoal-900 border border-emerald-500/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400 transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="space-y-1 pt-1">
            <p className="text-sm font-semibold text-cream-50">
              {locale === 'id' ? currentStage.titleId : currentStage.titleEn}
            </p>
            <p className="text-xs font-mono text-emerald-200/75 leading-relaxed">
              {locale === 'id' ? currentStage.detailId : currentStage.detailEn}
            </p>
          </div>

          {/* 4 Stage Pills */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            {BOOT_STAGES.map((stage, i) => {
              const active = progress >= stage.threshold;
              return (
                <div
                  key={stage.id}
                  className={`rounded-lg px-2 py-1.5 text-center font-mono text-[10px] border transition-colors ${
                    active
                      ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200 font-semibold'
                      : 'border-charcoal-800 bg-charcoal-950/50 text-charcoal-500'
                  }`}
                >
                  0{i + 1} • {stage.id.toUpperCase()}
                </div>
              );
            })}
          </div>
        </div>

        {/* Immediate Launch CTA */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleEnterMission}
            className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-8 py-4 text-sm sm:text-base font-bold text-charcoal-950 shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_45px_rgba(56,189,248,0.6)] hover:scale-102 transition-all cursor-pointer"
          >
            <span>
              {locale === 'id'
                ? 'Masuk ke Misi & Dunia 3D Kalimantan'
                : 'Enter 3D Orbital Mission & Storybook'}
            </span>
            <span className="inline-block transition-transform group-hover:translate-x-1">
              ↗
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Attribution Footer */}
      <div className="relative z-10 w-full max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-emerald-500/20 pt-4 text-[11px] font-mono text-emerald-200/60">
        <span>
          DATA PIPELINE: NASA FIRMS • NASA GIBS • COPERNICUS SENTINEL-1 SAR • IUCN • WDPA
        </span>
        <span>
          SCIENTIFIC INTEGRITY: ZERO SPECULATIVE MORTALITY CLAIMS
        </span>
      </div>
    </div>
  );
}

