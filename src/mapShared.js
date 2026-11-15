/**
 * Helper peta bersama untuk menu Map (informasi) dan menu Radar Mission (peta misi game).
 * Basemap satelit, pin kebakaran, aset satwa, serta perhitungan titik api & pin satwa
 * dipakai oleh kedua halaman agar datanya selalu sama.
 */
import {
  buildNasaWorldviewGlobalAndIndonesiaEvents,
  enrichFireHotspot,
  INDONESIA_BBOX,
  resolveIndonesiaWildlifeScope,
} from "./nasaScraper";

/**
 * MapLibre membuka kotak atribusi "compact" saat peta pertama dimuat. Di HP kotak itu
 * menutupi tengah peta, jadi kita tutup (tinggal ikon ⓘ yang bisa diklik untuk membuka).
 */
export function collapseAttribution(map) {
  const collapse = () => {
    map
      .getContainer()
      .querySelectorAll(".maplibregl-ctrl-attrib.maplibregl-compact-show")
      .forEach((el) => el.classList.remove("maplibregl-compact-show"));
  };
  map.once("load", collapse);
  map.once("idle", collapse);
}

/**
 * Plot NDVI terdekat dari output pipeline ML (ml/pipeline.py → ml-scores.json / ml/ndvi_samples.json).
 * Mengembalikan plot + delta (after − before) + jarak km.
 */
export function findNearestNdviPlot(lat, lon, plots) {
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

const KALIMANTAN_REGION_CODES = ["central", "west", "south", "east", "north"];

export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Gabungkan & seimbangkan titik api Indonesia (live FIRMS/EONET + arsip multi-pulau),
 * buang duplikat koordinat, lalu saring berdasarkan rentang waktu ("24h" | "3d" | "7d").
 */
export function buildIndonesiaFireEvents({
  fireEvents = [],
  eonetWildfires = [],
  timeFilter = "7d",
} = {}) {
  const multiIslandArchive = buildNasaWorldviewGlobalAndIndonesiaEvents();
  const kalimantanArchive = multiIslandArchive.filter((h) =>
    KALIMANTAN_REGION_CODES.includes(h.region_code),
  );

  const rawLive = [
    ...eonetWildfires,
    ...(Array.isArray(fireEvents) ? fireEvents : []),
  ].map((f, idx) => enrichFireHotspot(f, idx));

  const liveKalimantan = rawLive.filter((h) =>
    KALIMANTAN_REGION_CODES.includes(h.region_code),
  );
  const liveOtherIslands = rawLive.filter(
    (h) => !KALIMANTAN_REGION_CODES.includes(h.region_code),
  );

  // Batasi deteksi live non-Kalimantan per kabupaten (maks 6) agar Kalimantan tidak tertutup
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
    (f) => f.is_live === true && !f.is_baseline && f.acq_date !== "2024-09-18",
  );

  const activeSource = liveDetections.length >= 25 ? liveDetections : enrichedPool;
  const realtimeActive = liveDetections.length > 0;

  // Buang pin yang koordinatnya sama
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
    const isKal = KALIMANTAN_REGION_CODES.includes(fire.region_code);
    const fireTime = new Date(fire.timestamp || fire.acq_date).getTime();
    if (maxTime > 0 && !Number.isNaN(fireTime)) {
      if (timeFilter === "24h") {
        if (isKal && idx % 2 === 0) return true;
        if (maxTime - fireTime > 24 * 60 * 60 * 1000 && idx % 3 !== 0) return false;
      } else if (timeFilter === "3d") {
        if (isKal && idx % 3 !== 2) return true;
        if (maxTime - fireTime > 3 * 24 * 60 * 60 * 1000 && idx % 2 === 1) return false;
      }
    }
    return true;
  });

  return {
    filteredFireEvents: timeFiltered.slice(0, 260),
    isRealtimeFireMode: realtimeActive,
  };
}

/**
 * Pin satwa yang muncul di sekitar titik kebakaran aktif:
 * 1. Observasi GBIF nyata dalam radius 140 km dari titik api.
 * 2. Untuk klaster api lain (~110 km) tanpa observasi, satwa endemik koridor terdekat.
 */
export function buildFireTriggeredWildlifePins(fires = [], gbifOccurrences = []) {
  if (!fires || fires.length === 0) return [];

  const pins = [];
  gbifOccurrences.forEach((occ) => {
    const oLat = Number(occ.latitude);
    const oLon = Number(occ.longitude);
    if (Number.isNaN(oLat) || Number.isNaN(oLon)) return;
    const nearFire = fires.some((f) => {
      const fLat = Number(f.latitude);
      const fLon = Number(f.longitude);
      return (
        !Number.isNaN(fLat) &&
        !Number.isNaN(fLon) &&
        haversineKm(oLat, oLon, fLat, fLon) <= 140
      );
    });
    if (nearFire) pins.push(occ);
  });

  const seenCells = new Set();
  fires.forEach((f, idx) => {
    const fLat = Number(f.latitude);
    const fLon = Number(f.longitude);
    if (Number.isNaN(fLat) || Number.isNaN(fLon)) return;
    const cellKey = `${Math.round(fLat * 0.9)}:${Math.round(fLon * 0.9)}`;
    if (seenCells.has(cellKey)) return;
    seenCells.add(cellKey);

    const alreadyHasPin = pins.some(
      (p) => haversineKm(Number(p.latitude), Number(p.longitude), fLat, fLon) <= 95,
    );
    if (alreadyHasPin) return;

    const scope = resolveIndonesiaWildlifeScope(fLat, fLon);
    const primary = scope?.speciesList?.[0];
    if (!primary) return;

    pins.push({
      id: `auto-wildlife-${idx}-${cellKey}`,
      species: primary.name,
      scientific_name: primary.sci || "",
      latitude: Number((fLat + 0.11).toFixed(4)),
      longitude: Number((fLon + 0.11).toFixed(4)),
      year: 2026,
      event_date: f.acq_date || "LIVE",
      province: f.provinsi || scope.island || "Indonesia",
      locality: scope.corridorName || f.kabupaten || "Wildfire Corridor",
      dataset: "IUCN / H.O.M.E. Corridor Match",
      statusOverride: primary.status,
    });
  });

  return pins;
}

export const WILDLIFE_ART_MAP = {
  "bornean-orangutan": "/assets/art/orangutan.svg",
  "bornean orangutan": "/assets/art/orangutan.svg",
  "sunda-pangolin": "/assets/art/pangolin.svg",
  "sunda pangolin": "/assets/art/pangolin.svg",
  "sun-bear": "/assets/art/sunbear.svg",
  "sun bear": "/assets/art/sunbear.svg",
  "mouse-deer": "/assets/art/mousedeer.svg",
  "lesser mouse deer": "/assets/art/mousedeer.svg",
  "helmeted-hornbill": "/assets/art/hornbill.svg",
  "helmeted hornbill": "/assets/art/hornbill.svg",
};

export function getWildlifeArtUrl(speciesIdOrName = "") {
  const key = String(speciesIdOrName).toLowerCase().trim();
  return WILDLIFE_ART_MAP[key] || "/assets/art/orangutan.svg";
}

const WILDLIFE_PHOTO_MAP = {
  "bornean-orangutan":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Bornean_orangutan_(Pongo_pygmaeus),_Tanjung_Putting_National_Park_05.jpg?width=480",
  "bornean orangutan":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Bornean_orangutan_(Pongo_pygmaeus),_Tanjung_Putting_National_Park_05.jpg?width=480",
  "sunda-pangolin":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Pangolin_borneo.jpg?width=480",
  "sunda pangolin":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Pangolin_borneo.jpg?width=480",
  "sun-bear":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Sun_Bear.jpg?width=480",
  "sun bear":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Sun_Bear.jpg?width=480",
  "mouse-deer":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Adult_Lesser_mouse-deer_(Tragulus_kanchil),_Singapore_-_20141001.jpg?width=480",
  "lesser mouse deer":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Adult_Lesser_mouse-deer_(Tragulus_kanchil),_Singapore_-_20141001.jpg?width=480",
  "helmeted-hornbill":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Helmeted_Hornbill.jpg?width=480",
  "helmeted hornbill":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Helmeted_Hornbill.jpg?width=480",
  "sumatran tiger":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Panthera_tigris_sumatrae.jpg?width=480",
  "sumatran elephant":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Elephant_Sumatra_ProfilG.jpg?width=480",
  "sumatran orangutan":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Bornean_orangutan_(Pongo_pygmaeus),_Tanjung_Putting_National_Park_05.jpg?width=480",
  "javan hawk-eagle":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Nisaetus_bartelsi_(Elang_Jawa).jpg?width=480",
  "javan leopard":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Panthera_pardus_melas_(Tierpark_Berlin)_-_1009-891-(118).jpg?width=480",
  "komodo dragon":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Varanus_komodoensis.JPG?width=480",
  "yellow-crested cockatoo":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Helmeted_Hornbill.jpg?width=480",
};

export function getWildlifePhotoUrl(speciesIdOrName = "") {
  const key = String(speciesIdOrName).toLowerCase().trim();
  return WILDLIFE_PHOTO_MAP[key] || getWildlifeArtUrl(speciesIdOrName);
}


// Profil cadangan untuk spesies di luar iucn-species.json (Sumatra, Jawa, Nusa Tenggara)
export const WILDLIFE_SPECIES_PROFILES = {
  "sumatran tiger": {
    red_list_status: "CR",
    red_list_category: "Critically Endangered",
    population_trend: "decreasing",
    story_role: "Apex Predator of Sumatran Peatlands",
    habitat:
      "Lowland tropical rainforest, peat swamp forests, and montane forest corridors in Sumatra",
    description:
      "Fewer than 400 Sumatran tigers remain in the wild. Peatland fires and forest clearing fragment their large territories, pushing tigers closer to plantation edges.",
    threats: [
      "peatland fires",
      "habitat fragmentation",
      "snare poaching",
      "human-wildlife conflict",
    ],
  },
  "sumatran elephant": {
    red_list_status: "CR",
    red_list_category: "Critically Endangered",
    population_trend: "decreasing",
    story_role: "Keystone Seed Disperser",
    habitat:
      "Lowland broadleaf forests, peat swamps, and savanna fringes across Sumatra",
    description:
      "Sumatran elephants migrate along ancient riverine and peat corridors. Fires destroy forage plants and force herds into agricultural zones.",
    threats: [
      "habitat loss",
      "fire & smoke haze",
      "corridor blocking",
      "human-elephant conflict",
    ],
  },
  "javan hawk-eagle": {
    red_list_status: "EN",
    red_list_category: "Endangered",
    population_trend: "decreasing",
    story_role: "Canopy Raptor of Java (Garuda)",
    habitat:
      "Montane and sub-montane tropical forests on volcanic slopes across Java",
    description:
      "Endemic to Java and the inspiration for Indonesia's national emblem. Dry-season highland fires destroy tall emergent nesting trees.",
    threats: [
      "montane forest fire",
      "habitat fragmentation",
      "illegal wildlife trade",
    ],
  },
  "javan leopard": {
    red_list_status: "CR",
    red_list_category: "Critically Endangered",
    population_trend: "decreasing",
    story_role: "Last Big Cat of Java",
    habitat:
      "Dense montane rainforests, teak-forest buffers, and volcanic reserves in Java",
    description:
      "The sole remaining large carnivore on Java. Wildfire and drought shrink prey density and isolate small populations across fragmented mountain parks.",
    threats: ["forest fires", "habitat loss", "prey depletion", "poaching"],
  },
  "komodo dragon": {
    red_list_status: "EN",
    red_list_category: "Endangered",
    population_trend: "stable",
    story_role: "Apex Savanna Reptile",
    habitat: "Dry tropical savanna, monsoon forests, and coastal scrublands",
    description:
      "Savanna grass fires during dry monsoon peaks reduce deer prey availability and scorch ground-nesting burrows.",
    threats: ["savanna wildfires", "prey decline", "climate warming"],
  },
};


// Region Focus: 100% Indonesian Archipelago (overview + per-island)
export const REGION_COORDINATES = {
  indonesia: {
    center: [117.2, -2.4],
    zoom: 4.55,
    pitch: 0,
    bearing: 0,
    label: "🇮🇩 Indonesia",
  },
  sumatera: {
    center: [101.6, -0.6],
    zoom: 5.7,
    pitch: 0,
    bearing: 0,
    label: "🐅 Sumatra",
  },
  kalimantan: {
    center: [113.8, -1.2],
    zoom: 5.9,
    pitch: 0,
    bearing: 0,
    label: "🦧 Kalimantan",
  },
  jawa: {
    center: [110.0, -7.3],
    zoom: 6.6,
    pitch: 0,
    bearing: 0,
    label: "🦏 Java",
  },
  sulawesi: {
    center: [120.8, -1.8],
    zoom: 6.2,
    pitch: 0,
    bearing: 0,
    label: "🐒 Sulawesi",
  },
  nusa_tenggara: {
    center: [119.5, -8.6],
    zoom: 6.3,
    pitch: 0,
    bearing: 0,
    label: "🦎 Bali & Nusa",
  },
  papua: {
    center: [137.8, -4.2],
    zoom: 5.9,
    pitch: 0,
    bearing: 0,
    label: "🦜 Papua",
  },
};


// Geografi dasar Pulau Kalimantan (offline fallback)
export const BORNEO_BASE_GEOJSON = {
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


/**
 * Menghasilkan SVG Ikon Pin Kebakaran:
 * - Pin bulat berbingkai putih + garis tepi gelap tipis dengan ujung lancip (V-tip) di bawah
 * - Lingkaran dalam merah bata (#983226)
 * - Siluet kobaran api putih 3 lidah api dengan inti merah bata di bawahnya
 */
export function getFirePinSvg(width = 34, height = 40, color = "#983226") {
  return `
    <svg viewBox="0 0 40 46" width="${width}" height="${height}" style="display: block; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.65)); pointer-events: none;">
      <path
        d="M20 2 C11.16 2 4 9.16 4 18 C4 23.7 6.98 28.7 11.45 31.52 L20 42.5 L28.55 31.52 C33.02 28.7 36 23.7 36 18 C36 9.16 28.84 2 20 2 Z"
        fill="#ffffff"
        stroke="#262626"
        stroke-width="1.1"
      />
      <circle cx="20" cy="18" r="13.5" fill="${color}" />
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
        fill="${color}"
        d="M20.2 24.5 C18.8 24.5 17.7 23.3 17.9 21.8 C18.1 20.4 19.5 19.4 20.3 18.0 C21.1 19.5 22.2 20.6 22.3 22.0 C22.4 23.4 21.4 24.5 20.2 24.5 Z"
      />
    </svg>
  `;
}


/**
 * Style Basemap Satelit NASA Worldview
 */
export function buildNasaBasemapStyle() {
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

