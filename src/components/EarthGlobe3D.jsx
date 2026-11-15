import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n';

// Simplified world landmass polygons [lon, lat] for 3D orthographic rendering
// With high-detail Borneo (Kalimantan/Sarawak/Sabah/Brunei) & SE Asia
const LAND_POLYGONS = [
  // Borneo (High Detail Centerpiece)
  {
    name: 'Borneo / Kalimantan',
    isBorneo: true,
    coords: [
      [108.8, 0.8], [109.6, 2.0], [111.3, 1.2], [113.2, 3.2], [115.2, 5.0],
      [116.8, 7.0], [119.2, 5.1], [118.9, 1.0], [117.9, 0.8], [117.5, -0.5],
      [116.5, -1.8], [116.2, -3.5], [114.5, -4.1], [111.8, -3.5], [110.1, -2.8],
      [109.2, -0.5], [108.8, 0.8],
    ],
  },
  // Sumatra & Malay Peninsula
  {
    name: 'Sumatra',
    coords: [
      [95.3, 5.5], [98.5, 4.0], [101.2, 1.0], [104.5, -1.5], [105.8, -5.8],
      [103.5, -5.2], [100.2, -1.5], [97.0, 2.5], [95.3, 5.5],
    ],
  },
  {
    name: 'Malay Peninsula',
    coords: [
      [100.1, 6.8], [102.3, 6.2], [103.5, 3.5], [104.2, 1.3], [103.6, 1.2],
      [101.2, 3.2], [100.1, 6.8],
    ],
  },
  // Java
  {
    name: 'Java',
    coords: [
      [105.2, -6.0], [110.0, -6.5], [114.4, -7.8], [114.0, -8.7], [108.5, -7.8],
      [105.2, -6.8], [105.2, -6.0],
    ],
  },
  // Sulawesi
  {
    name: 'Sulawesi',
    coords: [
      [119.5, 1.2], [125.0, 1.5], [123.0, -0.5], [123.2, -4.5], [121.5, -5.5],
      [119.3, -5.2], [118.8, -2.5], [119.5, 1.2],
    ],
  },
  // Papua / New Guinea
  {
    name: 'New Guinea',
    coords: [
      [131.0, -0.8], [136.0, -1.8], [141.0, -2.6], [147.5, -6.0], [150.5, -10.2],
      [147.0, -9.5], [141.0, -8.5], [135.0, -4.5], [131.0, -0.8],
    ],
  },
  // Philippines
  {
    name: 'Philippines',
    coords: [
      [120.0, 18.2], [122.3, 17.5], [124.0, 13.0], [126.2, 7.0], [124.0, 6.0],
      [121.5, 10.5], [119.8, 14.5], [120.0, 18.2],
    ],
  },
  // Mainland Eurasia / Asia outline
  {
    name: 'Asia & Eurasia',
    coords: [
      [30.0, 40.0], [60.0, 65.0], [100.0, 72.0], [140.0, 65.0], [142.0, 45.0],
      [122.0, 38.0], [121.0, 28.0], [109.0, 20.0], [108.0, 11.0], [104.5, 10.5],
      [100.5, 13.5], [96.0, 16.0], [90.0, 22.0], [80.0, 8.0], [72.0, 20.0],
      [60.0, 25.0], [45.0, 12.0], [35.0, 30.0], [30.0, 40.0],
    ],
  },
  // Australia
  {
    name: 'Australia',
    coords: [
      [114.0, -22.0], [122.0, -16.0], [131.0, -12.0], [136.0, -12.5], [142.5, -11.0],
      [150.0, -22.0], [153.5, -28.0], [149.5, -37.5], [140.0, -38.0], [131.0, -32.0],
      [115.0, -34.5], [114.0, -22.0],
    ],
  },
  // Africa
  {
    name: 'Africa',
    coords: [
      [-17.0, 15.0], [-5.0, 35.0], [10.0, 37.0], [32.0, 31.0], [51.0, 12.0],
      [40.0, -10.0], [35.0, -25.0], [20.0, -34.5], [14.0, -22.0], [9.0, 4.0],
      [-8.0, 5.0], [-17.0, 15.0],
    ],
  },
];

// 5 Protected Parks on Borneo
const BORNEO_RESERVES = [
  { id: 'tanjung-puting', name: 'Tanjung Puting NP', lon: 111.95, lat: -2.95, sarBackscatter: '-11.4 dB', moisture: 'Peat Alert' },
  { id: 'betung-kerihun', name: 'Betung Kerihun NP', lon: 113.25, lat: 1.2, sarBackscatter: '-7.2 dB', moisture: 'Intact Canopy' },
  { id: 'bukit-baka', name: 'Bukit Baka Bukit Raya', lon: 112.5, lat: -0.7, sarBackscatter: '-8.1 dB', moisture: 'Stable Core' },
  { id: 'danau-sentarum', name: 'Danau Sentarum Wetland', lon: 112.15, lat: 0.85, sarBackscatter: '-12.8 dB', moisture: 'Seasonal Dry' },
  { id: 'kutai', name: 'Kutai National Park', lon: 117.4, lat: 0.4, sarBackscatter: '-9.6 dB', moisture: 'Edge Vigil' },
];

export default function EarthGlobe3D({ fireEvents = [] }) {
  const { locale } = useTranslation();
  const canvasRef = useRef(null);

  // Sensor visualization mode: 'hybrid' | 'sar' | 'thermal'
  const [sensorMode, setSensorMode] = useState('hybrid');
  // Camera preset: 'borneo' | 'global'
  const [viewPreset, setViewPreset] = useState('borneo');
  // Auto-spin toggle
  const [autoSpin, setAutoSpin] = useState(true);
  // Selected point on globe
  const [selectedTarget, setSelectedTarget] = useState(BORNEO_RESERVES[0]);

  // Mutable ref for smooth 60fps animation state
  const globeStateRef = useRef({
    rotLon: -113.8, // centered on Kalimantan 113.8°E
    rotLat: 2.0,
    targetLon: -113.8,
    targetLat: 2.0,
    zoom: 1.48,
    targetZoom: 1.48,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    orbitTick: 0,
  });

  // Update target zoom/rotation when preset changes
  useEffect(() => {
    if (viewPreset === 'borneo') {
      globeStateRef.current.targetLon = -113.8;
      globeStateRef.current.targetLat = 1.5;
      globeStateRef.current.targetZoom = 1.52;
    } else {
      globeStateRef.current.targetZoom = 0.96;
    }
  }, [viewPreset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Project (lon, lat, altitudeOffset) to 2D canvas coordinates
    const project3D = (lon, lat, radius, cx, cy, rotLon, rotLat, alt = 1) => {
      const lam = ((lon + rotLon) * Math.PI) / 180;
      const phi = (lat * Math.PI) / 180;
      const phi0 = (rotLat * Math.PI) / 180;

      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);
      const cosPhi0 = Math.cos(phi0);
      const sinPhi0 = Math.sin(phi0);
      const cosLam = Math.cos(lam);
      const sinLam = Math.sin(lam);

      // z > 0 means facing viewer
      const z = sinPhi0 * sinPhi + cosPhi0 * cosPhi * cosLam;
      const x = cosPhi * sinLam;
      const y = cosPhi0 * sinPhi - sinPhi0 * cosPhi * cosLam;

      return {
        x: cx + x * radius * alt,
        y: cy - y * radius * alt,
        z,
        visible: z > -0.05,
      };
    };

    const stars = Array.from({ length: 90 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.4 + 0.3,
      phase: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      const state = globeStateRef.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const cx = w * 0.5;
      const cy = h * 0.5;

      state.orbitTick += 0.015;

      // Smooth interpolation for zoom & rotation
      state.zoom += (state.targetZoom - state.zoom) * 0.08;
      if (!state.isDragging) {
        if (autoSpin && viewPreset === 'global') {
          state.targetLon -= 0.18;
        } else if (autoSpin && viewPreset === 'borneo') {
          // Gentle orbital oscillation around Borneo so it feels alive in 3D
          state.targetLon = -113.8 + Math.sin(state.orbitTick * 0.5) * 6.5;
          state.targetLat = 1.0 + Math.cos(state.orbitTick * 0.35) * 3.0;
        }
        state.rotLon += (state.targetLon - state.rotLon) * 0.08;
        state.rotLat += (state.targetLat - state.rotLat) * 0.08;
      }

      const baseR = Math.min(w, h) * 0.36 * state.zoom;

      ctx.clearRect(0, 0, w, h);

      // 1. Background Stars
      for (const s of stars) {
        const alpha = 0.3 + Math.sin(state.orbitTick * 2 + s.phase) * 0.25;
        ctx.fillStyle = `rgba(226, 242, 234, ${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Outer Atmospheric Halo Glow
      const haloGrad = ctx.createRadialGradient(cx, cy, baseR * 0.85, cx, cy, baseR * 1.28);
      if (sensorMode === 'sar') {
        haloGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
        haloGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.12)');
        haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (sensorMode === 'thermal') {
        haloGrad.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
        haloGrad.addColorStop(0.5, 'rgba(234, 88, 12, 0.1)');
        haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        haloGrad.addColorStop(0, 'rgba(74, 222, 128, 0.22)');
        haloGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.1)');
        haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR * 1.28, 0, Math.PI * 2);
      ctx.fill();

      // 3. 3D Ocean Sphere Body
      const oceanGrad = ctx.createRadialGradient(
        cx - baseR * 0.3,
        cy - baseR * 0.3,
        baseR * 0.1,
        cx,
        cy,
        baseR
      );
      if (sensorMode === 'sar') {
        oceanGrad.addColorStop(0, '#0c2738');
        oceanGrad.addColorStop(0.7, '#061520');
        oceanGrad.addColorStop(1, '#030a10');
      } else if (sensorMode === 'thermal') {
        oceanGrad.addColorStop(0, '#221510');
        oceanGrad.addColorStop(0.7, '#120b08');
        oceanGrad.addColorStop(1, '#080504');
      } else {
        oceanGrad.addColorStop(0, '#102b26');
        oceanGrad.addColorStop(0.65, '#091917');
        oceanGrad.addColorStop(1, '#040c0b');
      }

      ctx.fillStyle = oceanGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
      ctx.fill();

      // Clip inside sphere for surface features
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
      ctx.clip();

      // 4. Graticule Grid (Lat/Lon lines)
      ctx.lineWidth = 0.7;
      for (let lon = -180; lon < 180; lon += 15) {
        ctx.strokeStyle =
          lon === 114 ? 'rgba(56, 189, 248, 0.22)' : 'rgba(148, 163, 184, 0.1)';
        ctx.beginPath();
        let started = false;
        for (let lat = -80; lat <= 80; lat += 5) {
          const p = project3D(lon, lat, baseR, cx, cy, state.rotLon, state.rotLat);
          if (p.z > 0) {
            if (!started) {
              ctx.moveTo(p.x, p.y);
              started = true;
            } else {
              ctx.lineTo(p.x, p.y);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }

      for (let lat = -60; lat <= 60; lat += 15) {
        const isEquator = lat === 0;
        ctx.strokeStyle = isEquator
          ? 'rgba(251, 191, 36, 0.3)'
          : 'rgba(148, 163, 184, 0.1)';
        ctx.lineWidth = isEquator ? 1.1 : 0.7;
        ctx.beginPath();
        let started = false;
        for (let lon = -180; lon <= 180; lon += 5) {
          const p = project3D(lon, lat, baseR, cx, cy, state.rotLon, state.rotLat);
          if (p.z > 0) {
            if (!started) {
              ctx.moveTo(p.x, p.y);
              started = true;
            } else {
              ctx.lineTo(p.x, p.y);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }

      // 5. Render Landmass Polygons
      for (const poly of LAND_POLYGONS) {
        ctx.beginPath();
        let visiblePoints = 0;
        poly.coords.forEach(([lon, lat], idx) => {
          const p = project3D(lon, lat, baseR, cx, cy, state.rotLon, state.rotLat);
          if (p.z > -0.2) visiblePoints++;
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();

        if (visiblePoints > 0) {
          if (poly.isBorneo) {
            if (sensorMode === 'sar') {
              ctx.fillStyle = 'rgba(14, 165, 233, 0.35)';
              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 2;
            } else if (sensorMode === 'thermal') {
              ctx.fillStyle = 'rgba(180, 83, 9, 0.35)';
              ctx.strokeStyle = '#fbbf24';
              ctx.lineWidth = 2;
            } else {
              ctx.fillStyle = 'rgba(46, 125, 75, 0.55)';
              ctx.strokeStyle = '#6ee7b7';
              ctx.lineWidth = 2;
            }
          } else {
            ctx.fillStyle =
              sensorMode === 'sar'
                ? 'rgba(30, 58, 76, 0.45)'
                : 'rgba(38, 70, 55, 0.38)';
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
            ctx.lineWidth = 1;
          }
          ctx.fill();
          ctx.stroke();
        }
      }

      // 6. SAR Synthetic Aperture Radar Swath Grid over Kalimantan (when in SAR or Hybrid mode)
      if (sensorMode === 'sar' || sensorMode === 'hybrid') {
        const swathLon = 113.5 + Math.sin(state.orbitTick * 1.4) * 3.5;
        const swathCorners = [
          [swathLon - 2.2, 3.5],
          [swathLon + 2.2, 3.5],
          [swathLon + 1.5, -4.2],
          [swathLon - 2.9, -4.2],
        ];
        ctx.beginPath();
        swathCorners.forEach(([lon, lat], i) => {
          const p = project3D(lon, lat, baseR, cx, cy, state.rotLon, state.rotLat);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fillStyle =
          sensorMode === 'sar'
            ? 'rgba(56, 189, 248, 0.22)'
            : 'rgba(56, 189, 248, 0.11)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 7. Protected Areas Shields on Borneo
      for (const park of BORNEO_RESERVES) {
        const p = project3D(park.lon, park.lat, baseR, cx, cy, state.rotLon, state.rotLat);
        if (p.z > 0.1) {
          const isSelected = selectedTarget?.id === park.id;
          ctx.beginPath();
          ctx.arc(p.x, p.y, isSelected ? 7 : 4.5, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? '#34d399' : 'rgba(52, 211, 153, 0.75)';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = isSelected ? 2 : 1;
          ctx.stroke();
        }
      }

      // 8. Active Fire Anomalies on Borneo
      const activeFires = (fireEvents || []).slice(0, 45);
      activeFires.forEach((f, idx) => {
        const p = project3D(
          f.longitude,
          f.latitude,
          baseR,
          cx,
          cy,
          state.rotLon,
          state.rotLat
        );
        if (p.z > 0.1) {
          const pulse = 1 + Math.sin(state.orbitTick * 4 + idx) * 0.35;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4.5 * pulse, 0, Math.PI * 2);
          ctx.fillStyle =
            sensorMode === 'sar'
              ? 'rgba(244, 63, 94, 0.35)'
              : 'rgba(245, 158, 11, 0.38)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = sensorMode === 'sar' ? '#fda4af' : '#fde047';
          ctx.fill();
        }
      });

      ctx.restore(); // End sphere clip

      // 9. Sphere Rim Specular Ring
      ctx.strokeStyle =
        sensorMode === 'sar'
          ? 'rgba(56, 189, 248, 0.5)'
          : sensorMode === 'thermal'
          ? 'rgba(251, 191, 36, 0.45)'
          : 'rgba(110, 231, 183, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
      ctx.stroke();

      // 10. Orbiting Satellites ("Dancing with the SARs" Constellation in 3D)
      const satellites = [
        {
          name: 'SENTINEL-1 SAR (C-Band)',
          color: '#38bdf8',
          inclination: 52,
          speed: 1.15,
          phase: 0,
          alt: 1.16,
        },
        {
          name: 'NASA-ISRO NISAR (L-Band)',
          color: '#34d399',
          inclination: -48,
          speed: 0.95,
          phase: 2.1,
          alt: 1.22,
        },
        {
          name: 'SUOMI-NPP VIIRS (375m IR)',
          color: '#fbbf24',
          inclination: 28,
          speed: 1.35,
          phase: 4.2,
          alt: 1.12,
        },
      ];

      satellites.forEach((sat) => {
        const satLon = ((state.orbitTick * 28 * sat.speed + sat.phase * 60) % 360) - 180;
        const satLat = Math.sin((satLon * Math.PI) / 180) * sat.inclination;
        const pSat = project3D(
          satLon,
          satLat,
          baseR,
          cx,
          cy,
          state.rotLon,
          state.rotLat,
          sat.alt
        );
        const pGround = project3D(
          satLon,
          satLat,
          baseR,
          cx,
          cy,
          state.rotLon,
          state.rotLat,
          1.0
        );

        if (pSat.z > -0.15) {
          // Radar / Thermal beam down to Earth surface
          if (pGround.z > 0) {
            ctx.strokeStyle = sat.color;
            ctx.lineWidth = 1.2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(pSat.x, pSat.y);
            ctx.lineTo(pGround.x, pGround.y);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // Satellite body glow
          ctx.fillStyle = sat.color;
          ctx.beginPath();
          ctx.arc(pSat.x, pSat.y, 4.5, 0, Math.PI * 2);
          ctx.fill();

          // Satellite label tag
          ctx.font = '600 10px monospace';
          ctx.fillStyle = '#f8fafc';
          ctx.fillText(sat.name, pSat.x + 8, pSat.y + 3);
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [fireEvents, sensorMode, viewPreset, autoSpin, selectedTarget]);

  // Pointer drag handlers for 3D globe rotation
  const handlePointerDown = (e) => {
    globeStateRef.current.isDragging = true;
    globeStateRef.current.lastX = e.clientX;
    globeStateRef.current.lastY = e.clientY;
  };

  const handlePointerMove = (e) => {
    if (!globeStateRef.current.isDragging) return;
    const dx = e.clientX - globeStateRef.current.lastX;
    const dy = e.clientY - globeStateRef.current.lastY;
    globeStateRef.current.lastX = e.clientX;
    globeStateRef.current.lastY = e.clientY;

    globeStateRef.current.rotLon += dx * 0.45;
    globeStateRef.current.rotLat = Math.max(
      -65,
      Math.min(65, globeStateRef.current.rotLat + dy * 0.45)
    );
    globeStateRef.current.targetLon = globeStateRef.current.rotLon;
    globeStateRef.current.targetLat = globeStateRef.current.rotLat;
  };

  const handlePointerUp = () => {
    globeStateRef.current.isDragging = false;
  };

  const handleFocusReserve = (reserve) => {
    setSelectedTarget(reserve);
    setViewPreset('borneo');
    globeStateRef.current.targetLon = -reserve.lon;
    globeStateRef.current.targetLat = -reserve.lat;
    globeStateRef.current.targetZoom = 1.65;
  };

  return (
    <div className="relative w-full rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-[#071512] via-[#0a1d18] to-[#0d231d] text-cream-50 shadow-2xl overflow-hidden">
      {/* Top Orbital Command Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/20 bg-[#05100d]/90 px-5 py-3.5 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-400 animate-ping" />
          <span className="font-bold tracking-wider text-emerald-300 uppercase">
            3D ORBITAL TELEMETRY
          </span>
          <span className="hidden md:inline rounded bg-sky-500/20 border border-sky-400/30 px-2 py-0.5 text-[10px] text-sky-300">
            INTERACTIVE 3D GLOBE (DRAG TO ROTATE)
          </span>
        </div>

        {/* Sensor Mode Switcher */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'hybrid', label: '🌍 Hybrid Canopy + SAR', color: 'bg-emerald-600 text-white' },
            { id: 'sar', label: '📡 SAR Radar (VV/VH)', color: 'bg-sky-600 text-white' },
            { id: 'thermal', label: '🔥 VIIRS Thermal IR', color: 'bg-amber-600 text-charcoal-950' },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setSensorMode(mode.id)}
              className={`rounded-lg px-3 py-1 text-[11px] font-sans font-semibold transition-all cursor-pointer ${
                sensorMode === mode.id
                  ? `${mode.color} shadow-sm`
                  : 'bg-charcoal-900/80 text-emerald-100/70 hover:bg-charcoal-800 border border-emerald-500/20'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3D Globe + Tactical Telemetry Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Left/Center: Interactive 3D Globe Canvas */}
        <div className="lg:col-span-7 relative min-h-[380px] sm:min-h-[450px] flex items-center justify-center select-none">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            aria-label="Interactive 3D Earth Globe showing Kalimantan fire detections and SAR satellite orbits"
          />

          {/* Bottom-Left Camera Controls */}
          <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setViewPreset('borneo')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold backdrop-blur-md border transition-all cursor-pointer ${
                viewPreset === 'borneo'
                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-100'
                  : 'bg-charcoal-950/70 border-charcoal-700 text-cream-300 hover:bg-charcoal-900'
              }`}
            >
              🎯 {locale === 'id' ? 'Kunci Kalimantan' : 'Lock Borneo [113.8°E]'}
            </button>
            <button
              type="button"
              onClick={() => setViewPreset('global')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold backdrop-blur-md border transition-all cursor-pointer ${
                viewPreset === 'global'
                  ? 'bg-sky-500/30 border-sky-400 text-sky-100'
                  : 'bg-charcoal-950/70 border-charcoal-700 text-cream-300 hover:bg-charcoal-900'
              }`}
            >
              🌐 {locale === 'id' ? 'Orbit Global' : 'Global Orbit'}
            </button>
            <button
              type="button"
              onClick={() => setAutoSpin((s) => !s)}
              className="rounded-xl bg-charcoal-950/70 border border-charcoal-700 px-3 py-1.5 text-xs font-mono text-cream-300 hover:bg-charcoal-900 backdrop-blur-md cursor-pointer"
            >
              {autoSpin ? '⏸ Pause Orbit' : '▶ Spin Orbit'}
            </button>
          </div>

          {/* Top-Left Legend Overlay */}
          <div className="absolute top-4 left-4 pointer-events-none rounded-xl border border-emerald-500/25 bg-[#05100d]/80 px-3.5 py-2.5 text-[11px] font-mono backdrop-blur-md space-y-1">
            <div className="flex items-center gap-2 text-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>VIIRS Thermal Anomalies ({fireEvents?.length || 0})</span>
            </div>
            <div className="flex items-center gap-2 text-sky-300">
              <span className="h-2 w-2 rounded-xs bg-sky-400" />
              <span>SAR Radar Swath (Cloud-Penetrating)</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>5 WDPA Protected Sanctuaries</span>
            </div>
          </div>
        </div>

        {/* Right: Kalimantan Orbital Target & SAR Telemetry Readout */}
        <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-emerald-500/20 bg-[#06120f]/90 p-5 sm:p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-sky-400 block">
                {locale === 'id'
                  ? 'SINERGI MULTI-SENSOR // SAR + TERMAL'
                  : 'MULTI-SENSOR SYNERGY // SAR + THERMAL'}
              </span>
              <h3 className="font-hand text-3xl font-bold text-cream-50 mt-0.5">
                {locale === 'id'
                  ? 'Menembus Kabut Asap dengan Radar SAR'
                  : 'Why We Dance with the SARs'}
              </h3>
              <p className="mt-1.5 text-xs text-emerald-100/80 leading-relaxed">
                {locale === 'id'
                  ? 'Saat kebakaran gambut Kalimantan tertutup awan monsun dan asap pekat, kamera optik buta. Radar Apertur Sintetis (SAR Sentinel-1 & NISAR) menembus awan 24/7 untuk membaca kelembapan gambut & struktur kanopi bersama sensor panas NASA VIIRS.'
                  : 'When Kalimantan peat fires are veiled by thick monsoon clouds and haze, optical cameras are blinded. Synthetic Aperture Radar (Sentinel-1 & NISAR) penetrates clouds 24/7 to measure peat moisture & canopy structure alongside NASA VIIRS thermal sensors.'}
              </p>
            </div>

            {/* Interactive Sanctuary Target Selector */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/80 block">
                {locale === 'id'
                  ? 'Pilih Koridor Konservasi di Globe 3D:'
                  : 'Inspect Conservation Corridor on 3D Globe:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BORNEO_RESERVES.map((res) => {
                  const active = selectedTarget?.id === res.id;
                  return (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => handleFocusReserve(res)}
                      className={`text-left rounded-xl p-2.5 border transition-all cursor-pointer ${
                        active
                          ? 'border-emerald-400 bg-emerald-500/20 shadow-sm'
                          : 'border-emerald-500/20 bg-charcoal-950/60 hover:bg-charcoal-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-cream-50 truncate">
                          {res.name}
                        </span>
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-sky-300">
                        <span>σ° {res.sarBackscatter}</span>
                        <span className="text-amber-300">{res.moisture}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Target Live Telemetry Card */}
            {selectedTarget && (
              <div className="rounded-2xl border border-sky-500/30 bg-[#08191e]/90 p-4 space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-sky-500/20 pb-2">
                  <span className="text-sky-300 font-bold">
                    TARGET: {selectedTarget.name.toUpperCase()}
                  </span>
                  <span className="text-emerald-300 text-[11px]">
                    [{selectedTarget.lon}°E, {selectedTarget.lat}°N]
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-cream-400 block text-[10px]">SAR Backscatter</span>
                    <span className="text-sky-300 font-bold">{selectedTarget.sarBackscatter}</span>
                  </div>
                  <div>
                    <span className="text-cream-400 block text-[10px]">Peat Hydrology</span>
                    <span className="text-amber-300 font-bold">{selectedTarget.moisture}</span>
                  </div>
                  <div>
                    <span className="text-cream-400 block text-[10px]">Cloud Penetration</span>
                    <span className="text-emerald-300 font-bold">100% (C/L Band)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Links to Full Map & SAR Scanner */}
          <div className="pt-2 flex flex-wrap items-center gap-3 border-t border-emerald-500/20">
            <a
              href="#chapter-sar"
              className="flex-1 text-center rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-2.5 text-xs font-bold text-charcoal-950 hover:from-sky-400 hover:to-emerald-400 transition-all shadow-md"
            >
              {locale === 'id' ? 'Uji Lensa Radar SAR ↓' : 'Try Interactive SAR Scanner ↓'}
            </a>
            <Link
              to="/map"
              className="rounded-xl border border-emerald-400/40 bg-emerald-950/60 px-4 py-2.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-900 transition-colors"
            >
              {locale === 'id' ? 'Peta Penuh 3D →' : 'Full 3D Map →'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

