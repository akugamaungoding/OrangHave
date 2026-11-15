/**
 * Aturan kesulitan Radar Mission — dipakai bersama oleh peta misi (MissionMapPage)
 * dan game (GamePage) agar angka yang dijanjikan di peta sama dengan yang dimainkan.
 */

export const DIFFICULTY_PRESETS = {
  // Mudah: tutorial + cerita. Satwa terlihat, radar mengunci penuh, api tidak menyebar.
  easy: {
    labelId: 'Mudah',
    labelEn: 'Easy',
    icon: '🟢',
    color: '#16a34a',
    hotspotIds: ['f1', 'f3', 'f4', 'f5'],
    sizeScale: 0.85,
    timeBase: 40,
    timePerAnimal: 48,
    lives: 4,
    radar: 6,
    radarMs: 6500,
    radarRefill: 0,
    revealAnimal: true, // badge "CARI AKU!" & satwa terlihat menembus asap
    radarLock: true, // radar mengunci posisi satwa (crosshair)
    guideLine: 'always', // garis penuntun ke habitat: always | radar | never
    habitatClear: true, // habitat bersinar jelas
    smokeDensity: 1,
    growEvery: 0, // detik; 0 = api tidak meluas
    growRate: 0,
    spotFires: 0,
    panic: 0, // peluang panik per detik saat satwa dekat api
    panicMs: 0,
    leash: 0, // jarak maks ranger–satwa sebelum satwa lepas (0 = tidak ada)
    animalHp: 0, // 0 = satwa tidak bisa terluka
  },
  // Sedang: asap lebih pekat, satwa tersembunyi, radar 3× × 3 detik, api meluas pelan.
  medium: {
    labelId: 'Sedang',
    labelEn: 'Medium',
    icon: '🟠',
    color: '#ea580c',
    hotspotIds: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'],
    sizeScale: 1,
    timeBase: 30,
    timePerAnimal: 40,
    lives: 3,
    radar: 3,
    radarMs: 3000,
    radarRefill: 1,
    revealAnimal: false,
    radarLock: false,
    guideLine: 'radar',
    habitatClear: false,
    smokeDensity: 1.35,
    growEvery: 25,
    growRate: 0.05,
    spotFires: 0,
    panic: 0.35,
    panicMs: 1800,
    leash: 0,
    animalHp: 3,
  },
  // Sulit: waktu ketat, api meluas + spot fire, tanpa garis habitat, satwa bisa lepas.
  hard: {
    labelId: 'Sulit',
    labelEn: 'Hard',
    icon: '🔴',
    color: '#b91c1c',
    hotspotIds: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'],
    sizeScale: 1.15,
    timeBase: 25,
    timePerAnimal: 34,
    lives: 2,
    radar: 2,
    radarMs: 2500,
    radarRefill: 1,
    revealAnimal: false,
    radarLock: false,
    guideLine: 'never',
    habitatClear: false,
    smokeDensity: 1.6,
    growEvery: 20,
    growRate: 0.07,
    spotFires: 2,
    panic: 0.6,
    panicMs: 2600,
    leash: 240,
    animalHp: 2,
  },
};

/** Waktu misi (detik) bergantung jumlah satwa yang harus dievakuasi. */
export function getMissionTime(level, animalCount) {
  const p = DIFFICULTY_PRESETS[level] || DIFFICULTY_PRESETS.medium;
  return Math.round((p.timeBase + p.timePerAnimal * animalCount) / 5) * 5;
}

export function formatClock(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Intensitas titik api FIRMS → tingkat kesulitan (FRP dalam MW, suhu kecerahan dalam K). */
export function getFireGameLevel(frp, tempK) {
  const f = Number(frp) || 0;
  const t = Number(tempK) || 0;
  if (f >= 15 || t >= 360) return 'hard';
  if (f >= 5 || t >= 340) return 'medium';
  return 'easy';
}

/** Satwa yang dekat titik api → misi penyelamatan lebih sulit. */
export function getWildlifeGameLevel(nearestFireKm) {
  if (nearestFireKm === null || nearestFireKm === undefined) return 'medium';
  if (nearestFireKm <= 25) return 'hard';
  if (nearestFireKm <= 80) return 'medium';
  return 'easy';
}

/**
 * FRP nyata dari titik api FIRMS memperbesar api di game & mempercepat penyebarannya.
 * 5 MW → tanpa efek, ≥30 MW → api +25% lebih besar & menyebar 1,8× lebih cepat.
 */
export function getFrpScaling(frp) {
  const v = Number(frp);
  if (!v || Number.isNaN(v)) return { factor: 0, sizeMult: 1, growMult: 1 };
  const factor = Math.max(0, Math.min(1, (v - 5) / 25));
  return {
    factor,
    sizeMult: 1 + 0.25 * factor,
    growMult: 1 + 0.8 * factor,
  };
}
