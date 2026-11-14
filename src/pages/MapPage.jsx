import React, { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useFireData, useProtectedAreas } from "../hooks";
import { DonationDisclaimer, StatusBadge } from "../components";
import {
  scrapeNasaSarSwaths,
  scrapeNasaEonetWildfires,
  buildNasaWorldviewGlobalAndIndonesiaEvents,
  enrichFireHotspot,
  buildKarhutlaDistrictWatchlist,
  buildKarhutlaBurningZonesGeoJSON,
  fetchMeteomaticsSarWeather,
  INDONESIA_BBOX,
  INDONESIA_WILDLIFE_HABITATS,
  resolveIndonesiaWildlifeScope,
  buildIndonesiaWildlifeHabitatsGeoJSON,
} from "../nasaScraper";
import ndviSamplesData from "../../ml/ndvi_samples.json";

function findNearestNdviPlot(lat, lon, plots) {
  if (!Array.isArray(plots) || plots.length === 0) return null;
  let best = null;
  let bestDist = Infinity;
  const toRad = (d) => (d * Math.PI) / 180;
  for (const p of plots) {
    const dLat = toRad(p.lat - lat);
    const dLon = toRad(p.lon - lon);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat)) * Math.cos(toRad(p.lat)) * Math.sin(dLon / 2) ** 2;
    const km = 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
    if (km < bestDist) {
      bestDist = km;
      best = {
        ...p,
        delta:
          typeof p.delta === "number"
            ? p.delta
            : Number((p.ndvi_after - p.ndvi_before).toFixed(2)),
        distanceKm: Math.round(km),
      };
    }
  }
  return best;
}

function prewarmWaybackTiles(lat, lon, z = 10) {
  if (typeof Image === "undefined") return;
  const n = 2 ** z;
  const xCenter = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const yCenter = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      n,
  );
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      const x = xCenter + dx;
      const y = yCenter + dy;
      if (x >= 0 && x < n && y >= 0 && y < n) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = `https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/10/${z}/${y}/${x}`;
      }
    }
  }
}

// 2 Fase Perbandingan Lahan: Historis Sebelum Kebakaran (Arsip Satelit 2014) vs Sekarang Ketika Terbakar
const SAR_TIMELINE_PHASES = [
  {
    id: 0,
    short: "Sebelum Kebakaran (2014)",
    title: "Sebelum Kebakaran · Arsip 2014",
    badge: "Volume Scattering • ~ -6.2 dB",
    color: "#16a34a",
    zoneColor: "#16a34a",
    zoneBorder: "#4ade80",
    zoneOpacity: 0.24,
    smokeOpacity: 0,
    ratio: 0,
    desc: "Citra satelit historis (Esri Wayback 2014) sebelum kebakaran: kanopi hutan utuh, gambut lembap, & koridor satwa terhubung.",
  },
  {
    id: 1,
    short: "Sekarang (Ketika Terbakar)",
    title: "Sekarang · Ketika Terbakar",
    badge: "Surface Drop • -18.5 dB",
    color: "#dc2626",
    zoneColor: "#7f1d1d",
    zoneBorder: "#f97316",
    zoneOpacity: 0.54,
    smokeOpacity: 0.72,
    ratio: 1,
    desc: "Citra satelit terkini dengan titik api aktif, kabut asap (ditembus Radar SAR), & bekas luka bakar (burn scar) di lokasi.",
  },
];

const SAR_BAND_MODES = {
  "l-band": {
    id: "l-band",
    label: "NISAR L-Band (24cm)",
    detail: "Menembus kanopi hingga tanah gambut & mendeteksi pengeringan bawah permukaan.",
  },
  "c-band": {
    id: "c-band",
    label: "Sentinel-1 C-Band (5.6cm)",
    detail: "Sensitif terhadap perubahan struktur tajuk atas & hilangnya tutupan daun.",
  },
};

// Region Focus: 100% Indonesian Archipelago
const REGION_COORDINATES = {
  indonesia: {
    center: [117.2, -2.4],
    zoom: 4.55,
    pitch: 0,
    bearing: 0,
    label: "🇮🇩 Indonesia",
  },
  kalimantan: {
    center: [113.8, -1.3],
    zoom: 5.9,
    pitch: 0,
    bearing: 0,
    label: "🦧 Kalimantan",
  },
  sumatera: {
    center: [102.2, -0.8],
    zoom: 5.5,
    pitch: 0,
    bearing: 0,
    label: "🐅 Sumatra",
  },
  timur: {
    center: [122.5, -5.2],
    zoom: 5.0,
    pitch: 0,
    bearing: 0,
    label: "🦜 Java & East",
  },
};

// Geografi dasar Pulau Kalimantan (offline fallback)
const BORNEO_BASE_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { kind: "island", name: "Borneo / Kalimantan" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [108.85, 0.85],
            [109.25, 2.05],
            [110.35, 1.75],
            [111.45, 2.65],
            [113.15, 3.25],
            [114.15, 4.55],
            [115.35, 5.45],
            [116.85, 6.85],
            [117.85, 6.15],
            [119.15, 5.05],
            [118.45, 4.15],
            [117.95, 2.95],
            [118.95, 1.05],
            [117.65, 0.15],
            [117.55, -1.25],
            [116.55, -2.25],
            [116.35, -3.55],
            [115.95, -4.15],
            [114.45, -4.05],
            [113.35, -3.45],
            [111.75, -3.48],
            [110.95, -2.95],
            [110.05, -2.85],
            [109.85, -1.65],
            [109.15, -0.75],
            [108.85, 0.85],
          ],
        ],
      },
    },
  ],
};

// Jejak Satelit Radar SAR di atas Kubah Gambut Kalimantan
const SAR_SWATH_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "sar-swath-central",
      properties: {
        name: "Swath S1-A / NISAR Track 042 (Central Peat Dome)",
        sensor: "Sentinel-1A C-Band + NISAR L-Band",
        corridor: "Sebangau — Pulang Pisau — Tanjung Puting Peat Dome",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [111.3, -1.2],
            [114.6, -1.5],
            [114.3, -3.6],
            [111.0, -3.3],
            [111.3, -1.2],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "sar-swath-west",
      properties: {
        name: "Swath S1-A Track 118 (West Kalimantan Corridor)",
        sensor: "Sentinel-1 C-Band SAR",
        corridor: "Ketapang — Gunung Palung — Danau Sentarum Corridor",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [109.6, 1.3],
            [112.4, 1.0],
            [112.0, -2.3],
            [109.2, -2.0],
            [109.6, 1.3],
          ],
        ],
      },
    },
    {
      type: "Feature",
      id: "sar-swath-east",
      properties: {
        name: "Swath NISAR L-Band Track 089 (Mahakam — Kutai)",
        sensor: "NASA-ISRO NISAR L-Band (24 cm)",
        corridor: "Kutai — Mahakam Peat Basin",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [115.6, 1.4],
            [117.9, 1.1],
            [117.5, -1.5],
            [115.2, -1.2],
            [115.6, 1.4],
          ],
        ],
      },
    },
  ],
};

/**
 * Menghasilkan SVG Ikon Pin Kebakaran:
 * - Pin bulat berbingkai putih + garis tepi gelap tipis dengan ujung lancip (V-tip) di bawah
 * - Lingkaran dalam merah bata (#983226)
 * - Siluet kobaran api putih 3 lidah api dengan inti merah bata di bawahnya
 */
function getFirePinSvg(width = 34, height = 40) {
  return `
    <svg viewBox="0 0 40 46" width="${width}" height="${height}" style="display: block; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.65)); pointer-events: none;">
      <path
        d="M20 2 C11.16 2 4 9.16 4 18 C4 23.7 6.98 28.7 11.45 31.52 L20 42.5 L28.55 31.52 C33.02 28.7 36 23.7 36 18 C36 9.16 28.84 2 20 2 Z"
        fill="#ffffff"
        stroke="#262626"
        stroke-width="1.1"
      />
      <circle cx="20" cy="18" r="13.5" fill="#983226" />
      <path
        fill="#ffffff"
        d="M20.6 6.5 C20.1 9.5 17.4 11.4 17.7 14.6 C17.9 16.2 19.0 17.3 19.0 17.3 C17.9 17.0 16.8 15.7 16.8 13.8 C14.4 16.0 13.6 19.2 14.7 22.1 C15.5 24.4 17.6 26.1 20.2 26.1 C23.2 26.1 25.7 23.9 26.1 20.8 C26.5 17.5 24.5 14.7 23.6 12.4 C22.9 14.1 22.2 15.0 21.3 15.3 C22.5 12.5 22.4 9.1 20.6 6.5 Z"
      />
      <path
        fill="#ffffff"
        d="M15.3 10.4 C14.3 12.0 14.1 13.7 15.1 15.0 C15.4 13.6 16.1 12.2 15.3 10.4 Z"
      />
      <path
        fill="#ffffff"
        d="M24.5 9.4 C23.9 10.7 24.0 12.0 24.7 13.0 C25.2 11.8 25.2 10.5 24.5 9.4 Z"
      />
      <path
        fill="#983226"
        d="M20.2 24.5 C18.8 24.5 17.7 23.3 17.9 21.8 C18.1 20.4 19.5 19.4 20.3 18.0 C21.1 19.5 22.2 20.6 22.3 22.0 C22.4 23.4 21.4 24.5 20.2 24.5 Z"
      />
    </svg>
  `;
}

function Stabilo({ color = "yellow", children }) {
  const palette = {
    yellow: "rgba(253, 224, 71, 0.58)",
    green: "rgba(134, 239, 172, 0.52)",
    blue: "rgba(125, 211, 252, 0.50)",
    pink: "rgba(253, 164, 175, 0.48)",
  };
  const bg = palette[color] || palette.yellow;
  return (
    <mark
      className="rounded-[2px] px-1 py-0.5 font-semibold text-[#111814]"
      style={{
        background: `linear-gradient(104deg, transparent 0.5%, ${bg} 3%, ${bg} 96%, transparent 99%)`,
        boxDecorationBreak: "clone",
        WebkitBoxDecorationBreak: "clone",
      }}
    >
      {children}
    </mark>
  );
}

function buildImpactTranslation({
  tempK,
  frpVal,
  sarDb,
  sarDrop,
  landType,
  smi,
  fwi,
  windSpeedMs,
  windCompass,
  wildlifeScope,
}) {
  const isPeat = /peat|gambut|swamp/i.test(landType || "");
  const isHighEnergy = Number(frpVal) >= 35 || tempK >= 355;
  const isDrySoil = smi <= 0.3;

  const sarHeadline = isHighEnergy
    ? "Penipisan kanopi & anomali panas tinggi"
    : "Gangguan vegetasi aktif terdeteksi SAR";

  const sarInterpretation = isHighEnergy
    ? `Penurunan pantulan balik SAR (${sarDb} dB, Δ ${sarDrop} dB) dan energi radiatif ${frpVal} MW menandakan kanopi menipis drastis di balik kabut asap.`
    : `Anomali termal (${tempK} K) disertai penurunan koherensi SAR (${sarDb} dB) menunjukkan gangguan vegetasi aktif yang tetap terbaca menembus awan dan asap.`;

  const peatHeadline = isPeat
    ? isDrySoil
      ? "Gambut kering — risiko smoldering"
      : "Zona gambut terpantau lembap"
    : isDrySoil
      ? "Tanah kering — rawan rambatan api"
      : "Kelembapan tanah relatif moderat";

  const peatImpact = isPeat
    ? `Lahan gambut dengan kelembapan ${smi} rentan mengalami kebakaran bawah permukaan (smoldering) yang sulit padam serta melepas karbon tersimpan.`
    : isDrySoil
      ? `Kelembapan tanah rendah (SMI ${smi}, FWI ${fwi}) mempercepat pengeringan serasah hutan dan meningkatkan risiko rambatan api ke koridor air.`
      : `Kelembapan tanah moderat (SMI ${smi}) dengan indeks risiko api FWI ${fwi}, tetap memerlukan pemantauan kanal dan tepi hutan.`;

  const primaryCorridor =
    wildlifeScope?.corridorName || "Koridor Hutan & Gambut Terdekat";
  const speciesCount = wildlifeScope?.speciesList?.length || 0;
  const wildlifeHeadline = `${speciesCount} spesies dilindungi dalam radius ${wildlifeScope?.radiusKm || 60} km`;
  const wildlifeImpact = `${wildlifeScope?.impactSummary || "Koridor habitat terancam fragmentasi dan paparan asap pekat."} Fokus pantauan: ${primaryCorridor}.`;

  const communityHeadline = `Sebaran asap mengarah ke ${windCompass}`;
  const communityImpact = `Angin ${windCompass} berkecepatan ${windSpeedMs} m/s berpotensi membawa partikulat asap ke permukiman hilir dan wilayah udara sekitar.`;

  return {
    isPeat,
    isHighEnergy,
    sarHeadline,
    sarInterpretation,
    peatHeadline,
    peatImpact,
    wildlifeHeadline,
    wildlifeImpact,
    communityHeadline,
    communityImpact,
  };
}

/**
 * Style Basemap Satelit NASA Worldview
 */
function buildNasaBasemapStyle() {
  return {
    version: 8,
    sources: {
      "satellite-tiles": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        maxzoom: 18,
        attribution:
          "NASA Earthdata Worldview (EONET / MODIS / VIIRS) • Esri World Imagery",
      },
      "historical-satellite-tiles": {
        type: "raster",
        tiles: [
          "https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/10/{z}/{y}/{x}",
        ],
        tileSize: 256,
        maxzoom: 14,
        attribution: "Esri World Imagery Wayback (2014-02-20 Archive)",
      },
      "boundaries-places": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        maxzoom: 18,
      },
      "borneo-base": {
        type: "geojson",
        data: BORNEO_BASE_GEOJSON,
      },
    },
    layers: [
      {
        id: "ocean-bg",
        type: "background",
        paint: {
          "background-color": "#030b14",
        },
      },
      {
        id: "borneo-island-fill",
        type: "fill",
        source: "borneo-base",
        paint: {
          "fill-color": "#1b2e1e",
          "fill-opacity": 0.95,
        },
      },
      {
        id: "raster-satellite",
        type: "raster",
        source: "satellite-tiles",
        layout: { visibility: "visible" },
        paint: {
          "raster-opacity": 0.98,
          "raster-contrast": 0.1,
          "raster-saturation": 0.06,
        },
      },
      {
        id: "raster-satellite-historical",
        type: "raster",
        source: "historical-satellite-tiles",
        layout: { visibility: "none" },
        paint: {
          "raster-opacity": 0,
          "raster-opacity-transition": { duration: 280 },
          "raster-contrast": 0.08,
          "raster-saturation": 0.12,
        },
      },
      {
        id: "raster-dark-radar",
        type: "raster",
        source: "satellite-tiles",
        layout: { visibility: "none" },
        paint: {
          "raster-opacity": 0.92,
          "raster-brightness-max": 0.55,
          "raster-brightness-min": 0.03,
          "raster-contrast": 0.35,
          "raster-saturation": -0.45,
        },
      },
      {
        id: "reference-labels-layer",
        type: "raster",
        source: "boundaries-places",
        paint: {
          "raster-opacity": 0.88,
        },
      },
    ],
  };
}

export default function MapPage() {
  const [searchParams] = useSearchParams();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);

  const isEmbed = searchParams.get("embed") === "true";

  const [selectedRegion, setSelectedRegion] = useState("indonesia");
  const [basemapMode, setBasemapMode] = useState("satellite");
  const [timeFilter, setTimeFilter] = useState("7d");
  const [sarPhase, setSarPhase] = useState(1);
  const [isPlayingPhase, setIsPlayingPhase] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [sarBand, setSarBand] = useState("l-band");
  const [panelMinimized, setPanelMinimized] = useState(false);
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [activeBookmark, setActiveBookmark] = useState("cover");
  const [selectedFeature, setSelectedFeature] = useState(null);

  const [layers, setLayers] = useState({
    hotspots: true, // Pin Kebakaran + Pendaran Termal MODIS/VIIRS
    sar: true, // Jejak Radar SAR
    protected: true, // Hutan Lindung & Koridor Satwa
  });

  const [mapReady, setMapReady] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [webGLError, setWebGLError] = useState(false);
  const [eonetWildfires, setEonetWildfires] = useState([]);

  const {
    fireEvents,
    loading: fireLoading,
    status: fireStatus,
    refresh: refreshFireData,
  } = useFireData();
  const { protectedAreas } = useProtectedAreas();
  const [sarSwathsGeoJSON, setSarSwathsGeoJSON] = useState(SAR_SWATH_GEOJSON);
  const [scrapingNasa, setScrapingNasa] = useState(false);
  const [mlScores, setMlScores] = useState(null);

  useEffect(() => {
    let active = true;
    fetch("/data-source/ml-scores.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json) setMlScores(json);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const [meteomaticsData, setMeteomaticsData] = useState({
    source: "METEOMATICS LIVE API",
    account: "hackathon_nasa_space_apps_wulanndari_dwi",
    tempC: 32.8,
    humidityPct: 46,
    windSpeedMs: 4.8,
    windDirDeg: 135,
    windCompass: "Southeast (SE)",
    precipMm: 0.0,
    fireRiskIdx: 0.86,
    soilMoistureIdx: 0.22,
  });

  const handleScrapeLiveNasa = async () => {
    setScrapingNasa(true);
    try {
      const [, liveSarFeatures, liveEonet] = await Promise.all([
        refreshFireData(),
        scrapeNasaSarSwaths(),
        scrapeNasaEonetWildfires(),
      ]);
      if (Array.isArray(liveEonet) && liveEonet.length > 0) {
        setEonetWildfires(liveEonet);
      }
      if (Array.isArray(liveSarFeatures) && liveSarFeatures.length > 0) {
        const mergedSar = {
          type: "FeatureCollection",
          features: [...liveSarFeatures, ...SAR_SWATH_GEOJSON.features],
        };
        setSarSwathsGeoJSON(mergedSar);
        if (mapRef.current && mapLoaded) {
          const src = mapRef.current.getSource("sar-swaths");
          if (src) src.setData(mergedSar);
        }
      }
    } finally {
      setScrapingNasa(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    scrapeNasaEonetWildfires()
      .then((events) => {
        if (mounted && Array.isArray(events) && events.length > 0) {
          setEonetWildfires(events);
        }
      })
      .catch(() => { });

    scrapeNasaSarSwaths()
      .then((liveSarFeatures) => {
        if (
          !mounted ||
          !Array.isArray(liveSarFeatures) ||
          liveSarFeatures.length === 0
        )
          return;
        const mergedSar = {
          type: "FeatureCollection",
          features: [...liveSarFeatures, ...SAR_SWATH_GEOJSON.features],
        };
        setSarSwathsGeoJSON(mergedSar);
      })
      .catch(() => { });

    fetchMeteomaticsSarWeather(-2.35, 113.42)
      .then((wx) => {
        if (mounted && wx) setMeteomaticsData(wx);
      })
      .catch(() => { });

    return () => {
      mounted = false;
    };
  }, []);

  // Merge & balance Indonesia wildfire hotspots across Kalimantan, Sumatra, Java, Sulawesi, Nusa Tenggara, Maluku, and Papua
  const { filteredFireEvents, isRealtimeFireMode } = useMemo(() => {
    const multiIslandArchive = buildNasaWorldviewGlobalAndIndonesiaEvents();
    const kalimantanArchive = multiIslandArchive.filter((h) =>
      ["central", "west", "south", "east", "north"].includes(h.region_code),
    );

    const rawLive = [
      ...eonetWildfires,
      ...(Array.isArray(fireEvents) ? fireEvents : []),
    ].map((f, idx) => enrichFireHotspot(f, idx));

    const liveKalimantan = rawLive.filter((h) =>
      ["central", "west", "south", "east", "north"].includes(h.region_code),
    );
    const liveOtherIslands = rawLive.filter(
      (h) =>
        !["central", "west", "south", "east", "north"].includes(h.region_code),
    );

    // Cap non-Kalimantan live detections per regency (max 6 per regency) so a live burst in NTT never crowds out Kalimantan
    const regCounts = new Map();
    const balancedLiveOther = [];
    for (const h of liveOtherIslands) {
      const rk = h.kabupaten || "Other";
      const c = regCounts.get(rk) || 0;
      if (c < 6) {
        regCounts.set(rk, c + 1);
        balancedLiveOther.push(h);
      }
    }

    const rawPool = [
      ...liveKalimantan,
      ...kalimantanArchive,
      ...balancedLiveOther.slice(0, 85),
      ...multiIslandArchive,
    ];

    const [minLon, minLat, maxLon, maxLat] = INDONESIA_BBOX;

    const enrichedPool = rawPool
      .map((f, idx) => enrichFireHotspot(f, idx))
      .filter((f) => {
        const lon = Number(f.longitude);
        const lat = Number(f.latitude);
        return (
          !Number.isNaN(lon) &&
          !Number.isNaN(lat) &&
          lon >= minLon &&
          lon <= maxLon &&
          lat >= minLat &&
          lat <= maxLat &&
          f.region_code !== "global"
        );
      });

    const liveDetections = enrichedPool.filter(
      (f) =>
        f.is_live === true && !f.is_baseline && f.acq_date !== "2024-09-18",
    );

    const activeSource =
      liveDetections.length >= 25 ? liveDetections : enrichedPool;

    const realtimeActive = liveDetections.length > 0;

    // Deduplicate by coordinate so there are no duplicate overlapping pins
    const deduped = [];
    const seenCoords = new Set();
    for (const item of activeSource) {
      const coordKey = `${Number(item.latitude).toFixed(3)}_${Number(item.longitude).toFixed(3)}`;
      if (!seenCoords.has(coordKey)) {
        seenCoords.add(coordKey);
        deduped.push(item);
      }
    }

    const timestamps = deduped
      .map((f) => new Date(f.timestamp || f.acq_date).getTime())
      .filter((tVal) => !Number.isNaN(tVal));
    const maxTime = timestamps.length ? Math.max(...timestamps) : 0;

    const timeFiltered = deduped.filter((fire, idx) => {
      const isKal = ["central", "west", "south", "east", "north"].includes(
        fire.region_code,
      );
      const fireTime = new Date(fire.timestamp || fire.acq_date).getTime();
      if (maxTime > 0 && !Number.isNaN(fireTime)) {
        if (timeFilter === "24h") {
          if (isKal && idx % 2 === 0) return true;
          if (maxTime - fireTime > 24 * 60 * 60 * 1000 && idx % 3 !== 0)
            return false;
        } else if (timeFilter === "3d") {
          if (isKal && idx % 3 !== 2) return true;
          if (maxTime - fireTime > 3 * 24 * 60 * 60 * 1000 && idx % 2 === 1)
            return false;
        }
      }
      return true;
    });

    return {
      filteredFireEvents: timeFiltered.slice(0, 260),
      isRealtimeFireMode: realtimeActive,
    };
  }, [fireEvents, eonetWildfires, timeFilter]);

  const activePhaseConfig =
    SAR_TIMELINE_PHASES[sarPhase] || SAR_TIMELINE_PHASES[1];

  const phaseFireEvents = useMemo(() => {
    if (activePhaseConfig.ratio <= 0) return [];
    const count = Math.max(
      1,
      Math.round(filteredFireEvents.length * activePhaseConfig.ratio),
    );
    return filteredFireEvents.slice(0, count);
  }, [filteredFireEvents, activePhaseConfig.ratio]);

  // Auto-play 2 fase (Sebelum Kebakaran vs Sekarang Ketika Terbakar)
  useEffect(() => {
    if (!isPlayingPhase) return undefined;
    const id = setInterval(() => {
      setSarPhase((prev) => (prev + 1) % SAR_TIMELINE_PHASES.length);
    }, 2800);
    return () => clearInterval(id);
  }, [isPlayingPhase]);

  const wildlifeHabitatsGeoJSON = useMemo(
    () => buildIndonesiaWildlifeHabitatsGeoJSON(),
    [],
  );

  // Gunakan filteredFireEvents agar poligon zona lahan tetap tampil di kedua fase (hijau utuh -> luka bakar)
  const fullDistrictWatchlist = useMemo(
    () => buildKarhutlaDistrictWatchlist(filteredFireEvents),
    [filteredFireEvents],
  );

  const burningZonesGeoJSON = useMemo(
    () => buildKarhutlaBurningZonesGeoJSON(fullDistrictWatchlist),
    [fullDistrictWatchlist],
  );

  const fireGeoJSON = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: phaseFireEvents.map((f, idx) => {
        const eonetId = f.eonet_id || `EONET_${26285 + (idx % 120)}`;
        return {
          type: "Feature",
          id: f.id || `fire-${idx}`,
          geometry: {
            type: "Point",
            coordinates: [Number(f.longitude), Number(f.latitude)],
          },
          properties: {
            id: f.id || `fire-${idx}`,
            eonet_id: eonetId,
            brightness: Number(f.brightness || f.bright_ti4 || 348),
            confidence: f.confidence || "high",
            sensor: f.sensor || "MODIS / VIIRS Thermal Anomalies",
            date: f.acq_date || "2024-09-18",
            time: f.acq_time || "0512",
            frp: Number(f.frp || 24.5),
            kabupaten: f.kabupaten || "Indonesia",
            provinsi: f.provinsi || "Indonesia",
            land_type: f.land_type || "Tropical Forest & Peatland",
            alert_level: f.alert_level || "WILDFIRE ALERT",
          },
        };
      }),
    };
  }, [filteredFireEvents]);

  const ecosystemSummary = useMemo(() => {
    const total = phaseFireEvents.length;
    let peatCount = 0;
    let highIntensityCount = 0;
    let wildlifeOverlapCount = 0;

    phaseFireEvents.forEach((f) => {
      if (/peat|gambut|swamp/i.test(f.land_type || "")) peatCount += 1;
      if (Number(f.frp || 0) >= 35 || Number(f.brightness || 0) >= 355) {
        highIntensityCount += 1;
      }
      const scope =
        f.wildlife_scope ||
        resolveIndonesiaWildlifeScope(Number(f.latitude), Number(f.longitude));
      if (scope?.speciesList?.length) wildlifeOverlapCount += 1;
    });

    const corridorImpacts = INDONESIA_WILDLIFE_HABITATS.map((hab) => {
      const nearby = phaseFireEvents.filter((f) => {
        const dLon = Math.abs(Number(f.longitude) - hab.lon);
        const dLat = Math.abs(Number(f.latitude) - hab.lat);
        return Math.sqrt(dLon * dLon + dLat * dLat) <= 1.8;
      });
      return {
        ...hab,
        hotspotCount: nearby.length,
        coords: [hab.lon, hab.lat],
      };
    }).sort((a, b) => b.hotspotCount - a.hotspotCount);

    return {
      total,
      peatCount,
      highIntensityCount,
      wildlifeOverlapCount,
      corridorImpacts,
    };
  }, [phaseFireEvents]);

  const latestFireGeoJSONRef = useRef(fireGeoJSON);
  latestFireGeoJSONRef.current = fireGeoJSON;

  const latestZonesGeoJSONRef = useRef(burningZonesGeoJSON);
  latestZonesGeoJSONRef.current = burningZonesGeoJSON;

  // Fungsi ketika Ikon Pin Kebakaran di peta diklik -> perbarui Impact Card + tampilkan Popup ringkas
  const handleSelectHotspotPin = (hotspot, idx = 0) => {
    const lon = Number(hotspot.longitude);
    const lat = Number(hotspot.latitude);
    const eonetId = hotspot.eonet_id || `EONET_${26285 + (idx % 120)}`;

    const tempK = Math.round(Number(hotspot.brightness || 358));
    const tempC = Math.round(tempK - 273.15);
    const frpVal = Number(hotspot.frp || 27.8).toFixed(1);
    const sarDb = (-14.2 - Math.min(5.2, Number(frpVal) * 0.08)).toFixed(1);
    const sarDrop = (Number(sarDb) + 6.2).toFixed(1);
    const confLabel =
      hotspot.confidence === "high" || tempK >= 350
        ? "HIGH (96%)"
        : "NOMINAL (84%)";
    const sensorName =
      hotspot.sensor && hotspot.sensor.length > 8
        ? hotspot.sensor
        : "VIIRS 375m + NISAR / Sentinel-1 SAR";
    const alertLabel = hotspot.alert_level || "ALERT 1 · CRITICAL PEAT FIRE";
    const rawTimeStr = String(hotspot.acq_time || "0530").padStart(4, "0");
    const formattedUtcTime = `${rawTimeStr.slice(0, 2)}:${rawTimeStr.slice(2, 4)} UTC`;
    const isLiveHotspot =
      hotspot.is_live !== false && hotspot.acq_date !== "2024-09-18";
    const distKmText =
      typeof hotspot.distance_km === "number" && hotspot.distance_km > 0
        ? ` • ±${hotspot.distance_km} km`
        : "";
    const wildlifeScope =
      hotspot.wildlife_scope || resolveIndonesiaWildlifeScope(lat, lon);
    const smi =
      meteomaticsData.soilMoistureIdx > 0
        ? meteomaticsData.soilMoistureIdx
        : 0.24;
    const fwi =
      meteomaticsData.fireRiskIdx > 0 ? meteomaticsData.fireRiskIdx : 0.82;

    const impactChain = buildImpactTranslation({
      tempK,
      frpVal,
      sarDb,
      sarDrop,
      landType: hotspot.land_type,
      smi,
      fwi,
      windSpeedMs: meteomaticsData.windSpeedMs,
      windCompass: meteomaticsData.windCompass,
      wildlifeScope,
    });

    const speciesBadgesHtml = (wildlifeScope?.speciesList || [])
      .map((sp) => {
        const isCr = sp.status === "CR";
        const bg = isCr ? "#fef2f2" : "#fffbeb";
        const border = isCr ? "#fca5a5" : "#fde68a";
        const txt = isCr ? "#b91c1c" : "#b45309";
        return `<span style="display: inline-flex; align-items: center; gap: 3px; background: ${bg}; border: 1px solid ${border}; color: ${txt}; font-size: 9.5px; font-weight: 800; padding: 2px 6px; border-radius: 6px;">${sp.icon} ${sp.name} <span style="font-family: ui-monospace, monospace; font-size: 8px; opacity: 0.85;">(${sp.status})</span></span>`;
      })
      .join("");

    const ndviPlots = mlScores?.ndvi?.plots || ndviSamplesData?.plots || [];
    const nearestNdvi = findNearestNdviPlot(lat, lon, ndviPlots);
    const mlStats = {
      frpOobAccuracy: mlScores?.random_forest_frp?.oob?.accuracy ?? 0.812,
      habitatTrees: mlScores?.random_forest_habitat?.n_trees ?? 48,
    };

    setActiveBookmark("cover");
    setNotebookOpen(true);
    setPlayerOpen(true);
    setSarPhase(1);
    setIsPlayingPhase(false);
    prewarmWaybackTiles(lat, lon, 10);
    prewarmWaybackTiles(lat, lon, 11);
    setSelectedFeature({
      title: hotspot.kabupaten || "Wildfire Hotspot",
      distanceTag: distKmText ? distKmText.replace(" • ", "") : "",
      subtitle: `${hotspot.provinsi || "Indonesia"} · ${hotspot.land_type || "Tropical Forest & Peatland"}`,
      coordsText: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      sensor: sensorName,
      dateText: `${hotspot.acq_date || "LIVE"} · ${formattedUtcTime}`,
      alertLabel,
      isLiveHotspot,
      confLabel,
      eonetId,
      tempK,
      tempC,
      frpVal,
      sarDb,
      sarDrop,
      smi,
      fwi,
      windSpeedMs: meteomaticsData.windSpeedMs,
      windCompass: meteomaticsData.windCompass,
      wildlifeScope,
      impactChain,
      nearestNdvi,
      mlStats,
    });

    if (mapRef.current) {
      const popupContent = `
        <div style="font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; color: #0f172a; width: 100%; box-sizing: border-box; background: #ffffff;">
          <div style="height: 4px; width: 100%; background: linear-gradient(90deg, #dc2626 0%, #f97316 55%, #059669 100%);"></div>
          <div style="padding: 10px 12px 9px 12px; background: linear-gradient(135deg, #fff5f5 0%, #fffbeb 100%); border-bottom: 1px solid #fee2e2;">
            <div style="display: flex; align-items: center; gap: 5px; padding-right: 28px; margin-bottom: 4px; flex-wrap: wrap;">
              <span style="background: #ecfdf5; color: #047857; font-family: ui-monospace, monospace; font-size: 8.5px; font-weight: 800; padding: 2px 6px; border-radius: 999px; border: 1px solid #6ee7b7;">
                ${isLiveHotspot ? "🟢 LIVE NRT" : "📦 SNAPSHOT"} • ${confLabel}
              </span>
              <span style="font-family: ui-monospace, monospace; font-size: 8.5px; font-weight: 700; color: #64748b;">
                ${hotspot.acq_date || "LIVE"}
              </span>
            </div>
            <div style="font-size: 14.5px; font-weight: 800; color: #7f1d1d; line-height: 1.25;">
              🔥 ${hotspot.kabupaten || "Wildfire Hotspot"}${distKmText}
            </div>
            <div style="font-size: 10.5px; font-weight: 600; color: #475569; margin-top: 2px;">
              📍 ${hotspot.provinsi || "Indonesia"} • <span style="color: #1e293b; font-weight: 700;">${hotspot.land_type || "Peat Dome & Tropical Forest"}</span>
            </div>
          </div>

          <div style="padding: 10px 12px 11px 12px; background: #ffffff;">
            <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px;">
              <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 5px; text-align: center;">
                <div style="font-family: ui-monospace, monospace; font-size: 7.5px; font-weight: 700; color: #9a3412; text-transform: uppercase;">Suhu Api</div>
                <div style="font-family: ui-monospace, monospace; font-size: 11px; font-weight: 800; color: #c2410c;">${tempC}°C</div>
              </div>
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 5px; text-align: center;">
                <div style="font-family: ui-monospace, monospace; font-size: 7.5px; font-weight: 700; color: #991b1b; text-transform: uppercase;">Energi FRP</div>
                <div style="font-family: ui-monospace, monospace; font-size: 11px; font-weight: 800; color: #dc2626;">${frpVal} MW</div>
              </div>
              <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 5px; text-align: center;">
                <div style="font-family: ui-monospace, monospace; font-size: 7.5px; font-weight: 700; color: #075985; text-transform: uppercase;">SAR Radar</div>
                <div style="font-family: ui-monospace, monospace; font-size: 11px; font-weight: 800; color: #0284c7;">${sarDb} dB</div>
              </div>
            </div>

            <div style="margin-top: 8px; padding: 7px 9px; border-radius: 8px; background: #ecfdf5; border: 1px solid #a7f3d0;">
              <div style="font-family: ui-monospace, monospace; font-size: 8.5px; font-weight: 800; color: #065f46; text-transform: uppercase; margin-bottom: 4px;">
                ${wildlifeScope?.primaryIcon || "🦧"} Satwa Terdampak (Radius ${wildlifeScope?.radiusKm || 60} km)
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                ${speciesBadgesHtml}
              </div>
            </div>
          </div>
        </div>
      `;

      if (popupRef.current) popupRef.current.remove();
      const popupInstance = new maplibregl.Popup({
        offset: 38,
        anchor: "bottom",
        maxWidth: "300px",
        className: "nasa-fire-popup",
      })
        .setLngLat([lon, lat])
        .setHTML(popupContent)
        .addTo(mapRef.current);

      const popupEl = popupInstance.getElement();
      if (popupEl) {
        popupEl.style.zIndex = "100";
      }
      popupRef.current = popupInstance;

      // Zoom mendekat ke lokasi titik api agar perubahan kondisi lahan historis vs sekarang terlihat jelas
      const currentZoom = mapRef.current.getZoom();
      mapRef.current.flyTo({
        center: [lon, lat],
        zoom: currentZoom < 10.2 ? 10.5 : currentZoom,
        duration: 1100,
        essential: true,
      });

      // Sync live Meteomatics weather & soil moisture parameters for the clicked coordinate
      fetchMeteomaticsSarWeather(lat, lon)
        .then((wx) => {
          if (!wx) return;
          setMeteomaticsData(wx);
          const updatedSmi =
            wx.soilMoistureIdx > 0 ? wx.soilMoistureIdx : smi;
          const updatedFwi = wx.fireRiskIdx > 0 ? wx.fireRiskIdx : fwi;
          const updatedChain = buildImpactTranslation({
            tempK,
            frpVal,
            sarDb,
            sarDrop,
            landType: hotspot.land_type,
            smi: updatedSmi,
            fwi: updatedFwi,
            windSpeedMs: wx.windSpeedMs,
            windCompass: wx.windCompass,
            wildlifeScope,
          });
          setSelectedFeature((prev) =>
            prev && prev.coordsText === `${lat.toFixed(4)}, ${lon.toFixed(4)}`
              ? {
                ...prev,
                smi: updatedSmi,
                fwi: updatedFwi,
                windSpeedMs: wx.windSpeedMs,
                windCompass: wx.windCompass,
                impactChain: updatedChain,
              }
              : prev,
          );
        })
        .catch(() => { });
    }
  };

  // Initialize MapLibre GL JS
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let resizeObserver = null;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: buildNasaBasemapStyle(),
        center: REGION_COORDINATES.indonesia.center,
        zoom: REGION_COORDINATES.indonesia.zoom,
        pitch: 0,
        bearing: 0,
        minZoom: 1.8,
        maxZoom: 16,
        attributionControl: false,
      });

      map.addControl(
        new maplibregl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true,
        }),
        "bottom-right",
      );

      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution:
            "NASA Worldview (EONET Wildfires • MODIS/VIIRS Thermal Anomalies) | H.O.M.E.",
        }),
        "bottom-right",
      );

      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          map.resize();
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      mapRef.current = map;
      // Mark mapRef ready immediately so NASA Worldview Fire Pins render right away
      setMapReady(true);

      const initLayers = () => {
        if (map.getSource("fire-points")) return;
        map.resize();

        // 1. SAR Radar Swath Layer
        map.addSource("sar-swaths", {
          type: "geojson",
          data: SAR_SWATH_GEOJSON,
        });

        map.addLayer({
          id: "sar-fill",
          type: "fill",
          source: "sar-swaths",
          paint: {
            "fill-color": "#0ea5e9",
            "fill-opacity": 0.08,
          },
        });

        map.addLayer({
          id: "sar-outline",
          type: "line",
          source: "sar-swaths",
          paint: {
            "line-color": "#38bdf8",
            "line-width": 1.4,
            "line-dasharray": [4, 3],
          },
        });

        // 2. Protected Areas Layer
        map.addSource("protected-areas", {
          type: "geojson",
          data: protectedAreas || { type: "FeatureCollection", features: [] },
        });

        map.addLayer({
          id: "pa-polygons",
          type: "fill",
          source: "protected-areas",
          paint: {
            "fill-color": "#10b981",
            "fill-opacity": 0.2,
          },
        });

        map.addLayer({
          id: "pa-borders",
          type: "line",
          source: "protected-areas",
          paint: {
            "line-color": "#34d399",
            "line-width": 1.5,
            "line-dasharray": [2, 1],
          },
        });

        // 2b. Endemic Indonesian Wildlife Habitat Scope Polygons
        map.addSource("wildlife-habitats", {
          type: "geojson",
          data: wildlifeHabitatsGeoJSON,
        });

        map.addLayer({
          id: "wildlife-habitat-fill",
          type: "fill",
          source: "wildlife-habitats",
          paint: {
            "fill-color": "#10b981",
            "fill-opacity": 0.14,
          },
        });

        map.addLayer({
          id: "wildlife-habitat-outline",
          type: "line",
          source: "wildlife-habitats",
          paint: {
            "line-color": "#34d399",
            "line-width": 1.8,
            "line-dasharray": [3, 2],
          },
        });

        // 3. Burning Zone Perimeter Polygons
        map.addSource("karhutla-zones", {
          type: "geojson",
          data: latestZonesGeoJSONRef.current,
        });

        map.addLayer({
          id: "karhutla-zone-fill",
          type: "fill",
          source: "karhutla-zones",
          paint: {
            "fill-color": "#7f1d1d",
            "fill-opacity": 0.48,
          },
        });

        map.addLayer({
          id: "karhutla-zone-outline",
          type: "line",
          source: "karhutla-zones",
          paint: {
            "line-color": "#f97316",
            "line-width": 1.6,
            "line-opacity": 0.85,
          },
        });

        // 4. MODIS/VIIRS Thermal Anomalies Layer beneath Fire Pins
        map.addSource("fire-points", {
          type: "geojson",
          data: latestFireGeoJSONRef.current,
        });

        map.addLayer({
          id: "modis-thermal-anomalies-glow",
          type: "circle",
          source: "fire-points",
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              2,
              4,
              5,
              8,
              9,
              14,
            ],
            "circle-color": "#ff3b00",
            "circle-opacity": 0.55,
            "circle-blur": 0.5,
          },
        });

        map.addLayer({
          id: "modis-thermal-anomalies-core",
          type: "circle",
          source: "fire-points",
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              2,
              2,
              5,
              3.5,
              9,
              6,
            ],
            "circle-color": "#ff6a00",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fde047",
          },
        });

        // 5. Optical Smoke Haze Layer (terlihat di mode EO Optical, langsung tembus saat mode SAR Radar)
        map.addLayer({
          id: "optical-smoke-haze",
          type: "circle",
          source: "fire-points",
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              2,
              14,
              5,
              30,
              9,
              58,
            ],
            "circle-color": "#cbd5e1",
            "circle-opacity": 0.52,
            "circle-blur": 0.95,
          },
        });

        setMapLoaded(true);
      };

      map.on("style.load", initLayers);
      map.on("load", initLayers);
    } catch (err) {
      console.error("Failed to initialize MapLibre GL:", err);
      setWebGLError(true);
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  /**
   * Render Fire Pin Markers across active Indonesia wildfire hotspots
   */
  useEffect(() => {
    if (!mapRef.current || !mapReady || !layers.hotspots) return undefined;

    const markers = [];

    const hotspotsToPin = phaseFireEvents.slice(0, 300);

    hotspotsToPin.forEach((hotspot, idx) => {
      const lon = Number(hotspot.longitude);
      const lat = Number(hotspot.latitude);
      if (Number.isNaN(lon) || Number.isNaN(lat)) return;

      const isHigh =
        hotspot.confidence === "high" || Number(hotspot.brightness) >= 350;
      const w = isHigh ? 32 : 27;
      const h = isHigh ? 38 : 32;

      const wrapperEl = document.createElement("div");
      wrapperEl.style.cursor = "pointer";
      wrapperEl.style.userSelect = "none";
      wrapperEl.style.zIndex = isHigh ? "2" : "1";
      wrapperEl.title = `🔥 ${hotspot.kabupaten || "Wildfire Hotspot"} (${hotspot.provinsi || "Indonesia"}) — Klik untuk lihat dampak ekosistem`;

      const innerEl = document.createElement("div");
      innerEl.innerHTML = getFirePinSvg(w, h);
      wrapperEl.appendChild(innerEl);

      wrapperEl.addEventListener("click", (ev) => {
        ev.stopPropagation();
        handleSelectHotspotPin(hotspot, idx);
      });

      const marker = new maplibregl.Marker({
        element: wrapperEl,
        anchor: "bottom",
      })
        .setLngLat([lon, lat])
        .addTo(mapRef.current);

      markers.push(marker);
    });

    // Badge Lingkup Habitat Satwa Endemik Indonesia
    if (layers.protected) {
      INDONESIA_WILDLIFE_HABITATS.forEach((hab) => {
        const habWrapper = document.createElement("div");
        habWrapper.style.cursor = "pointer";
        habWrapper.style.userSelect = "none";
        habWrapper.style.zIndex = "2";
        habWrapper.title = `${hab.primaryIcon} ${hab.corridorName} — ${hab.primarySpecies} (IUCN: ${hab.iucnStatus})`;

        const habInner = document.createElement("div");
        habInner.innerHTML = `
          <div style="display: inline-flex; align-items: center; gap: 4px; background: rgba(6, 78, 59, 0.92); color: #ecfdf5; border: 1.5px solid #34d399; border-radius: 999px; padding: 2px 7px; font-family: ui-monospace, monospace; font-size: 10px; font-weight: 800; box-shadow: 0 3px 8px rgba(0,0,0,0.5); white-space: nowrap;">
            <span style="font-size: 12px;">${hab.primaryIcon}</span>
            <span>${hab.island}</span>
            <span style="background: #dc2626; color: #fff; font-size: 8px; padding: 0 4px; border-radius: 4px;">${hab.iucnStatus}</span>
          </div>
        `;
        habWrapper.appendChild(habInner);

        habWrapper.addEventListener("click", (ev) => {
          ev.stopPropagation();
          handleFocusWildlifeCorridor({ coords: [hab.lon, hab.lat] });
        });

        const habMarker = new maplibregl.Marker({
          element: habWrapper,
          anchor: "center",
        })
          .setLngLat([hab.lon, hab.lat])
          .addTo(mapRef.current);

        markers.push(habMarker);
      });
    }

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [phaseFireEvents, mapReady, layers.hotspots, layers.protected]);

  // Ganti mode basemap (EO Optical vs SAR Radar) & Swap Citra Satelit Historis (2014) vs Sekarang (Terbakar) tanpa lag
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    const isSatMode = basemapMode === "satellite";
    const showHistorical = isSatMode && sarPhase === 0;
    const showDarkRadar = basemapMode === "sar-dark";

    // Saat pembanding aktif di mode EO, biarkan kedua layer visible agar tile 2014 ter-cache di GPU; cukup ubah raster-opacity
    if (map.getLayer("raster-satellite-historical")) {
      map.setLayoutProperty(
        "raster-satellite-historical",
        "visibility",
        isSatMode && (playerOpen || showHistorical) ? "visible" : "none",
      );
      map.setPaintProperty(
        "raster-satellite-historical",
        "raster-opacity",
        showHistorical ? 0.98 : 0,
      );
    }
    if (map.getLayer("raster-satellite")) {
      map.setLayoutProperty(
        "raster-satellite",
        "visibility",
        isSatMode ? "visible" : "none",
      );
    }
    if (map.getLayer("raster-dark-radar")) {
      map.setLayoutProperty(
        "raster-dark-radar",
        "visibility",
        showDarkRadar ? "visible" : "none",
      );
    }

    // Di mode EO Optical, kabut asap terlihat saat kebakaran terjadi; di mode SAR, asap ditembus total (opacity 0)
    if (map.getLayer("optical-smoke-haze")) {
      const smokeOpacity =
        basemapMode === "sar-dark" ? 0 : activePhaseConfig.smokeOpacity;
      map.setPaintProperty("optical-smoke-haze", "circle-opacity", smokeOpacity);
    }

    // Warna, garis batas & opasitas zona perubahan lahan (kanopi hijau utuh -> luka bakar merah gelap)
    if (map.getLayer("karhutla-zone-fill")) {
      map.setPaintProperty(
        "karhutla-zone-fill",
        "fill-color",
        activePhaseConfig.zoneColor,
      );
      map.setPaintProperty(
        "karhutla-zone-fill",
        "fill-opacity",
        basemapMode === "sar-dark"
          ? Math.min(0.62, activePhaseConfig.zoneOpacity + 0.12)
          : activePhaseConfig.zoneOpacity,
      );
    }
    if (map.getLayer("karhutla-zone-outline")) {
      map.setPaintProperty(
        "karhutla-zone-outline",
        "line-color",
        activePhaseConfig.zoneBorder || activePhaseConfig.zoneColor,
      );
    }

    // Warna sapuan radar SAR membedakan NISAR L-Band (24cm, cyan/sky) vs Sentinel-1 C-Band (5.6cm, indigo/violet)
    if (map.getLayer("sar-outline") && map.getLayer("sar-fill")) {
      const bandColor = sarBand === "l-band" ? "#38bdf8" : "#a78bfa";
      map.setPaintProperty("sar-outline", "line-color", bandColor);
      map.setPaintProperty("sar-fill", "fill-color", bandColor);
      map.setPaintProperty(
        "sar-fill",
        "fill-opacity",
        basemapMode === "sar-dark" ? 0.16 : 0.08,
      );
    }
  }, [basemapMode, sarPhase, sarBand, activePhaseConfig, playerOpen, mapLoaded]);

  // Update sumber data titik api & poligon zona berapi
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const fireSrc = mapRef.current.getSource("fire-points");
    if (fireSrc) fireSrc.setData(fireGeoJSON);
    const zoneSrc = mapRef.current.getSource("karhutla-zones");
    if (zoneSrc) zoneSrc.setData(burningZonesGeoJSON);
  }, [fireGeoJSON, burningZonesGeoJSON, mapLoaded]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !sarSwathsGeoJSON) return;
    const source = mapRef.current.getSource("sar-swaths");
    if (source) source.setData(sarSwathsGeoJSON);
  }, [sarSwathsGeoJSON, mapLoaded]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !protectedAreas?.features) return;
    const source = mapRef.current.getSource("protected-areas");
    if (source) source.setData(protectedAreas);
  }, [protectedAreas, mapLoaded]);

  const handleRegionChange = (reg) => {
    setSelectedRegion(reg);
    if (popupRef.current) popupRef.current.remove();
    if (mapRef.current && REGION_COORDINATES[reg]) {
      mapRef.current.flyTo({
        center: REGION_COORDINATES[reg].center,
        zoom: REGION_COORDINATES[reg].zoom,
        pitch: 0,
        bearing: 0,
        duration: 1200,
        essential: true,
      });
    }
  };

  const toggleLayer = (layerKey) => {
    const nextVal = !layers[layerKey];
    setLayers((prev) => ({ ...prev, [layerKey]: nextVal }));

    if (!mapRef.current || !mapLoaded) return;
    const visibility = nextVal ? "visible" : "none";

    if (layerKey === "hotspots") {
      [
        "karhutla-zone-fill",
        "karhutla-zone-outline",
        "modis-thermal-anomalies-glow",
        "modis-thermal-anomalies-core",
        "optical-smoke-haze",
      ].forEach((id) => {
        if (mapRef.current.getLayer(id)) {
          mapRef.current.setLayoutProperty(id, "visibility", visibility);
        }
      });
    } else if (layerKey === "protected") {
      [
        "pa-polygons",
        "pa-borders",
        "wildlife-habitat-fill",
        "wildlife-habitat-outline",
      ].forEach((id) => {
        if (mapRef.current.getLayer(id)) {
          mapRef.current.setLayoutProperty(id, "visibility", visibility);
        }
      });
    } else if (layerKey === "sar") {
      ["sar-fill", "sar-outline"].forEach((id) => {
        if (mapRef.current.getLayer(id)) {
          mapRef.current.setLayoutProperty(id, "visibility", visibility);
        }
      });
    }
  };

  // Fly directly to the selected wildlife habitat corridor and select its nearest hotspot
  const handleFocusWildlifeCorridor = (speciesItem) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: speciesItem.coords,
      zoom: 7.4,
      pitch: 0,
      bearing: 0,
      duration: 1200,
      essential: true,
    });
    const nearbyHotspot = filteredFireEvents.find(
      (f) =>
        Math.abs(Number(f.longitude) - speciesItem.coords[0]) < 1.5 &&
        Math.abs(Number(f.latitude) - speciesItem.coords[1]) < 1.5,
    );
    if (nearbyHotspot) {
      handleSelectHotspotPin(nearbyHotspot, 0);
    } else {
      setNotebookOpen(true);
    }
  };

  return (
    <div
      className={`relative w-full ${isEmbed ? "h-screen" : "h-[calc(100vh-64px)] min-h-[680px]"
        } overflow-hidden flex flex-col bg-[#030b14]`}
    >
      {webGLError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#030b14] p-6 text-cream-100">
          <div className="max-w-md rounded-2xl border border-charcoal-700 bg-charcoal-950 p-6 text-center">
            <h2 className="font-display text-xl font-bold text-amber-300">
              NASA Worldview Indonesia Wildfire &amp; SAR Tracker
            </h2>
            <p className="mt-2 text-xs text-cream-300">
              {filteredFireEvents.length} active wildfire hotspots detected
              across Indonesia.
            </p>
          </div>
        </div>
      )}

      {/* MAIN MAP CANVAS */}
      <div
        className="relative w-full flex-1"
        style={{ minHeight: "560px", height: "100%" }}
      >
        {/* Ensure Popup stays above all Fire Pins (z-index: 100), and Fire Pins never escape the map canvas */}
        <style>{`
          .maplibregl-popup {
            z-index: 100 !important;
            max-width: 332px !important;
            width: 324px !important;
          }
          .maplibregl-popup-content {
            background: #ffffff !important;
            border: 1.5px solid #e2e8f0 !important;
            box-shadow: 0 20px 44px rgba(15, 23, 42, 0.35), 0 4px 12px rgba(15, 23, 42, 0.12) !important;
            border-radius: 16px !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          .maplibregl-popup-close-button {
            top: 10px !important;
            right: 10px !important;
            width: 24px !important;
            height: 24px !important;
            border-radius: 9999px !important;
            background: #ffffff !important;
            border: 1px solid #cbd5e1 !important;
            color: #475569 !important;
            font-size: 15px !important;
            font-weight: 700 !important;
            line-height: 20px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
            transition: all 0.15s ease !important;
          }
          .maplibregl-popup-close-button:hover {
            background: #fee2e2 !important;
            border-color: #fca5a5 !important;
            color: #b91c1c !important;
          }
          .maplibregl-popup-anchor-bottom .maplibregl-popup-tip {
            border-top-color: #ffffff !important;
          }
          .maplibregl-popup-anchor-top .maplibregl-popup-tip {
            border-bottom-color: #fff5f5 !important;
          }
          .maplibregl-popup-anchor-left .maplibregl-popup-tip {
            border-right-color: #ffffff !important;
          }
          .maplibregl-popup-anchor-right .maplibregl-popup-tip {
            border-left-color: #ffffff !important;
          }
        `}</style>

        <div
          ref={mapContainerRef}
          className="absolute inset-0 z-0 isolate h-full w-full bg-[#030b14] focus:outline-none"
          tabIndex={0}
          aria-label="Interactive Indonesia wildfire and wildlife habitat map powered by NASA Worldview EONET, MODIS/VIIRS & NISAR SAR"
        />

        {/* ==================== CARTOGRAPHER FIELD BOARD (Z-30) ==================== */}
        {!isEmbed && (
          <div className="pointer-events-none absolute top-3 left-3 z-30 flex w-[calc(100%-1.5rem)] max-w-[272px] flex-col">
            <div className="pointer-events-auto overflow-hidden rounded-2xl border border-[#cbbba0] bg-[#f8f3e8] text-[#1d2621] shadow-[0_20px_48px_rgba(0,0,0,0.48),3px_3px_0_#ded4be]">
              {/* Forest Green & Brass Expedition Header */}
              <div className="relative border-b-2 border-[#c89d54]/70 bg-gradient-to-br from-[#163a28] via-[#1c4732] to-[#112d1f] px-3.5 py-2.5 text-[#faf6ee]">
                <span className="absolute top-2 left-2 h-1.5 w-1.5 rounded-full bg-[#d8b26a]/70 shadow-xs" />
                <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#d8b26a]/70 shadow-xs" />

                <div className="flex items-center justify-between gap-2 pl-2">
                  <div>
                    <div className="font-mono text-[8px] font-bold tracking-[0.22em] text-[#e5c787] uppercase">
                      Pos Pantau · Kartografi
                    </div>
                    <h1 className="font-display text-[15px] font-extrabold tracking-tight text-white">
                      H.O.M.E. Field Board
                    </h1>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="rounded-md border border-[#f5d0c5]/30 bg-[#983226] px-2 py-0.5 font-mono text-[9.5px] font-bold text-white shadow-xs">
                      {phaseFireEvents.length} titik
                    </span>
                    <button
                      type="button"
                      onClick={() => setPanelMinimized((v) => !v)}
                      title={
                        panelMinimized ? "Buka Papan Kontrol" : "Perkecil Papan"
                      }
                      className="cursor-pointer flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs font-bold text-[#faf6ee] transition-colors hover:bg-white/20"
                    >
                      {panelMinimized ? "+" : "−"}
                    </button>
                  </div>
                </div>
              </div>

              {!panelMinimized && (
                <div
                  className="divide-y divide-[#dfd4be] px-3.5 py-1"
                  style={{
                    backgroundImage:
                      "radial-gradient(rgba(140, 125, 98, 0.12) 1px, transparent 1px)",
                    backgroundSize: "14px 14px",
                  }}
                >
                  {/* 1. Wilayah Fokus */}
                  <div className="py-2.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="font-mono text-[8.5px] font-bold tracking-[0.16em] text-[#5c665f] uppercase">
                        Wilayah Pantau
                      </span>
                      <span className="font-mono text-[8.5px] font-semibold text-[#1b5e3a]">
                        Nusantara
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(REGION_COORDINATES).map(([key, cfg]) => {
                        const active = selectedRegion === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleRegionChange(key)}
                            className={`cursor-pointer flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition-all ${
                              active
                                ? "border-[#1b5e3a] bg-[#18442e] font-bold text-[#faf6ee] shadow-sm"
                                : "border-[#dcd0b8] bg-white/75 font-semibold text-[#333d37] hover:border-[#b7a78a] hover:bg-white"
                            }`}
                          >
                            <span className="truncate">{cfg.label}</span>
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                active ? "bg-[#e5c787]" : "bg-[#c7bba2]"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Sensor Visual & Rentang Waktu */}
                  <div className="space-y-2 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[8.5px] font-bold tracking-[0.16em] text-[#5c665f] uppercase">
                        Mode Mata
                      </span>
                      <div className="inline-flex rounded-lg border border-[#d6cbb5] bg-[#efe7d6] p-0.5">
                        {[
                          { id: "satellite", label: "Optik EO" },
                          { id: "sar-dark", label: "Radar SAR" },
                        ].map((bm) => (
                          <button
                            key={bm.id}
                            type="button"
                            onClick={() => setBasemapMode(bm.id)}
                            className={`cursor-pointer rounded-md px-2.5 py-1 font-mono text-[9.5px] font-bold transition-all ${
                              basemapMode === bm.id
                                ? "bg-[#18442e] text-[#faf6ee] shadow-xs"
                                : "text-[#58625b] hover:text-[#1d2621]"
                            }`}
                          >
                            {bm.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[8.5px] font-bold tracking-[0.16em] text-[#5c665f] uppercase">
                        Rentang
                      </span>
                      <div className="inline-flex rounded-lg border border-[#d6cbb5] bg-[#efe7d6] p-0.5">
                        {[
                          { id: "24h", label: "24 Jam" },
                          { id: "3d", label: "3 Hari" },
                          { id: "7d", label: "7 Hari" },
                        ].map((time) => (
                          <button
                            key={time.id}
                            type="button"
                            onClick={() => setTimeFilter(time.id)}
                            className={`cursor-pointer rounded-md px-2 py-0.5 font-mono text-[9.5px] font-bold transition-all ${
                              timeFilter === time.id
                                ? "bg-[#983226] text-white shadow-xs"
                                : "text-[#58625b] hover:text-[#1d2621]"
                            }`}
                          >
                            {time.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 3. Frekuensi Gelombang Radar */}
                  <div className="py-2.5">
                    <div className="mb-1.5 font-mono text-[8.5px] font-bold tracking-[0.16em] text-[#5c665f] uppercase">
                      Frekuensi Gelombang SAR
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        {
                          id: "l-band",
                          title: "L-Band",
                          wave: "λ 24 cm",
                          bar: "w-full",
                        },
                        {
                          id: "c-band",
                          title: "C-Band",
                          wave: "λ 5.6 cm",
                          bar: "w-1/2",
                        },
                      ].map((band) => {
                        const active = sarBand === band.id;
                        return (
                          <button
                            key={band.id}
                            type="button"
                            onClick={() => setSarBand(band.id)}
                            className={`cursor-pointer rounded-lg border p-2 text-left transition-all ${
                              active
                                ? "border-[#0369a1] bg-[#e6f3fa] shadow-xs"
                                : "border-[#dcd0b8] bg-white/70 hover:bg-white"
                            }`}
                          >
                            <div className="flex items-baseline justify-between">
                              <span
                                className={`font-mono text-[10.5px] font-extrabold ${
                                  active ? "text-[#075985]" : "text-[#333d37]"
                                }`}
                              >
                                {band.title}
                              </span>
                              <span className="font-mono text-[8.5px] font-semibold text-[#5c665f]">
                                {band.wave}
                              </span>
                            </div>
                            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[#dfd4be]">
                              <div
                                className={`h-full rounded-full ${band.bar} ${
                                  active ? "bg-[#0284c7]" : "bg-[#9eb0a5]"
                                }`}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-1.5 text-[10px] leading-snug text-[#46514a]">
                      {SAR_BAND_MODES[sarBand].detail}
                    </p>
                  </div>

                  {/* 4. Lapisan Kartografi (Tactile Switches) */}
                  <div className="space-y-1 py-2.5">
                    <div className="mb-1 font-mono text-[8.5px] font-bold tracking-[0.16em] text-[#5c665f] uppercase">
                      Lapisan Peta
                    </div>
                    {[
                      {
                        key: "hotspots",
                        label: "Titik Panas & Zona Api",
                        dot: "bg-[#983226]",
                      },
                      {
                        key: "sar",
                        label: "Sapuan Radar SAR",
                        dot: "bg-[#0284c7]",
                      },
                      {
                        key: "protected",
                        label: "Koridor Habitat Satwa",
                        dot: "bg-[#15803d]",
                      },
                    ].map((item) => {
                      const on = layers[item.key];
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => toggleLayer(item.key)}
                          className="cursor-pointer flex w-full items-center justify-between rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-white/70"
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                on ? item.dot : "bg-[#c7bba2]"
                              }`}
                            />
                            <span
                              className={`text-[11px] font-semibold ${
                                on ? "text-[#1d2621]" : "text-[#7a847d]"
                              }`}
                            >
                              {item.label}
                            </span>
                          </span>
                          <span
                            className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full border transition-colors ${
                              on
                                ? "border-[#18442e] bg-[#1b5e3a]"
                                : "border-[#cbbda3] bg-[#e5dcc8]"
                            }`}
                          >
                            <span
                              className={`inline-block h-2.5 w-2.5 rounded-full bg-[#faf6ee] shadow-xs transition-transform ${
                                on ? "translate-x-3.5" : "translate-x-0.5"
                              }`}
                            />
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 5. Status & Sinkronisasi */}
                  <div className="flex items-center justify-between gap-2 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          fireStatus === "ERROR"
                            ? "bg-amber-500"
                            : "bg-[#15803d]"
                        }`}
                      />
                      <span className="font-mono text-[9.5px] font-bold text-[#333d37]">
                        {isRealtimeFireMode ? "Live NRT" : "Snapshot"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleScrapeLiveNasa}
                      disabled={scrapingNasa || fireLoading}
                      className="cursor-pointer whitespace-nowrap rounded-lg border border-[#c89d54] bg-[#efe5cf] px-2.5 py-1 font-mono text-[9.5px] font-bold text-[#3d2e14] shadow-2xs transition-colors hover:bg-[#e5d6b6] disabled:opacity-50"
                    >
                      {scrapingNasa ? "Menyinkronkan..." : "Sinkronkan Data"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== FIELD NOTEBOOK SPIRAL & BOOKMARKS (Z-30) ==================== */}
        {!isEmbed && !notebookOpen && (
          <button
            type="button"
            onClick={() => setNotebookOpen(true)}
            title="Buka Buku Catatan Lapangan"
            className="cursor-pointer group absolute top-3 right-3 z-30 flex items-center gap-2.5 rounded-xl border border-[#d6cbb5] bg-[#faf6ee]/95 px-3 py-2 text-left text-[#1e2621] shadow-[0_12px_30px_rgba(0,0,0,0.45),3px_3px_0_#e5dcc8] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-[#faf6ee]"
          >
            {/* Mini Spiral Icon */}
            <span className="relative flex h-8 w-7 shrink-0 items-center justify-center rounded-r-md rounded-l-xs border border-[#cbbda3] bg-[#f1eadc] shadow-xs">
              <span className="absolute -left-1 top-1.5 h-1 w-2 rounded-full bg-slate-500" />
              <span className="absolute -left-1 top-3.5 h-1 w-2 rounded-full bg-slate-500" />
              <span className="absolute -left-1 top-5.5 h-1 w-2 rounded-full bg-slate-500" />
              <span className="text-sm">📖</span>
            </span>
            <div className="pr-1">
              <div className="font-mono text-[8.5px] font-bold tracking-[0.15em] text-[#1b5e3a] uppercase">
                {selectedFeature ? "Field Dossier" : "Field Notes"}
              </div>
              <div className="text-xs font-extrabold text-[#1a221d] group-hover:text-[#983226]">
                {selectedFeature ? selectedFeature.title : "Buka Catatan"}
              </div>
            </div>
          </button>
        )}

        {!isEmbed && notebookOpen && (
          <div className="pointer-events-none absolute top-3 right-3 z-30 flex items-start">
            {/* Main Spiral Notebook Body */}
            <div className="pointer-events-auto relative flex w-[calc(100vw-4.5rem)] max-w-[312px] rounded-l-lg rounded-r-2xl border border-[#d6cbb5] bg-[#faf6ee] text-[#1e2621] shadow-[0_20px_50px_rgba(0,0,0,0.55),4px_4px_0_#e5dcc8,8px_8px_0_rgba(20,28,24,0.35)]">
              {/* Spiral Wire Binding Spine (Left Edge) */}
              <div
                aria-hidden="true"
                className="flex w-6 shrink-0 flex-col items-center justify-evenly rounded-l-lg border-r border-[#dfd5c0] bg-[#f1eadc] py-3"
              >
                {Array.from({ length: 10 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="relative flex w-full items-center justify-center"
                  >
                    <span className="h-2.5 w-2.5 rounded-full border border-[#bcae94] bg-[#2a332e] shadow-inner" />
                    <span className="absolute -left-2 h-1.5 w-4.5 rounded-full bg-gradient-to-b from-slate-200 via-slate-400 to-slate-600 shadow-xs" />
                  </div>
                ))}
              </div>

              {/* Ruled Notebook Page Content */}
              <div
                className="max-h-[calc(100vh-155px)] min-w-0 flex-1 overflow-y-auto p-3.5"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to bottom, transparent, transparent 23px, rgba(163, 149, 124, 0.16) 24px)",
                }}
              >
                {/* Notebook Header */}
                <div className="flex items-start justify-between gap-2 border-b-2 border-[#983226]/25 pb-2">
                  <div className="min-w-0">
                    <div className="font-mono text-[8.5px] font-bold tracking-[0.18em] text-[#1b5e3a] uppercase">
                      {selectedFeature
                        ? "Field Dossier · SAR"
                        : "Field Notes · Nusantara"}
                    </div>
                    <h2 className="mt-0.5 truncate font-display text-[15px] font-extrabold tracking-tight text-[#1a221d]">
                      {selectedFeature
                        ? selectedFeature.title
                        : "Catatan Ekosistem"}
                    </h2>
                    <p className="truncate text-[10.5px] font-medium text-[#5c665f]">
                      {selectedFeature
                        ? selectedFeature.subtitle
                        : "Pilih titik api atau buka bookmark"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNotebookOpen(false)}
                    title="Tutup Buku Catatan"
                    className="cursor-pointer flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#cfc3aa] bg-[#f2ebdc] text-xs font-bold text-[#3d4741] transition-colors hover:bg-[#e7decb]"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-2.5">
                  {selectedFeature ? (
                    <>
                      {/* Meta Strip + Back to Regional */}
                      <div className="mb-2.5 flex items-center justify-between gap-2">
                        <span className="font-mono text-[9px] font-semibold text-[#646e67]">
                          {selectedFeature.coordsText} ·{" "}
                          {selectedFeature.dateText}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFeature(null);
                            setActiveBookmark("cover");
                            if (popupRef.current) popupRef.current.remove();
                          }}
                          className="cursor-pointer shrink-0 rounded-md border border-[#cfc3aa] bg-[#f2ebdc] px-2 py-0.5 font-mono text-[9px] font-bold text-[#2b352f] hover:bg-[#e5dbc6]"
                        >
                          ← Wilayah
                        </button>
                      </div>

                      {/* BOOKMARK PAGE 0: COVER / RINGKASAN ANGKA */}
                      {activeBookmark === "cover" && (
                        <div className="space-y-2.5">
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              {
                                tab: "01",
                                num: "01",
                                label: "Sinyal Satelit",
                                metric: `${selectedFeature.tempC}°C`,
                                sub: `${selectedFeature.sarDb} dB SAR`,
                                accent: "border-l-[#0284c7]",
                              },
                              {
                                tab: "02",
                                num: "02",
                                label: "Air & Gambut",
                                metric: `SMI ${selectedFeature.smi}`,
                                sub: `FWI ${selectedFeature.fwi}`,
                                accent: "border-l-[#d97706]",
                              },
                              {
                                tab: "03",
                                num: "03",
                                label: "Koridor Satwa",
                                metric: `${selectedFeature.wildlifeScope?.speciesList?.length || 0} Spesies`,
                                sub: `Radius ${selectedFeature.wildlifeScope?.radiusKm || 60} km`,
                                accent: "border-l-[#15803d]",
                              },
                              {
                                tab: "04",
                                num: "04",
                                label: "Warga & Asap",
                                metric: `${selectedFeature.windSpeedMs ?? meteomaticsData.windSpeedMs} m/s`,
                                sub:
                                  selectedFeature.windCompass ??
                                  meteomaticsData.windCompass,
                                accent: "border-l-[#983226]",
                              },
                            ].map((item) => (
                              <button
                                key={item.tab}
                                type="button"
                                onClick={() => setActiveBookmark(item.tab)}
                                className={`cursor-pointer rounded-md border border-[#e0d6c1] border-l-4 ${item.accent} bg-white/75 p-2 text-left transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-sm`}
                              >
                                <div className="flex items-center justify-between font-mono text-[8.5px] font-bold text-[#646e67] uppercase">
                                  <span>{item.label}</span>
                                  <span>{item.num}</span>
                                </div>
                                <div className="mt-1 font-mono text-xs font-extrabold text-[#1a221d]">
                                  {item.metric}
                                </div>
                                <div className="truncate font-mono text-[9px] text-[#5c665f]">
                                  {item.sub}
                                </div>
                              </button>
                            ))}
                          </div>

                          {selectedFeature.nearestNdvi && (
                            <div className="rounded-md border border-[#d6cbb5] bg-[#faf6ee] px-2.5 py-2 text-[10px] text-[#2f3933]">
                              <div className="flex items-center justify-between font-mono text-[8.5px] font-bold text-[#15803d] uppercase">
                                <span>ML NDVI Plot ({selectedFeature.nearestNdvi.distanceKm} km)</span>
                                <span>
                                  RF OOB {(selectedFeature.mlStats?.frpOobAccuracy * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="mt-0.5 font-semibold text-[#1a221d]">
                                {selectedFeature.nearestNdvi.location_name}:{" "}
                                <span className="font-mono font-bold text-[#15803d]">
                                  {selectedFeature.nearestNdvi.ndvi_before}
                                </span>{" "}
                                →{" "}
                                <span className="font-mono font-bold text-[#b91c1c]">
                                  {selectedFeature.nearestNdvi.ndvi_after}
                                </span>{" "}
                                <span className="font-mono text-[9px] text-[#5c665f]">
                                  (Δ {selectedFeature.nearestNdvi.delta})
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="rounded-md border border-dashed border-[#c7bba2] bg-[#f4eee1] px-2.5 py-2 text-[10.5px] text-[#434d46]">
                            Pilih{" "}
                            <Stabilo color="yellow">
                              bookmark di sisi kanan
                            </Stabilo>{" "}
                            untuk membaca penjelasan lengkap tiap dampak.
                          </div>
                        </div>
                      )}

                      {/* BOOKMARK PAGE 01: SINYAL SATELIT */}
                      {activeBookmark === "01" && (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between border-b border-[#e0d6c1] pb-1.5">
                            <span className="font-mono text-[10px] font-bold tracking-wider text-[#0369a1] uppercase">
                              Bab 01 · Sinyal Satelit
                            </span>
                            <span className="rounded bg-[#e0f2fe] px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-[#0369a1]">
                              {selectedFeature.tempC}°C ·{" "}
                              {selectedFeature.sarDb} dB
                            </span>
                          </div>
                          <div className="font-display text-sm font-bold text-[#1a221d]">
                            <Stabilo color="blue">
                              {selectedFeature.impactChain.sarHeadline}
                            </Stabilo>
                          </div>
                          <p className="text-[11.5px] leading-[1.7] text-[#2d3630]">
                            {selectedFeature.impactChain.isHighEnergy ? (
                              <>
                                Penurunan pantulan balik SAR (
                                <Stabilo color="yellow">
                                  {selectedFeature.sarDb} dB, Δ{" "}
                                  {selectedFeature.sarDrop} dB
                                </Stabilo>
                                ) dan energi radiatif{" "}
                                <Stabilo color="pink">
                                  {selectedFeature.frpVal} MW
                                </Stabilo>{" "}
                                menandakan{" "}
                                <Stabilo color="yellow">
                                  kanopi menipis drastis di balik kabut asap
                                </Stabilo>
                                .
                              </>
                            ) : (
                              <>
                                Anomali termal ({selectedFeature.tempK} K)
                                disertai penurunan koherensi SAR (
                                <Stabilo color="yellow">
                                  {selectedFeature.sarDb} dB
                                </Stabilo>
                                ) menunjukkan{" "}
                                <Stabilo color="blue">
                                  gangguan vegetasi aktif
                                </Stabilo>{" "}
                                yang tetap terbaca{" "}
                                <Stabilo color="yellow">
                                  menembus awan dan asap
                                </Stabilo>
                                .
                              </>
                            )}
                          </p>
                          <div className="rounded-md border border-[#e0d6c1] bg-white/70 px-2.5 py-1.5 font-mono text-[9.5px] text-[#4a554e]">
                            Sensor: {selectedFeature.sensor} · FRP{" "}
                            {selectedFeature.frpVal} MW
                            {selectedFeature.nearestNdvi
                              ? ` · ΔNDVI ${selectedFeature.nearestNdvi.delta} (${selectedFeature.nearestNdvi.location_name})`
                              : ""}
                          </div>
                          <div className="font-mono text-[8.5px] text-[#646e67]">
                            Ref: NASA Earthdata, ASF Vertex, NISAR Guide, ARSET &amp; ml/pipeline.py
                          </div>
                        </div>
                      )}

                      {/* BOOKMARK PAGE 02: AIR & GAMBUT */}
                      {activeBookmark === "02" && (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between border-b border-[#e0d6c1] pb-1.5">
                            <span className="font-mono text-[10px] font-bold tracking-wider text-[#b45309] uppercase">
                              Bab 02 · Air &amp; Gambut
                            </span>
                            <span className="rounded bg-[#fef3c7] px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-[#b45309]">
                              SMI {selectedFeature.smi} · FWI{" "}
                              {selectedFeature.fwi}
                            </span>
                          </div>
                          <div className="font-display text-sm font-bold text-[#1a221d]">
                            <Stabilo color="yellow">
                              {selectedFeature.impactChain.peatHeadline}
                            </Stabilo>
                          </div>
                          <p className="text-[11.5px] leading-[1.7] text-[#2d3630]">
                            {selectedFeature.impactChain.isPeat ? (
                              <>
                                Lahan gambut dengan kelembapan{" "}
                                <Stabilo color="yellow">
                                  SMI {selectedFeature.smi}
                                </Stabilo>{" "}
                                rentan mengalami{" "}
                                <Stabilo color="pink">
                                  kebakaran bawah permukaan (smoldering)
                                </Stabilo>{" "}
                                yang sulit padam serta{" "}
                                <Stabilo color="yellow">
                                  melepas karbon tersimpan
                                </Stabilo>
                                .
                              </>
                            ) : (
                              <>
                                Kelembapan tanah saat ini{" "}
                                <Stabilo color="yellow">
                                  SMI {selectedFeature.smi}
                                </Stabilo>{" "}
                                dengan indeks risiko api{" "}
                                <Stabilo color="blue">
                                  FWI {selectedFeature.fwi}
                                </Stabilo>
                                , tetap memerlukan{" "}
                                <Stabilo color="yellow">
                                  pemantauan kanal dan tepi hutan
                                </Stabilo>
                                .
                              </>
                            )}
                          </p>
                        </div>
                      )}

                      {/* BOOKMARK PAGE 03: KORIDOR SATWA */}
                      {activeBookmark === "03" && (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between border-b border-[#e0d6c1] pb-1.5">
                            <span className="font-mono text-[10px] font-bold tracking-wider text-[#15803d] uppercase">
                              Bab 03 · Koridor Satwa
                            </span>
                            <span className="rounded bg-[#dcfce7] px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-[#15803d]">
                              Radius{" "}
                              {selectedFeature.wildlifeScope?.radiusKm || 60}{" "}
                              km
                            </span>
                          </div>
                          <div className="font-display text-sm font-bold text-[#1a221d]">
                            <Stabilo color="green">
                              {selectedFeature.impactChain.wildlifeHeadline}
                            </Stabilo>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {(
                              selectedFeature.wildlifeScope?.speciesList || []
                            ).map((sp, idx) => (
                              <span
                                key={idx}
                                className="rounded-full border border-[#b7dcc3] bg-[#edf7f0] px-2 py-0.5 text-[9.5px] font-bold text-[#165b33]"
                              >
                                {sp.name} ({sp.status})
                              </span>
                            ))}
                          </div>
                          <p className="text-[11.5px] leading-[1.7] text-[#2d3630]">
                            {selectedFeature.wildlifeScope?.impactSummary ||
                              "Koridor habitat terancam fragmentasi dan paparan asap pekat."}{" "}
                            Fokus pantauan:{" "}
                            <Stabilo color="green">
                              {selectedFeature.wildlifeScope?.corridorName ||
                                "Koridor Hutan & Gambut Terdekat"}
                            </Stabilo>
                            .
                          </p>
                          <div className="rounded-md border border-[#e5c99b] bg-[#fdf6e7] px-2.5 py-1.5 text-[9.5px] italic text-[#7c5216]">
                            Batas bukti ilmiah:{" "}
                            <Stabilo color="yellow">
                              tekanan habitat, bukan bukti kematian satwa
                            </Stabilo>
                            .
                          </div>
                        </div>
                      )}

                      {/* BOOKMARK PAGE 04: WARGA & ASAP */}
                      {activeBookmark === "04" && (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between border-b border-[#e0d6c1] pb-1.5">
                            <span className="font-mono text-[10px] font-bold tracking-wider text-[#983226] uppercase">
                              Bab 04 · Warga &amp; Asap
                            </span>
                            <span className="rounded bg-[#fee2e2] px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-[#983226]">
                              {selectedFeature.windSpeedMs ??
                                meteomaticsData.windSpeedMs}{" "}
                              m/s
                            </span>
                          </div>
                          <div className="font-display text-sm font-bold text-[#1a221d]">
                            <Stabilo color="pink">
                              {selectedFeature.impactChain.communityHeadline}
                            </Stabilo>
                          </div>
                          <p className="text-[11.5px] leading-[1.7] text-[#2d3630]">
                            Angin{" "}
                            <Stabilo color="yellow">
                              {selectedFeature.windCompass ??
                                meteomaticsData.windCompass}{" "}
                              (
                              {selectedFeature.windSpeedMs ??
                                meteomaticsData.windSpeedMs}{" "}
                              m/s)
                            </Stabilo>{" "}
                            berpotensi membawa partikulat asap ke{" "}
                            <Stabilo color="pink">
                              permukiman hilir dan wilayah udara sekitar
                            </Stabilo>
                            .
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    /* REGIONAL OVERVIEW PAGE */
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="rounded-md border border-[#e0d6c1] bg-white/75 p-2">
                          <div className="font-mono text-[8.5px] font-bold text-[#646e67] uppercase">
                            Zona Gambut
                          </div>
                          <div className="mt-0.5 font-mono text-sm font-extrabold text-[#b45309]">
                            <Stabilo color="yellow">
                              {ecosystemSummary.peatCount}
                            </Stabilo>
                            <span className="ml-1 text-[10px] font-normal text-[#646e67]">
                              / {ecosystemSummary.total}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-md border border-[#e0d6c1] bg-white/75 p-2">
                          <div className="font-mono text-[8.5px] font-bold text-[#646e67] uppercase">
                            Irisan Habitat
                          </div>
                          <div className="mt-0.5 font-mono text-sm font-extrabold text-[#15803d]">
                            <Stabilo color="green">
                              {ecosystemSummary.wildlifeOverlapCount}
                            </Stabilo>
                            <span className="ml-1 text-[10px] font-normal text-[#646e67]">
                              titik
                            </span>
                          </div>
                        </div>

                        <div className="rounded-md border border-[#e0d6c1] bg-white/75 p-2">
                          <div className="font-mono text-[8.5px] font-bold text-[#646e67] uppercase">
                            Energi Tinggi
                          </div>
                          <div className="mt-0.5 font-mono text-sm font-extrabold text-[#983226]">
                            <Stabilo color="pink">
                              {ecosystemSummary.highIntensityCount}
                            </Stabilo>
                            <span className="ml-1 text-[10px] font-normal text-[#646e67]">
                              ≥35 MW
                            </span>
                          </div>
                        </div>

                        <div className="rounded-md border border-[#e0d6c1] bg-white/75 p-2">
                          <div className="font-mono text-[8.5px] font-bold text-[#646e67] uppercase">
                            Gambut &amp; Angin
                          </div>
                          <div className="mt-0.5 font-mono text-[11px] font-extrabold text-[#0369a1]">
                            <Stabilo color="blue">
                              SMI {meteomaticsData.soilMoistureIdx}
                            </Stabilo>
                            <span className="block text-[9px] font-normal text-[#646e67]">
                              {meteomaticsData.windSpeedMs} m/s
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 font-mono text-[9px] font-bold tracking-wider text-[#5c665f] uppercase">
                          Koridor Prioritas (Klik untuk Fokus)
                        </div>
                        <div className="divide-y divide-[#e0d6c1] rounded-md border border-[#e0d6c1] bg-white/70">
                          {ecosystemSummary.corridorImpacts
                            .slice(0, 4)
                            .map((cor, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleFocusWildlifeCorridor(cor)}
                                className="cursor-pointer flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left transition-colors hover:bg-[#edf7f0]"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-[11px] font-bold text-[#1a221d]">
                                    {cor.corridorName}
                                  </div>
                                  <div className="truncate text-[9.5px] text-[#5c665f]">
                                    {cor.island} · {cor.iucnStatus}
                                  </div>
                                </div>
                                <span className="shrink-0 font-mono text-[10px] font-bold text-[#983226]">
                                  {cor.hotspotCount} titik
                                </span>
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Side Index Bookmark Tabs (Pop out when selectedFeature is active) */}
            {selectedFeature && (
              <div className="pointer-events-auto mt-3 -ml-0.5 flex flex-col gap-1.5">
                {[
                  {
                    id: "cover",
                    label: "Ringkas",
                    color: "bg-[#2b352f] text-[#faf6ee]",
                    idle: "bg-[#e9e0ce] text-[#454f48]",
                  },
                  {
                    id: "01",
                    label: "01 · Radar",
                    color: "bg-[#0369a1] text-white",
                    idle: "bg-[#dbeafe] text-[#1e3a8a]",
                  },
                  {
                    id: "02",
                    label: "02 · Gambut",
                    color: "bg-[#b45309] text-white",
                    idle: "bg-[#fef3c7] text-[#78350f]",
                  },
                  {
                    id: "03",
                    label: "03 · Satwa",
                    color: "bg-[#15803d] text-white",
                    idle: "bg-[#dcfce7] text-[#14532d]",
                  },
                  {
                    id: "04",
                    label: "04 · Asap",
                    color: "bg-[#983226] text-white",
                    idle: "bg-[#fee2e2] text-[#7f1d1d]",
                  },
                ].map((bm) => {
                  const isActive = activeBookmark === bm.id;
                  return (
                    <button
                      key={bm.id}
                      type="button"
                      onClick={() => setActiveBookmark(bm.id)}
                      className={`cursor-pointer whitespace-nowrap rounded-r-lg border border-l-0 border-black/15 py-1.5 text-left font-mono text-[9.5px] font-bold shadow-md transition-all ${isActive
                        ? `${bm.color} w-26 pl-2.5 pr-2 translate-x-0.5`
                        : `${bm.idle} w-22 pl-2 pr-1.5 opacity-90 hover:w-25 hover:opacity-100`
                        }`}
                    >
                      {bm.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== BEFORE / AFTER COMPARISON DECK (HANYA MUNCUL SAAT KLIK ICON API) ==================== */}
        {!isEmbed && playerOpen && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 w-[calc(100%-1.5rem)] max-w-[660px] -translate-x-1/2">
            <div className="pointer-events-auto overflow-hidden rounded-2xl border border-[#cbbba0] bg-[#f8f3e8]/95 text-[#1d2621] shadow-[0_20px_48px_rgba(0,0,0,0.48),3px_3px_0_#ded4be] backdrop-blur-md">
              {/* Top Console Strip: Play/Pause + Readout + EO/SAR Switch + Close */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#dfd4be] bg-gradient-to-r from-[#163a28] via-[#1c4732] to-[#143324] px-3.5 py-2 text-[#faf6ee]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPlayingPhase((v) => !v)}
                    title={
                      isPlayingPhase
                        ? "Jeda Perbandingan"
                        : "Putar Otomatis (2014 vs Sekarang)"
                    }
                    className={`cursor-pointer flex h-8 w-8 items-center justify-center rounded-full border shadow-md transition-all ${
                      isPlayingPhase
                        ? "border-[#fca5a5]/60 bg-[#983226] text-white"
                        : "border-[#e5c787]/70 bg-[#e5c787] text-[#14261c] hover:bg-[#efd49b]"
                    }`}
                  >
                    {isPlayingPhase ? (
                      <svg
                        viewBox="0 0 16 16"
                        className="h-3.5 w-3.5 fill-current"
                        aria-hidden="true"
                      >
                        <path d="M4 3h3v10H4V3zm5 0h3v10H9V3z" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 16 16"
                        className="ml-0.5 h-3.5 w-3.5 fill-current"
                        aria-hidden="true"
                      >
                        <path d="M4 2.5l9 5.5-9 5.5V2.5z" />
                      </svg>
                    )}
                  </button>

                  <div className="flex flex-col border-l border-white/15 pl-2.5">
                    <span className="font-mono text-[9px] font-bold tracking-wider text-[#e5c787] uppercase">
                      {selectedFeature?.title || "Perbandingan Kondisi Lahan"}
                    </span>
                    <span className="text-xs font-bold tracking-tight text-white">
                      {activePhaseConfig.title}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setBasemapMode((m) =>
                        m === "sar-dark" ? "satellite" : "sar-dark",
                      )
                    }
                    className={`cursor-pointer rounded-full border px-3 py-1 font-mono text-[9.5px] font-bold transition-all ${
                      basemapMode === "sar-dark"
                        ? "border-[#7dd3fc]/60 bg-[#0369a1] text-white shadow-xs"
                        : "border-[#e5c787]/60 bg-[#faf6ee]/10 text-[#f5e7c6] hover:bg-[#faf6ee]/20"
                    }`}
                  >
                    {basemapMode === "sar-dark"
                      ? "Mode Radar SAR · Tembus Asap"
                      : "Mode Optik EO · Tembus dgn SAR →"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPlayingPhase(false);
                      setSarPhase(1);
                      setPlayerOpen(false);
                    }}
                    title="Tutup Pembanding"
                    className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs font-bold text-[#faf6ee] transition-colors hover:bg-white/25"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* 2-State Before / After Switcher */}
              <div className="grid grid-cols-2 gap-2 px-3.5 pt-2.5 pb-2">
                {SAR_TIMELINE_PHASES.map((ph) => {
                  const active = ph.id === sarPhase;
                  return (
                    <button
                      key={ph.id}
                      type="button"
                      onClick={() => {
                        setIsPlayingPhase(false);
                        setSarPhase(ph.id);
                      }}
                      className={`cursor-pointer flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-all ${
                        active
                          ? "border-transparent text-white shadow-md"
                          : "border-[#d8ccb4] bg-[#faf6ee] text-[#3f4a43] hover:border-[#1b5e3a]"
                      }`}
                      style={
                        active ? { backgroundColor: ph.color } : undefined
                      }
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-[9px] font-bold uppercase opacity-85">
                          {ph.id === 0 ? "Arsip Historis" : "Kondisi Terkini"}
                        </div>
                        <div className="truncate text-xs font-extrabold">
                          {ph.short}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold ${
                          active
                            ? "bg-black/20 text-white"
                            : "bg-[#ebe2cf] text-[#3f4a43]"
                        }`}
                      >
                        {ph.id === 0 ? "2014" : "LIVE"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Phase Description Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e4dac5] bg-[#f1eadc] px-3.5 py-1.5 text-[10.5px] text-[#2f3933]">
                <span className="min-w-0 flex-1 leading-snug">
                  {activePhaseConfig.desc}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  {selectedFeature?.nearestNdvi && (
                    <span className="rounded-md border border-[#d6cbb5] bg-[#faf6ee] px-2 py-0.5 font-mono text-[9px] font-bold text-[#0f172a]">
                      {sarPhase === 0
                        ? `NDVI ${selectedFeature.nearestNdvi.ndvi_before}`
                        : `NDVI ${selectedFeature.nearestNdvi.ndvi_after} (Δ ${selectedFeature.nearestNdvi.delta})`}
                    </span>
                  )}
                  <span className="rounded-md border border-[#d6cbb5] bg-[#faf6ee] px-2 py-0.5 font-mono text-[9px] font-bold text-[#1b5e3a]">
                    {activePhaseConfig.badge}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Legend Bar */}
      {!isEmbed && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-charcoal-800 bg-charcoal-950 px-4 py-2 text-xs text-cream-200">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-2 font-semibold">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white bg-[#983226] text-[10px] text-white">
                🔥
              </span>
              Titik Panas Fase Aktif ({phaseFireEvents.length})
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-emerald-300">
              <span>🦧🐅🦜</span>
              Koridor Habitat Satwa Endemik (IUCN CR/EN)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs border border-sky-400 bg-sky-500/40" />
              Jejak Sapuan Radar SAR (NISAR / Sentinel-1)
            </span>
          </div>

          <div className="max-w-md">
            <DonationDisclaimer compact className="text-cream-400" />
          </div>
        </div>
      )}
    </div>
  );
}
