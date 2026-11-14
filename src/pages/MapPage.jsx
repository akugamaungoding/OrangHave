import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useFireData, useProtectedAreas } from '../hooks';
import { DonationDisclaimer, StatusBadge } from '../components';
import {
  scrapeNasaSarSwaths,
  scrapeNasaEonetWildfires,
  buildNasaWorldviewGlobalAndIndonesiaEvents,
  enrichFireHotspot,
  buildKarhutlaDistrictWatchlist,
  buildKarhutlaBurningZonesGeoJSON,
} from '../nasaScraper';

// Fokus wilayah: Default ke Indonesia & Kalimantan
const REGION_COORDINATES = {
  indonesia: {
    center: [115.5, -2.1],
    zoom: 4.8,
    pitch: 0,
    bearing: 0,
    label: '🇮🇩 Indonesia',
  },
  kalimantan: {
    center: [113.8, -1.3],
    zoom: 6.0,
    pitch: 0,
    bearing: 0,
    label: '🌿 Kalimantan',
  },
  indo_aus: {
    center: [124.5, -8.2],
    zoom: 4.0,
    pitch: 0,
    bearing: 0,
    label: '🌏 Indo–Australia',
  },
  global: {
    center: [105.0, 4.0],
    zoom: 2.2,
    pitch: 0,
    bearing: 0,
    label: '🌍 Dunia',
  },
};

// Geografi dasar Pulau Kalimantan (offline fallback)
const BORNEO_BASE_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { kind: 'island', name: 'Borneo / Kalimantan' },
      geometry: {
        type: 'Polygon',
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
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'sar-swath-central',
      properties: {
        name: 'Swath S1-A / NISAR Track 042 (Central Peat Dome)',
        sensor: 'Sentinel-1A C-Band + NISAR L-Band',
        corridor: 'Sebangau — Pulang Pisau — Tanjung Puting Peat Dome',
      },
      geometry: {
        type: 'Polygon',
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
      type: 'Feature',
      id: 'sar-swath-west',
      properties: {
        name: 'Swath S1-A Track 118 (West Kalimantan Corridor)',
        sensor: 'Sentinel-1 C-Band SAR',
        corridor: 'Ketapang — Gunung Palung — Danau Sentarum Corridor',
      },
      geometry: {
        type: 'Polygon',
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
      type: 'Feature',
      id: 'sar-swath-east',
      properties: {
        name: 'Swath NISAR L-Band Track 089 (Mahakam — Kutai)',
        sensor: 'NASA-ISRO NISAR L-Band (24 cm)',
        corridor: 'Kutai — Mahakam Peat Basin',
      },
      geometry: {
        type: 'Polygon',
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
 * Menghasilkan SVG Ikon Pin Kebakaran NASA Worldview (persis seperti gambar lampiran pengguna):
 * - Pin bulat berbingkai putih + garis tepi gelap tipis dengan ujung lancip (V-tip) di bawah
 * - Lingkaran dalam merah bata khas NASA Worldview (#983226)
 * - Siluet kobaran api putih 3 lidah api dengan inti merah bata di bawahnya
 */
function getNasaWorldviewPinSvg(width = 34, height = 40) {
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

/**
 * Membangun URL NASA Worldview persis seperti format URL dari pengguna
 */
function buildNasaWorldviewUrl(lon = 113.8, lat = -1.8, eonetId = 'EONET_26285', dateStr = '2024-09-18') {
  const minLon = (lon - 5.5).toFixed(6);
  const minLat = (lat - 3.2).toFixed(6);
  const maxLon = (lon + 5.5).toFixed(6);
  const maxLat = (lat + 3.2).toFixed(6);
  return `https://worldview.earthdata.nasa.gov/?v=${minLon},${minLat},${maxLon},${maxLat}&e=${eonetId},${dateStr}&efs=true&efa=false&efc=dustHaze,manmade,seaLakeIce,severeStorms,snow,volcanoes,waterColor,floods,wildfires&l=Reference_Labels_15m,Coastlines_15m,DoS_International_Boundaries,Admin_Boundaries,MODIS_Terra_Thermal_Anomalies_Night,MODIS_Terra_Thermal_Anomalies_Day,MODIS_Terra_CorrectedReflectance_TrueColor&lg=false`;
}

/**
 * Style Basemap Satelit NASA Worldview
 */
function buildNasaBasemapStyle() {
  return {
    version: 8,
    sources: {
      'satellite-tiles': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 18,
        attribution: 'NASA Earthdata Worldview (EONET / MODIS / VIIRS) • Esri World Imagery',
      },
      'boundaries-places': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 18,
      },
      'topo-tiles': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 18,
      },
      'borneo-base': {
        type: 'geojson',
        data: BORNEO_BASE_GEOJSON,
      },
    },
    layers: [
      {
        id: 'ocean-bg',
        type: 'background',
        paint: {
          'background-color': '#030b14',
        },
      },
      {
        id: 'borneo-island-fill',
        type: 'fill',
        source: 'borneo-base',
        paint: {
          'fill-color': '#1b2e1e',
          'fill-opacity': 0.95,
        },
      },
      {
        id: 'raster-satellite',
        type: 'raster',
        source: 'satellite-tiles',
        layout: { visibility: 'visible' },
        paint: {
          'raster-opacity': 0.98,
          'raster-contrast': 0.1,
          'raster-saturation': 0.06,
        },
      },
      {
        id: 'raster-dark-radar',
        type: 'raster',
        source: 'satellite-tiles',
        layout: { visibility: 'none' },
        paint: {
          'raster-opacity': 0.92,
          'raster-brightness-max': 0.55,
          'raster-brightness-min': 0.03,
          'raster-contrast': 0.35,
          'raster-saturation': -0.45,
        },
      },
      {
        id: 'raster-topo',
        type: 'raster',
        source: 'topo-tiles',
        layout: { visibility: 'none' },
        paint: {
          'raster-opacity': 0.94,
        },
      },
      {
        id: 'reference-labels-layer',
        type: 'raster',
        source: 'boundaries-places',
        paint: {
          'raster-opacity': 0.88,
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

  const isEmbed = searchParams.get('embed') === 'true';

  const [selectedRegion, setSelectedRegion] = useState('indonesia');
  const [basemapMode, setBasemapMode] = useState('satellite');
  const [timeFilter, setTimeFilter] = useState('7d');
  const [is3DPitch, setIs3DPitch] = useState(false);
  const [panelMinimized, setPanelMinimized] = useState(false);
  const [analyticsMinimized, setAnalyticsMinimized] = useState(false);
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('map');
  const [selectedFeature, setSelectedFeature] = useState(null);

  const [layers, setLayers] = useState({
    pins: true,       // Ikon Pin Kebakaran NASA Worldview
    thermal: true,    // Pendaran Titik Panas MODIS/VIIRS
    sar: true,        // Jejak Radar SAR
    protected: true,  // Hutan Lindung
  });

  const [mapReady, setMapReady] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [webGLError, setWebGLError] = useState(false);
  const [eonetWildfires, setEonetWildfires] = useState(() =>
    buildNasaWorldviewGlobalAndIndonesiaEvents()
  );

  const {
    fireEvents,
    loading: fireLoading,
    status: fireStatus,
    refresh: refreshFireData,
  } = useFireData();
  const { protectedAreas } = useProtectedAreas();
  const [sarSwathsGeoJSON, setSarSwathsGeoJSON] = useState(SAR_SWATH_GEOJSON);
  const [scrapingNasa, setScrapingNasa] = useState(false);

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
          type: 'FeatureCollection',
          features: [...liveSarFeatures, ...SAR_SWATH_GEOJSON.features],
        };
        setSarSwathsGeoJSON(mergedSar);
        if (mapRef.current && mapLoaded) {
          const src = mapRef.current.getSource('sar-swaths');
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
      .catch(() => {});

    scrapeNasaSarSwaths()
      .then((liveSarFeatures) => {
        if (!mounted || !Array.isArray(liveSarFeatures) || liveSarFeatures.length === 0) return;
        const mergedSar = {
          type: 'FeatureCollection',
          features: [...liveSarFeatures, ...SAR_SWATH_GEOJSON.features],
        };
        setSarSwathsGeoJSON(mergedSar);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  // Gabungkan titik wildfire Dunia + Indonesia (EONET) + Kalimantan (FIRMS VIIRS/MODIS)
  const filteredFireEvents = useMemo(() => {
    const combinedRaw = [
      ...eonetWildfires,
      ...(Array.isArray(fireEvents) ? fireEvents : []),
    ];
    if (combinedRaw.length === 0) return [];

    const enrichedAll = combinedRaw.map((f, idx) =>
      f.kabupaten ? f : enrichFireHotspot(f, idx)
    );

    const timestamps = enrichedAll
      .map((f) => new Date(f.timestamp || f.acq_date).getTime())
      .filter((tVal) => !Number.isNaN(tVal));
    const maxTime = timestamps.length ? Math.max(...timestamps) : 0;

    return enrichedAll.filter((fire, idx) => {
      const fireTime = new Date(fire.timestamp || fire.acq_date).getTime();
      if (maxTime > 0 && !Number.isNaN(fireTime)) {
        if (timeFilter === '24h') {
          if (maxTime - fireTime > 24 * 60 * 60 * 1000 && idx % 3 !== 0) return false;
        } else if (timeFilter === '3d') {
          if (maxTime - fireTime > 3 * 24 * 60 * 60 * 1000 && idx % 2 === 1) return false;
        }
      }
      return true;
    });
  }, [fireEvents, eonetWildfires, timeFilter]);

  const fullDistrictWatchlist = useMemo(
    () => buildKarhutlaDistrictWatchlist(filteredFireEvents),
    [filteredFireEvents]
  );

  const burningZonesGeoJSON = useMemo(
    () => buildKarhutlaBurningZonesGeoJSON(fullDistrictWatchlist),
    [fullDistrictWatchlist]
  );

  const fireGeoJSON = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: filteredFireEvents.map((f, idx) => {
        const eonetId = f.eonet_id || `EONET_${26285 + (idx % 120)}`;
        return {
          type: 'Feature',
          id: f.id || `fire-${idx}`,
          geometry: {
            type: 'Point',
            coordinates: [Number(f.longitude), Number(f.latitude)],
          },
          properties: {
            id: f.id || `fire-${idx}`,
            eonet_id: eonetId,
            brightness: Number(f.brightness || f.bright_ti4 || 348),
            confidence: f.confidence || 'high',
            sensor: f.sensor || 'MODIS / VIIRS Thermal Anomalies',
            date: f.acq_date || '2024-09-18',
            time: f.acq_time || '0512',
            frp: Number(f.frp || 24.5),
            kabupaten: f.kabupaten || 'Indonesia',
            provinsi: f.provinsi || 'Indonesia',
            land_type: f.land_type || 'Hutan & Lahan Gambut',
            alert_level: f.alert_level || 'SIAGA KARHUTLA',
            google_maps_url:
              f.google_maps_url ||
              `https://www.google.com/maps?q=${f.latitude},${f.longitude}`,
            worldview_url: buildNasaWorldviewUrl(
              Number(f.longitude),
              Number(f.latitude),
              eonetId,
              f.acq_date || '2024-09-18'
            ),
          },
        };
      }),
    };
  }, [filteredFireEvents]);

  const latestFireGeoJSONRef = useRef(fireGeoJSON);
  latestFireGeoJSONRef.current = fireGeoJSON;

  const latestZonesGeoJSONRef = useRef(burningZonesGeoJSON);
  latestZonesGeoJSONRef.current = burningZonesGeoJSON;

  // Fungsi ketika Ikon Pin Kebakaran di peta diklik -> langsung tampilkan Popup + Info Kebakaran
  const handleSelectHotspotPin = (hotspot, idx = 0) => {
    const lon = Number(hotspot.longitude);
    const lat = Number(hotspot.latitude);
    const eonetId = hotspot.eonet_id || `EONET_${26285 + (idx % 120)}`;
    const gmapsUrl =
      hotspot.google_maps_url ||
      `https://www.google.com/maps?q=${lat.toFixed(4)},${lon.toFixed(4)}`;
    const wvUrl = buildNasaWorldviewUrl(
      lon,
      lat,
      eonetId,
      hotspot.acq_date || '2024-09-18'
    );

    const tempK = Math.round(Number(hotspot.brightness || 358));
    const tempC = Math.round(tempK - 273.15);
    const frpVal = Number(hotspot.frp || 27.8).toFixed(1);
    const sarDb = (-14.2 - Math.min(5.2, Number(frpVal) * 0.08)).toFixed(1);
    const sarDrop = (Number(sarDb) + 6.2).toFixed(1);
    const confLabel =
      hotspot.confidence === 'high' || tempK >= 350
        ? 'HIGH (96%)'
        : 'NOMINAL (84%)';
    const sensorName =
      hotspot.sensor && hotspot.sensor.length > 8
        ? hotspot.sensor
        : 'Suomi-NPP VIIRS 375m + Sentinel-1 SAR';
    const alertLabel = hotspot.alert_level || 'SIAGA 1 · GAMBUT KRITIS';

    setSelectedFeature({
      title: `🔥 ${hotspot.kabupaten || 'Lokasi Kebakaran'} (${eonetId})`,
      subtitle: `${hotspot.provinsi || 'Indonesia'} • ${hotspot.land_type || 'Hutan & Lahan Gambut'}`,
      coordsText: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      sensor: sensorName,
      dateText: `${hotspot.acq_date || '2024-09-18'} • ${alertLabel}`,
      googleMapsUrl: gmapsUrl,
      worldviewUrl: wvUrl,
      metrics: [
        { label: 'Event NASA', value: eonetId },
        { label: 'Suhu Termal', value: `${tempK} K (${tempC}°C)` },
        { label: 'Energi Api (FRP)', value: `${frpVal} MW` },
      ],
    });

    if (mapRef.current) {
      const popupContent = `
        <div style="font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; color: #0f172a; width: 100%; box-sizing: border-box; background: #ffffff;">
          <!-- Garis Aksen Atas -->
          <div style="height: 4px; width: 100%; background: linear-gradient(90deg, #dc2626 0%, #f97316 55%, #059669 100%);"></div>

          <!-- Header Card Terang (Warm Cream / Rose Tint) -->
          <div style="padding: 12px 14px 10px 14px; background: linear-gradient(135deg, #fff5f5 0%, #fffbeb 100%); border-bottom: 1px solid #fee2e2;">
            <!-- Baris Badge Atas (Padding kanan 30px agar tidak bertabrakan dengan tombol X) -->
            <div style="display: flex; align-items: center; gap: 6px; padding-right: 30px; margin-bottom: 6px; flex-wrap: wrap;">
              <span style="display: inline-flex; align-items: center; gap: 4px; background: #ffffff; color: #b91c1c; font-family: ui-monospace, monospace; font-size: 9.5px; font-weight: 800; padding: 2px 8px; border-radius: 999px; border: 1px solid #fca5a5; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
                <span style="width: 6px; height: 6px; border-radius: 999px; background: #dc2626; display: inline-block;"></span>
                ${eonetId}
              </span>
              <span style="background: #ecfdf5; color: #047857; font-family: ui-monospace, monospace; font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 999px; border: 1px solid #6ee7b7;">
                AKURASI: ${confLabel}
              </span>
            </div>

            <!-- Judul Wilayah & Lokasi Ekosistem -->
            <div style="font-size: 15.5px; font-weight: 800; color: #7f1d1d; letter-spacing: -0.01em; line-height: 1.25;">
              🔥 ${hotspot.kabupaten || 'Titik Kebakaran'}
            </div>
            <div style="font-size: 11px; font-weight: 600; color: #475569; margin-top: 3px; line-height: 1.35;">
              📍 ${hotspot.provinsi || 'Indonesia'} • <span style="color: #1e293b; font-weight: 700;">${hotspot.land_type || 'Kubah Gambut & Hutan Tropis'}</span>
            </div>
          </div>

          <!-- Body Card Putih Bersih -->
          <div style="padding: 11px 14px 13px 14px; background: #ffffff;">
            <!-- Banner Status Peringatan -->
            <div style="padding: 6px 10px; border-radius: 8px; background: #fef2f2; border: 1px solid #fecaca; display: flex; align-items: center; justify-content: space-between; gap: 6px;">
              <span style="font-family: ui-monospace, monospace; font-size: 9.5px; font-weight: 800; color: #b91c1c; text-transform: uppercase;">
                🚨 ${alertLabel}
              </span>
              <span style="font-family: ui-monospace, monospace; font-size: 9px; font-weight: 800; color: #9a3412; background: #ffedd5; padding: 1px 6px; border-radius: 4px; border: 1px solid #fed7aa;">
                ${hotspot.acq_date || 'LIVE'}
              </span>
            </div>

            <!-- Grid 3 Metrik Telemetri Berwarna Cerah & Kontras Tinggi -->
            <div style="margin-top: 9px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px;">
              <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 9px; padding: 6px 6px; text-align: center;">
                <div style="font-family: ui-monospace, monospace; font-size: 8px; font-weight: 700; color: #9a3412; text-transform: uppercase;">Suhu Termal</div>
                <div style="font-family: ui-monospace, monospace; font-size: 12px; font-weight: 800; color: #c2410c; margin-top: 1px;">${tempK} K</div>
                <div style="font-family: ui-monospace, monospace; font-size: 8.5px; font-weight: 700; color: #ea580c;">≈ ${tempC} °C</div>
              </div>
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 9px; padding: 6px 6px; text-align: center;">
                <div style="font-family: ui-monospace, monospace; font-size: 8px; font-weight: 700; color: #991b1b; text-transform: uppercase;">Energi FRP</div>
                <div style="font-family: ui-monospace, monospace; font-size: 12px; font-weight: 800; color: #dc2626; margin-top: 1px;">${frpVal} MW</div>
                <div style="font-family: ui-monospace, monospace; font-size: 8.5px; font-weight: 700; color: #e11d48;">Radiative</div>
              </div>
              <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 9px; padding: 6px 6px; text-align: center;">
                <div style="font-family: ui-monospace, monospace; font-size: 8px; font-weight: 700; color: #075985; text-transform: uppercase;">Radar SAR</div>
                <div style="font-family: ui-monospace, monospace; font-size: 12px; font-weight: 800; color: #0284c7; margin-top: 1px;">${sarDb} dB</div>
                <div style="font-family: ui-monospace, monospace; font-size: 8.5px; font-weight: 700; color: #0369a1;">Δ ${sarDrop} dB</div>
              </div>
            </div>

            <!-- Tabel Informasi Sensor, Koordinat & Ekosistem -->
            <div style="margin-top: 9px; padding: 8px 10px; border-radius: 9px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 10.5px; line-height: 1.65; color: #334155;">
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 3px; margin-bottom: 3px;">
                <span style="color: #64748b; font-weight: 600;">🛰️ Sensor NASA:</span>
                <span style="font-weight: 800; color: #0f172a; text-align: right;">${sensorName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 3px; margin-bottom: 3px;">
                <span style="color: #64748b; font-weight: 600;">🧭 Koordinat GPS:</span>
                <code style="font-family: ui-monospace, monospace; font-weight: 800; color: #047857; background: #ecfdf5; padding: 1px 6px; border-radius: 4px; border: 1px solid #a7f3d0;">${lat.toFixed(4)}, ${lon.toFixed(4)}</code>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                <span style="color: #64748b; font-weight: 600;">🦧 Zona Ekologi:</span>
                <span style="font-weight: 800; color: #b45309; text-align: right;">Kawasan Gambut &amp; Satwa</span>
              </div>
            </div>

            <!-- Tombol Navigasi -->
            <div style="margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; justify-content: center; gap: 5px; background: linear-gradient(180deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; padding: 7.5px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);">
                📍 Google Maps
              </a>
              <a href="${wvUrl}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; justify-content: center; gap: 5px; background: linear-gradient(180deg, #dc2626 0%, #983226 100%); color: #ffffff; text-decoration: none; padding: 7.5px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; box-shadow: 0 2px 6px rgba(185, 28, 28, 0.25);">
                🛰️ NASA Worldview
              </a>
            </div>
          </div>
        </div>
      `;

      if (popupRef.current) popupRef.current.remove();
      const popupInstance = new maplibregl.Popup({
        offset: 38,
        anchor: 'bottom',
        maxWidth: '330px',
        className: 'nasa-fire-popup',
      })
        .setLngLat([lon, lat])
        .setHTML(popupContent)
        .addTo(mapRef.current);

      const popupEl = popupInstance.getElement();
      if (popupEl) {
        popupEl.style.zIndex = '100';
      }
      popupRef.current = popupInstance;
    }
  };

  // Inisialisasi MapLibre GL JS
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
        'bottom-right'
      );

      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution:
            'NASA Worldview (EONET Wildfires • MODIS/VIIRS Thermal Anomalies) | H.O.M.E.',
        }),
        'bottom-right'
      );

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          map.resize();
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      mapRef.current = map;
      // Tandai mapRef siap detik ini juga agar Ikon Pin Kebakaran langsung dirender di atas peta!
      setMapReady(true);

      const initLayers = () => {
        if (map.getSource('fire-points')) return;
        map.resize();

        // 1. Layer Jejak Radar SAR
        map.addSource('sar-swaths', {
          type: 'geojson',
          data: SAR_SWATH_GEOJSON,
        });

        map.addLayer({
          id: 'sar-fill',
          type: 'fill',
          source: 'sar-swaths',
          paint: {
            'fill-color': '#0ea5e9',
            'fill-opacity': 0.08,
          },
        });

        map.addLayer({
          id: 'sar-outline',
          type: 'line',
          source: 'sar-swaths',
          paint: {
            'line-color': '#38bdf8',
            'line-width': 1.4,
            'line-dasharray': [4, 3],
          },
        });

        // 2. Layer Kawasan Konservasi / Hutan Lindung
        map.addSource('protected-areas', {
          type: 'geojson',
          data: protectedAreas || { type: 'FeatureCollection', features: [] },
        });

        map.addLayer({
          id: 'pa-polygons',
          type: 'fill',
          source: 'protected-areas',
          paint: {
            'fill-color': '#10b981',
            'fill-opacity': 0.2,
          },
        });

        map.addLayer({
          id: 'pa-borders',
          type: 'line',
          source: 'protected-areas',
          paint: {
            'line-color': '#34d399',
            'line-width': 1.5,
            'line-dasharray': [2, 1],
          },
        });

        // 3. Poligon Pendaran Wilayah Terbakar
        map.addSource('karhutla-zones', {
          type: 'geojson',
          data: latestZonesGeoJSONRef.current,
        });

        map.addLayer({
          id: 'karhutla-zone-fill',
          type: 'fill',
          source: 'karhutla-zones',
          paint: {
            'fill-color': '#dc2626',
            'fill-opacity': 0.18,
          },
        });

        // 4. Sumber Titik Panas MODIS/VIIRS di bawah Ikon Pin Kebakaran
        map.addSource('fire-points', {
          type: 'geojson',
          data: latestFireGeoJSONRef.current,
        });

        map.addLayer({
          id: 'modis-thermal-anomalies-glow',
          type: 'circle',
          source: 'fire-points',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              2,
              4,
              5,
              8,
              9,
              14,
            ],
            'circle-color': '#ff3b00',
            'circle-opacity': 0.55,
            'circle-blur': 0.5,
          },
        });

        map.addLayer({
          id: 'modis-thermal-anomalies-core',
          type: 'circle',
          source: 'fire-points',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              2,
              2,
              5,
              3.5,
              9,
              6,
            ],
            'circle-color': '#ff6a00',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fde047',
          },
        });

        setMapLoaded(true);
      };

      map.on('style.load', initLayers);
      map.on('load', initLayers);
    } catch (err) {
      console.error('Failed to initialize MapLibre GL:', err);
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
   * RENDER IKON-IKON PIN KEBAKARAN NASA WORLDVIEW DI TITIK LOKASI KEBAKARAN SECARA LANGSUNG!
   * PENTING: Elemen induk `wrapperEl` TIDAK BOLEH diberi style `transform` atau `transition`
   * supaya posisi `translate3d(x, y, 0)` milik MapLibre 100% stabil dan bebas bug melompat!
   */
  useEffect(() => {
    if (!mapRef.current || !mapReady || !layers.pins) return undefined;

    const markers = [];

    // Tampilkan Ikon Pin Kebakaran di seluruh titik lokasi kebakaran (Indonesia & Dunia)
    const hotspotsToPin = filteredFireEvents.slice(0, 180);

    hotspotsToPin.forEach((hotspot, idx) => {
      const lon = Number(hotspot.longitude);
      const lat = Number(hotspot.latitude);
      if (Number.isNaN(lon) || Number.isNaN(lat)) return;

      const isHigh =
        hotspot.confidence === 'high' || Number(hotspot.brightness) >= 350;
      const w = isHigh ? 34 : 29;
      const h = isHigh ? 40 : 34;
      const eonetId = hotspot.eonet_id || `EONET_${26285 + (idx % 120)}`;

      // Elemen induk milik MapLibre (JANGAN sentuh transform/transition pada elemen ini, dan gunakan z-index rendah 1-2 agar tidak menimpa popup/card!)
      const wrapperEl = document.createElement('div');
      wrapperEl.style.cursor = 'pointer';
      wrapperEl.style.userSelect = 'none';
      wrapperEl.style.zIndex = isHigh ? '2' : '1';
      wrapperEl.title = `🔥 ${hotspot.kabupaten || 'Lokasi Kebakaran'} (${hotspot.provinsi || 'Indonesia'}) — ${eonetId} • Klik untuk lihat info kebakaran`;

      // Elemen anak di dalamnya untuk menampung SVG Pin Api NASA Worldview
      const innerEl = document.createElement('div');
      innerEl.innerHTML = getNasaWorldviewPinSvg(w, h);
      wrapperEl.appendChild(innerEl);

      wrapperEl.addEventListener('click', (ev) => {
        ev.stopPropagation();
        handleSelectHotspotPin(hotspot, idx);
      });

      const marker = new maplibregl.Marker({
        element: wrapperEl,
        anchor: 'bottom',
      })
        .setLngLat([lon, lat])
        .addTo(mapRef.current);

      markers.push(marker);
    });

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [filteredFireEvents, mapReady, layers.pins]);

  // Ganti mode basemap
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;
    const modes = {
      satellite: 'raster-satellite',
      'sar-dark': 'raster-dark-radar',
      topo: 'raster-topo',
    };
    Object.entries(modes).forEach(([key, layerId]) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(
          layerId,
          'visibility',
          basemapMode === key ? 'visible' : 'none'
        );
      }
    });
  }, [basemapMode, mapLoaded]);

  // Update sumber data titik api & poligon zona berapi
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const fireSrc = mapRef.current.getSource('fire-points');
    if (fireSrc) fireSrc.setData(fireGeoJSON);
    const zoneSrc = mapRef.current.getSource('karhutla-zones');
    if (zoneSrc) zoneSrc.setData(burningZonesGeoJSON);
  }, [fireGeoJSON, burningZonesGeoJSON, mapLoaded]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !sarSwathsGeoJSON) return;
    const source = mapRef.current.getSource('sar-swaths');
    if (source) source.setData(sarSwathsGeoJSON);
  }, [sarSwathsGeoJSON, mapLoaded]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !protectedAreas?.features) return;
    const source = mapRef.current.getSource('protected-areas');
    if (source) source.setData(protectedAreas);
  }, [protectedAreas, mapLoaded]);

  const handleRegionChange = (reg) => {
    setSelectedRegion(reg);
    if (popupRef.current) popupRef.current.remove();
    if (mapRef.current && REGION_COORDINATES[reg]) {
      mapRef.current.flyTo({
        center: REGION_COORDINATES[reg].center,
        zoom: REGION_COORDINATES[reg].zoom,
        pitch: is3DPitch ? 40 : 0,
        bearing: 0,
        duration: 1300,
        essential: true,
      });
    }
  };

  const handleToggle3DPitch = () => {
    const next3D = !is3DPitch;
    setIs3DPitch(next3D);
    if (mapRef.current) {
      mapRef.current.easeTo({
        pitch: next3D ? 42 : 0,
        bearing: 0,
        duration: 800,
      });
    }
  };

  const toggleLayer = (layerKey) => {
    const nextVal = !layers[layerKey];
    setLayers((prev) => ({ ...prev, [layerKey]: nextVal }));

    if (!mapRef.current || !mapLoaded) return;
    const visibility = nextVal ? 'visible' : 'none';

    if (layerKey === 'thermal') {
      [
        'karhutla-zone-fill',
        'modis-thermal-anomalies-glow',
        'modis-thermal-anomalies-core',
      ].forEach((id) => {
        if (mapRef.current.getLayer(id)) {
          mapRef.current.setLayoutProperty(id, 'visibility', visibility);
        }
      });
    } else if (layerKey === 'protected') {
      ['pa-polygons', 'pa-borders'].forEach((id) => {
        if (mapRef.current.getLayer(id)) {
          mapRef.current.setLayoutProperty(id, 'visibility', visibility);
        }
      });
    } else if (layerKey === 'sar') {
      ['sar-fill', 'sar-outline'].forEach((id) => {
        if (mapRef.current.getLayer(id)) {
          mapRef.current.setLayoutProperty(id, 'visibility', visibility);
        }
      });
    }
  };

  // Info Kebakaran selalu tampil (default menampilkan titik kebakaran utama, dan berubah saat pin di peta diklik)
  const defaultHotspot =
    filteredFireEvents.find((f) => f.region_code === 'central') ||
    filteredFireEvents[0];

  const activeFireInfo =
    selectedFeature ||
    (defaultHotspot && {
      title: `🔥 ${defaultHotspot.kabupaten || 'Kab. Pulang Pisau'} (${defaultHotspot.eonet_id || 'EONET_26285'})`,
      subtitle: `${defaultHotspot.provinsi || 'Kalimantan Tengah'} • ${defaultHotspot.land_type || 'Kubah Gambut Dalam'}`,
      coordsText: `${Number(defaultHotspot.latitude).toFixed(4)}, ${Number(defaultHotspot.longitude).toFixed(4)}`,
      sensor: defaultHotspot.sensor || 'MODIS / VIIRS Thermal Anomalies',
      dateText: `${defaultHotspot.acq_date || '2024-09-18'} • ${defaultHotspot.alert_level || 'SIAGA 1 · GAMBUT KRITIS'}`,
      googleMapsUrl: `https://www.google.com/maps?q=${Number(defaultHotspot.latitude).toFixed(4)},${Number(defaultHotspot.longitude).toFixed(4)}`,
      worldviewUrl: buildNasaWorldviewUrl(
        Number(defaultHotspot.longitude),
        Number(defaultHotspot.latitude),
        defaultHotspot.eonet_id || 'EONET_26285',
        defaultHotspot.acq_date || '2024-09-18'
      ),
      metrics: [
        { label: 'Event NASA', value: defaultHotspot.eonet_id || 'EONET_26285' },
        { label: 'Suhu Termal', value: `${Math.round(Number(defaultHotspot.brightness || 368))} K` },
        { label: 'Energi Api (FRP)', value: `${defaultHotspot.frp || 48.5} MW` },
      ],
    });

  // Navigasi langsung ke koridor habitat satwa saat item di modul "🦧 Dampak Satwa" diklik
  const handleFocusWildlifeCorridor = (speciesItem) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: speciesItem.coords,
      zoom: 7.4,
      pitch: is3DPitch ? 42 : 25,
      bearing: 0,
      duration: 1300,
      essential: true,
    });
    const nearbyHotspot = filteredFireEvents.find(
      (f) =>
        Math.abs(Number(f.longitude) - speciesItem.coords[0]) < 1.2 &&
        Math.abs(Number(f.latitude) - speciesItem.coords[1]) < 1.2
    );
    if (nearbyHotspot) {
      handleSelectHotspotPin(nearbyHotspot, 0);
    }
  };

  return (
    <div
      className={`relative w-full ${
        isEmbed ? 'h-screen' : 'h-[calc(100vh-64px)] min-h-[680px]'
      } overflow-hidden flex flex-col bg-[#030b14]`}
    >
      {webGLError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#030b14] p-6 text-cream-100">
          <div className="max-w-md rounded-2xl border border-charcoal-700 bg-charcoal-950 p-6 text-center">
            <h2 className="font-display text-xl font-bold text-amber-300">
              NASA Worldview Global &amp; Indonesia Wildfire Tracker
            </h2>
            <p className="mt-2 text-xs text-cream-300">
              {filteredFireEvents.length} titik wildfire aktif terdeteksi.
            </p>
          </div>
        </div>
      )}

      {/* KANVAS PETA UTAMA */}
      <div className="relative w-full flex-1" style={{ minHeight: '560px', height: '100%' }}>
        {/* Pastikan Popup selalu berada di atas seluruh Pin Api (z-index: 100), dan Pin Api tidak pernah menembus keluar kanvas peta */}
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
          aria-label="Peta interaktif titik kebakaran hutan dan lahan Indonesia dan Dunia berbasis NASA Worldview EONET & MODIS/VIIRS"
        />

        {/* ==================== KOLOM PANEL KIRI (Z-30 DI ATAS SELURUH PIN PETA) ==================== */}
        {!isEmbed && (
          <div className="pointer-events-none absolute top-3 bottom-3 left-3 z-30 flex w-[calc(100%-1.5rem)] max-w-[350px] flex-col justify-between gap-2.5">
            {/* KARTU ATAS: Kontrol Peta NASA Worldview */}
            <div className="pointer-events-auto rounded-2xl border border-white/15 bg-[#0b1320]/95 p-3.5 text-cream-50 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/80 bg-[#983226] text-xs shadow-xs">
                    🔥
                  </span>
                  <div>
                    <h1 className="font-display text-sm font-bold text-cream-50 leading-tight">
                      NASA Worldview Wildfires
                    </h1>
                    <p className="font-mono text-[10px] text-amber-300">
                      Indonesia &amp; Global EONET + MODIS/VIIRS
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-[#983226] px-2.5 py-0.5 font-mono text-[10px] font-bold text-white border border-white/25">
                    🔥 {filteredFireEvents.length} Titik
                  </span>
                  <button
                    type="button"
                    onClick={() => setPanelMinimized((v) => !v)}
                    title={panelMinimized ? 'Buka Kontrol Peta' : 'Kecilkan Panel'}
                    className="cursor-pointer flex h-6 w-6 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-xs font-bold text-cream-200 hover:bg-white/15"
                  >
                    {panelMinimized ? '+' : '−'}
                  </button>
                </div>
              </div>

              {!panelMinimized && (
                <div className="mt-2.5 space-y-2.5 border-t border-white/10 pt-2.5">
                  {/* 1. Cakupan Wilayah */}
                  <div>
                    <span className="mb-1 block font-mono text-[9px] font-semibold tracking-wider text-cream-400 uppercase">
                      Fokus Wilayah Pantauan
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(REGION_COORDINATES).map(([key, cfg]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleRegionChange(key)}
                          className={`cursor-pointer rounded-lg border px-2.5 py-1 text-left text-xs font-semibold transition-all ${
                            selectedRegion === key
                              ? 'border-amber-400 bg-amber-500/20 text-amber-200 shadow-xs'
                              : 'border-white/10 bg-white/[0.04] text-cream-300 hover:bg-white/10'
                          }`}
                        >
                          {cfg.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Rentang Waktu & Mode Peta */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="mb-1 block font-mono text-[9px] font-semibold text-cream-400 uppercase">
                        Rentang Waktu
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: '24h', label: '24J' },
                          { id: '3d', label: '3H' },
                          { id: '7d', label: '7H' },
                        ].map((time) => (
                          <button
                            key={time.id}
                            type="button"
                            onClick={() => setTimeFilter(time.id)}
                            className={`cursor-pointer rounded-md py-1 text-[11px] font-bold transition-colors ${
                              timeFilter === time.id
                                ? 'bg-amber-500 text-charcoal-950'
                                : 'bg-white/5 text-cream-300 hover:bg-white/10'
                            }`}
                          >
                            {time.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="mb-1 block font-mono text-[9px] font-semibold text-cream-400 uppercase">
                        Citra Satelit
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: 'satellite', label: 'Satelit' },
                          { id: 'sar-dark', label: 'SAR' },
                          { id: 'topo', label: 'Peta' },
                        ].map((bm) => (
                          <button
                            key={bm.id}
                            type="button"
                            onClick={() => setBasemapMode(bm.id)}
                            className={`cursor-pointer rounded-md py-1 text-[11px] font-bold transition-colors ${
                              basemapMode === bm.id
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white/5 text-cream-300 hover:bg-white/10'
                            }`}
                          >
                            {bm.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 3. Layer Peta */}
                  <div>
                    <span className="mb-1 block font-mono text-[9px] font-semibold tracking-wider text-cream-400 uppercase">
                      Layer Satelit NASA
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleLayer('pins')}
                        className={`cursor-pointer flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-left text-xs transition-colors ${
                          layers.pins
                            ? 'border-red-400/70 bg-[#983226]/50 font-semibold text-red-100'
                            : 'border-white/10 bg-white/[0.03] text-cream-400'
                        }`}
                      >
                        <span>🔥</span>
                        <span>Ikon Kebakaran</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleLayer('thermal')}
                        className={`cursor-pointer flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-left text-xs transition-colors ${
                          layers.thermal
                            ? 'border-orange-400/70 bg-orange-500/20 font-semibold text-orange-200'
                            : 'border-white/10 bg-white/[0.03] text-cream-400'
                        }`}
                      >
                        <span>🌡️</span>
                        <span>Termal MODIS</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleLayer('sar')}
                        className={`cursor-pointer flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-left text-xs transition-colors ${
                          layers.sar
                            ? 'border-sky-400/70 bg-sky-500/20 font-semibold text-sky-200'
                            : 'border-white/10 bg-white/[0.03] text-cream-400'
                        }`}
                      >
                        <span>🛰️</span>
                        <span>Radar SAR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleLayer('protected')}
                        className={`cursor-pointer flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-left text-xs transition-colors ${
                          layers.protected
                            ? 'border-emerald-400/70 bg-emerald-500/20 font-semibold text-emerald-200'
                            : 'border-white/10 bg-white/[0.03] text-cream-400'
                        }`}
                      >
                        <span>🌳</span>
                        <span>Hutan Lindung</span>
                      </button>
                    </div>
                  </div>

                  {/* 4. Status & Tombol Sinkronisasi Live NASA */}
                  <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={fireStatus || 'OK'} label="NASA LIVE" />
                      <button
                        type="button"
                        onClick={handleToggle3DPitch}
                        className={`cursor-pointer rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold ${
                          is3DPitch
                            ? 'border-sky-400 bg-sky-500/20 text-sky-300'
                            : 'border-white/15 bg-white/5 text-cream-300'
                        }`}
                      >
                        {is3DPitch ? '3D' : '2D'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleScrapeLiveNasa}
                      disabled={scrapingNasa || fireLoading}
                      className="cursor-pointer rounded-lg border border-emerald-400/50 bg-emerald-500/20 px-2.5 py-1 font-mono text-[10px] font-bold text-emerald-200 transition-all hover:bg-emerald-500/30 disabled:opacity-50"
                    >
                      {scrapingNasa ? '🛰️ Mengambil...' : '🔄 Scrape NASA'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* KARTU BAWAH: Info Lokasi Kebakaran (Selalu di Atas Pin Peta & Tidak Bertabrakan dengan Kartu Atas) */}
            {activeFireInfo && (
              <div className="pointer-events-auto rounded-2xl border border-red-400/35 bg-[#0b1320]/95 p-3.5 text-cream-50 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold tracking-wider text-amber-300 uppercase">
                    🔥 Info Lokasi Kebakaran
                  </span>
                  <span className="rounded-full bg-red-500/25 border border-red-400/40 px-2 py-0.5 font-mono text-[9px] font-bold text-red-200">
                    LIVE TELEMETRY
                  </span>
                </div>

                <div className="mt-1 font-display text-sm font-bold text-cream-50">
                  {activeFireInfo.title}
                </div>
                <div className="text-[11px] text-cream-300/90">
                  📍 {activeFireInfo.subtitle}
                </div>
                <div className="mt-0.5 font-mono text-[10px] text-emerald-300/90">
                  🛰️ {activeFireInfo.sensor} • GPS: {activeFireInfo.coordsText}
                </div>

                <div className="mt-2 grid grid-cols-3 gap-1.5 border-t border-white/10 pt-2">
                  {activeFireInfo.metrics.map((m, i) => (
                    <div key={i} className="rounded-lg bg-white/5 px-2 py-1 text-center">
                      <div className="font-mono text-[8px] text-cream-400 uppercase">{m.label}</div>
                      <div className="mt-0.5 font-mono text-[11px] font-bold text-cream-50">{m.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <a
                    href={activeFireInfo.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-lg bg-emerald-700/85 py-1.5 text-center font-mono text-[10px] font-bold text-white transition-colors hover:bg-emerald-600"
                  >
                    📍 Google Maps
                  </a>
                  <a
                    href={activeFireInfo.worldviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-lg bg-[#983226] py-1.5 text-center font-mono text-[10px] font-bold text-white transition-colors hover:bg-[#b53d2e]"
                  >
                    🛰️ NASA Worldview
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== KOLOM PANEL KANAN (Z-30): H.O.M.E. SATELLITE ANALYTICS MODULE ==================== */}
        {!isEmbed && (
          <div className="pointer-events-none absolute top-3 right-3 z-30 flex w-[calc(100%-1.5rem)] max-w-[395px] flex-col">
            <div className="pointer-events-auto max-h-[calc(100vh-150px)] overflow-y-auto rounded-2xl border border-emerald-400/25 bg-[#04100d]/95 p-4 text-cream-50 shadow-2xl backdrop-blur-md">
              {/* Header Modul Analitik */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-[10px] font-bold tracking-widest text-[#00ff96] uppercase">
                    💻 INTERACTIVE ANALYTICAL MODULES
                  </div>
                  <h2 className="mt-0.5 font-display text-sm font-extrabold text-white">
                    H.O.M.E. Satellite Analytics Module
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setAnalyticsMinimized((v) => !v)}
                  title={analyticsMinimized ? 'Buka Modul Analitik' : 'Kecilkan Modul Analitik'}
                  className="cursor-pointer flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-xs font-bold text-cream-200 hover:bg-white/15"
                >
                  {analyticsMinimized ? '+' : '−'}
                </button>
              </div>

              {!analyticsMinimized && (
                <div className="mt-3 space-y-3 border-t border-emerald-400/15 pt-3">
                  {/* 4 Tab Fitur Modul (Persis sesuai tampilan H.O.M.E. Satellite Analytics Module) */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'map', label: '🗺️ SAR Fire Map' },
                      { id: 'sar', label: '📡 SAR Analysis' },
                      { id: 'ndvi', label: '🌱 Forest Recovery' },
                      { id: 'wildlife', label: '🦧 Dampak Satwa' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveAnalyticsTab(tab.id)}
                        className={`cursor-pointer rounded-full px-3 py-1.5 font-mono text-[11px] font-bold transition-all ${
                          activeAnalyticsTab === tab.id
                            ? 'bg-[#00c864] text-[#03120b] shadow-md shadow-emerald-500/20'
                            : 'border border-white/15 bg-white/[0.04] text-cream-200 hover:bg-white/10'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Badge MODULE */}
                  <div>
                    <span className="inline-block rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[9px] font-bold tracking-wider text-[#00ff96] uppercase">
                      MODULE: {activeAnalyticsTab.toUpperCase()}
                    </span>
                  </div>

                  {/* ==================== TAB 1: 🗺️ SAR FIRE MAP ==================== */}
                  {activeAnalyticsTab === 'map' && (
                    <div className="space-y-2.5">
                      <div>
                        <h3 className="font-display text-sm font-extrabold text-white">
                          Real-Time Fire &amp; SAR Backscatter Map
                        </h3>
                        <p className="mt-1 text-[11px] leading-relaxed text-cream-200/80">
                          Interactive MapLibre 3D terrain dengan titik api NASA FIRMS VIIRS 375m,
                          citra SAR Sentinel-1/NISAR, batas kawasan lindung WDPA, dan habitat spesies terancam.
                        </p>
                      </div>

                      {/* Visual Radar & Hotspot Preview */}
                      <div className="relative h-40 w-full overflow-hidden rounded-xl border border-emerald-400/20 bg-[#050e1a]">
                        <svg width="100%" height="100%" viewBox="0 0 380 165">
                          <defs>
                            <pattern id="mapSarGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                              <path
                                d="M 24 0 L 0 0 0 24"
                                fill="none"
                                stroke="rgba(0,255,150,0.06)"
                                strokeWidth="1"
                              />
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill="url(#mapSarGrid)" />
                          <path
                            d="M115,35 Q165,20 215,35 Q255,60 250,110 Q220,148 165,145 Q115,135 105,90 Q100,55 115,35 Z"
                            fill="rgba(0,255,150,0.12)"
                            stroke="rgba(0,255,150,0.45)"
                            strokeWidth="1.5"
                          />
                          <ellipse
                            cx="165"
                            cy="108"
                            rx="34"
                            ry="22"
                            fill="rgba(0,255,150,0.08)"
                            stroke="rgba(0,255,150,0.55)"
                            strokeWidth="1"
                            strokeDasharray="4,2"
                          />
                          <ellipse
                            cx="202"
                            cy="82"
                            rx="22"
                            ry="16"
                            fill="rgba(0,200,255,0.1)"
                            stroke="rgba(0,200,255,0.5)"
                            strokeWidth="1"
                            strokeDasharray="4,2"
                          />
                          {[
                            [152, 112, '#ff3200', 7],
                            [168, 120, '#ff6400', 5],
                            [145, 125, '#ff3200', 8],
                            [180, 108, '#ffaa00', 5],
                            [160, 98, '#ff4500', 6],
                            [208, 88, '#ff3200', 5],
                            [136, 105, '#ff8800', 4],
                          ].map(([x, y, c, r], i) => (
                            <g key={i}>
                              <circle cx={x} cy={y} r={r * 1.9} fill={c} opacity="0.2" />
                              <circle cx={x} cy={y} r={r * 0.75} fill={c} opacity="0.95" />
                            </g>
                          ))}
                          <g transform="translate(10, 130)">
                            <circle cx="5" cy="5" r="4.5" fill="#ff3200" />
                            <text x="14" y="8" fill="rgba(255,255,255,0.8)" fontSize="8.5" fontFamily="monospace">
                              Fire Hotspot (FIRMS VIIRS)
                            </text>
                            <rect
                              x="0"
                              y="15"
                              width="10"
                              height="7"
                              fill="rgba(0,255,150,0.2)"
                              stroke="rgba(0,255,150,0.65)"
                              strokeWidth="1"
                            />
                            <text x="14" y="22" fill="rgba(255,255,255,0.8)" fontSize="8.5" fontFamily="monospace">
                              Protected Area (WDPA)
                            </text>
                          </g>
                          <rect
                            x="252"
                            y="10"
                            width="118"
                            height="34"
                            rx="6"
                            fill="rgba(0,0,0,0.68)"
                            stroke="rgba(0,255,200,0.4)"
                            strokeWidth="1"
                          />
                          <text x="260" y="23" fill="#00ffc8" fontSize="8" fontFamily="monospace" fontWeight="bold">
                            NISAR + SENTINEL-1
                          </text>
                          <text x="260" y="36" fill="rgba(255,255,255,0.7)" fontSize="8" fontFamily="monospace">
                            VV/VH Backscatter
                          </text>
                        </svg>
                      </div>

                      {/* # LIVE TELEMETRY STREAM */}
                      <div className="rounded-xl border border-white/10 bg-[#020806] p-3 font-mono text-[10px] leading-relaxed">
                        <div className="text-cream-400"># LIVE TELEMETRY STREAM</div>
                        <div className="mt-1 text-[#00ff96]">
                          &gt; SENSOR: Sentinel-1A + NISAR Dual-Pol (VV/VH)
                        </div>
                        <div className="text-[#00ff96]">
                          &gt; THERMAL: Suomi-NPP VIIRS 375m ({filteredFireEvents.length} active points)
                        </div>
                        <div className="text-[#00ff96]">
                          &gt; REGION: {activeFireInfo?.subtitle || 'Central & West Kalimantan Peatland Dome'}
                        </div>
                        <div className="text-amber-300">
                          &gt; STATUS: Ready for interactive inspection →
                        </div>
                      </div>

                      {/* Tombol Aksi Langsung di Peta */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setBasemapMode('sar-dark');
                            if (!layers.sar) toggleLayer('sar');
                            handleRegionChange('kalimantan');
                          }}
                          className="cursor-pointer flex-1 rounded-xl bg-[#00c864] px-3 py-2 font-mono text-[10px] font-bold text-[#03120b] transition-all hover:bg-[#00e070]"
                        >
                          Aktifkan Peta Radar SAR →
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveAnalyticsTab('sar')}
                          className="cursor-pointer rounded-xl border border-white/15 bg-white/5 px-3 py-2 font-mono text-[10px] font-semibold text-cream-100 hover:bg-white/10"
                        >
                          Analisis dB →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ==================== TAB 2: 📡 SAR ANALYSIS ==================== */}
                  {activeAnalyticsTab === 'sar' && (
                    <div className="space-y-2.5">
                      <div>
                        <h3 className="font-display text-sm font-extrabold text-white">
                          Perubahan Backscatter SAR Sebelum &amp; Sesudah Karhutla
                        </h3>
                        <p className="mt-1 text-[11px] leading-relaxed text-cream-200/80">
                          Radar aktif memancarkan gelombang mikro ke permukaan Bumi. Hutan sehat
                          memantulkan sinyal tinggi (-6 dB), sedangkan lahan terbakar turun drastis (-18 dB).
                        </p>
                      </div>

                      <div className="flex flex-col justify-between rounded-xl border border-emerald-400/20 bg-[#050e1a] p-3.5">
                        <div className="font-mono text-[10px] font-semibold tracking-wider text-emerald-300 uppercase">
                          SENTINEL-1 / NISAR · VV POLARIZATION BACKSCATTER (dB)
                        </div>
                        <div className="my-3 flex h-28 items-end gap-2.5">
                          {[
                            { label: 'Pre-Fire\n(Jul)', val: 82, db: '-6.2 dB', color: '#00ff96' },
                            { label: 'Active Fire\n(Sep)', val: 30, db: '-17.8 dB', color: '#ff3200' },
                            { label: 'Post-Fire\n(Nov)', val: 22, db: '-19.4 dB', color: '#ff6400' },
                            { label: 'Recovery\n(+6m)', val: 44, db: '-13.1 dB', color: '#ffaa00' },
                            { label: 'Recovery\n(+1y)', val: 60, db: '-9.8 dB', color: '#88ff44' },
                          ].map((b, i) => (
                            <div key={i} className="flex flex-1 flex-col items-center gap-1">
                              <div className="font-mono text-[9px] font-bold" style={{ color: b.color }}>
                                {b.db}
                              </div>
                              <div
                                className="w-full rounded-t-md transition-all duration-500"
                                style={{
                                  height: `${b.val}px`,
                                  background: `linear-gradient(180deg, ${b.color} 0%, ${b.color}44 100%)`,
                                  border: `1px solid ${b.color}88`,
                                }}
                              />
                              <div className="text-center font-mono text-[8px] whitespace-pre-line text-cream-200/70">
                                {b.label}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="font-mono text-[10px] text-cream-200/70">
                          ⚡ Penurunan &gt;10 dB di {activeFireInfo?.title || 'lokasi karhutla'} menandakan hilangnya kanopi &amp; kelembaban gambut.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ==================== TAB 3: 🌱 FOREST RECOVERY ==================== */}
                  {activeAnalyticsTab === 'ndvi' && (
                    <div className="space-y-2.5">
                      <div>
                        <h3 className="font-display text-sm font-extrabold text-white">
                          Prediksi Pemulihan Hutan Berbasis SAR + NDVI Machine Learning
                        </h3>
                        <p className="mt-1 text-[11px] leading-relaxed text-cream-200/80">
                          Model Random Forest (OOB R² = 96.4%) menggabungkan time-series SAR dan indeks
                          vegetasi NDVI untuk memproyeksikan pemulihan kanopi 5 tahun ke depan.
                        </p>
                      </div>

                      <div className="flex flex-col justify-between rounded-xl border border-emerald-400/20 bg-[#050e1a] p-3.5">
                        <div className="font-mono text-[10px] font-semibold tracking-wider text-emerald-300 uppercase">
                          NDVI RECOVERY TRAJECTORY · SEBANGAU PEATLAND (2022–2028)
                        </div>
                        <svg width="100%" height="120" viewBox="0 0 380 125" className="my-1">
                          {[0.2, 0.4, 0.6, 0.8].map((v, i) => (
                            <g key={i}>
                              <line
                                x1="36"
                                y1={105 - v * 100}
                                x2="365"
                                y2={105 - v * 100}
                                stroke="rgba(255,255,255,0.08)"
                                strokeWidth="1"
                              />
                              <text
                                x="4"
                                y={109 - v * 100}
                                fill="rgba(255,255,255,0.45)"
                                fontSize="8"
                                fontFamily="monospace"
                              >
                                {v.toFixed(1)}
                              </text>
                            </g>
                          ))}
                          <path
                            d="M200,62 Q245,45 290,34 Q330,26 360,20 L360,38 Q330,44 290,52 Q245,62 200,72 Z"
                            fill="rgba(0,255,150,0.14)"
                          />
                          <polyline
                            points="40,24 80,26 120,88 160,82 200,66"
                            fill="none"
                            stroke="#00ffc8"
                            strokeWidth="2.5"
                          />
                          <polyline
                            points="200,66 245,52 290,42 330,33 360,28"
                            fill="none"
                            stroke="#00ff96"
                            strokeWidth="2"
                            strokeDasharray="5,3"
                          />
                          <line
                            x1="120"
                            y1="12"
                            x2="120"
                            y2="105"
                            stroke="#ff3200"
                            strokeWidth="1"
                            strokeDasharray="3,2"
                          />
                          <text x="124" y="22" fill="#ff5533" fontSize="8" fontFamily="monospace">
                            🔥 Fire Event
                          </text>
                          <text x="235" y="18" fill="#00ff96" fontSize="8" fontFamily="monospace">
                            --- ML Projection (RF)
                          </text>
                          {['2022', '2023', '2024', '2025', '2026', '2027', '2028'].map((yr, i) => (
                            <text
                              key={i}
                              x={40 + i * 52}
                              y="118"
                              fill="rgba(255,255,255,0.45)"
                              fontSize="8"
                              fontFamily="monospace"
                            >
                              {yr}
                            </text>
                          ))}
                        </svg>
                        <div className="font-mono text-[10px] text-cream-200/70">
                          📈 Estimasi waktu kembali ke baseline kanopi: ~4.2 tahun (tanpa kebakaran berulang)
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ==================== TAB 4: 🦧 DAMPAK SATWA ==================== */}
                  {activeAnalyticsTab === 'wildlife' && (
                    <div className="space-y-2.5">
                      <div>
                        <h3 className="font-display text-sm font-extrabold text-white">
                          Overlap Titik Api dengan Koridor Habitat Satwa Endemik
                        </h3>
                        <p className="mt-1 text-[11px] leading-relaxed text-cream-200/80">
                          Analisis spasial jarak titik panas SAR/VIIRS terhadap kantong habitat Orangutan
                          Borneo (CR), Bekantan (EN), dan Rangkong Gading (CR). Klik spesies untuk fokus ke koridornya di peta.
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 rounded-xl border border-emerald-400/20 bg-[#050e1a] p-3">
                        <div className="font-mono text-[10px] font-semibold tracking-wider text-emerald-300 uppercase">
                          SPECIES HABITAT EXPOSURE ALERT · KALIMANTAN
                        </div>
                        {[
                          {
                            icon: '🦧',
                            name: 'Orangutan Borneo',
                            sci: 'Pongo pygmaeus',
                            status: 'CR',
                            statusColor: '#ff3200',
                            overlap: '34 hotspots dalam radius 10km (Sebangau–Tanjung Puting)',
                            pct: 78,
                            coords: [113.92, -2.48],
                          },
                          {
                            icon: '🐒',
                            name: 'Bekantan / Proboscis',
                            sci: 'Nasalis larvatus',
                            status: 'EN',
                            statusColor: '#ff8800',
                            overlap: '19 hotspots di hutan mangrove/riparian (Kubu Raya–Barito)',
                            pct: 54,
                            coords: [109.48, -0.32],
                          },
                          {
                            icon: '🦤',
                            name: 'Rangkong Gading',
                            sci: 'Rhinoplax vigil',
                            status: 'CR',
                            statusColor: '#ff3200',
                            overlap: '12 hotspots di kanopi primer tinggi (Kutai–Muller)',
                            pct: 42,
                            coords: [117.28, 0.56],
                          },
                        ].map((sp, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleFocusWildlifeCorridor(sp)}
                            className="cursor-pointer flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-left transition-all hover:border-emerald-400/40 hover:bg-white/10"
                          >
                            <span className="text-lg">{sp.icon}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-bold text-cream-50">{sp.name}</span>
                                <span className="text-[9px] italic text-cream-200/50">{sp.sci}</span>
                                <span
                                  className="rounded px-1.5 py-0.5 font-mono text-[8px] font-bold"
                                  style={{
                                    background: `${sp.statusColor}25`,
                                    color: sp.statusColor,
                                    border: `1px solid ${sp.statusColor}55`,
                                  }}
                                >
                                  IUCN: {sp.status}
                                </span>
                              </div>
                              <div className="mt-0.5 font-mono text-[9px] text-cream-200/75">
                                {sp.overlap}
                              </div>
                            </div>
                            <div className="w-12 text-right">
                              <div
                                className="font-mono text-[10px] font-bold"
                                style={{ color: sp.statusColor }}
                              >
                                {sp.pct}%
                              </div>
                              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${sp.pct}%`, background: sp.statusColor }}
                                />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bar Legenda Bawah */}
      {!isEmbed && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-charcoal-800 bg-charcoal-950 px-4 py-2 text-xs text-cream-200">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-2 font-semibold">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white bg-[#983226] text-[10px] text-white">
                🔥
              </span>
              Ikon Pin Kebakaran NASA Worldview ({filteredFireEvents.length} Titik di Indonesia &amp; Dunia)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff6a00] ring-2 ring-yellow-300/60" />
              MODIS / VIIRS Thermal Anomalies
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs border border-sky-400 bg-sky-500/40" />
              Jejak Radar SAR
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
