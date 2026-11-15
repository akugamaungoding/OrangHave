import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../i18n';
import SdgMark from '../components/SdgMark';
import { getFact, ML_SOURCES } from '../nisarKnowledge';
import {
  DIFFICULTY_PRESETS,
  getMissionTime,
  getFrpScaling,
  formatClock,
} from '../gameDifficulty';

/* ── Web Audio Procedural Sound System ── */
class GameAudio {
  static ctx = null;

  static init() {
    if (!GameAudio.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) GameAudio.ctx = new AudioCtx();
    }
  }

  static playFootstep() {
    try {
      GameAudio.init();
      if (!GameAudio.ctx) return;
      if (GameAudio.ctx.state === 'suspended') GameAudio.ctx.resume();
      const osc = GameAudio.ctx.createOscillator();
      const gain = GameAudio.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, GameAudio.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, GameAudio.ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.04, GameAudio.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, GameAudio.ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(GameAudio.ctx.destination);
      osc.start();
      osc.stop(GameAudio.ctx.currentTime + 0.07);
    } catch {
      // Audio not permitted
    }
  }

  static playFoundAnimal() {
    try {
      GameAudio.init();
      if (!GameAudio.ctx) return;
      if (GameAudio.ctx.state === 'suspended') GameAudio.ctx.resume();
      const osc = GameAudio.ctx.createOscillator();
      const gain = GameAudio.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, GameAudio.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(640, GameAudio.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.15, GameAudio.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, GameAudio.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(GameAudio.ctx.destination);
      osc.start();
      osc.stop(GameAudio.ctx.currentTime + 0.35);
    } catch {
      // Audio failed
    }
  }

  static playRescueChime() {
    try {
      GameAudio.init();
      if (!GameAudio.ctx) return;
      if (GameAudio.ctx.state === 'suspended') GameAudio.ctx.resume();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = GameAudio.ctx.createOscillator();
        const gain = GameAudio.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const startTime = GameAudio.ctx.currentTime + idx * 0.09;
        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
        osc.connect(gain);
        gain.connect(GameAudio.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } catch {
      // Audio failed
    }
  }

  static playRadarPulse() {
    try {
      GameAudio.init();
      if (!GameAudio.ctx) return;
      if (GameAudio.ctx.state === 'suspended') GameAudio.ctx.resume();
      const osc = GameAudio.ctx.createOscillator();
      const gain = GameAudio.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, GameAudio.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, GameAudio.ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.12, GameAudio.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, GameAudio.ctx.currentTime + 0.7);
      osc.connect(gain);
      gain.connect(GameAudio.ctx.destination);
      osc.start();
      osc.stop(GameAudio.ctx.currentTime + 0.7);
    } catch {
      // Audio failed
    }
  }

  static playDangerWarning() {
    try {
      GameAudio.init();
      if (!GameAudio.ctx) return;
      if (GameAudio.ctx.state === 'suspended') GameAudio.ctx.resume();
      const osc = GameAudio.ctx.createOscillator();
      const gain = GameAudio.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, GameAudio.ctx.currentTime);
      osc.frequency.setValueAtTime(170, GameAudio.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, GameAudio.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, GameAudio.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(GameAudio.ctx.destination);
      osc.start();
      osc.stop(GameAudio.ctx.currentTime + 0.25);
    } catch {
      // Audio failed
    }
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   BANYAK TITIK KEBAKARAN KARHUTLA DI BERBAGAI PENJURU HUTAN (MULTIPLE HOTSPOTS)
   ────────────────────────────────────────────────────────────────────────── */
const DEFAULT_FIRE_HOTSPOTS = [
  { id: 'f1', x: 530, y: 195, rx: 85, ry: 55, name: 'Karhutla Kubah Gambut Tengah', nameEn: 'Central Peat Dome Wildfire', intensity: 1.1 },
  { id: 'f2', x: 740, y: 150, rx: 65, ry: 48, name: 'Titik Api Kanopi Meranti Timur', nameEn: 'Eastern Meranti Canopy Hotspot', intensity: 0.9 },
  { id: 'f3', x: 730, y: 470, rx: 60, ry: 45, name: 'Bara Api Semak Sisi Timur', nameEn: 'Eastern Shrubland Embers', intensity: 0.95 },
  { id: 'f4', x: 370, y: 580, rx: 70, ry: 50, name: 'Kebakaran Rawa Gambut Selatan', nameEn: 'Southern Peat Swamp Fire', intensity: 1.05 },
  { id: 'f5', x: 220, y: 390, rx: 62, ry: 46, name: 'Api Tajuk Belukar Barat', nameEn: 'Western Thicket Crown Fire', intensity: 0.85 },
  { id: 'f6', x: 600, y: 730, rx: 55, ry: 40, name: 'Rekahan Bara Bawah Tanah Tenggara', nameEn: 'Southeast Underground Ember Rift', intensity: 0.8 },
];

/* ──────────────────────────────────────────────────────────────────────────
   5 SATWA LIAR DENGAN LOKASI HILANG & HABITAT ALAMI BERBEDA (BUKAN DI SUNGAI)
   ────────────────────────────────────────────────────────────────────────── */
const WILDLIFE_MISSIONS = [
  {
    id: 'kancil',
    name: 'Kecil si Kancil',
    nameEn: 'Little Deer',
    species: 'Lesser Mouse Deer (Tragulus kanchil)',
    emoji: '🦌',
    lostPos: { x: 420, y: 440 },
    habitat: {
      name: 'Semak Riparian Rindang Barat Laut',
      nameEn: 'Northwest Riparian Shrubland',
      desc: 'Semak hijau lembap teduh tempat kancil bersembunyi dari panas api.',
      descEn: 'Shady, moist green shrubs where the mouse deer hides from the heat of the fire.',
      icon: '🌿',
      x: 160,
      y: 200,
      radius: 46,
      color: '#34d399',
    },
    cryId: 'Hutan tempat tinggalku terkepung asap api... tolong temukan aku dan tuntun aku ke semak rindang sejuk!',
    cryEn: 'My forest home is surrounded by smoke... please find me and guide me to the cool green shrubland!',
    storyEpilogueId: 'Kecil kini merumput tenang bersama kawanannya di semak riparian yang sejuk dan terlindung.',
    storyEpilogueEn: 'Little Deer is now grazing peacefully with its herd in the cool, sheltered riverine shrubs.',
  },
  {
    id: 'tuki',
    name: 'Tuki si Orangutan',
    nameEn: 'Tuki the Orangutan',
    species: 'Bornean Orangutan (Pongo pygmaeus)',
    emoji: '🦧',
    lostPos: { x: 330, y: 270 },
    habitat: {
      name: 'Kanopi Pohon Ulin Tenggara',
      nameEn: 'Southeast Ironwood Canopy',
      desc: 'Tajuk pohon ulin purba yang tinggi dan aman dari kebakaran gambut bawah.',
      descEn: 'The tall crowns of ancient ironwood trees, safe from the peat fires below.',
      icon: '🌳',
      x: 650,
      y: 630,
      radius: 48,
      color: '#10b981',
    },
    cryId: 'Asap pekat membakar tajuk pohonku! Tolong temukan aku dan bawa aku ke kanopi ulin yang rimbun!',
    cryEn: 'Thick smoke burns my nest canopy! Please find me and guide me to the tall ironwood trees!',
    storyEpilogueId: 'Tuki berpelukan erat dengan Ibunya di dahan kanopi pohon ulin purba yang bebas dari asap pekat.',
    storyEpilogueEn: 'Tuki safely reunited with his Mother in a towering ironwood canopy free from suffocating smoke.',
  },
  {
    id: 'liku',
    name: 'Liku si Trenggiling',
    nameEn: 'Liku the Pangolin',
    species: 'Sunda Pangolin (Manis javanica)',
    emoji: '🦎',
    lostPos: { x: 640, y: 440 },
    habitat: {
      name: 'Liang Bukit Lembap Barat Daya',
      nameEn: 'Southwest Moist Hill Burrow',
      desc: 'Gundukan tanah gambut lembap yang sejuk bebas dari bara api bawah tanah.',
      descEn: 'Cool, moist peat mounds free from underground embers.',
      icon: '🪨',
      x: 180,
      y: 660,
      radius: 48,
      color: '#06b6d4',
    },
    cryId: 'Tanah sarangku memanas membara! Aku butuh bantuanmu menuju bukit tanah lembap yang sejuk!',
    cryEn: 'The peat ground under me is boiling hot! Guide me to the cool moist highland burrow!',
    storyEpilogueId: 'Liku meringkuk hangat dan damai di liang tanah gambut basah yang tidak terjangkau bara karhutla.',
    storyEpilogueEn: 'Liku is curled up peacefully inside a moist peat mound burrow, safe from subterranean embers.',
  },
  {
    id: 'madu',
    name: 'Madu si Beruang Madu',
    nameEn: 'Madu the Sun Bear',
    species: 'Sun Bear (Helarctos malayanus)',
    emoji: '🐻',
    lostPos: { x: 720, y: 340 },
    habitat: {
      name: 'Pohon Sarang Lebah Selatan',
      nameEn: 'Southern Giant Honey Hollow Tree',
      desc: 'Pohon tua berongga raksasa yang kaya sarang lebah hutan dan terlindung dari api.',
      descEn: 'A giant old hollow tree full of wild beehives and sheltered from the flames.',
      icon: '🍯',
      x: 480,
      y: 680,
      radius: 48,
      color: '#f59e0b',
    },
    cryId: 'Pohon maduku hangus dilalap api tajuk! Tolong temukan aku dan tuntun ke pohon sarang lebah selatan!',
    cryEn: 'My honey hollow was burned! Please guide me to the giant southern hollow tree!',
    storyEpilogueId: 'Madu kembali mencakar kulit pohon tua dan menikmati sarang lebah hutan lezat dengan tenang.',
    storyEpilogueEn: 'Madu is happily foraging in a giant hollow trunk, feasting on wild honey in tranquility.',
  },
  {
    id: 'rangkong',
    name: 'Rangkong si Burung Enggang',
    nameEn: 'Rangkong the Hornbill',
    species: 'Helmeted Hornbill (Rhinoplax vigil)',
    emoji: '🦅',
    lostPos: { x: 260, y: 520 },
    habitat: {
      name: 'Puncak Kanopi Bukit Utara',
      nameEn: 'Northern High Ridge Canopy',
      desc: 'Puncak tertinggi perbukitan hutan primer di mana udara bersih dari asap karhutla.',
      descEn: 'The highest ridge of the primary forest, where the air is clear of wildfire smoke.',
      icon: '🌲',
      x: 520,
      y: 110,
      radius: 48,
      color: '#84cc16',
    },
    cryId: 'Sayapku kotor tertutup jelaga hitam! Tolong bantu aku mencapai puncak kanopi bukit utara yang bersih!',
    cryEn: 'My wings are soot-stained! Help me reach the clean high ridge canopy in the north!',
    storyEpilogueId: 'Rangkong terbang membubung tinggi di atas bukit utara dengan sayap bersih menyambut fajar.',
    storyEpilogueEn: 'Rangkong soars freely above the pristine northern ridge with soot-free wings greeting the dawn.',
  },
];

/* ──────────────────────────────────────────────────────────────────────────
   MISI DARI PETA: pemetaan spesies IUCN di peta → misi satwa di game,
   dan preset tingkat kesulitan berdasarkan intensitas titik api terpilih.
   ────────────────────────────────────────────────────────────────────────── */
const SPECIES_TO_MISSION = {
  'mouse-deer': 'kancil',
  'lesser mouse deer': 'kancil',
  'bornean-orangutan': 'tuki',
  'bornean orangutan': 'tuki',
  'sunda-pangolin': 'liku',
  'sunda pangolin': 'liku',
  'sun-bear': 'madu',
  'sun bear': 'madu',
  'helmeted-hornbill': 'rangkong',
  'helmeted hornbill': 'rangkong',
};

// Titik api tambahan untuk level Sulit (tidak menutupi lokasi satwa maupun habitatnya)
const EXTRA_HARD_HOTSPOTS = [
  { id: 'f7', x: 300, y: 140, rx: 50, ry: 38, name: 'Api Loncat Lereng Barat Laut', nameEn: 'Northwest Slope Spot Fire', intensity: 0.9 },
  { id: 'f8', x: 560, y: 330, rx: 48, ry: 36, name: 'Bara Gambut Tengah Hutan', nameEn: 'Mid-Forest Peat Embers', intensity: 0.95 },
];

const PRESET_ICONS_FALLBACK = DIFFICULTY_PRESETS.medium;

// Titik yang tidak boleh tertutup api (lokasi satwa hilang, habitat, posisi awal ranger)
// agar api yang meluas tidak pernah membuat misi mustahil diselesaikan.
const PROTECTED_POINTS = [
  { x: 120, y: 440, r: 60 },
  ...WILDLIFE_MISSIONS.map((m) => ({ x: m.lostPos.x, y: m.lostPos.y, r: 55 })),
  ...WILDLIFE_MISSIONS.map((m) => ({ x: m.habitat.x, y: m.habitat.y, r: m.habitat.radius + 45 })),
];

// Ellipse api (rx, ry) + margin r tidak boleh mencakup titik terlindung
function fireCoversProtected(fire, rx, ry) {
  return PROTECTED_POINTS.some((p) => {
    const dx = p.x - fire.x;
    const dy = p.y - fire.y;
    const ex = rx + p.r;
    const ey = ry + p.r;
    return (dx * dx) / (ex * ex) + (dy * dy) / (ey * ey) < 1;
  });
}

// Gumpalan asap tebal yang membubung dari satu titik api
function buildFireSmoke(fz, count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: fz.x + (Math.random() - 0.5) * fz.rx * 1.6,
      y: fz.y + (Math.random() - 0.5) * fz.ry * 1.6,
      radius: 55 + Math.random() * 60,
      opacity: 0.65 + Math.random() * 0.3,
      vx: 0.1 + Math.random() * 0.3,
      vy: -0.12 + (Math.random() - 0.5) * 0.12,
    });
  }
  return out;
}

function buildHotspots(preset, sizeMult = 1) {
  return [...DEFAULT_FIRE_HOTSPOTS, ...EXTRA_HARD_HOTSPOTS]
    .filter((f) => preset.hotspotIds.includes(f.id))
    .map((f) => {
      const scale = preset.sizeScale * sizeMult;
      let rx = f.rx * scale;
      let ry = f.ry * scale;
      // FRP tinggi memperbesar api, tetapi tetap tidak menutupi satwa/habitat
      while ((rx > f.rx * preset.sizeScale || ry > f.ry * preset.sizeScale) && fireCoversProtected(f, rx, ry)) {
        rx *= 0.97;
        ry *= 0.97;
      }
      return { ...f, rx, ry, baseRx: rx, baseRy: ry, intensity: f.intensity * scale };
    });
}

// NDVI sekitar lokasi misi dari pipeline ML (dikirim peta misi lewat URL)
function parseNdviParams(searchParams) {
  const before = Number(searchParams.get('ndviB'));
  const after = Number(searchParams.get('ndviA'));
  const loc = searchParams.get('ndviLoc');
  if (!loc || Number.isNaN(before) || Number.isNaN(after) || before <= 0) return null;
  return {
    loc,
    before,
    after,
    delta: Number((after - before).toFixed(2)),
    lossPct: Math.round(((before - after) / before) * 100),
  };
}

// Satu fakta singkat untuk briefing — satu misi, satu pesan
const BRIEFING_FACTS = {
  fire: {
    id: 'Titik api ini adalah deteksi nyata satelit NASA FIRMS (VIIRS/MODIS). FRP mengukur energi panas yang dipancarkan api — semakin besar, semakin cepat koridor hutan habis.',
    en: 'This hotspot is a real NASA FIRMS satellite detection (VIIRS/MODIS). FRP measures the heat energy the fire radiates — the higher it is, the faster forest corridors disappear.',
  },
  animal: {
    id: 'Gambut yang terbakar bisa membara di bawah tanah berminggu-minggu. Asapnya menyeberang perbatasan, tapi satwa tidak bisa pindah negara — rumahnya hanya di sini.',
    en: 'Burning peat can smoulder underground for weeks. Its smoke crosses borders, but animals cannot move country — this forest is their only home.',
  },
  free: {
    id: 'Asap karhutla Kalimantan pernah menutup sekolah dan menunda penerbangan sampai Malaysia dan Singapura. Apinya lokal, dampaknya lintas negara.',
    en: 'Smoke from Kalimantan fires has closed schools and delayed flights as far as Malaysia and Singapore. The fire is local; the harm crosses borders.',
  },
};

/**
 * Bangun konfigurasi game dari query string, mis.:
 *   /game/play?mission=fire&level=hard&site=Ketapang&frp=21.6
 *   /game/play?mission=animal&species=sun-bear&level=medium&site=Sebangau
 */
function buildGameConfig(searchParams) {
  const mode = searchParams.get('mission');
  const levelParam = searchParams.get('level');
  const level = DIFFICULTY_PRESETS[levelParam] ? levelParam : 'medium';
  const preset = DIFFICULTY_PRESETS[level] || PRESET_ICONS_FALLBACK;

  let missions = WILDLIFE_MISSIONS;
  let targetMission = null;
  if (mode === 'animal') {
    const speciesKey = String(searchParams.get('species') || '').toLowerCase().trim();
    const missionId = SPECIES_TO_MISSION[speciesKey] || speciesKey;
    targetMission = WILDLIFE_MISSIONS.find((m) => m.id === missionId) || null;
    if (targetMission) missions = [targetMission];
  }

  const resolvedMode = mode === 'fire' || (mode === 'animal' && targetMission) ? mode : null;
  const frp = searchParams.get('frp') || '';
  // Hanya misi titik api yang membawa FRP nyata dari peta
  const frpScaling = resolvedMode === 'fire' ? getFrpScaling(frp) : getFrpScaling(0);

  return {
    mode: resolvedMode,
    level,
    preset,
    missions,
    targetMission,
    frpScaling,
    missionTime: getMissionTime(level, missions.length),
    hotspots: buildHotspots(preset, frpScaling.sizeMult),
    site: searchParams.get('site') || '',
    frp,
    ndvi: parseNdviParams(searchParams),
  };
}

export default function GamePage() {
  const location = useLocation();
  const config = useMemo(
    () => buildGameConfig(new URLSearchParams(location.search)),
    [location.search],
  );
  // key → game di-remount bersih setiap kali misi dari peta berganti
  return <RadarMissionGame key={location.search} config={config} />;
}

function RadarMissionGame({ config }) {
  const { locale } = useTranslation();
  const isId = locale === 'id';
  const { missions, preset } = config;
  const MAX_LIVES = preset.lives;
  const MISSION_TIME = config.missionTime;
  const CRISIS_TIME = Math.max(20, Math.round(MISSION_TIME * 0.2));

  const canvasRef = useRef(null);

  // Status Game
  const [lives, setLives] = useState(MAX_LIVES);
  const [rescuedCount, setRescuedCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(MISSION_TIME);
  // Game dimulai dalam keadaan jeda: pemain membaca briefing evakuasi dulu
  const [briefingOpen, setBriefingOpen] = useState(true);
  const [isPaused, setIsPaused] = useState(true);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [failReason, setFailReason] = useState('');
  // 'time' | 'ranger' | 'animal' — menentukan narasi game over
  const [failKind, setFailKind] = useState('');
  // Nama koridor yang hangus terkena ranger/satwa selama misi
  const [burnedCorridors, setBurnedCorridors] = useState([]);

  // Kondisi satwa saat dikawal (Sedang/Sulit): bisa terluka & panik di dekat api
  const [animalHp, setAnimalHp] = useState(preset.animalHp);
  const [animalPanicking, setAnimalPanicking] = useState(false);
  const animalFxRef = useRef({ hp: preset.animalHp, invulnUntil: 0, panicUntil: 0, panicCooldownUntil: 0 });
  const rangerInvulnUntilRef = useRef(0);

  // Api dinamis: jejak jalur ranger (untuk spot fire) & peringatan spot fire yang akan menyala
  const visitHeatRef = useRef(new Map());
  const pendingSpotRef = useRef(null);
  const spotFiresSpawnedRef = useRef(0);
  const crisisShownRef = useRef(false);

  // Soft gate edukasi: bandingkan layer Before / After / Change sekali (disimpan di browser)
  const [layersSeen, setLayersSeen] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('home-radar-layers-seen') || '[]');
    } catch {
      return [];
    }
  });
  const layerGateDone = ['before', 'after', 'change'].every((l) => layersSeen.includes(l));

  // Skenario Titik Kebakaran Aktif (Dinamis / Bisa Banyak & Diacak)
  const [fireHotspots, setFireHotspots] = useState(config.hotspots);

  // Mode Layer Radar NISAR
  const [radarLayer, setRadarLayer] = useState('optical');

  // Pulsa Radar NISAR untuk Menembus Kabut Asap
  const [radarActive, setRadarActive] = useState(false);
  const [radarCharges, setRadarCharges] = useState(preset.radar);
  const radarWaveRef = useRef(0);
  // Sudut meleset acak per pulsa: radar memberi arah kasar, bukan posisi pasti
  const radarNoiseRef = useRef(0);
  const smokeParticlesRef = useRef([]);

  // Misi Satwa Aktif (Index 0 s.d 4)
  const [missionIndex, setMissionIndex] = useState(0);
  const currentMission = missions[missionIndex];

  // Fase Satwa: 'SEARCHING' (Ranger harus mencari satwa) | 'FOLLOWING' (Satwa ditemukan & mengikuti ranger)
  const [animalState, setAnimalState] = useState('SEARCHING');

  // Karakter Ranger Manusia Penyelamat
  const rangerRef = useRef({
    x: 120,
    y: 440,
    targetX: 120,
    targetY: 440,
    angle: 0,
    isMoving: false,
    walkCycle: 0,
    speed: 140,
  });

  // Posisi Satwa Aktif
  const animalPosRef = useRef({
    x: currentMission.lostPos.x,
    y: currentMission.lostPos.y,
    angle: 0,
    walkCycle: 0,
  });

  const lastTimeRef = useRef(0);
  const animIdRef = useRef(null);
  const stepSoundTimerRef = useRef(0);

  // Dialog Balon Bicara Ranger
  const [rangerDialogue, setRangerDialogue] = useState(
    isId
      ? `Cari ${currentMission.name}. Asap terlalu pekat — gunakan senter dan radar NISAR.`
      : `Find ${currentMission.nameEn}. The smoke is too thick — use your flashlight and NISAR radar.`
  );

  // Tutup briefing & mulai evakuasi
  const startMission = useCallback(() => {
    setBriefingOpen(false);
    setIsPaused(false);
    if (!layerGateDone) {
      setRangerDialogue(
        isId
          ? `Sebelum jauh masuk asap, bandingkan layer Before → After → Change di panel radar. Lalu cari ${missions[0].name}.`
          : `Before heading deep into the smoke, compare the Before → After → Change layers in the radar panel. Then find ${missions[0].nameEn}.`
      );
    }
  }, [layerGateDone, isId, missions]);

  // Modal Encounter saat Pertama Kali Menemukan Satwa
  const [showFoundModal, setShowFoundModal] = useState(false);

  // Countdown Timer Game
  useEffect(() => {
    if (isPaused || gameWon || gameOver) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setGameOver(true);
          setFailKind('time');
          setFailReason(
            isId
              ? 'Waktu evakuasi habis. Api terus meluas, dan koridor yang tadi masih bisa dilewati kini tertutup asap.'
              : 'Evacuation time ran out. The fire kept spreading, and corridors that were still passable are now sealed by smoke.'
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, gameWon, gameOver, isId]);

  const formatTime = formatClock;

  // Partikel kabut asap karhutla — kepadatan mengikuti tingkat kesulitan
  const buildSmoke = useCallback((fires) => {
    const density = preset.smokeDensity;
    const smokes = [];
    for (let i = 0; i < Math.round(90 * density); i++) {
      smokes.push({
        x: Math.random() * 1000,
        y: Math.random() * 800,
        radius: 60 + Math.random() * 75,
        opacity: Math.min(0.95, (0.5 + Math.random() * 0.4) * (0.85 + density * 0.15)),
        vx: 0.15 + Math.random() * 0.35,
        vy: -0.06 + (Math.random() - 0.5) * 0.15,
      });
    }
    fires.forEach((fz) => smokes.push(...buildFireSmoke(fz, Math.round(9 * density))));
    return smokes;
  }, [preset.smokeDensity]);

  useEffect(() => {
    smokeParticlesRef.current = buildSmoke(config.hotspots);
  }, [buildSmoke, config.hotspots]);

  // Toast singkat untuk perubahan api (meluas / spot fire)
  const [fireToast, setFireToast] = useState(null);
  const fireToastTimerRef = useRef(null);
  const showFireToast = useCallback((text) => {
    setFireToast(text);
    if (fireToastTimerRef.current) clearTimeout(fireToastTimerRef.current);
    fireToastTimerRef.current = setTimeout(() => setFireToast(null), 3200);
  }, []);

  /* ────────────────────────────────────────────────────────────────────────
     API DINAMIS: meluas tiap 20–25 detik, spot fire di jalur yang sering dilalui,
     dan krisis asap saat waktu hampir habis. Berjalan mengikuti jam game (berhenti saat jeda).
     ──────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (briefingOpen || gameWon || gameOver) return;
    const elapsed = MISSION_TIME - timeRemaining;
    if (elapsed <= 0) return;

    // 1. Api meluas pelan (tidak pernah menutup satwa/habitat/posisi awal)
    if (preset.growEvery > 0 && elapsed % preset.growEvery === 0) {
      const rate = preset.growRate * config.frpScaling.growMult;
      setFireHotspots((prev) =>
        prev.map((f) => {
          const rx = Math.min(f.rx * (1 + rate), f.baseRx * 1.6);
          const ry = Math.min(f.ry * (1 + rate), f.baseRy * 1.6);
          if (rx === f.rx || fireCoversProtected(f, rx, ry)) return f;
          return { ...f, rx, ry, intensity: Math.min(1.7, f.intensity * (1 + rate * 0.6)) };
        }),
      );
      showFireToast(
        isId
          ? '🔥 Api meluas — koridor aman menyempit'
          : '🔥 The fire is spreading — safe corridors are shrinking'
      );
    }

    // 2. Spot fire (Sulit): bara terbawa angin ke jalur yang paling sering dilewati ranger
    const spotTriggers = [0.3, 0.6];
    const spawned = spotFiresSpawnedRef.current;
    if (
      preset.spotFires > spawned &&
      !pendingSpotRef.current &&
      elapsed >= Math.round(MISSION_TIME * spotTriggers[Math.min(spawned, spotTriggers.length - 1)])
    ) {
      const ranger = rangerRef.current;
      // Sel jalur paling sering dilewati + titik di sekitarnya (agar tetap ada kandidat
      // ketika pusat sel terlalu dekat satwa, habitat, posisi awal, atau ranger)
      const OFFSETS = [[0, 0], [90, 0], [-90, 0], [0, 90], [0, -90], [70, 70], [-70, -70], [70, -70], [-70, 70]];
      const candidates = [...visitHeatRef.current.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .flatMap(([key]) => {
          const [cx, cy] = key.split(':').map(Number);
          return OFFSETS.map(([ox, oy]) => ({ x: cx * 100 + 50 + ox, y: cy * 100 + 50 + oy }));
        })
        .filter((c) => (
          c.x > 60 && c.x < 860 && c.y > 60 && c.y < 740 &&
          Math.hypot(c.x - ranger.x, c.y - ranger.y) > 120 &&
          Math.hypot(c.x - animalPosRef.current.x, c.y - animalPosRef.current.y) > 110 &&
          !fireCoversProtected(c, 40, 32) &&
          // jangan menumpuk di atas api yang sudah ada
          !fireHotspots.some((fz) => Math.hypot(c.x - fz.x, c.y - fz.y) < Math.max(fz.rx, fz.ry) + 30)
        ));
      const pick = candidates[0];
      if (pick) {
        pendingSpotRef.current = { x: pick.x, y: pick.y, igniteAt: elapsed + 3 };
        setRangerDialogue(
          isId
            ? '⚠️ Bara terbawa angin ke jalur yang sering kamu lewati! Dalam 3 detik akan menyala — cari jalur lain.'
            : '⚠️ Embers are drifting onto the path you keep using! It will ignite in 3 seconds — find another route.'
        );
      }
    }

    if (pendingSpotRef.current && elapsed >= pendingSpotRef.current.igniteAt) {
      const sp = pendingSpotRef.current;
      pendingSpotRef.current = null;
      spotFiresSpawnedRef.current += 1;
      const n = spotFiresSpawnedRef.current;
      const spot = {
        id: `spot-${n}`,
        x: sp.x,
        y: sp.y,
        rx: 40,
        ry: 32,
        baseRx: 40,
        baseRy: 32,
        intensity: 0.9,
        name: `Spot Fire Jalur Evakuasi #${n}`,
        nameEn: `Evacuation Route Spot Fire #${n}`,
        isSpot: true,
      };
      setFireHotspots((prev) => [...prev, spot]);
      smokeParticlesRef.current = [...smokeParticlesRef.current, ...buildFireSmoke(spot, 8)];
      showFireToast(isId ? '🔥 Spot fire menyala di jalur evakuasi!' : '🔥 A spot fire ignited on the evacuation route!');
    }

    // 3. Krisis asap saat waktu hampir habis — selaras dengan cerita lintas batas di beranda
    if (!crisisShownRef.current && timeRemaining <= CRISIS_TIME) {
      crisisShownRef.current = true;
      setRangerDialogue(
        isId
          ? '🌫️ Asap sudah sampai ke kota. Di musim seperti ini sekolah di Kalimantan, Sarawak, sampai Singapura pernah diliburkan. Cepat!'
          : '🌫️ The smoke has reached the towns. In seasons like this, schools from Kalimantan and Sarawak to Singapore have closed. Hurry!'
      );
    }
  }, [timeRemaining]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pulsa Radar NISAR L-band Menembus Kabut Asap
  const radarTimerRef = useRef(null);
  useEffect(() => () => {
    if (radarTimerRef.current) clearTimeout(radarTimerRef.current);
    if (fireToastTimerRef.current) clearTimeout(fireToastTimerRef.current);
  }, []);

  const triggerRadar = useCallback(() => {
    if (radarCharges <= 0 || radarActive || briefingOpen) return;
    setRadarCharges((prev) => prev - 1);
    setRadarActive(true);
    radarWaveRef.current = 10;
    radarNoiseRef.current = (Math.random() - 0.5) * 0.7;
    GameAudio.playRadarPulse();

    // Radar menenangkan satwa yang panik (pemain melihat jalur aman lagi)
    if (animalFxRef.current.panicUntil > performance.now()) {
      animalFxRef.current.panicUntil = 0;
      animalFxRef.current.panicCooldownUntil = performance.now() + 5000;
      setAnimalPanicking(false);
    }

    const searching = animalState === 'SEARCHING';
    setRangerDialogue(
      preset.radarLock
        ? isId
          ? '🛰️ Radar NISAR menembus asap — posisi satwa terkunci!'
          : '🛰️ NISAR radar pierces the smoke — animal position locked!'
        : searching
          ? isId
            ? '🛰️ Pantulan radar menangkap gerakan… satwa ada kira-kira di arah panah hijau.'
            : '🛰️ Radar echoes caught movement… the animal is roughly where the green arrow points.'
          : isId
            ? '🛰️ Radar memetakan koridor — ikuti arah ke habitat sebelum asap menutup lagi.'
            : '🛰️ Radar maps the corridor — head toward the habitat before the smoke closes in.'
    );

    if (radarTimerRef.current) clearTimeout(radarTimerRef.current);
    radarTimerRef.current = setTimeout(() => {
      setRadarActive(false);
    }, preset.radarMs);
  }, [radarCharges, radarActive, briefingOpen, animalState, preset.radarLock, preset.radarMs, isId]);

  /* ────────────────────────────────────────────────────────────────────────
     DATA PROSEDURAL POHON ALAMI DI DUNIA NYATA
     Pohon yang berada di dalam zona salah satu dari banyak titik api akan terbakar
     ──────────────────────────────────────────────────────────────────────── */
  const treeCanopyData = useMemo(() => {
    const trees = [];
    const seedRandom = (s) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    // Jalur sungai alami di sisi kanan (tidak ada pohon & bukan habitat)
    const isInsideRiver = (x, y) => {
      let rc = 930;
      if (y < 220) rc = 950 - y * 0.25;
      else if (y < 520) rc = 890 - (y - 220) * 0.12;
      else rc = 855 + (y - 520) * 0.28;
      return Math.abs(x - rc) < 42;
    };

    // Cek apakah pohon berada di salah satu dari BANYAK titik kebakaran
    const isInsideAnyFireScar = (x, y) => {
      return fireHotspots.some((fz) => {
        const dx = x - fz.x;
        const dy = y - fz.y;
        return (dx * dx) / (fz.rx * fz.rx) + (dy * dy) / (fz.ry * fz.ry) < 1.0;
      });
    };

    let seed = 73;
    for (let gx = 25; gx < 975; gx += 26) {
      for (let gy = 25; gy < 775; gy += 24) {
        seed += 1.37;
        const jx = (seedRandom(seed) - 0.5) * 18;
        const jy = (seedRandom(seed + 1) - 0.5) * 16;
        const tx = gx + jx;
        const ty = gy + jy;

        if (isInsideRiver(tx, ty)) continue;

        const isBurned = isInsideAnyFireScar(tx, ty);
        const radius = 11 + seedRandom(seed + 2) * 11;
        const treeType = Math.floor(seedRandom(seed + 3) * 4);

        const palette = [
          { base: '#1b4d24', mid: '#2d6d35', light: '#46904e', highlight: '#73b977' },
          { base: '#133919', mid: '#1e5426', light: '#337a3c', highlight: '#5ba662' },
          { base: '#2b5219', mid: '#417326', light: '#629e3a', highlight: '#91cb61' },
          { base: '#233d26', mid: '#385d3b', light: '#548759', highlight: '#84b889' },
        ][treeType];

        const subLeaves = [];
        for (let l = 0; l < 5; l++) {
          const lAngle = (l / 5) * Math.PI * 2 + seedRandom(seed + 4 + l);
          const lDist = radius * 0.45;
          subLeaves.push({
            ox: Math.cos(lAngle) * lDist,
            oy: Math.sin(lAngle) * lDist,
            r: radius * (0.42 + seedRandom(seed + 9 + l) * 0.25),
          });
        }

        trees.push({
          x: tx,
          y: ty,
          radius,
          palette,
          subLeaves,
          isBurned,
        });
      }
    }

    return trees;
  }, [fireHotspots]);

  // Reset Sektor / Mulai Ulang Misi (opsional: acak posisi titik api)
  const restartMission = useCallback((randomizeFires = false) => {
    setLives(MAX_LIVES);
    setRescuedCount(0);
    setTimeRemaining(MISSION_TIME);
    setBriefingOpen(false);
    setIsPaused(false);
    setGameWon(false);
    setGameOver(false);
    setFailReason('');
    setFailKind('');
    setBurnedCorridors([]);
    setMissionIndex(0);
    setAnimalState('SEARCHING');
    setShowFoundModal(false);
    setRadarActive(false);
    setRadarCharges(preset.radar);
    setAnimalHp(preset.animalHp);
    setAnimalPanicking(false);
    setFireToast(null);
    radarWaveRef.current = 0;
    animalFxRef.current = { hp: preset.animalHp, invulnUntil: 0, panicUntil: 0, panicCooldownUntil: 0 };
    rangerInvulnUntilRef.current = 0;
    visitHeatRef.current = new Map();
    pendingSpotRef.current = null;
    spotFiresSpawnedRef.current = 0;
    crisisShownRef.current = false;

    // Api selalu kembali ke ukuran awal (api dinamis sudah meluas di percobaan sebelumnya)
    let nextFires = config.hotspots;
    if (randomizeFires) {
      nextFires = config.hotspots.map((f, i) => {
        const jx = Math.sin(Date.now() + i * 2.3) * 35;
        const jy = Math.cos(Date.now() + i * 1.9) * 30;
        const moved = {
          ...f,
          x: Math.max(160, Math.min(800, f.x + jx)),
          y: Math.max(130, Math.min(740, f.y + jy)),
        };
        // Jangan sampai api acak menutupi satwa atau habitat
        return fireCoversProtected(moved, moved.rx, moved.ry) ? f : moved;
      });
    }
    setFireHotspots(nextFires);
    smokeParticlesRef.current = buildSmoke(nextFires);

    rangerRef.current = {
      x: 120,
      y: 440,
      targetX: 120,
      targetY: 440,
      angle: 0,
      isMoving: false,
      walkCycle: 0,
      speed: 140,
    };

    animalPosRef.current = {
      x: missions[0].lostPos.x,
      y: missions[0].lostPos.y,
      angle: 0,
      walkCycle: 0,
    };

    setRangerDialogue(
      isId
        ? `Cari ${missions[0].name}. Asap terlalu pekat — gunakan senter dan radar NISAR.`
        : `Find ${missions[0].nameEn}. The smoke is too thick — use your flashlight and NISAR radar.`
    );
  }, [isId, MAX_LIVES, MISSION_TIME, preset.radar, preset.animalHp, config.hotspots, missions, buildSmoke]);

  // Pilih layer radar + catat untuk soft gate "bandingkan sebelum lanjut"
  const LAYER_LESSONS = {
    before: {
      id: '🌲 Before: kanopi utuh sebelum kebakaran — inilah rumah yang sedang dipertaruhkan.',
      en: '🌲 Before: the intact canopy before the fire — this is the home at stake.',
    },
    // After & Change memakai fakta dari dokumen scraping ml/source (Intro to SAR, NISAR Data User Guide)
    after: {
      id: `📡 After: ${getFact('volume', true).text}`,
      en: `📡 After: ${getFact('volume', false).text}`,
    },
    change: {
      id: `🗺️ Change: ${getFact('gcov', true).text} Selisih sebelum–sesudah menunjukkan koridor mana yang hilang paling cepat.`,
      en: `🗺️ Change: ${getFact('gcov', false).text} The before–after difference shows which corridors are vanishing fastest.`,
    },
  };

  const selectLayer = (layer) => {
    setRadarLayer(layer);
    if (LAYER_LESSONS[layer]) {
      setRangerDialogue(isId ? LAYER_LESSONS[layer].id : LAYER_LESSONS[layer].en);
    }
    if (layer !== 'optical' && !layersSeen.includes(layer)) {
      const next = [...layersSeen, layer];
      setLayersSeen(next);
      try {
        window.localStorage.setItem('home-radar-layers-seen', JSON.stringify(next));
      } catch {
        // localStorage tidak tersedia — gate cukup berlaku di sesi ini
      }
    }
  };

  // Navigasi Mengklik Peta Langsung
  const handleMapClick = (e) => {
    if (gameOver || gameWon || isPaused || showFoundModal) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    rangerRef.current.targetX = Math.max(30, Math.min(canvas.width - 30, clickX));
    rangerRef.current.targetY = Math.max(30, Math.min(canvas.height - 30, clickY));
  };

  // Keyboard navigation listener (W, A, S, D / Arrow keys)
  useEffect(() => {
    const keysDown = new Set();

    const handleKeyDown = (e) => {
      if (briefingOpen) {
        if (e.key === 'Enter') {
          e.preventDefault();
          startMission();
        }
        return;
      }
      if (gameOver || gameWon) return;
      if (showFoundModal) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setShowFoundModal(false);
        }
        return;
      }

      keysDown.add(e.key.toLowerCase());
      if (e.key === 'p' || e.key === 'P') {
        setIsPaused((prev) => !prev);
      }
      if (e.key === ' ' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        triggerRadar();
      }
    };

    const handleKeyUp = (e) => {
      keysDown.delete(e.key.toLowerCase());
    };

    const interval = setInterval(() => {
      if (gameOver || gameWon || isPaused || showFoundModal) return;
      let dx = 0;
      let dy = 0;

      if (keysDown.has('arrowup') || keysDown.has('w')) dy -= 1;
      if (keysDown.has('arrowdown') || keysDown.has('s')) dy += 1;
      if (keysDown.has('arrowleft') || keysDown.has('a')) dx -= 1;
      if (keysDown.has('arrowright') || keysDown.has('d')) dx += 1;

      if (dx !== 0 || dy !== 0) {
        const length = Math.hypot(dx, dy);
        const stepDist = 34;
        rangerRef.current.targetX = Math.max(30, Math.min(970, rangerRef.current.x + (dx / length) * stepDist));
        rangerRef.current.targetY = Math.max(30, Math.min(770, rangerRef.current.y + (dy / length) * stepDist));
      }
    }, 50);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(interval);
    };
  }, [gameOver, gameWon, isPaused, showFoundModal, triggerRadar, briefingOpen, startMission]);

  /* ────────────────────────────────────────────────────────────────────────
     60 FPS ENGINE RENDERING: API DINAMIS + SATWA KE HABITAT ASLI
     ──────────────────────────────────────────────────────────────────────── */
  // Nilai terbaru yang dibaca loop tanpa harus me-restart animasi tiap detik
  const livesRef = useRef(lives);
  livesRef.current = lives;
  const timeRemainingRef = useRef(timeRemaining);
  timeRemainingRef.current = timeRemaining;
  const foundOnceRef = useRef(new Set());
  const panicFlagRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    lastTimeRef.current = performance.now();

    // Titik (px, py) berada di dalam ellipse api yang diskalakan + padding
    const insideFire = (px, py, fz, scale = 0.72, pad = 0) => {
      const ex = fz.rx * scale + pad;
      const ey = fz.ry * scale + pad;
      const dx = px - fz.x;
      const dy = py - fz.y;
      return (dx * dx) / (ex * ex) + (dy * dy) / (ey * ey) < 1;
    };

    // Dorong posisi menjauh dari pusat api
    const pushAway = (obj, fz, distance) => {
      const vx = obj.x - fz.x;
      const vy = obj.y - fz.y;
      const len = Math.hypot(vx, vy) || 1;
      obj.x = Math.max(30, Math.min(970, obj.x + (vx / len) * distance));
      obj.y = Math.max(30, Math.min(770, obj.y + (vy / len) * distance));
    };

    const recordBurned = (fz) => {
      const label = isId ? fz.name : fz.nameEn || fz.name;
      setBurnedCorridors((prev) => (prev.includes(label) ? prev : [...prev, label]));
    };

    const roughDistance = (d) => {
      if (d < 200) return isId ? 'DEKAT' : 'NEAR';
      if (d < 450) return isId ? 'SEDANG' : 'MID';
      return isId ? 'JAUH' : 'FAR';
    };

    // Kipas arah kasar radar (bukan kunci posisi penuh)
    const drawRadarBearing = (ranger, target, label, color, now) => {
      const d = Math.hypot(target.x - ranger.x, target.y - ranger.y);
      const ang = Math.atan2(target.y - ranger.y, target.x - ranger.x) + radarNoiseRef.current;
      const spread = 0.45;
      const len = 150 + Math.sin(now * 0.01) * 6;
      ctx.save();
      const grad = ctx.createRadialGradient(ranger.x, ranger.y, 20, ranger.x, ranger.y, len);
      grad.addColorStop(0, `${color}00`);
      grad.addColorStop(0.4, `${color}55`);
      grad.addColorStop(1, `${color}00`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(ranger.x, ranger.y);
      ctx.arc(ranger.x, ranger.y, len, ang - spread, ang + spread);
      ctx.closePath();
      ctx.fill();

      // Panah arah
      const tipX = ranger.x + Math.cos(ang) * (len - 18);
      const tipY = ranger.y + Math.sin(ang) * (len - 18);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ranger.x + Math.cos(ang) * 34, ranger.y + Math.sin(ang) * 34);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(tipX + Math.cos(ang) * 14, tipY + Math.sin(ang) * 14);
      ctx.lineTo(tipX + Math.cos(ang + 2.4) * 11, tipY + Math.sin(ang + 2.4) * 11);
      ctx.lineTo(tipX + Math.cos(ang - 2.4) * 11, tipY + Math.sin(ang - 2.4) * 11);
      ctx.closePath();
      ctx.fill();

      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(`📡 ${label} · ${roughDistance(d)}`, ranger.x + Math.cos(ang) * (len + 14), ranger.y + Math.sin(ang) * (len + 14));
      ctx.restore();
    };

    const render = (now) => {
      // Timestamp rAF bisa sedikit lebih awal dari performance.now() di frame pertama → jaga dt tidak negatif
      const dt = Math.max(0, Math.min((now - lastTimeRef.current) / 1000, 0.1));
      lastTimeRef.current = now;

      const ranger = rangerRef.current;
      const animal = animalPosRef.current;
      const fx = animalFxRef.current;
      const hab = currentMission.habitat;
      const active = !gameOver && !gameWon && !isPaused && !showFoundModal;
      const panicking = animalState === 'FOLLOWING' && fx.panicUntil > now;

      // Laporkan berakhirnya panik ke UI (sekali saja, bukan tiap frame)
      if (panicFlagRef.current && !panicking) {
        panicFlagRef.current = false;
        setAnimalPanicking(false);
      }

      // 1. UPDATE FISIKA GERAK RANGER MANUSIA
      const dx = ranger.targetX - ranger.x;
      const dy = ranger.targetY - ranger.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 3 && active) {
        ranger.isMoving = true;
        ranger.angle = Math.atan2(dy, dx);
        const moveStep = Math.min(dist, ranger.speed * dt);
        ranger.x += (dx / dist) * moveStep;
        ranger.y += (dy / dist) * moveStep;
        ranger.walkCycle += moveStep * 0.18;

        // Jejak jalur ranger → kandidat lokasi spot fire di level Sulit
        const cellKey = `${Math.floor(ranger.x / 100)}:${Math.floor(ranger.y / 100)}`;
        visitHeatRef.current.set(cellKey, (visitHeatRef.current.get(cellKey) || 0) + dt);

        stepSoundTimerRef.current += dt;
        if (stepSoundTimerRef.current > 0.28) {
          GameAudio.playFootstep();
          stepSoundTimerRef.current = 0;
        }
      } else {
        ranger.isMoving = false;
      }

      if (active) {
        // FASE 1: RANGER MENCARI SATWA
        if (animalState === 'SEARCHING') {
          const dToAnimal = Math.hypot(ranger.x - animal.x, ranger.y - animal.y);
          if (dToAnimal < 45) {
            GameAudio.playFoundAnimal();
            setAnimalState('FOLLOWING');
            const firstTime = !foundOnceRef.current.has(currentMission.id);
            foundOnceRef.current.add(currentMission.id);
            if (firstTime) setShowFoundModal(true);
            setRangerDialogue(
              firstTime
                ? isId
                  ? `Kamu menemukan ${currentMission.name}! Tuntun dia ke ${hab.name}.`
                  : `You found ${currentMission.nameEn}! Guide it to ${hab.nameEn}.`
                : isId
                  ? `${currentMission.name} kembali bersamamu. Jangan terlalu jauh darinya!`
                  : `${currentMission.nameEn} is with you again. Don't get too far ahead!`
            );
          }
        }

        // FASE 2: SATWA MENGIKUTI RANGER MENUJU HABITAT ASLINYA
        if (animalState === 'FOLLOWING') {
          if (!panicking) {
            const adx = (ranger.x - Math.cos(ranger.angle) * 38) - animal.x;
            const ady = (ranger.y - Math.sin(ranger.angle) * 38) - animal.y;
            const adist = Math.hypot(adx, ady);
            if (adist > 5) {
              animal.angle = Math.atan2(ady, adx);
              animal.x += (adx / adist) * Math.min(adist, (ranger.speed * 1.05) * dt);
              animal.y += (ady / adist) * Math.min(adist, (ranger.speed * 1.05) * dt);
              animal.walkCycle += dt * 8;
            }
          }

          // Satwa panik saat mencium api dari dekat → berhenti, pemain harus menunggu / pakai radar
          if (preset.panic > 0 && !panicking && now > fx.panicCooldownUntil) {
            const nearFire = fireHotspots.find((fz) => insideFire(animal.x, animal.y, fz, 0.72, 70));
            if (nearFire && Math.random() < preset.panic * dt) {
              fx.panicUntil = now + preset.panicMs;
              fx.panicCooldownUntil = now + preset.panicMs + 3500;
              panicFlagRef.current = true;
              setAnimalPanicking(true);
              setRangerDialogue(
                isId
                  ? `${currentMission.name} panik mencium asap dan berhenti! Tunggu dia tenang, atau pancarkan radar untuk menunjukkan jalur aman.`
                  : `${currentMission.nameEn} panicked at the smoke and froze! Wait for it to calm down, or pulse the radar to show a safe path.`
              );
            }
          }

          // Satwa tertinggal terlalu jauh (Sulit) → kembali bersembunyi di balik asap
          if (preset.leash > 0 && Math.hypot(ranger.x - animal.x, ranger.y - animal.y) > preset.leash) {
            setAnimalState('SEARCHING');
            fx.panicUntil = 0;
            panicFlagRef.current = false;
            setAnimalPanicking(false);
            setRangerDialogue(
              isId
                ? `${currentMission.name} tertinggal dan bersembunyi lagi di balik asap! Kembali dan temukan dia.`
                : `${currentMission.nameEn} fell behind and hid in the smoke again! Go back and find it.`
            );
          }

          // Satwa ikut terluka bila masuk zona api
          if (preset.animalHp > 0 && now > fx.invulnUntil) {
            const burnFire = fireHotspots.find((fz) => insideFire(animal.x, animal.y, fz));
            if (burnFire) {
              GameAudio.playDangerWarning();
              fx.hp -= 1;
              fx.invulnUntil = now + 1500;
              pushAway(animal, burnFire, 50);
              setAnimalHp(fx.hp);
              recordBurned(burnFire);
              if (fx.hp <= 0) {
                setGameOver(true);
                setFailKind('animal');
                setFailReason(
                  isId
                    ? `${currentMission.name} terjebak di "${burnFire.name}". Koridor itu hangus, dan jalan pulangnya ikut hilang.`
                    : `${currentMission.nameEn} was trapped in "${burnFire.nameEn || burnFire.name}". That corridor burned, and its way home went with it.`
                );
              } else {
                setRangerDialogue(
                  isId
                    ? `${currentMission.name} terluka! Koridor "${burnFire.name}" hangus. ${hab.name} makin terancam.`
                    : `${currentMission.nameEn} is hurt! The "${burnFire.nameEn || burnFire.name}" corridor burned. ${hab.nameEn} is now at greater risk.`
                );
              }
            }
          }

          // CEK JIKA BERHASIL MENCAPAI HABITAT ASLINYA
          const dHabitat = Math.hypot(animal.x - hab.x, animal.y - hab.y);
          if (dHabitat < hab.radius + 15) {
            GameAudio.playRescueChime();
            const nextCount = rescuedCount + 1;
            setRescuedCount(nextCount);
            // Satu isi ulang radar per satwa yang pulang (Sedang/Sulit) agar tetap adil
            if (preset.radarRefill > 0) setRadarCharges((c) => c + preset.radarRefill);
            fx.hp = preset.animalHp;
            fx.panicUntil = 0;
            setAnimalHp(preset.animalHp);

            if (nextCount >= missions.length) {
              setGameWon(true);
            } else {
              const nextIdx = missionIndex + 1;
              setMissionIndex(nextIdx);
              const nextMission = missions[nextIdx];

              animal.x = nextMission.lostPos.x;
              animal.y = nextMission.lostPos.y;
              setAnimalState('SEARCHING');

              setRangerDialogue(
                isId
                  ? `${currentMission.name} sampai di rumahnya. Tapi ${nextMission.name} masih di balik asap — cari dia!`
                  : `${currentMission.nameEn} made it home. But ${nextMission.nameEn} is still somewhere in the smoke — find it!`
              );
            }
          }
        }

        // CEK RANGER MENYENTUH API (juga saat diam: api bisa meluas ke arahnya)
        if (now > rangerInvulnUntilRef.current) {
          const hitFire = fireHotspots.find((fz) => insideFire(ranger.x, ranger.y, fz));
          if (hitFire) {
            GameAudio.playDangerWarning();
            rangerInvulnUntilRef.current = now + 1200;
            pushAway(ranger, hitFire, 45);
            ranger.targetX = ranger.x;
            ranger.targetY = ranger.y;
            recordBurned(hitFire);
            const next = livesRef.current - 1;
            livesRef.current = next;
            setLives(next);
            if (next <= 0) {
              setGameOver(true);
              setFailKind('ranger');
              setFailReason(
                isId
                  ? `Ranger terkepung api di "${hitFire.name}". Tanpa ranger, tidak ada yang menuntun ${currentMission.name} pulang.`
                  : `The ranger was surrounded by fire at "${hitFire.nameEn || hitFire.name}". Without a ranger, no one can guide ${currentMission.nameEn} home.`
              );
            } else {
              setRangerDialogue(
                isId
                  ? `Koridor "${hitFire.name}" hangus. ${hab.name} ikut terancam — mundur dan cari jalur lain.`
                  : `The "${hitFire.nameEn || hitFire.name}" corridor has burned. ${hab.nameEn} is under threat — fall back and find another route.`
              );
            }
          }
        }
      }

      /* ────────────────────────────────────────────────────────────────
         GAMBAR DUNIA PETA ALAMI
         ──────────────────────────────────────────────────────────────── */
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // (A) ALAS TANAH HIJAU RIMBA
      ctx.fillStyle = '#1e4420';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // (B) TAMPILAN SESUAI NISAR RADAR LAYER
      if (radarLayer === 'before') {
        ctx.fillStyle = 'rgba(74, 222, 128, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (radarLayer === 'after') {
        ctx.fillStyle = '#1b1b1b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (radarLayer === 'change') {
        fireHotspots.forEach((fz) => {
          const heatGrad = ctx.createRadialGradient(fz.x, fz.y, 10, fz.x, fz.y, fz.rx * 1.5);
          heatGrad.addColorStop(0, 'rgba(239, 68, 68, 0.7)');
          heatGrad.addColorStop(0.5, 'rgba(234, 179, 8, 0.45)');
          heatGrad.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
          ctx.fillStyle = heatGrad;
          ctx.beginPath();
          ctx.arc(fz.x, fz.y, fz.rx * 1.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // (C) SUNGAI BERLIKU DENGAN TEPIAN PASIR
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(950, 0);
      ctx.bezierCurveTo(910, 160, 860, 320, 875, 480);
      ctx.bezierCurveTo(890, 600, 790, 720, 940, 800);
      ctx.strokeStyle = '#8a7356';
      ctx.lineWidth = 58;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.strokeStyle = '#1b5e7d';
      ctx.lineWidth = 42;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.35)';
      ctx.lineWidth = 5;
      ctx.setLineDash([16, 22]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // (D) TITIK KEBAKARAN KARHUTLA (bisa meluas & bertambah)
      if (radarLayer !== 'before') {
        fireHotspots.forEach((fz, idx) => {
          ctx.save();
          const burnScarGrad = ctx.createRadialGradient(fz.x, fz.y, 10, fz.x, fz.y, fz.rx);
          burnScarGrad.addColorStop(0, 'rgba(249, 115, 22, 0.88)');
          burnScarGrad.addColorStop(0.35, 'rgba(194, 65, 12, 0.78)');
          burnScarGrad.addColorStop(0.75, 'rgba(58, 22, 8, 0.92)');
          burnScarGrad.addColorStop(1, 'rgba(30, 68, 32, 0)');
          ctx.fillStyle = burnScarGrad;
          ctx.beginPath();
          ctx.ellipse(fz.x, fz.y, fz.rx, fz.ry, -0.1 + (idx * 0.15), 0, Math.PI * 2);
          ctx.fill();

          // Tepi api yang menyala (front api bergerak)
          if (preset.growEvery > 0) {
            ctx.strokeStyle = `rgba(251, 146, 60, ${0.35 + Math.sin(now * 0.006 + idx) * 0.2})`;
            ctx.lineWidth = 2.5;
            ctx.setLineDash([6, 8]);
            ctx.beginPath();
            ctx.ellipse(fz.x, fz.y, fz.rx * 0.72, fz.ry * 0.72, -0.1 + (idx * 0.15), 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          ctx.font = `${Math.round(20 * fz.intensity)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('🔥', fz.x, fz.y + Math.sin(now * 0.007 + idx) * 3);
          ctx.restore();
        });
      }

      // Peringatan spot fire yang akan menyala (3 detik) — pemain diberi waktu menghindar
      if (pendingSpotRef.current) {
        const sp = pendingSpotRef.current;
        const pulse = 34 + Math.sin(now * 0.02) * 8;
        ctx.save();
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.95)';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('⚠', sp.x, sp.y);
        ctx.restore();
      }

      // (E) POHON KANOPI RIMBUN
      treeCanopyData.forEach((tree) => {
        if (tree.isBurned && radarLayer !== 'before') {
          ctx.save();
          ctx.translate(tree.x, tree.y);
          ctx.fillStyle = 'rgba(20, 10, 5, 0.75)';
          ctx.beginPath();
          ctx.arc(0, 0, tree.radius * 0.65, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return;
        }

        ctx.save();
        ctx.translate(tree.x, tree.y);
        ctx.fillStyle = 'rgba(6, 22, 10, 0.5)';
        ctx.beginPath();
        ctx.ellipse(5, 7, tree.radius, tree.radius * 0.75, 0.2, 0, Math.PI * 2);
        ctx.fill();

        const p = tree.palette;
        ctx.fillStyle = p.base;
        ctx.beginPath();
        ctx.arc(0, 0, tree.radius, 0, Math.PI * 2);
        ctx.fill();

        tree.subLeaves.forEach((sl) => {
          ctx.fillStyle = p.mid;
          ctx.beginPath();
          ctx.arc(sl.ox, sl.oy, sl.r, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.fillStyle = p.light;
        ctx.beginPath();
        ctx.arc(-tree.radius * 0.22, -tree.radius * 0.22, tree.radius * 0.58, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // (F) HABITAT ASLI — jelas di Mudah; di Sedang/Sulit hanya ikon samar sampai dekat / saat radar
      const nearHabitat =
        Math.hypot(ranger.x - hab.x, ranger.y - hab.y) < 170 ||
        Math.hypot(animal.x - hab.x, animal.y - hab.y) < 170;
      const habitatVivid = preset.habitatClear || radarActive || nearHabitat;
      ctx.save();
      if (habitatVivid) {
        const pulseHab = Math.sin(now * 0.006) * 7;
        ctx.strokeStyle = hab.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(hab.x, hab.y, hab.radius + pulseHab, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 8;
        ctx.stroke();
      } else {
        ctx.globalAlpha = 0.3;
      }
      ctx.fillStyle = '#062013';
      ctx.beginPath();
      ctx.arc(hab.x, hab.y, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = hab.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(hab.icon, hab.x, hab.y - 1);
      if (habitatVivid) {
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(isId ? hab.name : hab.nameEn, hab.x, hab.y + 36);
        ctx.shadowBlur = 0;
      }
      ctx.restore();

      // (G) JALUR PENUNTUN — selalu (Mudah), hanya saat radar (Sedang), tidak ada (Sulit)
      const showGuide =
        animalState === 'FOLLOWING' &&
        (preset.guideLine === 'always' || (preset.guideLine === 'radar' && radarActive));
      if (showGuide) {
        ctx.save();
        ctx.strokeStyle = preset.guideLine === 'always' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(52, 211, 153, 0.85)';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([8, 12]);
        ctx.beginPath();
        ctx.moveTo(animal.x, animal.y);
        ctx.quadraticCurveTo((animal.x + hab.x) / 2, (animal.y + hab.y) / 2 - 30, hab.x, hab.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🐾', (animal.x + hab.x) / 2, (animal.y + hab.y) / 2 - 15);
        ctx.restore();
      }

      // (H) POSISI SATWA — tersembunyi di balik asap kecuali Mudah / tersorot senter / radar lock
      const dRangerAnimal = Math.hypot(ranger.x - animal.x, ranger.y - animal.y);
      const animalVisible =
        animalState === 'FOLLOWING' ||
        preset.revealAnimal ||
        dRangerAnimal < 120 ||
        (radarActive && preset.radarLock);
      if (animalVisible) {
        ctx.save();
        const shake = panicking ? Math.sin(now * 0.08) * 3 : 0;
        ctx.translate(animal.x + shake, animal.y);
        if (animalState === 'FOLLOWING' && now < fx.invulnUntil && Math.floor(now / 120) % 2 === 0) {
          ctx.globalAlpha = 0.4;
        }

        if (animalState === 'SEARCHING' && preset.revealAnimal) {
          const ping = Math.sin(now * 0.008) * 8;
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, 24 + ping, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.roundRect(-24, -36, 48, 16, 5);
          ctx.fill();
          ctx.font = 'bold 9px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(isId ? 'CARI AKU!' : 'FIND ME!', 0, -26);
        } else if (animalState === 'FOLLOWING') {
          ctx.strokeStyle = panicking ? '#f97316' : '#facc15';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.stroke();
          if (panicking) {
            ctx.font = 'bold 18px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#f97316';
            ctx.fillText('❗', 0, -30);
          }
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 8, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '30px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(currentMission.emoji, 0, -2);
        ctx.restore();
      }

      // (I) GADIS RANGER DENGAN RANSEL PENYELAMAT
      ctx.save();
      ctx.translate(ranger.x, ranger.y);
      if (now < rangerInvulnUntilRef.current && Math.floor(now / 120) % 2 === 0) {
        ctx.globalAlpha = 0.45;
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(0, 8, 15, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sinar Senter
      ctx.save();
      ctx.rotate(ranger.angle);
      const lightBeam = ctx.createRadialGradient(8, 0, 4, 65, 0, 95);
      lightBeam.addColorStop(0, 'rgba(254, 240, 138, 0.6)');
      lightBeam.addColorStop(0.5, 'rgba(250, 204, 21, 0.25)');
      lightBeam.addColorStop(1, 'rgba(250, 204, 21, 0)');
      ctx.fillStyle = lightBeam;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(105, -35);
      ctx.lineTo(105, 35);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.rotate(ranger.angle);
      const legOffset = ranger.isMoving ? Math.sin(ranger.walkCycle) * 7 : 0;
      const armOffset = ranger.isMoving ? Math.cos(ranger.walkCycle) * 6 : 0;

      ctx.fillStyle = '#451a03';
      ctx.fillRect(-5, -8 + legOffset, 10, 4);
      ctx.fillRect(-5, 4 - legOffset, 10, 4);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-6, -6, 7, 12);
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.roundRect(-16, -7, 10, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.roundRect(-7, -8, 14, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-2 + armOffset, -10, 5, 3);
      ctx.fillRect(-2 - armOffset, 7, 5, 3);
      ctx.fillStyle = '#713f12';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(2, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // (J) INDIKATOR TITIK TUJUAN KLIK
      const dTarget = Math.hypot(ranger.targetX - ranger.x, ranger.targetY - ranger.y);
      if (dTarget > 6) {
        ctx.save();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(ranger.targetX, ranger.targetY, 11 + Math.sin(now * 0.01) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // (K) KABUT ASAP KARHUTLA & SINAR RADAR PENEMBUS KABUT NISAR
      if (!radarActive) {
        ctx.save();
        const hazeGrad = ctx.createRadialGradient(ranger.x, ranger.y, 60, ranger.x, ranger.y, 260);
        hazeGrad.addColorStop(0, 'rgba(48, 40, 33, 0)');
        hazeGrad.addColorStop(1, `rgba(48, 40, 33, ${Math.min(0.75, 0.42 * preset.smokeDensity)})`);
        ctx.fillStyle = hazeGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      if (smokeParticlesRef.current && smokeParticlesRef.current.length > 0) {
        ctx.save();
        smokeParticlesRef.current.forEach((sm) => {
          if (active) {
            sm.x += sm.vx;
            sm.y += sm.vy;
          }
          if (sm.x > canvas.width + 60) sm.x = -60;
          if (sm.x < -60) sm.x = canvas.width + 60;
          if (sm.y > canvas.height + 60) sm.y = -60;
          if (sm.y < -60) sm.y = canvas.height + 60;

          // Senter & radius sekitar ranger membersihkan kabut asap
          const distToRanger = Math.hypot(sm.x - ranger.x, sm.y - ranger.y);
          let rangerClear = 1;
          if (distToRanger < 130) {
            rangerClear = Math.max(0.08, (distToRanger - 40) / 90);
          }

          // Habitat sedikit lebih bersih hanya bila terlihat jelas
          let habClear = 1;
          if (habitatVivid) {
            const distToHab = Math.hypot(sm.x - hab.x, sm.y - hab.y);
            if (distToHab < 90) habClear = Math.max(0.2, (distToHab - 30) / 60);
          }

          const radarPierce = radarActive ? 0.08 : 1.0;
          const finalAlpha = sm.opacity * rangerClear * habClear * radarPierce;

          if (finalAlpha > 0.02) {
            const smokeGrad = ctx.createRadialGradient(sm.x, sm.y, 4, sm.x, sm.y, sm.radius);
            smokeGrad.addColorStop(0, `rgba(45, 38, 32, ${Math.min(1, finalAlpha * 0.95)})`);
            smokeGrad.addColorStop(0.5, `rgba(38, 30, 24, ${finalAlpha * 0.65})`);
            smokeGrad.addColorStop(1, 'rgba(25, 20, 16, 0)');
            ctx.fillStyle = smokeGrad;
            ctx.beginPath();
            ctx.arc(sm.x, sm.y, sm.radius, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.restore();
      }

      // Krisis: saat waktu hampir habis asap menebal di seluruh peta
      const tLeft = timeRemainingRef.current;
      if (tLeft <= CRISIS_TIME && !radarActive) {
        const k = 1 - tLeft / CRISIS_TIME;
        ctx.save();
        ctx.fillStyle = `rgba(70, 58, 44, ${0.12 + k * 0.28})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      // (L) GELOMBANG RADAR NISAR L-BAND
      if (radarActive) {
        ctx.save();
        radarWaveRef.current += 380 * dt;
        if (radarWaveRef.current > 1400) radarWaveRef.current = 15;
        const waveR = radarWaveRef.current;

        ctx.strokeStyle = 'rgba(52, 211, 153, 0.85)';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([14, 10]);
        ctx.beginPath();
        ctx.arc(ranger.x, ranger.y, waveR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(ranger.x, ranger.y, Math.max(0, waveR - 45), 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(52, 211, 153, 0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        for (let gx = 0; gx < canvas.width; gx += 125) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, canvas.height);
          ctx.stroke();
        }
        for (let gy = 0; gy < canvas.height; gy += 125) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(canvas.width, gy);
          ctx.stroke();
        }

        if (animalState === 'SEARCHING') {
          if (preset.radarLock) {
            // Mudah: kunci posisi penuh dengan crosshair
            const reticlePulse = Math.sin(now * 0.015) * 6;
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(animal.x, animal.y, 34 + reticlePulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(animal.x - 45, animal.y);
            ctx.lineTo(animal.x - 20, animal.y);
            ctx.moveTo(animal.x + 20, animal.y);
            ctx.lineTo(animal.x + 45, animal.y);
            ctx.moveTo(animal.x, animal.y - 45);
            ctx.lineTo(animal.x, animal.y - 20);
            ctx.moveTo(animal.x, animal.y + 20);
            ctx.lineTo(animal.x, animal.y + 45);
            ctx.stroke();
            ctx.fillStyle = '#22c55e';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`📡 NISAR TARGET LOCK: ${currentMission.emoji}`, animal.x, animal.y - 44);
          } else {
            // Sedang/Sulit: hanya arah kasar + perkiraan jarak
            drawRadarBearing(ranger, animal, currentMission.emoji, '#34d399', now);
          }
        } else if (preset.guideLine === 'never') {
          // Sulit: tanpa garis habitat — radar hanya memberi arah kasar ke habitat
          drawRadarBearing(ranger, hab, hab.icon, '#a3e635', now);
        }

        ctx.restore();
      }

      animIdRef.current = requestAnimationFrame(render);
    };

    animIdRef.current = requestAnimationFrame(render);
    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, [treeCanopyData, radarLayer, missionIndex, currentMission, animalState, rescuedCount, gameOver, gameWon, isPaused, showFoundModal, fireHotspots, radarActive, isId, missions, preset, CRISIS_TIME]);

  /* ──────────────────────────────────────────────────────────────────────────
     RINGKASAN AKHIR: tanpa skor/AQI palsu — yang dihitung adalah siapa yang pulang
     ────────────────────────────────────────────────────────────────────────── */
  const missionResults = useMemo(() => {
    const rescued = missions.slice(0, rescuedCount);
    const stillLost = missions.slice(rescuedCount);
    return {
      rescued,
      stillLost,
      elapsedTime: formatTime(MISSION_TIME - timeRemaining),
    };
  }, [missions, rescuedCount, timeRemaining, MISSION_TIME]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#07130b] text-cream-100 py-4 px-2 sm:px-6 font-sans selection:bg-amber-400 selection:text-charcoal-900">
      <div className="mx-auto max-w-7xl">
        {/* TOP BAR / BREADCRUMB */}
        <div className="mb-3 flex items-center justify-between text-xs text-emerald-400 font-mono">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-emerald-300 transition-colors">
              {isId ? 'Beranda' : 'Home'}
            </Link>
            <span>/</span>
            <Link to="/game/radar-rescue" className="hover:text-emerald-300 transition-colors">
              {isId ? 'Peta Misi' : 'Mission Map'}
            </Link>
            <span>/</span>
            <span className="text-amber-300 font-bold">NASA NISAR: Dancing with the SARs</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-red-950 px-2.5 py-1 rounded-full border border-red-700/60 text-[11px] text-red-300 font-bold">
              🔥 {fireHotspots.length} {isId ? 'Titik Api Aktif' : 'Active Hotspots'}
            </span>
            <span className="bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-700/50 text-[11px] text-amber-300 font-bold">
              {isId ? `Target: ${currentMission.name}` : `Target: ${currentMission.nameEn}`}
            </span>
          </div>
        </div>

        {/* ── BANNER MISI DARI PETA ── */}
        {config.mode && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-500/50 bg-gradient-to-r from-[#2a1306] via-[#1a1a08] to-[#0a1b10] px-4 py-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-amber-400 px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase text-charcoal-950">
                🗺️ {isId ? 'Misi dari Peta' : 'Map Mission'}
              </span>
              {config.mode === 'fire' ? (
                <span className="font-bold text-cream-100">
                  🔥 {isId ? 'Titik api' : 'Hotspot'}{' '}
                  <span className="text-amber-300">{config.site || (isId ? 'terpilih' : 'selected')}</span>
                  {config.frp && <span className="font-mono text-red-300"> · FRP {config.frp} MW</span>}
                </span>
              ) : (
                <span className="font-bold text-cream-100">
                  {config.targetMission.emoji} {isId ? 'Selamatkan' : 'Rescue'}{' '}
                  <span className="text-amber-300">{isId ? config.targetMission.name : config.targetMission.nameEn}</span>
                  {config.site && <span className="text-emerald-300/80"> · {config.site}</span>}
                </span>
              )}
              <span className="rounded-full border border-white/20 bg-black/40 px-2 py-0.5 font-mono text-[10px] font-bold text-cream-100">
                {preset.icon} {isId ? `Level ${preset.labelId}` : `${preset.labelEn} level`} · ❤️{MAX_LIVES} · ⏱️{formatTime(MISSION_TIME)} · 📡{preset.radar}x
              </span>
              {config.frpScaling.factor > 0 && (
                <span
                  className="rounded-full border border-red-500/50 bg-red-950/60 px-2 py-0.5 font-mono text-[10px] font-bold text-red-200"
                  title={isId ? 'FRP nyata dari NASA FIRMS memengaruhi api di game' : 'Real NASA FIRMS FRP shapes the fire in this game'}
                >
                  🛰️ FRP → {isId ? 'api' : 'fire'} +{Math.round((config.frpScaling.sizeMult - 1) * 100)}%
                  {preset.growEvery > 0 && ` · ${isId ? 'sebar' : 'spread'} ×${config.frpScaling.growMult.toFixed(1)}`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <Link to="/game/radar-rescue" className="text-emerald-300 hover:text-emerald-200">
                ← {isId ? 'Kembali ke Peta' : 'Back to Map'}
              </Link>
              <span className="text-emerald-700">|</span>
              <Link to="/game/play" className="text-cream-200/70 hover:text-cream-100">
                {isId ? 'Mode Bebas' : 'Free Play'}
              </Link>
            </div>
          </div>
        )}

        {/* CONTAINER UTAMA GAME */}
        <div className="relative w-full rounded-3xl overflow-hidden border-2 border-emerald-700/70 shadow-2xl bg-[#030a05]">
          {/* ── TOP HUD (❤️ 3 | 🐾 0/5 | ⏱️ 03:00 | ⏸️) ── */}
          <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
            {/* Kiri: Nyawa & Satwa Terselamatkan */}
            <div className="flex items-center gap-3 pointer-events-auto">
              <div className="flex items-center gap-1.5 bg-[#0a1b10]/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-emerald-600/50 shadow-lg font-mono text-sm font-bold text-cream-50">
                <span className="text-red-500 text-base">❤️</span>
                <span>{lives}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-[#0a1b10]/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-emerald-600/50 shadow-lg font-mono text-sm font-bold text-amber-300">
                <span className="text-base">🐾</span>
                <span>{rescuedCount}/{missions.length}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-[#0a1b10]/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-emerald-600/50 shadow-lg font-mono text-sm font-bold text-cream-100">
                <span className="text-base">⏱️</span>
                <span>{formatTime(timeRemaining)}</span>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 bg-[#0a1b10]/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-emerald-600/50 text-xs font-mono font-bold">
                {animalState === 'SEARCHING' ? (
                  <span className="text-red-400 animate-pulse">
                    🔍 {isId ? `Cari ${currentMission.emoji}` : `Find ${currentMission.emoji}`}
                  </span>
                ) : animalPanicking ? (
                  <span className="text-orange-400 animate-pulse">
                    ❗ {isId ? `${currentMission.emoji} panik` : `${currentMission.emoji} panicking`}
                  </span>
                ) : (
                  <span className="text-emerald-300">
                    🐾 {isId ? `Tuntun ke ${currentMission.habitat.icon}` : `Guide to ${currentMission.habitat.icon}`}
                  </span>
                )}
              </div>

              {/* Kondisi satwa saat dikawal (Sedang/Sulit) */}
              {preset.animalHp > 0 && animalState === 'FOLLOWING' && (
                <div
                  className="flex items-center gap-1 bg-[#0a1b10]/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-amber-600/50 shadow-lg font-mono text-sm font-bold"
                  title={isId ? 'Kondisi satwa — terluka bila masuk zona api' : 'Animal condition — hurt when it enters fire'}
                >
                  <span className="text-base">{currentMission.emoji}</span>
                  <span className="tracking-tight">
                    {'🧡'.repeat(Math.max(0, animalHp))}
                    <span className="opacity-30">{'🤍'.repeat(Math.max(0, preset.animalHp - animalHp))}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Kanan: Tombol Pause ⏸️ */}
            <button
              onClick={() => setIsPaused((prev) => !prev)}
              className="pointer-events-auto w-10 h-10 rounded-2xl bg-[#0a1b10]/90 backdrop-blur-md border border-emerald-600/50 flex items-center justify-center text-cream-50 font-bold hover:bg-emerald-900 transition-all shadow-lg active:scale-95"
              title={isId ? 'Jeda Game' : 'Pause Game'}
            >
              {isPaused ? '▶️' : '⏸️'}
            </button>
          </div>

          {/* ── NOTIFIKASI API & EDUKASI RADAR (TENGAH ATAS) ── */}
          <div className="pointer-events-none absolute top-16 left-1/2 z-30 flex w-[min(92%,460px)] -translate-x-1/2 flex-col items-center gap-1.5">
            {radarActive && (
              <div className="rounded-xl border border-emerald-400/70 bg-[#04150c]/90 px-3 py-1.5 text-center font-mono text-[10.5px] font-bold text-emerald-200 shadow-lg backdrop-blur-md">
                📡 {getFact('lband', isId).text} {getFact('cloudsCanopy', isId).text}
                <span className="block mt-0.5 text-[9px] font-normal text-emerald-300/70">
                  {isId ? 'Sumber' : 'Source'}: {getFact('lband', isId).source?.title} · {getFact('cloudsCanopy', isId).source?.title}
                </span>
              </div>
            )}
            {fireToast && (
              <div className="rounded-xl border border-orange-500/70 bg-[#2a0e04]/90 px-3 py-1.5 text-center text-[11px] font-bold text-orange-200 shadow-lg backdrop-blur-md">
                {fireToast}
              </div>
            )}
          </div>

          {/* ── KARTU NISAR RADAR LAYER (DI POJOK KIRI ATAS) ── */}
          <div className="absolute top-20 left-4 z-30 w-44 sm:w-48 bg-[#0a1c11]/90 backdrop-blur-md rounded-2xl border border-emerald-600/60 p-2.5 shadow-2xl text-xs font-sans text-cream-100">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-emerald-800/80">
              <span className="font-bold text-[11px] text-emerald-300 flex items-center gap-1">
                <span>🛰️</span> NISAR Radar Layer
              </span>
              <span className="text-[10px] opacity-60">ℹ️</span>
            </div>

            {/* Soft gate: bandingkan sebelum–sesudah sekali di misi pertama */}
            {!layerGateDone && (
              <div className="mb-2 rounded-lg border border-amber-400/70 bg-amber-950/50 px-2 py-1.5 text-[9.5px] leading-snug text-amber-100 animate-pulse">
                <div className="font-bold text-amber-300">
                  {isId ? '👁️ Bandingkan dulu sebelum lanjut' : '👁️ Compare before you go on'}
                </div>
                <div className="mt-0.5 font-mono">
                  {['before', 'after', 'change'].map((l) => (
                    <span key={l} className={`mr-1.5 ${layersSeen.includes(l) ? 'text-emerald-300' : 'text-amber-200/70'}`}>
                      {layersSeen.includes(l) ? '✓' : '○'} {l === 'before' ? 'Before' : l === 'after' ? 'After' : 'Change'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <button
                onClick={() => selectLayer('before')}
                className={`w-full flex items-center gap-2 p-1.5 rounded-xl border text-left transition-all ${
                  radarLayer === 'before'
                    ? 'bg-emerald-700/80 border-emerald-400 text-cream-50 font-bold'
                    : 'bg-black/40 border-emerald-900/60 text-cream-200/80 hover:bg-emerald-950'
                }`}
              >
                <div className="w-6 h-6 rounded bg-emerald-900 border border-emerald-600 flex items-center justify-center text-[10px]">
                  🌲
                </div>
                <div>
                  <div className="text-[10px] font-bold">Before (Pre-Fire)</div>
                  <div className="text-[8px] opacity-60">Jan 2025 • Pristine</div>
                </div>
              </button>

              <button
                onClick={() => selectLayer('after')}
                className={`w-full flex items-center gap-2 p-1.5 rounded-xl border text-left transition-all ${
                  radarLayer === 'after'
                    ? 'bg-emerald-700/80 border-emerald-400 text-cream-50 font-bold'
                    : 'bg-black/40 border-emerald-900/60 text-cream-200/80 hover:bg-emerald-950'
                }`}
              >
                <div className="w-6 h-6 rounded bg-charcoal-800 border border-charcoal-600 flex items-center justify-center text-[10px]">
                  📡
                </div>
                <div>
                  <div className="text-[10px] font-bold">After (SAR Backscatter)</div>
                  <div className="text-[8px] opacity-60">{fireHotspots.length} Fire Scars Visible</div>
                </div>
              </button>

              <button
                onClick={() => selectLayer('change')}
                className={`w-full flex items-center gap-2 p-1.5 rounded-xl border text-left transition-all ${
                  radarLayer === 'change'
                    ? 'bg-emerald-700/80 border-emerald-400 text-cream-50 font-bold'
                    : 'bg-black/40 border-emerald-900/60 text-cream-200/80 hover:bg-emerald-950'
                }`}
              >
                <div className="w-6 h-6 rounded bg-gradient-to-br from-red-600 via-yellow-500 to-blue-500 border border-amber-400 flex items-center justify-center text-[10px]">
                  🗺️
                </div>
                <div>
                  <div className="text-[10px] font-bold">Change Map (Delta)</div>
                  <div className="text-[8px] opacity-60">Multi-Zone Burn Heatmap</div>
                </div>
              </button>

              <button
                onClick={() => selectLayer('optical')}
                className={`w-full text-center py-1 rounded-lg text-[9px] font-mono transition-colors ${
                  radarLayer === 'optical'
                    ? 'text-amber-300 font-bold'
                    : 'text-emerald-400/70 hover:text-emerald-300'
                }`}
              >
                {isId ? '● Tampilan Udara Nyata' : '● Realistic Optical View'}
              </button>
            </div>

            {/* Tombol Pancarkan Radar NISAR Menembus Kabut Asap */}
            <div className="pt-2 border-t border-emerald-800/80 mt-2">
              <button
                onClick={triggerRadar}
                disabled={radarCharges <= 0 || radarActive}
                className={`w-full py-2 px-2 rounded-xl font-bold text-[11px] flex items-center justify-between transition-all shadow-md active:scale-95 ${
                  radarActive
                    ? 'bg-emerald-400 text-charcoal-950 animate-pulse border border-emerald-200'
                    : radarCharges > 0
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-charcoal-950'
                    : 'bg-emerald-950/60 text-emerald-600/60 border border-emerald-900 cursor-not-allowed'
                }`}
                title={isId ? 'Pancarkan Pulsa Radar NISAR (Spasi / R)' : 'Emit NISAR Radar Pulse (Space / R)'}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span>📡</span>
                  <span className="truncate">
                    {radarActive
                      ? (isId ? 'RADAR AKTIF!' : 'RADAR ACTIVE!')
                      : (isId ? 'Tembus Asap (Spasi)' : 'Pierce Smoke (Space)')}
                  </span>
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-black/40 text-[9px] font-mono text-cream-50 font-bold ml-1 shrink-0">
                  {radarCharges}x
                </span>
              </button>
              <div className="text-[8px] text-emerald-400/80 text-center mt-1 font-mono">
                {radarActive
                  ? (isId ? 'Gelombang mikro L-band menembus asap!' : 'L-band microwave piercing smoke!')
                  : (isId ? 'Tekan [Spasi] atau tombol ini' : 'Press [Space] or click button')}
              </div>
            </div>
          </div>

          {/* ── TOMBOL CEPAT RADAR NISAR DI POJOK KANAN BAWAH (MOBILE & TOUCH FRIENDLY) ── */}
          <div className="absolute bottom-4 right-4 z-30 flex flex-col items-end gap-1.5 pointer-events-auto">
            <button
              onClick={triggerRadar}
              disabled={radarCharges <= 0 || radarActive}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl shadow-2xl border backdrop-blur-md transition-all active:scale-90 font-mono text-xs font-bold ${
                radarActive
                  ? 'bg-emerald-400 border-white text-charcoal-950 animate-pulse shadow-emerald-500/50'
                  : radarCharges > 0
                  ? 'bg-[#0a1f13]/95 border-emerald-500 text-emerald-300 hover:bg-emerald-900 shadow-lg hover:border-emerald-300'
                  : 'bg-black/60 border-emerald-950 text-emerald-700 cursor-not-allowed'
              }`}
              title={isId ? 'Pancarkan Radar NISAR Menembus Asap' : 'Emit NISAR Radar Through Smoke'}
            >
              <span className="text-base sm:text-lg">📡</span>
              <span className="hidden sm:inline">
                {radarActive
                  ? (isId ? 'RADAR MENEMBUS KABUT' : 'RADAR PIERCING SMOKE')
                  : (isId ? 'PANCARKAN NISAR' : 'NISAR RADAR PULSE')}
              </span>
              <span className="px-2 py-0.5 rounded-xl bg-black/50 text-amber-300 font-bold text-[11px] border border-emerald-700/60">
                {radarCharges}x
              </span>
            </button>
          </div>

          {/* ── KANVAS GAME PETA HUTAN NYATA (1000 x 800) ── */}
          <div className="relative w-full aspect-[5/4] sm:aspect-[16/10] overflow-hidden select-none">
            <canvas
              ref={canvasRef}
              width={1000}
              height={800}
              onClick={handleMapClick}
              className="w-full h-full object-cover cursor-crosshair"
              title={isId ? 'Klik di mana saja pada peta untuk melangkah' : 'Click anywhere on map to walk'}
            />
          </div>

          {/* ── DIALOG KOTAK RANGER GADIS BERANSEL DI POJOK BAWAH ── */}
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-30 flex items-end gap-3 pointer-events-none">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0a1e12] border-2 border-amber-400 shadow-2xl flex items-center justify-center text-3xl sm:text-4xl filter drop-shadow-md shrink-0">
              👩‍🌾
            </div>

            <div className="bg-[#0b1c11]/95 backdrop-blur-md rounded-2xl border-2 border-emerald-600/70 p-3 shadow-2xl text-xs sm:text-sm text-cream-100 font-sans leading-relaxed pointer-events-auto">
              <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider font-mono mb-0.5">
                Ranger Maya • Field Guide
              </div>
              <p className="font-serif italic text-cream-100">{rangerDialogue}</p>
            </div>
          </div>
        </div>

        {/* ── BRIEFING EVAKUASI (1 LAYAR SEBELUM MAIN) ── */}
        {briefingOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
            <div className="bg-[#0b1c11] max-w-lg w-full max-h-[92vh] overflow-y-auto rounded-3xl border-2 border-amber-400 shadow-2xl p-6 text-cream-50">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-amber-400 px-2.5 py-0.5 font-mono text-[10px] font-extrabold uppercase text-charcoal-950">
                  {config.mode === 'fire'
                    ? (isId ? '🔥 Misi titik api nyata' : '🔥 Real hotspot mission')
                    : config.mode === 'animal'
                      ? (isId ? `${config.targetMission.emoji} Misi penyelamatan` : `${config.targetMission.emoji} Rescue mission`)
                      : (isId ? '🎲 Mode bebas' : '🎲 Free play')}
                </span>
                <span className="font-mono text-[10px] font-bold text-cream-200/80">
                  {preset.icon} {isId ? preset.labelId : preset.labelEn} · ❤️{MAX_LIVES} · ⏱️{formatTime(MISSION_TIME)}
                </span>
              </div>

              <h2 className="font-hand text-3xl sm:text-4xl font-bold text-amber-300 mt-4 leading-tight">
                {isId ? 'Ini bukan skor — ini evakuasi.' : 'This is not a score — it is an evacuation.'}
              </h2>
              <p className="font-serif italic text-emerald-200 mt-1">
                {isId ? 'Setiap detik, rumah mereka mengecil.' : 'Every second, their home gets smaller.'}
              </p>

              {/* Satu misi = satu pesan */}
              <div className="mt-4 rounded-2xl border border-emerald-600/60 bg-emerald-950/70 p-3 text-sm leading-relaxed">
                {config.mode === 'fire' && (
                  <p>
                    🔥 {isId ? 'Titik api nyata di' : 'A real hotspot in'}{' '}
                    <strong className="text-amber-300">{config.site || (isId ? 'Kalimantan' : 'Kalimantan')}</strong>
                    {config.frp && <span className="font-mono text-red-300"> · FRP {config.frp} MW</span>}.{' '}
                    {isId
                      ? `Yang kehilangan rumah: ${missions.map((m) => m.emoji).join(' ')} — ${missions.length} satwa yang koridornya ada di sekitar api ini.`
                      : `Who is losing their home: ${missions.map((m) => m.emoji).join(' ')} — ${missions.length} animals whose corridors sit around this fire.`}
                  </p>
                )}
                {config.mode === 'animal' && (
                  <p>
                    {config.targetMission.emoji} {isId ? 'Rumah' : 'The home of'}{' '}
                    <strong className="text-amber-300">{isId ? config.targetMission.name : config.targetMission.nameEn}</strong>
                    {config.site && <span className="text-emerald-300/80"> ({config.site})</span>}:{' '}
                    <strong>{isId ? config.targetMission.habitat.name : config.targetMission.habitat.nameEn}</strong> —{' '}
                    {isId ? config.targetMission.habitat.desc : config.targetMission.habitat.descEn}
                  </p>
                )}
                {!config.mode && (
                  <p>
                    {missions.map((m) => m.emoji).join(' ')}{' '}
                    {isId
                      ? 'Lima satwa tersesat di antara titik api. Rumah mereka ada di sisi lain asap.'
                      : 'Five animals are lost between the hotspots. Their homes are on the other side of the smoke.'}
                  </p>
                )}
              </div>

              {/* Bukti "rumah mengecil": NDVI dari pipeline ML di sekitar lokasi misi */}
              {config.ndvi && (
                <div className="mt-3 rounded-2xl border border-lime-700/60 bg-lime-950/40 p-3 text-[12px] leading-relaxed">
                  🌿 {isId ? 'Kehijauan hutan di' : 'Forest greenness at'}{' '}
                  <strong className="text-lime-200">{config.ndvi.loc}</strong>{' '}
                  {isId ? 'turun dari' : 'fell from'}{' '}
                  <span className="font-mono">{config.ndvi.before}</span> {isId ? 'ke' : 'to'}{' '}
                  <span className="font-mono">{config.ndvi.after}</span>{' '}
                  <span className="font-mono text-red-300">(−{config.ndvi.lossPct}%)</span>.
                  <span className="block text-[10px] text-cream-200/55">
                    NDVI · {isId ? 'contoh kerja pipeline ML (ml/pipeline.py), bukan unduhan langsung NASA' : 'ML pipeline worked example (ml/pipeline.py), not a direct NASA download'}
                  </span>
                </div>
              )}

              {/* Satu fakta singkat + fakta radar bersumber dari ml/source */}
              <p className="mt-3 text-[12px] leading-relaxed text-cream-200/85">
                💡 {(() => {
                  const fact = BRIEFING_FACTS[config.mode || 'free'];
                  return isId ? fact.id : fact.en;
                })()}
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-emerald-200/90">
                📡 {getFact('allWeather', isId).text}{' '}
                <a
                  href={getFact('allWeather', isId).source?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] text-emerald-400/80 underline decoration-dotted"
                >
                  [{getFact('allWeather', isId).source?.title}]
                </a>
              </p>

              {/* Aturan level — ringkas */}
              <ul className="mt-3 space-y-1 rounded-2xl border border-white/10 bg-black/40 p-3 text-[11.5px] leading-snug text-cream-100">
                {preset.revealAnimal ? (
                  <li>👀 {isId ? 'Satwa ditandai “CARI AKU!” dan radar mengunci posisinya.' : 'The animal is marked “FIND ME!” and the radar locks onto it.'}</li>
                ) : (
                  <li>
                    📡 {isId
                      ? `Satwa tak terlihat di balik asap. Senter hanya menerangi jarak dekat; radar memberi arah kasar (${preset.radar}× · ${(preset.radarMs / 1000).toFixed(1)} dtk, +${preset.radarRefill} tiap satwa pulang).`
                      : `Animals are hidden in the smoke. Your flashlight only reaches close by; the radar gives a rough bearing (${preset.radar}× · ${(preset.radarMs / 1000).toFixed(1)}s, +${preset.radarRefill} per animal home).`}
                  </li>
                )}
                {preset.growEvery > 0 && (
                  <li>
                    🔥 {isId ? `Api meluas tiap ${preset.growEvery} detik` : `Fire spreads every ${preset.growEvery} seconds`}
                    {config.frpScaling.factor > 0 && (isId ? ' — makin cepat karena FRP titik api ini tinggi.' : ' — faster because this hotspot has high FRP.')}
                    {config.frpScaling.factor === 0 && '.'}
                  </li>
                )}
                {preset.spotFires > 0 && (
                  <li>⚠️ {isId ? 'Bara bisa menyalakan spot fire di jalur yang sering kamu lewati.' : 'Embers can ignite spot fires on the paths you use most.'}</li>
                )}
                {preset.animalHp > 0 && (
                  <li>🧡 {isId ? 'Satwa ikut terluka jika masuk api, dan bisa panik di dekat api.' : 'Animals get hurt in the fire and may panic near it.'}</li>
                )}
                {preset.guideLine !== 'always' && (
                  <li>
                    🧭 {preset.guideLine === 'radar'
                      ? (isId ? 'Jalur ke habitat hanya terlihat saat radar aktif.' : 'The route home only shows while the radar is active.')
                      : (isId ? 'Tidak ada jalur ke habitat — baca arah dari radar.' : 'No route line home — read the radar bearing.')}
                  </li>
                )}
                {preset.leash > 0 && (
                  <li>🐾 {isId ? 'Jangan terlalu jauh: satwa bisa tertinggal dan bersembunyi lagi.' : 'Stay close: the animal can fall behind and hide again.'}</li>
                )}
                <li className="pt-1 font-mono text-[10px] text-cream-200/60">
                  {isId ? 'Klik peta / WASD untuk berjalan · Spasi = radar · P = jeda' : 'Click the map / WASD to walk · Space = radar · P = pause'}
                </li>
              </ul>

              <button
                onClick={startMission}
                className="mt-4 w-full px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-red-500 text-charcoal-950 font-extrabold text-sm hover:brightness-110 transition-all shadow-lg active:scale-95"
              >
                ▶ {isId ? 'Mulai Evakuasi' : 'Start Evacuation'} <span className="font-mono text-[10px] opacity-70">(Enter)</span>
              </button>
            </div>
          </div>
        )}

        {/* ── MODAL SAAT RANGER PERTAMA KALI MENEMUKAN SATWA ── */}
        {showFoundModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-[#0b1c11] max-w-lg w-full rounded-3xl border-2 border-amber-400 shadow-2xl p-6 text-center text-cream-50">
              <div className="text-6xl my-2 animate-bounce">{currentMission.emoji}</div>
              <h2 className="font-hand text-3xl font-bold text-amber-300 mt-2">
                {isId ? `${currentMission.name} Ditemukan!` : `${currentMission.nameEn} Discovered!`}
              </h2>
              <div className="text-xs text-emerald-400 font-mono mt-1">
                {currentMission.species}
              </div>

              <div className="my-4 p-4 rounded-2xl bg-black/50 border border-amber-500/40 text-left font-serif italic text-amber-200 text-sm leading-relaxed">
                &ldquo;{isId ? currentMission.cryId : currentMission.cryEn}&rdquo;
              </div>

              <div className="my-4 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-600/60 text-left text-xs space-y-1">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <span>{currentMission.habitat.icon}</span>
                  <span>{isId ? 'Target Habitat Asli:' : 'Target Natural Habitat:'}</span>
                </div>
                <p className="text-cream-200 font-bold">
                  {isId ? currentMission.habitat.name : currentMission.habitat.nameEn}
                </p>
                <p className="text-emerald-300/80 text-[11px]">
                  {isId ? currentMission.habitat.desc : currentMission.habitat.descEn}
                </p>
              </div>

              <button
                onClick={() => setShowFoundModal(false)}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-charcoal-950 font-bold text-sm hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg active:scale-95"
              >
                {isId ? '🐾 Tuntun Satwa Menuju Habitat Aslinya ➔' : '🐾 Guide Animal Back to Its Habitat ➔'}
              </button>
            </div>
          </div>
        )}

        {/* ── ENDING: MEREKA PULANG — TAPI DI DUNIA NYATA KORIDOR INI MASIH RAWAN ── */}
        {gameWon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
            <div className="bg-[#0c2215] max-w-xl w-full max-h-[92vh] overflow-y-auto rounded-3xl border-2 border-amber-400 shadow-2xl p-6 sm:p-8 text-center text-cream-50">
              <div className="text-4xl sm:text-5xl my-1 tracking-widest">
                {missionResults.rescued.map((m) => m.emoji).join(' ')}
              </div>

              <h2 className="font-hand text-3xl sm:text-4xl font-bold text-amber-300 mt-2">
                {config.mode === 'animal'
                  ? (isId ? `${config.targetMission.name} pulang.` : `${config.targetMission.nameEn} made it home.`)
                  : (isId ? 'Mereka pulang.' : 'They made it home.')}
              </h2>

              {/* Kalimat pengunci pesan — berbeda per jenis misi */}
              <p className="font-serif italic text-emerald-200 text-sm sm:text-base mt-2 leading-relaxed">
                {config.mode === 'fire'
                  ? isId
                    ? `Di game, ${missions.length} satwa lolos dari titik api ${config.site || 'ini'}. Di dunia nyata, titik api itu terdeteksi satelit — dan koridor di sekitarnya masih rawan.`
                    : `In the game, ${missions.length} animals escaped the ${config.site || 'this'} hotspot. In the real world, that fire was detected by satellite — and the corridors around it are still at risk.`
                  : config.mode === 'animal'
                    ? isId
                      ? `Di game, ${config.targetMission.name} sampai di ${config.targetMission.habitat.name}. Di dunia nyata, rumah ${config.targetMission.species.split(' (')[0]}${config.site ? ` di ${config.site}` : ''} masih terancam api dan asap.`
                      : `In the game, ${config.targetMission.nameEn} reached ${config.targetMission.habitat.nameEn}. In the real world, the home of the ${config.targetMission.species.split(' (')[0]}${config.site ? ` in ${config.site}` : ''} is still threatened by fire and smoke.`
                    : isId
                      ? 'Di game mereka pulang. Di dunia nyata, koridor ini masih rawan.'
                      : 'In the game they made it home. In the real world, these corridors are still at risk.'}
              </p>

              {/* Catatan evakuasi — netral, bukan skor */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl border border-emerald-700/60 bg-black/40 p-2">
                  <div className="text-[10px] text-cream-200/70">{isId ? 'Dievakuasi' : 'Evacuated'}</div>
                  <strong className="font-mono text-amber-300">{missionResults.rescued.length}/{missions.length}</strong>
                </div>
                <div className="rounded-xl border border-emerald-700/60 bg-black/40 p-2">
                  <div className="text-[10px] text-cream-200/70">{isId ? 'Waktu evakuasi' : 'Evacuation time'}</div>
                  <strong className="font-mono text-cream-100">{missionResults.elapsedTime}</strong>
                </div>
                <div className="rounded-xl border border-red-800/60 bg-black/40 p-2">
                  <div className="text-[10px] text-cream-200/70">{isId ? 'Koridor hangus' : 'Corridors burned'}</div>
                  <strong className="font-mono text-red-300">{burnedCorridors.length}</strong>
                </div>
              </div>

              {/* Epilog satwa di rumahnya */}
              <div className="my-4 text-left">
                <div className="text-[11px] font-bold text-emerald-300 font-mono mb-2 uppercase tracking-wider">
                  {isId ? 'Di rumahnya sekarang:' : 'At home now:'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-sans">
                  {missionResults.rescued.map((m) => (
                    <div key={m.id} className="p-2 rounded-xl bg-black/40 border border-emerald-900/60 flex items-start gap-2">
                      <span className="text-xl shrink-0">{m.emoji}</span>
                      <p className="text-cream-200/85 leading-tight">{isId ? m.storyEpilogueId : m.storyEpilogueEn}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hubungkan ke SDG & satu aksi nyata */}
              <div className="rounded-2xl border border-amber-500/40 bg-black/50 p-3 text-left">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { n: 15, color: '#56C02B', label: isId ? 'Habitat' : 'Life on Land' },
                    { n: 13, color: '#3F7E44', label: isId ? 'Iklim' : 'Climate' },
                    { n: 3, color: '#4C9F38', label: isId ? 'Udara & kesehatan' : 'Air & health' },
                  ].map((g) => (
                    <span
                      key={g.n}
                      className="rounded-md px-2 py-0.5 font-mono text-[10px] font-extrabold text-white"
                      style={{ backgroundColor: g.color }}
                    >
                      SDG {g.n} · {g.label}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-[11.5px] leading-relaxed text-cream-100">
                  {isId
                    ? 'Rumah satwa (SDG 15), asap & karbon gambut (SDG 13), dan udara yang kita hirup bersama negara tetangga (SDG 3) adalah satu cerita. Pilih satu langkah:'
                    : 'Wildlife homes (SDG 15), peat smoke & carbon (SDG 13), and the air we share with neighbouring countries (SDG 3) are one story. Pick one step:'}
                </p>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px] font-bold">
                  <Link to="/map" className="rounded-lg bg-emerald-700 px-2 py-2 text-center text-cream-50 hover:bg-emerald-600">
                    🗺️ {isId ? 'Pantau titik api nyata' : 'Watch real hotspots'}
                  </Link>
                  <a
                    href="https://firms.modaps.eosdis.nasa.gov/map/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-sky-800 px-2 py-2 text-center text-cream-50 hover:bg-sky-700"
                  >
                    🛰️ NASA FIRMS ↗
                  </a>
                  <Link to="/#chapter-choice" className="rounded-lg bg-amber-500 px-2 py-2 text-center text-charcoal-950 hover:bg-amber-400">
                    🤝 {isId ? 'Dukung mitra' : 'Support partners'}
                  </Link>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-4 text-xs sm:text-sm">
                <button
                  onClick={() => restartMission(false)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-900 border border-emerald-600 text-cream-50 font-bold hover:bg-emerald-800"
                >
                  {isId ? 'Main ulang 🔁' : 'Replay 🔁'}
                </button>
                <button
                  onClick={() => restartMission(true)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-900 border border-emerald-600 text-cream-50 font-bold hover:bg-emerald-800"
                >
                  {isId ? 'Acak titik api 🎲' : 'Shuffle fires 🎲'}
                </button>
                <Link
                  to="/game/radar-rescue"
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-950 border border-amber-600 text-amber-200 font-bold hover:bg-amber-900"
                >
                  {isId ? 'Misi lain di peta 🗺️' : 'Another map mission 🗺️'}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── GAME OVER: SATU RUMAH LAGI TIDAK SEMPAT DISELAMATKAN ── */}
        {gameOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
            <div className="bg-[#180907] max-w-md w-full max-h-[92vh] overflow-y-auto rounded-3xl border-2 border-red-500 shadow-2xl p-6 text-center text-cream-50">
              <div className="text-5xl my-2">
                {failKind === 'animal' ? `${currentMission.emoji}🔥` : failKind === 'time' ? '🌫️' : '🔥'}
              </div>
              <h2 className="font-hand text-3xl font-bold text-red-400 mt-1 leading-tight">
                {isId ? 'Satu rumah lagi tidak sempat diselamatkan.' : 'One more home could not be saved.'}
              </h2>
              <p className="font-sans text-sm text-cream-200/90 mt-3 leading-relaxed">{failReason}</p>

              {missionResults.stillLost.length > 0 && (
                <div className="mt-3 rounded-xl border border-red-900/70 bg-black/40 p-2.5 text-left text-xs">
                  <div className="font-bold text-red-300">{isId ? 'Masih di balik asap:' : 'Still in the smoke:'}</div>
                  <div className="mt-1 text-cream-100">
                    {missionResults.stillLost.map((m) => `${m.emoji} ${isId ? m.name : m.nameEn}`).join(' · ')}
                  </div>
                  {burnedCorridors.length > 0 && (
                    <div className="mt-1.5 text-cream-200/70">
                      🔥 {isId ? 'Koridor hangus:' : 'Corridors burned:'} {burnedCorridors.join(', ')}
                    </div>
                  )}
                </div>
              )}

              <p className="mt-3 font-serif italic text-[13px] text-amber-200/90 leading-relaxed">
                {isId
                  ? 'Di dunia nyata tidak ada tombol “coba lagi”. Karena itu deteksi dini dari satelit — sebelum api sampai ke rumah mereka — begitu penting.'
                  : 'In the real world there is no “try again” button. That is why early satellite detection — before the fire reaches their homes — matters so much.'}
              </p>

              <div className="mt-5 grid grid-cols-1 gap-2 text-sm">
                <button
                  onClick={() => restartMission(false)}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-colors shadow-lg active:scale-95"
                >
                  {isId ? 'Coba evakuasi lagi 🔄' : 'Try the evacuation again 🔄'}
                </button>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <Link to="/map" className="rounded-xl border border-emerald-700 bg-emerald-950 px-3 py-2 text-cream-100 hover:bg-emerald-900">
                    🗺️ {isId ? 'Lihat titik api nyata' : 'See real hotspots'}
                  </Link>
                  <Link to="/#chapter-choice" className="rounded-xl border border-amber-600 bg-amber-950 px-3 py-2 text-amber-200 hover:bg-amber-900">
                    🤝 {isId ? 'Dukung mitra' : 'Support partners'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── FOOTER EDUKASI SDGS & SAINS RADAR NISAR ── */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#09180e] p-4 rounded-2xl border border-emerald-900/80 text-xs">
            <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5 font-mono">
              <span>🛰️</span> {isId ? 'Mengapa Radar NISAR?' : 'Why NISAR Radar?'}
            </h3>
            {/* Fakta dari dokumen scraping ml/source (NISAR Data User Guide, Intro to SAR, ARSET) */}
            <ul className="text-emerald-200/80 leading-relaxed font-sans space-y-1">
              {['lband', 'canopy', 'swath', 'openData', 'validated', 'arsetFire'].map((key) => (
                <li key={key}>• {getFact(key, isId).text}</li>
              ))}
            </ul>
            <div className="mt-2 font-mono text-[9.5px] leading-relaxed text-emerald-400/70">
              {isId ? 'Sumber (ml/source)' : 'Sources (ml/source)'}:{' '}
              {ML_SOURCES.map((src, i) => (
                <span key={src.file}>
                  {i > 0 && ' · '}
                  <a href={src.url} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:text-emerald-200">
                    {src.title}
                  </a>
                </span>
              ))}
            </div>
          </div>

          <div className="bg-[#09180e] p-4 rounded-2xl border border-emerald-900/80 text-xs">
            <h3 className="font-bold text-emerald-300 mb-1 flex items-center gap-1.5 font-mono">
              <span>🦧</span> {isId ? '5 Satwa & Habitat Aslinya' : '5 Animals & Their Natural Habitats'}
            </h3>
            <p className="text-emerald-200/80 leading-relaxed font-sans">
              {isId
                ? 'Kancil di semak riparian sejuk, Orangutan di kanopi pohon ulin tenggara, Trenggiling di liang bukit lembap, Beruang Madu di pohon sarang lebah raksasa, dan Enggang Gading di puncak bukit utara.'
                : 'The mouse deer in cool riverside shrubs, the orangutan in the southeast ironwood canopy, the pangolin in a moist hill burrow, the sun bear in a giant beehive tree, and the helmeted hornbill on the northern ridge.'}
            </p>
          </div>

          <div className="bg-[#09180e] p-4 rounded-2xl border border-emerald-900/80 text-xs">
            <h3 className="font-bold text-cream-100 mb-1 flex items-center gap-1.5 font-mono">
              <span>🌍</span> {isId ? 'Sasaran SDGs PBB' : 'UN SDG Targets'}
            </h3>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <SdgMark n={15} caption={isId ? 'Habitat' : 'Life on Land'} compact />
              <SdgMark n={13} caption={isId ? 'Iklim' : 'Climate'} compact />
              <SdgMark n={3} caption={isId ? 'Kesehatan' : 'Health'} compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
