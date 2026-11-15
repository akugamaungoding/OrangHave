/**
 * MapLibre 6 loads its web worker from a file next to its own bundle.
 * Vite pre-bundles maplibre-gl into .vite/deps, where that file does not exist,
 * so tell MapLibre exactly where the worker lives. Without this, GeoJSON layers
 * (fires, swaths, habitats) never render.
 */
import { setWorkerUrl } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';

setWorkerUrl(maplibreWorkerUrl);
