import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useFireData } from '../hooks';

/* ════════════════════════════════════════════════════════════════════
   HeroGlobe — a real 3D Earth (satellite imagery on a globe with an
   atmosphere) that turns, flies in to Indonesia, and shows:
     • live NASA FIRMS fire hotspots glowing and pulsing,
     • a radar satellite orbiting over the archipelago, sweeping a
       green SAR "swath" across the ground below it.
   Purely decorative: no interaction, so the page still scrolls.
   Falls back to a static illustration if WebGL is unavailable.
   ════════════════════════════════════════════════════════════════════ */

const INDONESIA_BBOX = [94, -11.5, 142, 7];
const INDONESIA_CENTER = [114.5, -1.5];

// One descending orbit pass over western Indonesia (ground track)
const TRACK_START = [97, 9.5];
const TRACK_END = [128, -11.5];
const ORBIT_SECONDS = 11;
const SWATH_HALF_WIDTH = 1.4; // degrees either side of the track
const SWATH_TAIL = 0.28; // share of the pass that stays "painted" behind the satellite

const lerp = (a, b, t) => a + (b - a) * t;
const along = (t) => [lerp(TRACK_START[0], TRACK_END[0], t), lerp(TRACK_START[1], TRACK_END[1], t)];

function swathPolygon(t) {
  const t0 = Math.max(0, t - SWATH_TAIL);
  const [x0, y0] = along(t0);
  const [x1, y1] = along(t);
  const dx = TRACK_END[0] - TRACK_START[0];
  const dy = TRACK_END[1] - TRACK_START[1];
  const len = Math.hypot(dx, dy);
  const nx = (-dy / len) * SWATH_HALF_WIDTH;
  const ny = (dx / len) * SWATH_HALF_WIDTH;
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny], [x0 + nx, y0 + ny]]],
    },
    properties: {},
  };
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function satelliteElement() {
  const el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  el.style.pointerEvents = 'none';
  el.innerHTML = `
    <svg width="74" height="34" viewBox="0 0 74 34" style="filter: drop-shadow(0 0 6px rgba(110,231,183,.7)); transform: rotate(-28deg)">
      <rect x="1" y="9" width="24" height="14" rx="2" fill="#5b8aa0" stroke="#d6e6ea" stroke-width="1.5"/>
      <line x1="9" y1="9" x2="9" y2="23" stroke="#d6e6ea" stroke-width=".8"/>
      <line x1="17" y1="9" x2="17" y2="23" stroke="#d6e6ea" stroke-width=".8"/>
      <line x1="25" y1="16" x2="29" y2="16" stroke="#d6e6ea" stroke-width="2"/>
      <rect x="29" y="6" width="16" height="20" rx="3" fill="#e8d6b0" stroke="#fff" stroke-width="1.5"/>
      <circle cx="37" cy="27.5" r="3" fill="#6ee7b7"/>
      <line x1="45" y1="16" x2="49" y2="16" stroke="#d6e6ea" stroke-width="2"/>
      <rect x="49" y="9" width="24" height="14" rx="2" fill="#5b8aa0" stroke="#d6e6ea" stroke-width="1.5"/>
      <line x1="57" y1="9" x2="57" y2="23" stroke="#d6e6ea" stroke-width=".8"/>
      <line x1="65" y1="9" x2="65" y2="23" stroke="#d6e6ea" stroke-width=".8"/>
    </svg>`;
  return el;
}

function labelElement(text) {
  const el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText =
    'pointer-events:none;font:600 11px/1 Inter,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:rgba(253,246,227,.85);text-shadow:0 1px 6px rgba(0,0,0,.9)';
  el.textContent = text;
  return el;
}

export default function HeroGlobe({ fallbackSrc = '/assets/art/hero-orbit.svg', topPadding = 0 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const firesRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const { fireEvents = [] } = useFireData();

  // Indonesian hotspots only (the feed can contain other regions)
  const firesGeoJSON = useMemo(() => {
    const [w, s, e, n] = INDONESIA_BBOX;
    return {
      type: 'FeatureCollection',
      features: fireEvents
        .map((f) => ({ lon: Number(f.longitude ?? f.lon), lat: Number(f.latitude ?? f.lat), frp: Number(f.frp) || 5 }))
        .filter((p) => p.lon >= w && p.lon <= e && p.lat >= s && p.lat <= n)
        .map((p) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [p.lon, p.lat] }, properties: { frp: p.frp } })),
    };
  }, [fireEvents]);

  firesRef.current = firesGeoJSON;

  // Build the map once
  useEffect(() => {
    if (!containerRef.current) return undefined;
    if (!webglAvailable()) {
      setFailed(true);
      return undefined;
    }
    const reduced = prefersReducedMotion();
    let map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            imagery: {
              type: 'raster',
              tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
              tileSize: 256,
              maxzoom: 9,
            },
          },
          layers: [
            { id: 'space', type: 'background', paint: { 'background-color': '#020812' } },
            {
              id: 'earth',
              type: 'raster',
              source: 'imagery',
              paint: { 'raster-saturation': 0.1, 'raster-contrast': 0.12, 'raster-brightness-max': 0.92 },
            },
          ],
        },
        center: reduced ? INDONESIA_CENTER : [40, 12],
        zoom: reduced ? 3.1 : 1.35,
        pitch: reduced ? 25 : 0,
        bearing: 0,
        interactive: false,
        attributionControl: false,
        fadeDuration: 0,
        renderWorldCopies: false,
      });
    } catch {
      setFailed(true);
      return undefined;
    }
    mapRef.current = map;
    if (import.meta.env?.DEV) window.__heroMap = map;
    map.on('error', (e) => {
      // Tile hiccups are fine; only give up if the GL context itself fails
      if (String(e?.error?.message || '').match(/webgl|context/i)) setFailed(true);
    });

    let raf = 0;
    let satMarker;
    const labels = [];
    const start = performance.now();

    map.on('style.load', () => {
      try {
        map.setProjection({ type: 'globe' });
      } catch {
        /* older engines: stays flat, still fine */
      }
      try {
        map.setSky({
          'sky-color': '#0b1d2a',
          'horizon-color': '#5fa8c9',
          'fog-color': '#0b1d2a',
          'sky-horizon-blend': 0.6,
          'horizon-fog-blend': 0.6,
          'fog-ground-blend': 0.2,
          'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 4, 0.9, 7, 0.2],
        });
      } catch {
        /* sky not supported */
      }

      // Orbit ground track (faint dashed line)
      map.addSource('track', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [TRACK_START, TRACK_END] }, properties: {} },
      });
      map.addLayer({
        id: 'track',
        type: 'line',
        source: 'track',
        paint: { 'line-color': '#e0f2fe', 'line-opacity': 0.35, 'line-width': 1.2, 'line-dasharray': [2, 3] },
      });

      // Radar swath painted behind the satellite
      map.addSource('swath', { type: 'geojson', data: swathPolygon(reduced ? 0.6 : 0) });
      map.addLayer({ id: 'swath-fill', type: 'fill', source: 'swath', paint: { 'fill-color': '#34d399', 'fill-opacity': 0.22 } });
      map.addLayer({
        id: 'swath-edge',
        type: 'line',
        source: 'swath',
        paint: { 'line-color': '#6ee7b7', 'line-opacity': 0.7, 'line-width': 1.2 },
      });

      // Fires: soft glow + bright core
      map.addSource('fires', { type: 'geojson', data: firesRef.current });
      map.addLayer({
        id: 'fire-glow',
        type: 'circle',
        source: 'fires',
        paint: {
          'circle-color': '#f97316',
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 3, 4, 9],
          'circle-blur': 1,
          'circle-opacity': 0.55,
        },
      });
      map.addLayer({
        id: 'fire-core',
        type: 'circle',
        source: 'fires',
        paint: {
          'circle-color': '#fde68a',
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 0.8, 4, 2.2],
          'circle-opacity': 0.95,
        },
      });

      // Satellite + a few place labels
      satMarker = new maplibregl.Marker({ element: satelliteElement() }).setLngLat(along(reduced ? 0.6 : 0)).addTo(map);
      [
        ['Kalimantan', [113.6, -1.2]],
        ['Sumatra', [101.2, -0.4]],
        ['Java', [110, -7.6]],
      ].forEach(([name, at]) => labels.push(new maplibregl.Marker({ element: labelElement(name) }).setLngLat(at).addTo(map)));

      if (reduced) return;

      // Fly from space to Indonesia, then keep a gentle drift
      map.easeTo({
        center: INDONESIA_CENTER,
        zoom: 3.15,
        pitch: 28,
        bearing: -8,
        duration: 7000,
        easing: (t) => 1 - (1 - t) ** 3,
        padding: { top: topPadding, bottom: 0, left: 0, right: 0 },
      });

      let arrived = false;
      map.once('moveend', () => {
        arrived = true;
      });

      let frame = 0;
      const tick = (now) => {
        const secs = (now - start) / 1000;
        const t = (secs % ORBIT_SECONDS) / ORBIT_SECONDS;
        satMarker.setLngLat(along(t));
        map.getSource('swath')?.setData(swathPolygon(t));

        // Pulse the fires (every other frame is plenty)
        if (frame++ % 2 === 0) {
          const pulse = 0.4 + 0.25 * Math.sin(secs * 3);
          map.setPaintProperty('fire-glow', 'circle-opacity', pulse);
        }
        // Slow camera drift once we have arrived
        if (arrived) {
          map.jumpTo({ bearing: -8 + Math.sin(secs * 0.12) * 10, center: [INDONESIA_CENTER[0] + Math.sin(secs * 0.08) * 2.5, INDONESIA_CENTER[1]] });
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });

    // Pause the animation when the hero is off-screen (saves battery)
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf && !reduced && map.isStyleLoaded()) {
        map.fire('hero:resume');
      }
    });
    io.observe(containerRef.current);
    map.on('hero:resume', () => {
      const resume = (now) => {
        const secs = (now - start) / 1000;
        const t = (secs % ORBIT_SECONDS) / ORBIT_SECONDS;
        satMarker?.setLngLat(along(t));
        map.getSource('swath')?.setData(swathPolygon(t));
        map.setPaintProperty('fire-glow', 'circle-opacity', 0.4 + 0.25 * Math.sin(secs * 3));
        map.jumpTo({ bearing: -8 + Math.sin(secs * 0.12) * 10, center: [INDONESIA_CENTER[0] + Math.sin(secs * 0.08) * 2.5, INDONESIA_CENTER[1]] });
        raf = requestAnimationFrame(resume);
      };
      raf = requestAnimationFrame(resume);
    });

    const onResize = () => map.resize();
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', onResize);
      labels.forEach((m) => m.remove());
      satMarker?.remove();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push new fire data in when it arrives
  useEffect(() => {
    const src = mapRef.current?.getSource?.('fires');
    if (src) src.setData(firesGeoJSON);
  }, [firesGeoJSON]);

  if (failed) {
    return <img src={fallbackSrc} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />;
  }

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {/* Starfield behind the globe */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1px 1px at 12% 18%, #fff8 50%, transparent 51%), radial-gradient(1px 1px at 28% 72%, #fff6 50%, transparent 51%), radial-gradient(1.5px 1.5px at 44% 12%, #fffa 50%, transparent 51%), radial-gradient(1px 1px at 63% 28%, #fff7 50%, transparent 51%), radial-gradient(1px 1px at 82% 14%, #fff9 50%, transparent 51%), radial-gradient(1.5px 1.5px at 91% 64%, #fff6 50%, transparent 51%), radial-gradient(1px 1px at 6% 52%, #fff7 50%, transparent 51%), radial-gradient(1px 1px at 72% 86%, #fff5 50%, transparent 51%), radial-gradient(ellipse at 50% 120%, #0d2a3a 0%, #020812 60%)',
        }}
      />
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  );
}
