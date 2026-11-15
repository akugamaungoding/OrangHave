import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useFireData } from "../hooks";
import { useTranslation } from "../i18n";
import { scrapeNasaEonetWildfires } from "../nasaScraper";
import {
  REGION_COORDINATES,
  buildNasaBasemapStyle,
  getFirePinSvg,
  getWildlifeArtUrl,
  getWildlifePhotoUrl,
  buildIndonesiaFireEvents,
  buildFireTriggeredWildlifePins,
  haversineKm,
  findNearestNdviPlot,
  collapseAttribution,
} from "../mapShared";
import ndviSamplesData from "../../ml/ndvi_samples.json";
import { getFact, ML_PRIMARY_SOURCES } from "../nisarKnowledge";
import {
  DIFFICULTY_PRESETS as GAME_LEVELS,
  getFireGameLevel,
  getWildlifeGameLevel,
  getMissionTime,
  formatClock,
} from "../gameDifficulty";

// Jumlah satwa per jenis misi: misi titik api = 5 satwa, misi satwa = 1
const FIRE_MISSION_ANIMALS = 5;

/* ──────────────────────────────────────────────────────────────────────────
   PETA MISI RADAR MISSION
   Duplikat peta satelit dari menu Map (data titik api & satwa yang sama),
   tetapi khusus untuk memilih misi game:
   - Klik titik api  → misi dengan tingkat kesulitan sesuai intensitas api
   - Klik satwa      → misi menyelamatkan satwa tersebut
   ────────────────────────────────────────────────────────────────────────── */

// Satwa yang punya misi di game (sesuai karakter di GamePage)
const GAME_SPECIES = {
  "bornean orangutan": { id: "bornean-orangutan", emoji: "🦧", character: "Tuki si Orangutan", characterEn: "Tuki the Orangutan" },
  "sun bear": { id: "sun-bear", emoji: "🐻", character: "Madu si Beruang Madu", characterEn: "Madu the Sun Bear" },
  "sunda pangolin": { id: "sunda-pangolin", emoji: "🦎", character: "Liku si Trenggiling", characterEn: "Liku the Pangolin" },
  "lesser mouse deer": { id: "mouse-deer", emoji: "🦌", character: "Kecil si Kancil", characterEn: "Little Deer" },
  "helmeted hornbill": { id: "helmeted-hornbill", emoji: "🦅", character: "Rangkong si Burung Enggang", characterEn: "Rangkong the Hornbill" },
};

const speciesKey = (name) => String(name || "").toLowerCase().trim();

function buildPlayUrl(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  });
  const qs = q.toString();
  return qs ? `/game/play?${qs}` : "/game/play";
}

export default function MissionMapPage() {
  const { locale } = useTranslation();
  const isId = locale === "id";
  const L = (en, id) => (isId ? id : en);
  const navigate = useNavigate();

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);
  const [webGLError, setWebGLError] = useState(false);
  // Di HP panel ditutup dulu supaya peta & pin misi langsung terlihat
  const [panelOpen, setPanelOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth >= 640,
  );
  const [region, setRegion] = useState("indonesia");
  const [selected, setSelected] = useState(null);

  const { fireEvents } = useFireData();
  const [eonetWildfires, setEonetWildfires] = useState([]);
  const [gbifOccurrences, setGbifOccurrences] = useState([]);
  // Plot NDVI dari pipeline ML (ml/pipeline.py → ml-scores.json), fallback ke ml/ndvi_samples.json
  const [ndviPlots, setNdviPlots] = useState(ndviSamplesData?.plots || []);

  useEffect(() => {
    let active = true;
    fetch("/data-source/ml-scores.json")
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
      .then((json) => {
        if (active && Array.isArray(json?.ndvi?.plots) && json.ndvi.plots.length > 0) {
          setNdviPlots(json.ndvi.plots);
        }
      });
    scrapeNasaEonetWildfires()
      .then((events) => {
        if (active && Array.isArray(events) && events.length > 0) setEonetWildfires(events);
      })
      .catch(() => {});
    fetch("/data-source/gbif-occurrences.json")
      .then((res) => (res.ok ? res.json() : []))
      .catch(() => [])
      .then((json) => {
        if (active && Array.isArray(json)) setGbifOccurrences(json);
      });
    return () => {
      active = false;
    };
  }, []);

  // Data titik api sama persis dengan menu Map (rentang 7 hari)
  const fires = useMemo(
    () =>
      buildIndonesiaFireEvents({ fireEvents, eonetWildfires, timeFilter: "7d" })
        .filteredFireEvents.map((f) => ({
          ...f,
          gameLevel: getFireGameLevel(f.frp, f.brightness),
        })),
    [fireEvents, eonetWildfires],
  );

  // Hanya satwa yang punya misi di game
  const animals = useMemo(() => {
    return buildFireTriggeredWildlifePins(fires, gbifOccurrences)
      .filter((occ) => GAME_SPECIES[speciesKey(occ.species)])
      .map((occ) => {
        const lat = Number(occ.latitude);
        const lon = Number(occ.longitude);
        let nearestFireKm = null;
        let nearestFireName = null;
        fires.forEach((f) => {
          const km = haversineKm(lat, lon, Number(f.latitude), Number(f.longitude));
          if (!Number.isNaN(km) && (nearestFireKm === null || km < nearestFireKm)) {
            nearestFireKm = Math.round(km);
            nearestFireName = f.kabupaten || f.provinsi || null;
          }
        });
        return {
          ...occ,
          game: GAME_SPECIES[speciesKey(occ.species)],
          nearestFireKm,
          nearestFireName,
          gameLevel: getWildlifeGameLevel(nearestFireKm),
        };
      });
  }, [fires, gbifOccurrences]);

  const levelCounts = useMemo(() => {
    const c = { easy: 0, medium: 0, hard: 0 };
    fires.forEach((f) => {
      c[f.gameLevel] += 1;
    });
    return c;
  }, [fires]);

  const speciesSummary = useMemo(() => {
    const map = new Map();
    animals.forEach((a) => {
      const k = speciesKey(a.species);
      if (!map.has(k)) map.set(k, { ...a.game, name: a.species, items: [] });
      map.get(k).items.push(a);
    });
    return [...map.values()];
  }, [animals]);

  const flyTo = (lon, lat, zoom = 8.5) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: [lon, lat],
      zoom: Math.max(mapRef.current.getZoom(), zoom),
      duration: 1000,
      essential: true,
    });
  };

  const selectFire = (fire) => {
    setSelected({ type: "fire", data: fire });
    flyTo(Number(fire.longitude), Number(fire.latitude));
  };

  const selectAnimal = (animal) => {
    setSelected({ type: "animal", data: animal });
    flyTo(Number(animal.longitude), Number(animal.latitude));
  };

  // Simpan handler terbaru agar listener marker tidak memakai closure lama
  const selectFireRef = useRef(selectFire);
  const selectAnimalRef = useRef(selectAnimal);
  useEffect(() => {
    selectFireRef.current = selectFire;
    selectAnimalRef.current = selectAnimal;
  });

  // Inisialisasi MapLibre (basemap satelit yang sama dengan menu Map)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return undefined;
    let resizeObserver = null;
    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: buildNasaBasemapStyle(),
        center: REGION_COORDINATES.indonesia.center,
        zoom: REGION_COORDINATES.indonesia.zoom,
        minZoom: 1.8,
        maxZoom: 16,
        attributionControl: false,
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: "NASA Worldview (EONET • MODIS/VIIRS) | H.O.M.E. Radar Mission",
        }),
        "bottom-right",
      );
      collapseAttribution(map);
      // Geser pusat peta ke kanan agar tidak tertutup panel kiri (layar lebar)
      if (mapContainerRef.current.clientWidth >= 768) {
        map.setPadding({ left: 300, top: 0, right: 0, bottom: 0 });
      }
      map.on("click", () => setSelected(null));
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => map.resize());
        resizeObserver.observe(mapContainerRef.current);
      }
      mapRef.current = map;
      setMapReady(true);
    } catch {
      setWebGLError(true);
    }
    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Pasang pin titik api (diwarnai sesuai level) & pin satwa
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    fires.forEach((fire) => {
      const lon = Number(fire.longitude);
      const lat = Number(fire.latitude);
      if (Number.isNaN(lon) || Number.isNaN(lat)) return;
      const lvl = GAME_LEVELS[fire.gameLevel];
      const big = fire.gameLevel === "hard";
      const el = document.createElement("div");
      el.style.cursor = "pointer";
      el.style.zIndex = big ? "2" : "1";
      el.title = `🔥 ${fire.kabupaten || "Hotspot"} — ${isId ? "Misi" : "Mission"} ${lvl.icon} ${isId ? lvl.labelId : lvl.labelEn}`;
      el.innerHTML = getFirePinSvg(big ? 32 : 27, big ? 38 : 32, lvl.color);
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        selectFireRef.current(fire);
      });
      markersRef.current.push(
        new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([lon, lat]).addTo(mapRef.current),
      );
    });

    animals.forEach((animal) => {
      const lon = Number(animal.longitude);
      const lat = Number(animal.latitude);
      if (Number.isNaN(lon) || Number.isNaN(lat)) return;
      const photoUrl = getWildlifePhotoUrl(animal.game.id);
      const artUrl = getWildlifeArtUrl(animal.game.id);
      const el = document.createElement("div");
      el.style.cursor = "pointer";
      el.style.zIndex = "3";
      el.title = `${animal.game.emoji} ${animal.species} — ${isId ? "Klik untuk misi penyelamatan" : "Click for a rescue mission"}`;
      el.innerHTML = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));">
          <div style="width: 38px; height: 38px; border-radius: 999px; background: #faf6ee; border: 3px solid #fbbf24; overflow: hidden;">
            <img src="${photoUrl}" alt="" onerror="this.onerror=null;this.src='${artUrl}';" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <span style="position: absolute; top: -6px; right: -8px; background: #15803d; color: #fff; font-size: 11px; padding: 1px 3px; border-radius: 999px; border: 1.5px solid #faf6ee; line-height: 1.1;">🎮</span>
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #fbbf24; margin-top: -1px;"></div>
        </div>
      `;
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        selectAnimalRef.current(animal);
      });
      markersRef.current.push(
        new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([lon, lat]).addTo(mapRef.current),
      );
    });
  }, [mapReady, fires, animals, isId]);

  const changeRegion = (key) => {
    setRegion(key);
    setSelected(null);
    const r = REGION_COORDINATES[key];
    if (mapRef.current && r) {
      mapRef.current.flyTo({ center: r.center, zoom: r.zoom, duration: 1200, essential: true });
    }
  };

  /* ── Data kartu misi yang sedang dipilih ── */
  const mission = useMemo(() => {
    if (!selected) return null;

    // Plot NDVI terdekat (≤150 km) dari pipeline ML — bukti "rumah mengecil" untuk briefing game
    const nearNdvi = (() => {
      const plot = findNearestNdviPlot(
        Number(selected.data.latitude),
        Number(selected.data.longitude),
        ndviPlots,
      );
      return plot && plot.distanceKm <= 150 ? plot : null;
    })();
    const ndviParams = nearNdvi
      ? { ndviLoc: nearNdvi.location_name, ndviB: nearNdvi.ndvi_before, ndviA: nearNdvi.ndvi_after }
      : {};

    if (selected.type === "fire") {
      const f = selected.data;
      const tempK = Math.round(Number(f.brightness) || 0);
      const frp = Number(f.frp || 0).toFixed(1);
      return {
        type: "fire",
        level: f.gameLevel,
        title: f.kabupaten || L("Wildfire Hotspot", "Titik Api"),
        subtitle: `${f.provinsi || "Indonesia"}${f.land_type ? ` · ${f.land_type}` : ""}`,
        stats: [
          { label: L("Fire energy", "Energi api"), value: `${frp} MW` },
          { label: L("Temperature", "Suhu"), value: tempK ? `${Math.round(tempK - 273.15)}°C` : "–" },
          { label: L("Date", "Tanggal"), value: f.acq_date || "LIVE" },
        ],
        goal: L(
          "Rescue all 5 animals trapped between the hotspots before time runs out.",
          "Selamatkan 5 satwa yang terjebak di antara titik api sebelum waktu habis.",
        ),
        ndvi: nearNdvi,
        url: buildPlayUrl({ mission: "fire", level: f.gameLevel, site: f.kabupaten || f.provinsi || "", frp, ...ndviParams }),
      };
    }
    const a = selected.data;
    return {
      type: "animal",
      level: a.gameLevel,
      title: isId ? a.game.character : a.game.characterEn,
      subtitle: `${a.species}${a.scientific_name ? ` (${a.scientific_name})` : ""}`,
      photo: getWildlifePhotoUrl(a.game.id),
      art: getWildlifeArtUrl(a.game.id),
      emoji: a.game.emoji,
      stats: [
        { label: L("Location", "Lokasi"), value: a.locality || a.province || "–" },
        {
          label: L("Nearest fire", "Api terdekat"),
          value: a.nearestFireKm !== null ? `±${a.nearestFireKm} km` : "–",
        },
        { label: L("Province", "Provinsi"), value: a.province || "–" },
      ],
      goal: L(
        `Find ${a.game.characterEn} hidden in the smoke and guide it back to its natural habitat.`,
        `Temukan ${a.game.character} di balik kabut asap lalu tuntun kembali ke habitat aslinya.`,
      ),
      ndvi: nearNdvi,
      url: buildPlayUrl({ mission: "animal", species: a.game.id, level: a.gameLevel, site: a.locality || a.province || "", ...ndviParams }),
    };
  }, [selected, isId, ndviPlots]); // eslint-disable-line react-hooks/exhaustive-deps

  const missionLevel = mission ? GAME_LEVELS[mission.level] : null;

  return (
    <div className="relative flex h-[calc(100vh-64px)] min-h-[620px] w-full flex-col overflow-hidden bg-[#030b14]">
      {/* Pembungkus absolut: CSS maplibre memaksa container peta ber-position relative */}
      <div className="absolute inset-0">
        <div ref={mapContainerRef} className="h-full w-full" aria-label={L("Radar Mission map", "Peta misi Radar Mission")} />
      </div>

      {webGLError && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#030b14] p-6 text-center text-cream-100">
          {L("This browser cannot display the map (WebGL unavailable).", "Browser ini tidak bisa menampilkan peta (WebGL tidak tersedia).")}
        </div>
      )}

      {/* ── PANEL KIRI: PETUNJUK & DAFTAR MISI (gaya "Field Board" menu Map) ── */}
      <div className="pointer-events-none absolute top-3 left-3 z-30 flex w-[calc(100%-1.5rem)] max-w-[300px] flex-col">
        <div className="pointer-events-auto overflow-hidden rounded-2xl border border-[#cbbba0] bg-[#f8f3e8] text-[#1d2621] shadow-[0_20px_48px_rgba(0,0,0,0.48),3px_3px_0_#ded4be]">
          {/* Header hijau hutan & kuningan */}
          <div className="relative border-b-2 border-[#c89d54]/70 bg-gradient-to-br from-[#163a28] via-[#1c4732] to-[#112d1f] px-3.5 py-2.5 text-[#faf6ee]">
            <span className="absolute top-2 left-2 h-1.5 w-1.5 rounded-full bg-[#d8b26a]/70 shadow-xs" />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#d8b26a]/70 shadow-xs" />
            <div className="flex items-center justify-between gap-2 pl-2">
              <div>
                <div className="font-mono text-[8px] font-bold tracking-[0.22em] text-[#e5c787] uppercase">
                  NASA NISAR · {L("Mission Map", "Peta Misi")}
                </div>
                <div className="font-display text-[15px] font-extrabold tracking-tight text-white">🎮 Radar Mission</div>
              </div>
              <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => navigate("/game")}
                title={L("Back to the Mission Hub", "Kembali ke Pusat Misi")}
                className="cursor-pointer rounded-full border border-[#e5c787]/50 bg-[#e5c787]/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#f5e7c6] transition-colors hover:bg-[#e5c787]/25"
              >
                ← {L("Hub", "Pusat Misi")}
              </button>
              <button
                type="button"
                onClick={() => setPanelOpen((v) => !v)}
                aria-label={panelOpen ? L("Collapse panel", "Perkecil panel") : L("Expand panel", "Buka panel")}
                className="cursor-pointer flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs font-bold text-[#faf6ee] transition-colors hover:bg-white/20"
              >
                {panelOpen ? "−" : "+"}
              </button>
              </div>
            </div>
          </div>

          {panelOpen && (
            <div
              className="max-h-[calc(100vh-180px)] divide-y divide-[#dfd4be] overflow-y-auto px-3.5 py-1 text-xs"
              style={{
                backgroundImage: "radial-gradient(rgba(140, 125, 98, 0.12) 1px, transparent 1px)",
                backgroundSize: "14px 14px",
              }}
            >
              <p className="py-2.5 leading-relaxed text-[#333d37]">
                {L(
                  "Pick a mission on the map: click a 🔥 hotspot for a mission whose difficulty matches the fire's intensity, or click an animal 🐾 to rescue it.",
                  "Pilih misi di peta: klik titik api 🔥 untuk misi dengan tingkat kesulitan sesuai intensitas apinya, atau klik satwa 🐾 untuk menyelamatkannya.",
                )}
              </p>

              {/* Wilayah */}
              <div className="py-2.5">
                <div className="mb-1.5 font-mono text-[8.5px] font-bold tracking-[0.16em] text-[#5c665f] uppercase">
                  {L("Region", "Wilayah")}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(REGION_COORDINATES).map(([key, r]) => {
                    const active = region === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => changeRegion(key)}
                        className={`cursor-pointer flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition-all ${
                          active
                            ? "border-[#1b5e3a] bg-[#18442e] font-bold text-[#faf6ee] shadow-sm"
                            : "border-[#dcd0b8] bg-white/75 font-semibold text-[#333d37] hover:border-[#b7a78a] hover:bg-white"
                        }`}
                      >
                        <span className="truncate">{r.label}</span>
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? "bg-[#e5c787]" : "bg-[#c7bba2]"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legenda level titik api */}
              <div className="py-2.5">
                <div className="mb-1.5 font-mono text-[8.5px] font-bold tracking-[0.16em] text-[#5c665f] uppercase">
                  🔥 {L("Hotspot missions", "Misi titik api")} ({fires.length})
                </div>
                <div className="space-y-1">
                  {Object.entries(GAME_LEVELS).map(([key, lvl]) => (
                    <div key={key} className="flex items-center justify-between rounded-lg border border-[#dcd0b8] bg-white/75 px-2 py-1.5">
                      <span className="flex items-center gap-2 font-bold text-[#1d2621]">
                        <span className="inline-block h-3 w-3 rounded-full border border-white shadow-xs" style={{ background: lvl.color }} />
                        {isId ? lvl.labelId : lvl.labelEn}
                      </span>
                      <span className="font-mono text-[10px] text-[#5c665f]">
                        ❤️{lvl.lives} · ⏱️{formatClock(getMissionTime(key, FIRE_MISSION_ANIMALS))} · {levelCounts[key]} {L("pins", "titik")}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-[#646e67]">
                  {L("Difficulty is based on fire radiative power (FRP) and temperature.", "Level ditentukan dari energi api (FRP) dan suhu titik api.")}
                </p>
              </div>

              {/* Daftar satwa */}
              <div className="py-2.5">
                <div className="mb-1.5 font-mono text-[8.5px] font-bold tracking-[0.16em] text-[#5c665f] uppercase">
                  🐾 {L("Animal rescue missions", "Misi penyelamatan satwa")} ({animals.length})
                </div>
                <div className="space-y-1">
                  {speciesSummary.map((sp) => (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => selectAnimal(sp.items[0])}
                      className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-[#dcd0b8] bg-white/75 px-2 py-1.5 text-left transition-all hover:border-[#b7a78a] hover:bg-white"
                    >
                      <span className="font-bold text-[#1d2621]">
                        {sp.emoji} {isId ? sp.character : sp.characterEn}
                      </span>
                      <span className="rounded-md bg-[#18442e] px-1.5 font-mono text-[10px] font-bold text-[#faf6ee]">{sp.items.length}×</span>
                    </button>
                  ))}
                  {speciesSummary.length === 0 && (
                    <div className="text-[11px] text-[#646e67]">{L("Loading animals…", "Memuat satwa…")}</div>
                  )}
                </div>
              </div>

              <div className="py-2.5">
                <button
                  type="button"
                  onClick={() => navigate("/game/play")}
                  className="w-full cursor-pointer rounded-lg border border-[#1b5e3a] bg-[#18442e] px-3 py-2 text-[12px] font-bold text-[#faf6ee] shadow-sm transition-colors hover:bg-[#1f5638]"
                >
                  🎲 {L("Free Play (all 5 animals)", "Main Mode Bebas (5 satwa)")}
                </button>
              </div>

              {/* Sains radar & sumber — dari dokumen scraping ml/source */}
              <div className="py-2.5 text-[10.5px] leading-snug text-[#333d37]">
                <div className="mb-1 font-mono text-[8.5px] font-bold tracking-[0.16em] text-[#1b5e3a] uppercase">
                  📡 {L("Why radar?", "Kenapa radar?")}
                </div>
                {getFact("lband", isId).text} {getFact("canopy", isId).text}
                <div className="mt-1.5 font-mono text-[9px] text-[#646e67]">
                  {L("Sources", "Sumber")}:{" "}
                  {ML_PRIMARY_SOURCES.map((src, i) => (
                    <span key={src.file}>
                      {i > 0 && " · "}
                      <a href={src.url} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:text-[#1d2621]">
                        {src.title}
                      </a>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── KARTU BRIEFING MISI (gaya buku catatan spiral menu Map) ── */}
      {mission && missionLevel && (
        <div className="pointer-events-none absolute right-3 bottom-10 z-30 flex items-start sm:top-3 sm:bottom-auto">
          <div className="pointer-events-auto relative flex w-[calc(100vw-1.5rem)] max-w-[340px] rounded-l-lg rounded-r-2xl border border-[#d6cbb5] bg-[#faf6ee] text-[#1e2621] shadow-[0_20px_50px_rgba(0,0,0,0.55),4px_4px_0_#e5dcc8,8px_8px_0_rgba(20,28,24,0.35)]">
            {/* Jilid spiral */}
            <div
              aria-hidden="true"
              className="flex w-6 shrink-0 flex-col items-center justify-evenly rounded-l-lg border-r border-[#dfd5c0] bg-[#f1eadc] py-3"
            >
              {Array.from({ length: 10 }).map((_, idx) => (
                <div key={idx} className="relative flex w-full items-center justify-center">
                  <span className="h-2.5 w-2.5 rounded-full border border-[#bcae94] bg-[#2a332e] shadow-inner" />
                  <span className="absolute -left-2 h-1.5 w-4.5 rounded-full bg-gradient-to-b from-slate-200 via-slate-400 to-slate-600 shadow-xs" />
                </div>
              ))}
            </div>

            {/* Halaman bergaris */}
            <div
              className="max-h-[calc(100vh-155px)] min-w-0 flex-1 overflow-y-auto p-3.5"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to bottom, transparent, transparent 23px, rgba(163, 149, 124, 0.16) 24px)",
              }}
            >
              {/* Header catatan */}
              <div className="flex items-start gap-2.5 border-b-2 border-[#983226]/25 pb-2">
                {mission.type === "animal" ? (
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 border-[#15803d]/40 bg-[#f4efe3] shadow-xs">
                    <img
                      src={mission.photo}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = mission.art;
                      }}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl shadow-xs"
                    style={{ background: `${missionLevel.color}1f`, border: `2px solid ${missionLevel.color}66` }}
                  >
                    🔥
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[8.5px] font-bold tracking-[0.18em] text-[#1b5e3a] uppercase">
                    {mission.type === "fire" ? L("Hotspot mission", "Misi titik api") : L("Rescue mission", "Misi penyelamatan")}
                  </div>
                  <h2 className="mt-0.5 truncate font-display text-[15px] font-extrabold tracking-tight text-[#1a221d]">
                    {mission.type === "animal" && `${mission.emoji} `}
                    {mission.title}
                  </h2>
                  <p className="truncate text-[10.5px] font-medium text-[#5c665f]">{mission.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label={L("Close", "Tutup")}
                  className="cursor-pointer flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#cfc3aa] bg-[#f2ebdc] text-xs font-bold text-[#3d4741] transition-colors hover:bg-[#e7decb]"
                >
                  ×
                </button>
              </div>

              <div className="mt-2.5 space-y-2.5 text-xs">
                <div className="grid grid-cols-3 gap-1.5">
                  {mission.stats.map((s) => (
                    <div key={s.label} className="rounded-lg border border-[#d6cbb5] bg-white/80 px-2 py-1.5">
                      <div className="font-mono text-[8px] font-bold uppercase tracking-wider text-[#646e67]">{s.label}</div>
                      <div className="truncate font-bold text-[#1d2621]" title={s.value}>
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-[#d6cbb5] bg-white/80 px-2.5 py-2">
                  <span className="font-bold text-[#1d2621]">
                    {L("Difficulty", "Tingkat kesulitan")}:{" "}
                    <span style={{ color: missionLevel.color }}>
                      {missionLevel.icon} {isId ? missionLevel.labelId : missionLevel.labelEn}
                    </span>
                  </span>
                  <div className="mt-1 font-mono text-[10px] text-[#4a554e]">
                    ❤️ {missionLevel.lives} · ⏱️ {formatClock(getMissionTime(mission.level, mission.type === "fire" ? FIRE_MISSION_ANIMALS : 1))} · 🔥 {missionLevel.hotspotIds.length} {L("fires", "titik api")} · 📡 {missionLevel.radar}x
                  </div>
                </div>

                {mission.ndvi && (
                  <div className="rounded-lg border border-[#cfe0d4] bg-[#f1f8f3] px-2.5 py-2">
                    <div className="font-bold text-[#24402d]">
                      🌿 {L("Greenness (NDVI)", "Kehijauan (NDVI)")} · {mission.ndvi.location_name}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-[#1d2621]">
                      {mission.ndvi.ndvi_before} → {mission.ndvi.ndvi_after}{" "}
                      <span className={mission.ndvi.delta <= -0.15 ? "font-bold text-[#b91c1c]" : "font-bold text-[#b45309]"}>
                        (Δ {mission.ndvi.delta})
                      </span>{" "}
                      <span className="text-[#646e67]">
                        {mission.ndvi.before_window} → {mission.ndvi.after_window} · ±{mission.ndvi.distanceKm} km
                      </span>
                    </div>
                    <div className="mt-0.5 text-[9.5px] text-[#646e67]">
                      {L(
                        "ML pipeline (ml/pipeline.py) worked example — not a direct NASA download.",
                        "Contoh kerja pipeline ML (ml/pipeline.py) — bukan unduhan langsung NASA.",
                      )}
                    </div>
                  </div>
                )}

                <p className="leading-relaxed text-[#333d37]">🎯 {mission.goal}</p>

                <button
                  type="button"
                  onClick={() => navigate(mission.url)}
                  className="w-full cursor-pointer rounded-lg border border-[#7f2a1f] bg-[#983226] px-4 py-2.5 text-[13px] font-extrabold text-white shadow-sm transition-colors hover:bg-[#a83a2c] active:scale-[0.98]"
                >
                  ▶ {mission.type === "fire" ? L("Start Mission", "Mulai Misi") : L("Start Rescue Mission", "Mulai Misi Penyelamatan")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
