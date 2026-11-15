import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/* ════════════════════════════════════════════════════════════════════
   HazeRealMap — real satellite map of the haze routes.
   Esri World Imagery under curved smoke routes from Kalimantan to
   Sarawak, Sabah, Brunei, Peninsular Malaysia and Singapore, with
   animated smoke puffs, live Kalimantan fire hotspots and clickable
   place labels. Not draggable, so the page scroll is never hijacked.
   Falls back to the schematic SVG map if WebGL is unavailable.
   ════════════════════════════════════════════════════════════════════ */

const SOURCE = [113.9, -2.1]; // Central Kalimantan peatlands
export const PLACE_COORDS = {
  sarawak: [110.35, 1.55], // Kuching
  sabah: [116.07, 5.98], // Kota Kinabalu
  brunei: [114.94, 4.94], // Bandar Seri Begawan
  peninsular: [101.69, 3.14], // Kuala Lumpur
  singapore: [103.82, 1.35],
};
const BOUNDS = [
  [99.2, -4.9],
  [119.8, 7.4],
];
const PUFFS_PER_ROUTE = 3;

function curve(a, b, bend, n = 48) {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  const c = [mx + (-dy / len) * bend * len, my + (dx / len) * bend * len];
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [
      (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t ** 2 * b[0],
      (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t ** 2 * b[1],
    ];
  });
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

const isOn = (active, id) => active === 'all' || active === id;

export default function HazeRealMap({ neighbors, active, onSelect, fireEvents = [], fallback = null }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const [failed, setFailed] = useState(false);

  // Routes: land routes bend gently, sea routes arc north-west with the monsoon
  const routes = useMemo(
    () =>
      neighbors.map((n) => ({
        id: n.id,
        route: n.route,
        coords: curve(SOURCE, PLACE_COORDS[n.id], n.route === 'sea' ? -0.22 : 0.08),
      })),
    [neighbors]
  );

  const routesGeoJSON = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: routes.map((r) => ({
        type: 'Feature',
        properties: { id: r.id, route: r.route },
        geometry: { type: 'LineString', coordinates: r.coords },
      })),
    }),
    [routes]
  );

  const firesGeoJSON = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: fireEvents
        .map((f) => [Number(f.longitude ?? f.lon), Number(f.latitude ?? f.lat)])
        .filter(([lon, lat]) => lon >= 108 && lon <= 119.5 && lat >= -4.5 && lat <= 7.5)
        .map((c) => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: c } })),
    }),
    [fireEvents]
  );
  const firesRef = useRef(firesGeoJSON);
  firesRef.current = firesGeoJSON;
  const activeRef = useRef(active);
  activeRef.current = active;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Build the map once
  useEffect(() => {
    if (!containerRef.current) return undefined;
    if (!webglAvailable()) {
      setFailed(true);
      return undefined;
    }
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
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
              maxzoom: 10,
            },
            labels: {
              type: 'raster',
              tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
              tileSize: 256,
              maxzoom: 10,
            },
          },
          layers: [
            { id: 'bg', type: 'background', paint: { 'background-color': '#0b2533' } },
            { id: 'imagery', type: 'raster', source: 'imagery', paint: { 'raster-saturation': -0.15, 'raster-brightness-max': 0.9 } },
            { id: 'borders', type: 'raster', source: 'labels', paint: { 'raster-opacity': 0.55 } },
          ],
        },
        bounds: BOUNDS,
        fitBoundsOptions: { padding: 16 },
        interactive: false,
        attributionControl: false,
        fadeDuration: 0,
      });
    } catch {
      setFailed(true);
      return undefined;
    }
    mapRef.current = map;
    map.on('error', (e) => {
      if (String(e?.error?.message || '').match(/webgl|context/i)) setFailed(true);
    });

    let raf = 0;
    let visible = true;
    const start = performance.now();

    map.on('load', () => {
      // Haze haloes along the routes
      map.addSource('routes', { type: 'geojson', data: routesGeoJSON });
      map.addLayer({
        id: 'routes-glow',
        type: 'line',
        source: 'routes',
        layout: { 'line-cap': 'round' },
        paint: { 'line-color': '#b8a08a', 'line-width': 14, 'line-blur': 10, 'line-opacity': 0.35 },
      });
      map.addLayer({
        id: 'routes-land',
        type: 'line',
        source: 'routes',
        filter: ['==', ['get', 'route'], 'island'],
        layout: { 'line-cap': 'round' },
        paint: { 'line-color': '#ffb070', 'line-width': 3, 'line-opacity': 0.95 },
      });
      map.addLayer({
        id: 'routes-sea',
        type: 'line',
        source: 'routes',
        filter: ['==', ['get', 'route'], 'sea'],
        paint: { 'line-color': '#ffb070', 'line-width': 3, 'line-opacity': 0.95, 'line-dasharray': [2, 1.6] },
      });

      // Live fire hotspots in Kalimantan
      map.addSource('fires', { type: 'geojson', data: firesRef.current });
      map.addLayer({
        id: 'fires-glow',
        type: 'circle',
        source: 'fires',
        paint: { 'circle-color': '#ff6a1f', 'circle-radius': 7, 'circle-blur': 1, 'circle-opacity': 0.55 },
      });
      map.addLayer({
        id: 'fires-core',
        type: 'circle',
        source: 'fires',
        paint: { 'circle-color': '#ffd27a', 'circle-radius': 1.8, 'circle-opacity': 0.95 },
      });

      // Smoke puffs travelling along each route
      map.addSource('puffs', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'puffs',
        type: 'circle',
        source: 'puffs',
        paint: {
          'circle-color': '#e9ded2',
          'circle-radius': ['get', 'r'],
          'circle-blur': 0.6,
          'circle-opacity': ['get', 'o'],
        },
      });

      applyActive(map, activeRef.current);

      // Fire source marker (pulsing)
      const src = document.createElement('div');
      src.setAttribute('aria-hidden', 'true');
      src.innerHTML = `
        <div style="position:relative;width:46px;height:46px;display:flex;align-items:center;justify-content:center;pointer-events:none">
          <span class="hz-pulse" style="position:absolute;inset:0;border-radius:9999px;background:rgba(255,106,31,.45)"></span>
          <span style="font-size:22px;filter:drop-shadow(0 0 6px rgba(255,140,60,.9))">🔥</span>
        </div>
        <div style="margin-top:2px;white-space:nowrap;transform:translateX(-30%);font:700 12px/1.2 Inter,system-ui,sans-serif;color:#fff3e6;text-shadow:0 1px 6px rgba(0,0,0,.95)">Kalimantan (Indonesia)</div>`;
      new maplibregl.Marker({ element: src, anchor: 'top' }).setLngLat([SOURCE[0], SOURCE[1] + 0.45]).addTo(map);

      // Clickable place labels
      neighbors.forEach((n) => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'hz-place';
        el.innerHTML = `<span class="hz-dot"></span><span class="hz-name">${n.place}</span>`;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectRef.current(n.id);
        });
        markersRef.current[n.id] = el;
        new maplibregl.Marker({ element: el, anchor: 'left', offset: [-7, 0] }).setLngLat(PLACE_COORDS[n.id]).addTo(map);
      });
      syncMarkers(markersRef.current, activeRef.current);

      // Animate puffs
      const tick = (now) => {
        if (!visible) {
          raf = 0;
          return;
        }
        const secs = (now - start) / 1000;
        const feats = [];
        routes.forEach((r, ri) => {
          const on = isOn(activeRef.current, r.id);
          const dur = r.route === 'sea' ? 4.2 : 3.2;
          for (let k = 0; k < PUFFS_PER_ROUTE; k++) {
            const t = ((secs / dur + k / PUFFS_PER_ROUTE + ri * 0.13) % 1 + 1) % 1;
            const idx = Math.min(r.coords.length - 1, Math.floor(t * (r.coords.length - 1)));
            const fade = Math.sin(Math.PI * t);
            feats.push({
              type: 'Feature',
              properties: { r: (on ? 5 : 3.5) + t * 4, o: (on ? 0.8 : 0.35) * fade },
              geometry: { type: 'Point', coordinates: r.coords[idx] },
            });
          }
        });
        map.getSource('puffs')?.setData({ type: 'FeatureCollection', features: feats });
        raf = requestAnimationFrame(tick);
      };
      if (!reduced) raf = requestAnimationFrame(tick);

      // Pause when the map is off-screen
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !raf && !reduced) raf = requestAnimationFrame(tick);
      });
      io.observe(containerRef.current);
      map.once('remove', () => io.disconnect());
    });

    const onResize = () => map.resize();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Highlight the chosen route(s)
  useEffect(() => {
    const map = mapRef.current;
    if (map && map.isStyleLoaded() && map.getLayer('routes-land')) applyActive(map, active);
    syncMarkers(markersRef.current, active);
  }, [active]);

  // New fire data
  useEffect(() => {
    mapRef.current?.getSource?.('fires')?.setData(firesGeoJSON);
  }, [firesGeoJSON]);

  if (failed) return fallback;

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#0b2533] sm:aspect-[16/10]">
      <style>{`
        .hz-pulse { animation: hz-pulse 2s ease-out infinite; }
        @keyframes hz-pulse { 0% { transform: scale(.4); opacity: .9 } 100% { transform: scale(1.6); opacity: 0 } }
        .hz-place { display:flex; align-items:center; gap:6px; cursor:pointer; background:none; border:0; padding:0; }
        .hz-dot { width:14px; height:14px; border-radius:9999px; background:#fff; border:2px solid #7c2d12; box-shadow:0 0 0 3px rgba(0,0,0,.25); transition:all .2s; }
        .hz-name { font:600 12px/1.2 Inter,system-ui,sans-serif; color:#fff; padding:3px 8px; border-radius:9999px; background:rgba(8,20,16,.72); box-shadow:0 2px 8px rgba(0,0,0,.4); white-space:nowrap; transition:all .2s; }
        .hz-place:hover .hz-name { background:rgba(194,65,12,.9); }
        .hz-place.is-on .hz-dot { background:#ea580c; border-color:#fff; box-shadow:0 0 0 4px rgba(234,88,12,.35); }
        .hz-place.is-on .hz-name { background:#c2410c; }
        .hz-place.is-off { opacity:.6; }
        @media (prefers-reduced-motion: reduce) { .hz-pulse { animation:none } }
      `}</style>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      {/* Legend */}
      <div className="pointer-events-none absolute right-2 bottom-2 rounded-lg bg-black/60 px-2.5 py-1.5 text-[10px] leading-relaxed text-cream-50">
        <div className="flex items-center gap-2"><span className="inline-block h-0.5 w-5 bg-[#ffb070]" /> Over land (Borneo)</div>
        <div className="flex items-center gap-2"><span className="inline-block w-5 border-t-2 border-dashed border-[#ffb070]" /> Across the sea (monsoon wind)</div>
        <div className="flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-full bg-[#ff8a3d] shadow-[0_0_6px_#ff6a1f]" /> Fire hotspot (NASA FIRMS)</div>
      </div>
      <div className="pointer-events-none absolute bottom-1 left-2 text-[9px] text-white/60">Imagery © Esri</div>
    </div>
  );
}

function applyActive(map, active) {
  const on = active === 'all' ? ['literal', true] : ['==', ['get', 'id'], active];
  ['routes-land', 'routes-sea'].forEach((id) => {
    map.setPaintProperty(id, 'line-opacity', ['case', on, 0.95, 0.3]);
    map.setPaintProperty(id, 'line-width', ['case', on, 3.2, 1.6]);
    map.setPaintProperty(id, 'line-color', ['case', on, '#ff9a4d', '#e8d2bd']);
  });
  map.setPaintProperty('routes-glow', 'line-opacity', ['case', on, 0.4, 0.1]);
}

function syncMarkers(markers, active) {
  Object.entries(markers).forEach(([id, el]) => {
    el.classList.toggle('is-on', active !== 'all' && active === id);
    el.classList.toggle('is-off', active !== 'all' && active !== id);
  });
}
