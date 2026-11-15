import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../i18n';
import SdgMark from '../components/SdgMark';

/* ── Retro Crazy-Arcade Procedural Audio ── */
class ArcadeAudio {
  static ctx = null;
  static muted = false;

  static init() {
    if (!ArcadeAudio.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ArcadeAudio.ctx = new AudioCtx();
    }
    if (ArcadeAudio.ctx && ArcadeAudio.ctx.state === 'suspended') {
      ArcadeAudio.ctx.resume().catch(() => { });
    }
  }

  static tone(freqStart, freqEnd, duration = 0.12, type = 'square', vol = 0.08, delay = 0) {
    if (ArcadeAudio.muted) return;
    try {
      ArcadeAudio.init();
      const ctx = ArcadeAudio.ctx;
      if (!ctx) return;
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, now);
      if (freqEnd !== freqStart) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(25, freqEnd), now + duration);
      }
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Ignore audio block
    }
  }

  static playDropBomb() {
    ArcadeAudio.tone(240, 420, 0.09, 'sine', 0.1);
  }

  static playSplash() {
    ArcadeAudio.tone(180, 55, 0.22, 'sawtooth', 0.09);
    ArcadeAudio.tone(520, 140, 0.16, 'triangle', 0.07, 0.03);
  }

  static playPowerUp() {
    ArcadeAudio.tone(523, 659, 0.08, 'square', 0.07, 0);
    ArcadeAudio.tone(659, 988, 0.12, 'square', 0.07, 0.08);
  }

  static playRescue() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      ArcadeAudio.tone(f, f, 0.14, 'triangle', 0.1, idx * 0.07);
    });
  }

  static playHit() {
    ArcadeAudio.tone(200, 70, 0.28, 'sawtooth', 0.11);
  }

  static playStageClear() {
    [523, 659, 784, 1046, 1318].forEach((f, idx) => {
      ArcadeAudio.tone(f, f, 0.18, 'square', 0.08, idx * 0.09);
    });
  }
}

/* ── Grid Constants (Classic 13x11 Crazy Arcade Arena) ── */
const COLS = 13;
const ROWS = 11;
const TILE = 48;
const CANVAS_W = COLS * TILE; // 624
const CANVAS_H = ROWS * TILE; // 528

const T_EMPTY = 0;
const T_SOLID = 1; // Indestructible ironwood / peat mound
const T_BRUSH = 2; // Destructible dry peat scrub
const T_FIRE_CRATE = 3; // Burning peat obstacle (extinguishable!)

const POWERUP_TYPES = [
  { id: 'bomb', icon: '💧', labelEn: '+1 Water Bomb', labelId: '+1 Bom Air', color: '#0ea5e9' },
  { id: 'range', icon: '🌊', labelEn: '+1 Splash Range', labelId: '+1 Jangkauan', color: '#06b6d4' },
  { id: 'speed', icon: '⚡', labelEn: '+Speed Boots', labelId: '+Sepatu Cepat', color: '#eab308' },
  { id: 'shield', icon: '🛡️', labelEn: 'SAR Shield', labelId: 'Perisai SAR', color: '#10b981' },
];

const WILDLIFE_CAST = [
  { id: 'tuki', emoji: '🦧', nameEn: 'Tuki (Orangutan)', nameId: 'Tuki (Orangutan)', status: 'CR' },
  { id: 'liku', emoji: '🦔', nameEn: 'Liku (Pangolin)', nameId: 'Liku (Trenggiling)', status: 'CR' },
  { id: 'madu', emoji: '🐻', nameEn: 'Madu (Sun Bear)', nameId: 'Madu (Beruang Madu)', status: 'VU' },
  { id: 'kancil', emoji: '🦌', nameEn: 'Kancil (Mouse Deer)', nameId: 'Kancil (Pelanduk)', status: 'LC' },
  { id: 'rangkong', emoji: '🦅', nameEn: 'Rangkong (Hornbill)', nameId: 'Rangkong (Enggang)', status: 'CR' },
];

/* ── Crisp 10x10 Pixel-Art UI Icons for Detail Boxes ── */
const UI_PIXEL_PALETTE = {
  '.': null,
  k: '#3d2817', // dark ink outline
  r: '#ef4444', // heart / alert red
  p: '#fda4af', // heart shine pink
  w: '#ffffff', // white highlight
  o: '#c2410c', // orangutan fur
  f: '#f59e0b', // orangutan face / gold
  b: '#3b82f6', // water blue
  c: '#7dd3fc', // cyan wave / shine
  d: '#1d4ed8', // deep water blue
  y: '#facc15', // star / bolt gold
  g: '#22c55e', // shield emerald
  s: '#94a3b8', // clock / metal silver
};

const UI_PIXEL_ICONS = {
  heart: [
    '..kk..kk..',
    '.krrkkrrk.',
    'kprrrrrrrk',
    'kprrrrrrrk',
    'krrrrrrrrk',
    '.krrrrrrk.',
    '..krrrrk..',
    '...krrk...',
    '....kk....',
    '..........',
  ],
  skull: [
    '..kkkkkk..',
    '.kwwwwwwk.',
    'kwkkwwkkwk',
    'kwkkwwkkwk',
    'kwwwwwwwwk',
    '.kwkwwkwk.',
    '..kkkkkk..',
    '..........',
    '..........',
    '..........',
  ],
  orangutan: [
    '..kkkkkk..',
    '.kooooook.',
    'kooffffook',
    'koofkfkook',
    'kooffffook',
    '.koffffok.',
    '..koooook.',
    '.kkoooookk',
    '..........',
    '..........',
  ],
  clock: [
    '...kkkk...',
    '..kssssk..',
    '.kswwwwsk.',
    'kswwkkwwsk',
    'kswwkwwwsk',
    'kswwkkwwsk',
    '.kswwwwsk.',
    '..kssssk..',
    '...kkkk...',
    '..........',
  ],
  bomb: [
    '....kk....',
    '...kcck...',
    '..kbbbbk..',
    '.kcwbbbbk.',
    '.kcbbbbbk.',
    '.kbbbbbdk.',
    '.kbbbbddk.',
    '..kddddk..',
    '...kkkk...',
    '..........',
  ],
  wave: [
    '..........',
    '..kkkkk...',
    '.kccccck..',
    'kccwwwcck.',
    'kbbbbbbbk.',
    '.kkkkkbbk.',
    '..kcckbbk.',
    '.kccbbddk.',
    '.kddddddk.',
    '..kkkkkk..',
  ],
  bolt: [
    '....kkkk..',
    '...kyyyk..',
    '..kyyyk...',
    '.kyyyyykk.',
    'kyyyyyyyk.',
    '.kkkkyyk..',
    '...kyyk...',
    '..kyyk....',
    '..kkk.....',
    '..........',
  ],
  shield: [
    '.kkkkkkkk.',
    'kggggggggk',
    'kgwwgggggk',
    'kgwggggggk',
    'kggggggggk',
    '.kggggggk.',
    '.kggggggk.',
    '..kggggk..',
    '...kggk...',
    '....kk....',
  ],
  star: [
    '....kk....',
    '...kyyk...',
    'kkkkyykkkk',
    'kywwyyyyyk',
    '.kyyyyyyk.',
    '..kyyyyk..',
    '.kyykkvyk.',
    'kyyk..kyyk',
    'kkk....kkk',
    '..........',
  ],
  flag: [
    '.kk.......',
    '.krrrrrrk.',
    '.krrffrrk.',
    '.krrrrrrk.',
    '.kkrrrrk..',
    '.kk.......',
    '.kk.......',
    '.kk.......',
    'kkkk......',
    '..........',
  ],
};

function PixelIcon({ name, size = 18, className = '' }) {
  const grid = UI_PIXEL_ICONS[name];
  if (!grid) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      shapeRendering="crispEdges"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      {grid.map((row, ry) =>
        row.split('').map((ch, cx) => {
          const fill = UI_PIXEL_PALETTE[ch === 'v' ? 'y' : ch];
          if (!fill) return null;
          return <rect key={`${ry}-${cx}`} x={cx} y={ry} width={1} height={1} fill={fill} />;
        }),
      )}
    </svg>
  );
}

/* ── Fine 16-bit Pixel-Art Outer Space Wallpaper with Soft Blur ── */
const SPACE_PIXELS = [
  [18, 18, 2, '#ffffff'], [42, 34, 2, '#bae6fd'], [74, 14, 2, '#fef08a'], [108, 28, 2, '#ffffff'],
  [144, 16, 2, '#fbcfe8'], [182, 32, 2, '#bae6fd'], [220, 12, 2, '#ffffff'], [258, 26, 2, '#fef08a'],
  [296, 18, 2, '#bae6fd'], [334, 30, 2, '#ffffff'], [372, 14, 2, '#fbcfe8'], [412, 24, 2, '#ffffff'],
  [456, 16, 2, '#bae6fd'], [24, 72, 2, '#fef08a'], [58, 92, 2, '#ffffff'], [96, 68, 2, '#bae6fd'],
  [138, 88, 2, '#ffffff'], [176, 76, 2, '#fbcfe8'], [214, 96, 2, '#ffffff'], [254, 70, 2, '#bae6fd'],
  [292, 90, 2, '#fef08a'], [330, 74, 2, '#ffffff'], [368, 94, 2, '#bae6fd'], [408, 78, 2, '#ffffff'],
  [448, 88, 2, '#fef08a'], [16, 138, 2, '#ffffff'], [48, 162, 2, '#bae6fd'], [86, 146, 2, '#fbcfe8'],
  [124, 174, 2, '#ffffff'], [166, 142, 2, '#fef08a'], [208, 166, 2, '#ffffff'], [248, 148, 2, '#bae6fd'],
  [286, 170, 2, '#ffffff'], [326, 144, 2, '#fbcfe8'], [364, 168, 2, '#ffffff'], [402, 150, 2, '#fef08a'],
  [442, 164, 2, '#bae6fd'], [22, 212, 2, '#bae6fd'], [62, 236, 2, '#ffffff'], [104, 218, 2, '#fef08a'],
  [148, 242, 2, '#ffffff'], [190, 224, 2, '#fbcfe8'], [232, 248, 2, '#bae6fd'], [274, 220, 2, '#ffffff'],
  [316, 244, 2, '#fef08a'], [358, 226, 2, '#ffffff'], [398, 246, 2, '#bae6fd'], [438, 222, 2, '#ffffff'],
  [34, 274, 2, '#fef08a'], [84, 284, 2, '#ffffff'], [134, 276, 2, '#bae6fd'], [184, 288, 2, '#ffffff'],
  [236, 274, 2, '#fbcfe8'], [288, 286, 2, '#ffffff'], [340, 272, 2, '#bae6fd'], [392, 284, 2, '#fef08a'],
  [444, 276, 2, '#ffffff'],
];

const SPACE_SPARKLES = [
  [54, 48, '#fef08a'],
  [158, 52, '#bae6fd'],
  [318, 44, '#ffffff'],
  [426, 124, '#fbcfe8'],
  [66, 202, '#bae6fd'],
  [394, 206, '#fef08a'],
];

function PixelSpaceWallpaper() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#080c1c]" aria-hidden="true">
      <svg
        viewBox="0 0 480 300"
        preserveAspectRatio="xMidYMid slice"
        shapeRendering="crispEdges"
        className="h-full w-full scale-[1.02] blur-[2.5px]"
      >
        {/* Deep space base */}
        <rect x="0" y="0" width="480" height="300" fill="#080c1c" />

        {/* Fine 16-bit Pixel Nebula Clouds */}
        <rect x="0" y="34" width="136" height="68" fill="#141133" opacity="0.75" />
        <rect x="18" y="46" width="88" height="42" fill="#1e184d" opacity="0.75" />
        <rect x="34" y="56" width="52" height="22" fill="#2c236b" opacity="0.65" />

        <rect x="308" y="14" width="172" height="76" fill="#0d1f36" opacity="0.8" />
        <rect x="336" y="26" width="124" height="48" fill="#132e4f" opacity="0.75" />
        <rect x="362" y="38" width="76" height="24" fill="#1a406b" opacity="0.65" />

        <rect x="130" y="122" width="220" height="68" fill="#11112e" opacity="0.7" />
        <rect x="168" y="134" width="144" height="42" fill="#181640" opacity="0.7" />

        <rect x="0" y="202" width="160" height="98" fill="#0c1c30" opacity="0.75" />
        <rect x="18" y="220" width="110" height="62" fill="#132a45" opacity="0.7" />

        <rect x="316" y="198" width="164" height="102" fill="#171136" opacity="0.8" />
        <rect x="340" y="216" width="116" height="66" fill="#23194f" opacity="0.7" />

        {/* Fine pixel starfield */}
        {SPACE_PIXELS.map(([sx, sy, sz, col], idx) => (
          <rect key={`sp-${idx}`} x={sx} y={sy} width={sz} height={sz} fill={col} opacity="0.85" />
        ))}

        {/* 4-point pixel sparkles */}
        {SPACE_SPARKLES.map(([cx, cy, col], idx) => (
          <g key={`spk-${idx}`}>
            <rect x={cx} y={cy - 2} width={2} height={6} fill={col} />
            <rect x={cx - 2} y={cy} width={6} height={2} fill={col} />
            <rect x={cx} y={cy} width={2} height={2} fill="#ffffff" />
          </g>
        ))}

        {/* Top-Left Fine Pixel Ringed Planet */}
        <g transform="translate(14, 22)">
          <rect x="6" y="14" width="32" height="2" fill="#fde68a" opacity="0.8" />
          <rect x="2" y="16" width="40" height="2" fill="#f59e0b" opacity="0.85" />
          <rect x="14" y="6" width="16" height="3" fill="#fb923c" />
          <rect x="10" y="9" width="24" height="5" fill="#f97316" />
          <rect x="10" y="14" width="24" height="5" fill="#ea580c" />
          <rect x="10" y="19" width="24" height="5" fill="#c2410c" />
          <rect x="14" y="24" width="16" height="3" fill="#9a3412" />
          <rect x="14" y="9" width="6" height="2" fill="#fed7aa" />
          <rect x="0" y="18" width="10" height="2" fill="#fef08a" />
          <rect x="10" y="20" width="24" height="2" fill="#fde047" />
          <rect x="34" y="18" width="10" height="2" fill="#fef08a" />
        </g>

        {/* Top-Right Fine Pixel Earth & Orbital Satellite */}
        <g transform="translate(426, 24)">
          <rect x="8" y="0" width="16" height="3" fill="#38bdf8" />
          <rect x="5" y="3" width="22" height="3" fill="#0ea5e9" />
          <rect x="2" y="6" width="28" height="16" fill="#0284c7" />
          <rect x="5" y="22" width="22" height="3" fill="#0369a1" />
          <rect x="8" y="25" width="16" height="3" fill="#075985" />
          {/* Continents */}
          <rect x="8" y="6" width="8" height="5" fill="#22c55e" />
          <rect x="10" y="11" width="6" height="5" fill="#16a34a" />
          <rect x="19" y="9" width="8" height="8" fill="#22c55e" />
          <rect x="21" y="17" width="6" height="4" fill="#15803d" />
          {/* Clouds */}
          <rect x="5" y="9" width="6" height="2" fill="#e0f2fe" />
          <rect x="16" y="19" width="8" height="2" fill="#ffffff" />
          {/* Tiny satellite */}
          <rect x="-14" y="6" width="3" height="7" fill="#60a5fa" />
          <rect x="-11" y="8" width="5" height="3" fill="#cbd5e1" />
          <rect x="-6" y="6" width="3" height="7" fill="#60a5fa" />
        </g>

        {/* Bottom-Left Fine Pixel Moon */}
        <g transform="translate(18, 244)">
          <rect x="6" y="0" width="12" height="3" fill="#e2e8f0" />
          <rect x="3" y="3" width="18" height="3" fill="#cbd5e1" />
          <rect x="0" y="6" width="24" height="12" fill="#cbd5e1" />
          <rect x="3" y="18" width="18" height="3" fill="#94a3b8" />
          <rect x="6" y="21" width="12" height="3" fill="#64748b" />
          <rect x="5" y="6" width="5" height="5" fill="#94a3b8" />
          <rect x="14" y="12" width="5" height="5" fill="#94a3b8" />
        </g>

        {/* Pixel Shooting Star */}
        <g transform="translate(86, 26)">
          <rect x="0" y="8" width="5" height="2" fill="#38bdf8" opacity="0.45" />
          <rect x="5" y="6" width="5" height="2" fill="#7dd3fc" opacity="0.7" />
          <rect x="10" y="4" width="5" height="2" fill="#bae6fd" />
          <rect x="15" y="1" width="5" height="4" fill="#ffffff" />
          <rect x="17" y="1" width="3" height="2" fill="#fef08a" />
        </g>

        {/* Bottom-Right Fine Pixel Rocket */}
        <g transform="translate(436, 248)">
          <rect x="6" y="0" width="4" height="3" fill="#ef4444" />
          <rect x="4" y="3" width="8" height="5" fill="#f8fafc" />
          <rect x="6" y="5" width="4" height="3" fill="#38bdf8" />
          <rect x="4" y="8" width="8" height="6" fill="#e2e8f0" />
          <rect x="1" y="11" width="3" height="5" fill="#ef4444" />
          <rect x="12" y="11" width="3" height="5" fill="#ef4444" />
          <rect x="6" y="14" width="4" height="5" fill="#f97316" />
          <rect x="6" y="19" width="4" height="3" fill="#facc15" />
        </g>
      </svg>
      {/* Subtle dark soft-focus scrim so the foreground game stays the visual hero */}
      <div className="absolute inset-0 bg-[#050814]/35 backdrop-blur-[1.5px]" />
    </div>
  );
}

const STAGES = [
  {
    id: 1,
    nameEn: 'Stage 1 · Sebangau Peatland',
    nameId: 'Level 1 · Gambut Sebangau',
    bgFloor: '#1e3a28',
    bgAlt: '#244430',
    solidColor: '#13261b',
    animalCount: 3,
    enemyCount: 3,
    timeSec: 150,
    brushDensity: 0.48,
  },
  {
    id: 2,
    nameEn: 'Stage 2 · Tanjung Puting Smoke',
    nameId: 'Level 2 · Koridor Asap Tanjung Puting',
    bgFloor: '#233524',
    bgAlt: '#2a402b',
    solidColor: '#162217',
    animalCount: 4,
    enemyCount: 4,
    timeSec: 160,
    brushDensity: 0.56,
  },
  {
    id: 3,
    nameEn: 'Stage 3 · Deep Peat Emergency',
    nameId: 'Level 3 · Darurat Gambut Dalam',
    bgFloor: '#2a2822',
    bgAlt: '#333028',
    solidColor: '#1a1814',
    animalCount: 5,
    enemyCount: 6,
    timeSec: 180,
    brushDensity: 0.62,
  },
];

function createStageState(stageIndex, preferredAnimalId = null) {
  const stage = STAGES[Math.min(stageIndex, STAGES.length - 1)];
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(T_EMPTY));

  // Classic Bomberman / Crazy Arcade checkerboard pillars + outer border
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) {
        grid[r][c] = T_SOLID;
      } else if (r % 2 === 0 && c % 2 === 0) {
        grid[r][c] = T_SOLID;
      } else {
        // Keep player spawn safe zone (top-left: (1,1), (1,2), (2,1))
        const isSafeSpawn =
          (r === 1 && c === 1) || (r === 1 && c === 2) || (r === 2 && c === 1);
        if (!isSafeSpawn && Math.random() < stage.brushDensity) {
          grid[r][c] = Math.random() < 0.35 ? T_FIRE_CRATE : T_BRUSH;
        }
      }
    }
  }

  // Pick candidate cells away from spawn for animals and enemies
  const freeCells = [];
  for (let r = 1; r < ROWS - 1; r += 1) {
    for (let c = 1; c < COLS - 1; c += 1) {
      if (grid[r][c] !== T_SOLID && !(r <= 2 && c <= 2)) {
        freeCells.push({ r, c });
      }
    }
  }
  // Shuffle
  for (let i = freeCells.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [freeCells[i], freeCells[j]] = [freeCells[j], freeCells[i]];
  }

  // Order wildlife so preferredAnimalId (if any from Map) appears first
  const orderedCast = [...WILDLIFE_CAST].sort((a, b) => {
    if (a.id === preferredAnimalId) return -1;
    if (b.id === preferredAnimalId) return 1;
    return 0;
  });

  const animals = [];
  for (let i = 0; i < stage.animalCount && freeCells.length > 0; i += 1) {
    const cell = freeCells.pop();
    // Ensure animal cell is clear, surrounded by at least 1 destructible brush for arcade feel
    grid[cell.r][cell.c] = T_EMPTY;
    const sp = orderedCast[i % orderedCast.length];
    animals.push({
      ...sp,
      r: cell.r,
      c: cell.c,
      rescued: false,
      bobOffset: Math.random() * Math.PI * 2,
    });
  }

  // Spawn Ember Spark enemies in open cells further away
  const enemies = [];
  const enemyDirs = [
    { dr: 0, dc: 1 },
    { dr: 0, dc: -1 },
    { dr: 1, dc: 0 },
    { dr: -1, dc: 0 },
  ];
  for (let i = 0; i < stage.enemyCount && freeCells.length > 0; i += 1) {
    // Prefer cells far from (1,1)
    const idx = freeCells.findIndex((p) => p.r + p.c >= 6);
    const cell = idx >= 0 ? freeCells.splice(idx, 1)[0] : freeCells.pop();
    grid[cell.r][cell.c] = T_EMPTY;
    const dir = enemyDirs[i % enemyDirs.length];
    enemies.push({
      id: `ember-${i}`,
      x: cell.c * TILE + TILE / 2,
      y: cell.r * TILE + TILE / 2,
      dr: dir.dr,
      dc: dir.dc,
      speed: 72 + stageIndex * 14,
      alive: true,
    });
  }

  return {
    stage,
    grid,
    animals,
    enemies,
    bombs: [],
    splashes: [],
    powerups: [],
    particles: [],
    player: {
      x: 1 * TILE + TILE / 2,
      y: 1 * TILE + TILE / 2,
      dir: 'down',
      speed: 145,
      maxBombs: 1,
      range: 2,
      lives: 3,
      invulnTimer: 0,
      shieldTimer: 0,
      walkPhase: 0,
    },
    timeLeft: stage.timeSec,
  };
}

export default function KarhutlaArcadeGamePage() {
  const { locale } = useTranslation();
  const isId = locale === 'id';
  const L = (en, id) => (isId ? id : en);
  const location = useLocation();
  const preferredAnimal = location.state?.animalId || null;

  const canvasRef = useRef(null);
  const keysRef = useRef({});
  const stateRef = useRef(createStageState(0, preferredAnimal));

  const [gameStatus, setGameStatus] = useState('title'); // 'title' | 'playing' | 'paused' | 'stage_clear' | 'gameover' | 'victory'
  const [stageIdx, setStageIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [muted, setMuted] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [hud, setHud] = useState({
    lives: 3,
    timeLeft: STAGES[0].timeSec,
    rescued: 0,
    totalAnimals: STAGES[0].animalCount,
    maxBombs: 1,
    range: 2,
    speedLvl: 1,
    shield: 0,
  });

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
  }, []);

  useEffect(() => {
    if (!toastMsg) return undefined;
    const t = setTimeout(() => setToastMsg(null), 2200);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const startStage = useCallback(
    (idx, keepStats = false) => {
      const prevPlayer = stateRef.current?.player;
      const next = createStageState(idx, preferredAnimal);
      if (keepStats && prevPlayer) {
        next.player.maxBombs = prevPlayer.maxBombs;
        next.player.range = prevPlayer.range;
        next.player.speed = prevPlayer.speed;
        next.player.lives = Math.max(prevPlayer.lives, 2);
      }
      stateRef.current = next;
      setStageIdx(idx);
      setHud({
        lives: next.player.lives,
        timeLeft: next.timeLeft,
        rescued: 0,
        totalAnimals: next.animals.length,
        maxBombs: next.player.maxBombs,
        range: next.player.range,
        speedLvl: Math.round((next.player.speed - 145) / 22) + 1,
        shield: 0,
      });
      setGameStatus('playing');
    },
    [preferredAnimal],
  );

  const dropWaterBomb = useCallback(() => {
    if (gameStatus !== 'playing') return;
    const gs = stateRef.current;
    const c = Math.floor(gs.player.x / TILE);
    const r = Math.floor(gs.player.y / TILE);
    if (gs.bombs.length >= gs.player.maxBombs) return;
    if (gs.bombs.some((b) => b.r === r && b.c === c)) return;

    ArcadeAudio.playDropBomb();
    gs.bombs.push({
      id: `bomb-${Date.now()}-${Math.random()}`,
      r,
      c,
      fuse: 2.1,
      range: gs.player.range,
    });
  }, [gameStatus]);

  /* ── Keyboard Controls ── */
  useEffect(() => {
    const onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
        e.preventDefault();
      }
      keysRef.current[k] = true;
      if (k === ' ' || k === 'enter') {
        dropWaterBomb();
      }
      if (k === 'p' || k === 'escape') {
        setGameStatus((prev) =>
          prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev,
        );
      }
    };
    const onKeyUp = (e) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [dropWaterBomb]);

  /* ── Main 60fps Crazy Arcade Game Loop ── */
  useEffect(() => {
    let rafId = null;
    let lastTime = performance.now();
    let hudTick = 0;

    const detonateBomb = (gs, bomb) => {
      ArcadeAudio.playSplash();
      const splashCells = [{ r: bomb.r, c: bomb.c }];
      const dirs = [
        { dr: -1, dc: 0 },
        { dr: 1, dc: 0 },
        { dr: 0, dc: -1 },
        { dr: 0, dc: 1 },
      ];

      dirs.forEach(({ dr, dc }) => {
        for (let step = 1; step <= bomb.range; step += 1) {
          const nr = bomb.r + dr * step;
          const nc = bomb.c + dc * step;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
          const tile = gs.grid[nr][nc];
          if (tile === T_SOLID) break;

          splashCells.push({ r: nr, c: nc });

          // Chain-detonate another bomb hit by splash
          const hitBomb = gs.bombs.find((b) => b.r === nr && b.c === nc && b.fuse > 0.05);
          if (hitBomb) hitBomb.fuse = 0.02;

          if (tile === T_BRUSH || tile === T_FIRE_CRATE) {
            gs.grid[nr][nc] = T_EMPTY;
            setScore((s) => s + (tile === T_FIRE_CRATE ? 80 : 30));
            // Drop random Crazy Arcade power-up (~34% chance)
            if (Math.random() < 0.34) {
              const pType = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
              gs.powerups.push({
                id: `pu-${nr}-${nc}-${Date.now()}`,
                r: nr,
                c: nc,
                ...pType,
              });
            }
            // Spawn water/ash particles
            for (let p = 0; p < 8; p += 1) {
              gs.particles.push({
                x: nc * TILE + TILE / 2,
                y: nr * TILE + TILE / 2,
                vx: (Math.random() - 0.5) * 140,
                vy: (Math.random() - 0.5) * 140,
                life: 0.45,
                color: tile === T_FIRE_CRATE ? '#38bdf8' : '#a3e635',
              });
            }
            break; // Stop splash ray after breaking 1 block
          }
        }
      });

      splashCells.forEach((cell) => {
        gs.splashes.push({ r: cell.r, c: cell.c, life: 0.42 });
        // Extinguish Ember Spark enemies in splash
        gs.enemies.forEach((en) => {
          if (!en.alive) return;
          const er = Math.floor(en.y / TILE);
          const ec = Math.floor(en.x / TILE);
          if (er === cell.r && ec === cell.c) {
            en.alive = false;
            setScore((s) => s + 150);
            for (let p = 0; p < 10; p += 1) {
              gs.particles.push({
                x: en.x,
                y: en.y,
                vx: (Math.random() - 0.5) * 170,
                vy: (Math.random() - 0.5) * 170,
                life: 0.5,
                color: '#7dd3fc',
              });
            }
          }
        });
      });
    };

    const isBlocked = (gs, x, y, radius = 15) => {
      const corners = [
        { x: x - radius, y: y - radius },
        { x: x + radius, y: y - radius },
        { x: x - radius, y: y + radius },
        { x: x + radius, y: y + radius },
      ];
      for (const pt of corners) {
        const c = Math.floor(pt.x / TILE);
        const r = Math.floor(pt.y / TILE);
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true;
        if (gs.grid[r][c] !== T_EMPTY) return true;
      }
      return false;
    };

    const update = (dt) => {
      const gs = stateRef.current;
      const p = gs.player;

      // Timer countdown
      gs.timeLeft = Math.max(0, gs.timeLeft - dt);
      if (gs.timeLeft <= 0) {
        ArcadeAudio.playHit();
        setGameStatus('gameover');
        return;
      }

      if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);
      if (p.shieldTimer > 0) p.shieldTimer = Math.max(0, p.shieldTimer - dt);

      // Player movement with Crazy Arcade corner-assist
      const keys = keysRef.current;
      let dx = 0;
      let dy = 0;
      if (keys.arrowup || keys.w) {
        dy -= 1;
        p.dir = 'up';
      }
      if (keys.arrowdown || keys.s) {
        dy += 1;
        p.dir = 'down';
      }
      if (keys.arrowleft || keys.a) {
        dx -= 1;
        p.dir = 'left';
      }
      if (keys.arrowright || keys.d) {
        dx += 1;
        p.dir = 'right';
      }

      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        const stepX = (dx / len) * p.speed * dt;
        const stepY = (dy / len) * p.speed * dt;
        p.walkPhase += dt * 12;

        if (stepX !== 0 && !isBlocked(gs, p.x + stepX, p.y)) {
          p.x += stepX;
        } else if (stepX !== 0) {
          // Corner-slide vertically toward nearest tile center
          const targetY = Math.floor(p.y / TILE) * TILE + TILE / 2;
          if (Math.abs(targetY - p.y) > 2) {
            const slide = Math.sign(targetY - p.y) * Math.min(Math.abs(targetY - p.y), p.speed * dt * 0.7);
            if (!isBlocked(gs, p.x, p.y + slide)) p.y += slide;
          }
        }

        if (stepY !== 0 && !isBlocked(gs, p.x, p.y + stepY)) {
          p.y += stepY;
        } else if (stepY !== 0) {
          const targetX = Math.floor(p.x / TILE) * TILE + TILE / 2;
          if (Math.abs(targetX - p.x) > 2) {
            const slide = Math.sign(targetX - p.x) * Math.min(Math.abs(targetX - p.x), p.speed * dt * 0.7);
            if (!isBlocked(gs, p.x + slide, p.y)) p.x += slide;
          }
        }
      }

      const pr = Math.floor(p.y / TILE);
      const pc = Math.floor(p.x / TILE);

      // Collect Power-Ups
      gs.powerups = gs.powerups.filter((pu) => {
        if (pu.r === pr && pu.c === pc) {
          ArcadeAudio.playPowerUp();
          setScore((s) => s + 100);
          if (pu.id === 'bomb') p.maxBombs = Math.min(5, p.maxBombs + 1);
          if (pu.id === 'range') p.range = Math.min(6, p.range + 1);
          if (pu.id === 'speed') p.speed = Math.min(235, p.speed + 22);
          if (pu.id === 'shield') p.shieldTimer = 9;
          showToast(`${pu.icon} ${isId ? pu.labelId : pu.labelEn}!`);
          return false;
        }
        return true;
      });

      // Rescue Trapped Animals
      let justCleared = false;
      gs.animals.forEach((an) => {
        if (!an.rescued && an.r === pr && an.c === pc) {
          an.rescued = true;
          ArcadeAudio.playRescue();
          setScore((s) => s + 300);
          showToast(`✨ ${isId ? an.nameId : an.nameEn} ${L('rescued!', 'diselamatkan!')}`);
          if (gs.animals.every((a) => a.rescued)) {
            justCleared = true;
          }
        }
      });

      if (justCleared) {
        ArcadeAudio.playStageClear();
        setScore((s) => s + Math.round(gs.timeLeft * 10));
        if (stageIdx + 1 >= STAGES.length) {
          setGameStatus('victory');
        } else {
          setGameStatus('stage_clear');
        }
        return;
      }

      // Bombs countdown & detonation
      const exploded = [];
      gs.bombs = gs.bombs.filter((b) => {
        b.fuse -= dt;
        if (b.fuse <= 0) {
          exploded.push(b);
          return false;
        }
        return true;
      });
      exploded.forEach((b) => detonateBomb(gs, b));

      // Splashes decay
      gs.splashes = gs.splashes.filter((sp) => {
        sp.life -= dt;
        return sp.life > 0;
      });

      // Particles decay
      gs.particles = gs.particles.filter((pt) => {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
        return pt.life > 0;
      });

      // Ember Enemies patrol
      const dirs = [
        { dr: 0, dc: 1 },
        { dr: 0, dc: -1 },
        { dr: 1, dc: 0 },
        { dr: -1, dc: 0 },
      ];
      gs.enemies.forEach((en) => {
        if (!en.alive) return;
        const nx = en.x + en.dc * en.speed * dt;
        const ny = en.y + en.dr * en.speed * dt;
        const hitBomb = gs.bombs.some((b) => {
          const br = Math.floor(ny / TILE);
          const bc = Math.floor(nx / TILE);
          return b.r === br && b.c === bc;
        });

        if (!hitBomb && !isBlocked(gs, nx, ny, 16)) {
          en.x = nx;
          en.y = ny;
        } else {
          // Pick a valid random direction
          const cr = Math.floor(en.y / TILE);
          const cc = Math.floor(en.x / TILE);
          en.x = cc * TILE + TILE / 2;
          en.y = cr * TILE + TILE / 2;
          const valid = dirs.filter((d) => {
            const tr = cr + d.dr;
            const tc = cc + d.dc;
            return (
              tr >= 0 &&
              tr < ROWS &&
              tc >= 0 &&
              tc < COLS &&
              gs.grid[tr][tc] === T_EMPTY &&
              !gs.bombs.some((b) => b.r === tr && b.c === tc)
            );
          });
          if (valid.length > 0) {
            const pick = valid[Math.floor(Math.random() * valid.length)];
            en.dr = pick.dr;
            en.dc = pick.dc;
          }
        }

        // Check collision with player
        if (Math.hypot(en.x - p.x, en.y - p.y) < 26) {
          if (p.shieldTimer > 0) {
            en.alive = false;
            setScore((s) => s + 150);
            ArcadeAudio.playSplash();
          } else if (p.invulnTimer <= 0) {
            p.lives -= 1;
            p.invulnTimer = 2.0;
            ArcadeAudio.playHit();
            if (p.lives <= 0) {
              setGameStatus('gameover');
            }
          }
        }
      });

      hudTick += dt;
      if (hudTick >= 0.12) {
        hudTick = 0;
        setHud({
          lives: p.lives,
          timeLeft: Math.ceil(gs.timeLeft),
          rescued: gs.animals.filter((a) => a.rescued).length,
          totalAnimals: gs.animals.length,
          maxBombs: p.maxBombs,
          range: p.range,
          speedLvl: Math.round((p.speed - 145) / 22) + 1,
          shield: Math.ceil(p.shieldTimer),
        });
      }
    };

    const draw = (now) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const gs = stateRef.current;
      const t = now / 1000;

      // 1. Checkerboard Peat Forest Floor
      for (let r = 0; r < ROWS; r += 1) {
        for (let c = 0; c < COLS; c += 1) {
          ctx.fillStyle = (r + c) % 2 === 0 ? gs.stage.bgFloor : gs.stage.bgAlt;
          ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
        }
      }

      // 2. Grid Tiles (Solid Pillars, Dry Brush, Burning Peat Crates)
      for (let r = 0; r < ROWS; r += 1) {
        for (let c = 0; c < COLS; c += 1) {
          const tile = gs.grid[r][c];
          const x = c * TILE;
          const y = r * TILE;
          if (tile === T_SOLID) {
            const upSolid = r > 0 && gs.grid[r - 1][c] === T_SOLID;
            const downSolid = r < ROWS - 1 && gs.grid[r + 1][c] === T_SOLID;
            const leftSolid = c > 0 && gs.grid[r][c - 1] === T_SOLID;
            const rightSolid = c < COLS - 1 && gs.grid[r][c + 1] === T_SOLID;
            const seed = (r * 37 + c * 19) % 12;

            // 1. Seamless Old-Town Weathered Stone-Brick Masonry Base
            ctx.fillStyle = '#5c6066'; // dark mortar bed
            ctx.fillRect(x, y, TILE, TILE);

            // Staggered Old-Town stone blocks (2 rows of stones per tile, seamless across neighbors)
            const stoneShades = ['#8b8f94', '#7f848a', '#95989c', '#747980'];
            const drawStone = (sx, sy, sw, sh, shadeIdx) => {
              ctx.fillStyle = stoneShades[shadeIdx % stoneShades.length];
              ctx.beginPath();
              ctx.roundRect(sx + 0.8, sy + 0.8, sw - 1.6, sh - 1.6, 2.5);
              ctx.fill();
              // Subtle top-edge highlight on each old stone
              ctx.fillStyle = 'rgba(241, 245, 249, 0.22)';
              ctx.fillRect(sx + 2, sy + 1.5, sw - 4, 2);
            };

            const rowH = TILE / 2;
            // Top stone course
            drawStone(x, y, TILE * 0.52, rowH, seed);
            drawStone(x + TILE * 0.52, y, TILE * 0.48, rowH, seed + 1);
            // Bottom staggered stone course
            drawStone(x, y + rowH, TILE * 0.26, rowH, seed + 2);
            drawStone(x + TILE * 0.26, y + rowH, TILE * 0.52, rowH, seed + 3);
            drawStone(x + TILE * 0.78, y + rowH, TILE * 0.22, rowH, seed + 1);

            // Soft aged-stone patina & moss tint
            if (seed % 2 === 0) {
              ctx.fillStyle = 'rgba(101, 163, 13, 0.14)';
              ctx.beginPath();
              ctx.ellipse(x + 16, y + 18, 12, 8, 0.25, 0, Math.PI * 2);
              ctx.fill();
            }

            // 2. Old-Town 2.5D Exposed Outer Edges (only where not connected to another wall)
            if (!upSolid) {
              ctx.fillStyle = 'rgba(226, 232, 240, 0.45)';
              ctx.fillRect(x, y, TILE, 3);
              ctx.fillStyle = '#27272a';
              ctx.fillRect(x, y, TILE, 1.5);
            }
            if (!leftSolid) {
              ctx.fillStyle = 'rgba(226, 232, 240, 0.28)';
              ctx.fillRect(x, y, 2.5, TILE);
              ctx.fillStyle = '#27272a';
              ctx.fillRect(x, y, 1.5, TILE);
            }
            if (!rightSolid) {
              ctx.fillStyle = 'rgba(24, 24, 27, 0.35)';
              ctx.fillRect(x + TILE - 3, y, 3, TILE);
              ctx.fillStyle = '#27272a';
              ctx.fillRect(x + TILE - 1.5, y, 1.5, TILE);
            }
            if (!downSolid) {
              ctx.fillStyle = 'rgba(24, 24, 27, 0.45)';
              ctx.fillRect(x, y + TILE - 5.5, TILE, 5.5);
              ctx.fillStyle = '#18181b';
              ctx.fillRect(x, y + TILE - 1.5, TILE, 1.5);
            }

            // 3. Lush Creeping & Hanging Old-Town Ivy Vines + Purple Clematis Flowers
            const drawHeartLeaf = (lx, ly, angle, scale, shade = 0) => {
              ctx.save();
              ctx.translate(lx, ly);
              ctx.rotate(angle);
              ctx.scale(scale, scale);
              ctx.fillStyle = shade === 0 ? '#65a30d' : shade === 1 ? '#84cc16' : '#4d7c0f';
              ctx.strokeStyle = '#1a4314';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.bezierCurveTo(-5, -2.5, -5.5, 4.2, 0, 7.2);
              ctx.bezierCurveTo(5.5, 4.2, 5, -2.5, 0, 0);
              ctx.fill();
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(0, 0.8);
              ctx.lineTo(0, 5.5);
              ctx.stroke();
              ctx.restore();
            };

            const drawPurpleFlower = (fx, fy, radius) => {
              for (let p = 0; p < 5; p += 1) {
                const ang = (p * Math.PI * 2) / 5 - Math.PI / 2;
                const px = fx + Math.cos(ang) * radius * 0.7;
                const py = fy + Math.sin(ang) * radius * 0.7;
                ctx.save();
                ctx.translate(px, py);
                ctx.rotate(ang);
                ctx.fillStyle = '#9333ea';
                ctx.strokeStyle = '#581c87';
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.ellipse(0, 0, radius * 0.62, radius * 0.38, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
              }
              ctx.fillStyle = '#fde047';
              ctx.beginPath();
              ctx.arc(fx, fy, radius * 0.34, 0, Math.PI * 2);
              ctx.fill();
            };

            // Continuous horizontal creeping runner along connected top/border walls
            if (leftSolid || rightSolid) {
              const runnerY = y + (upSolid ? 18 : 9);
              ctx.strokeStyle = '#2d5a1b';
              ctx.lineWidth = 2.2;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(leftSolid ? x : x + 5, runnerY + (seed % 2 === 0 ? -2 : 2));
              ctx.bezierCurveTo(
                x + TILE * 0.33,
                runnerY + (seed % 2 === 0 ? 6 : -5),
                x + TILE * 0.66,
                runnerY + (seed % 2 === 0 ? -5 : 6),
                rightSolid ? x + TILE : x + TILE - 5,
                runnerY + (seed % 2 === 0 ? 2 : -2),
              );
              ctx.stroke();

              // Hanging vine cascades draping down the stone face
              if (seed % 2 === 0) {
                ctx.strokeStyle = '#3f7d20';
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.moveTo(x + 14, runnerY + 1);
                ctx.quadraticCurveTo(x + 9, y + 26, x + 15, y + 36);
                ctx.moveTo(x + 31, runnerY - 1);
                ctx.quadraticCurveTo(x + 36, y + 23, x + 29, y + 32);
                ctx.stroke();
                // Curly tendril
                ctx.strokeStyle = '#d4b46a';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.arc(x + 17, y + 35, 2.5, 0, Math.PI * 1.6);
                ctx.stroke();
                drawHeartLeaf(x + 10, y + 21, -0.6, 0.82, 0);
                drawHeartLeaf(x + 16, y + 29, 0.5, 0.78, 1);
                drawHeartLeaf(x + 32, y + 23, 0.45, 0.76, 2);
              }

              // Dense alternating ivy leaves along horizontal runner
              drawHeartLeaf(x + 8, runnerY - 1, -0.5, 0.88, 2);
              drawHeartLeaf(x + 19, runnerY + 2, 0.4, 0.92, 1);
              drawHeartLeaf(x + 30, runnerY - 1, -0.35, 0.86, 0);
              drawHeartLeaf(x + 39, runnerY + 2, 0.55, 0.82, 1);

              if (seed % 3 === 0) {
                drawPurpleFlower(x + 23, runnerY - 1, 5.2);
              } else if (seed % 5 === 0) {
                drawPurpleFlower(x + 13, y + 28, 4.4);
              }
            } else if (upSolid || downSolid) {
              // Continuous vertical climbing vine along side walls
              const runnerX = x + (leftSolid ? 20 : 12);
              ctx.strokeStyle = '#2d5a1b';
              ctx.lineWidth = 2.2;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(runnerX, upSolid ? y : y + 6);
              ctx.bezierCurveTo(
                runnerX + 7,
                y + TILE * 0.33,
                runnerX - 7,
                y + TILE * 0.66,
                runnerX,
                downSolid ? y + TILE : y + TILE - 6,
              );
              ctx.stroke();

              // Side offshoot & golden curl
              ctx.strokeStyle = '#d4b46a';
              ctx.lineWidth = 1.3;
              ctx.beginPath();
              ctx.moveTo(runnerX, y + 18);
              ctx.quadraticCurveTo(runnerX + 12, y + 15, runnerX + 15, y + 24);
              ctx.arc(runnerX + 13, y + 24, 2.2, 0, Math.PI * 1.5);
              ctx.stroke();

              drawHeartLeaf(runnerX - 4, y + 9, -0.8, 0.88, 0);
              drawHeartLeaf(runnerX + 5, y + 17, 0.75, 0.92, 1);
              drawHeartLeaf(runnerX - 3, y + 27, -0.65, 0.86, 2);
              drawHeartLeaf(runnerX + 5, y + 36, 0.6, 0.84, 0);

              if (seed % 2 === 0) {
                drawPurpleFlower(runnerX + 9, y + 20, 4.8);
              }
            } else {
              // Interior Old-Town pillar: lush draping ivy crown + hanging tendrils
              const cx = x + TILE / 2;
              ctx.strokeStyle = '#2d5a1b';
              ctx.lineWidth = 2;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(x + 6, y + 10);
              ctx.quadraticCurveTo(cx, y + 5, x + TILE - 6, y + 12);
              ctx.moveTo(x + 11, y + 9);
              ctx.quadraticCurveTo(x + 8, y + 23, x + 13, y + 34);
              ctx.moveTo(x + 31, y + 10);
              ctx.quadraticCurveTo(x + 35, y + 22, x + 28, y + 32);
              ctx.stroke();

              ctx.strokeStyle = '#d4b46a';
              ctx.lineWidth = 1.3;
              ctx.beginPath();
              ctx.arc(x + 15, y + 33, 2.4, 0, Math.PI * 1.5);
              ctx.stroke();

              drawHeartLeaf(x + 9, y + 11, -0.6, 0.9, 2);
              drawHeartLeaf(x + 21, y + 8, 0.3, 0.94, 1);
              drawHeartLeaf(x + 33, y + 12, 0.55, 0.88, 0);
              drawHeartLeaf(x + 10, y + 23, -0.45, 0.82, 1);
              drawHeartLeaf(x + 31, y + 23, 0.45, 0.8, 2);

              if (seed % 2 === 0) {
                drawPurpleFlower(x + 27, y + 11, 5.1);
                drawPurpleFlower(x + 13, y + 27, 4.1);
              } else {
                drawPurpleFlower(x + 14, y + 12, 5.0);
              }
            }
          } else if (tile === T_BRUSH) {
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.roundRect(x + 4, y + 4, TILE - 8, TILE - 8, 8);
            ctx.fill();
            ctx.fillStyle = '#a16207';
            ctx.beginPath();
            ctx.roundRect(x + 7, y + 7, TILE - 14, TILE - 18, 6);
            ctx.fill();
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🪵', x + TILE / 2, y + TILE / 2 + 1);
          } else if (tile === T_FIRE_CRATE) {
            const pulse = 0.85 + Math.sin(t * 7 + r + c) * 0.15;
            ctx.fillStyle = '#7f1d1d';
            ctx.beginPath();
            ctx.roundRect(x + 4, y + 4, TILE - 8, TILE - 8, 8);
            ctx.fill();
            ctx.fillStyle = `rgba(249, 115, 22, ${pulse})`;
            ctx.beginPath();
            ctx.roundRect(x + 8, y + 8, TILE - 16, TILE - 16, 6);
            ctx.fill();
            ctx.font = '22px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔥', x + TILE / 2, y + TILE / 2 + 1);
          }
        }
      }

      // 3. Power-Ups
      gs.powerups.forEach((pu) => {
        const x = pu.c * TILE + TILE / 2;
        const y = pu.r * TILE + TILE / 2 + Math.sin(t * 5 + pu.c) * 3;
        ctx.fillStyle = pu.color;
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#faf6ee';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pu.icon, x, y + 1);
      });

      // 4. Trapped Endemic Animals (Rescue Targets)
      gs.animals.forEach((an) => {
        if (an.rescued) return;
        const x = an.c * TILE + TILE / 2;
        const y = an.r * TILE + TILE / 2 + Math.sin(t * 4 + an.bobOffset) * 3;
        ctx.fillStyle = 'rgba(250, 246, 238, 0.94)';
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(an.emoji, x, y + 1);
        // Tiny SOS badge
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(x - 12, y - 24, 24, 11);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('SOS', x, y - 18);
      });

      // 5. Water Bombs (Bouncy Crazy-Arcade Balloons)
      gs.bombs.forEach((b) => {
        const x = b.c * TILE + TILE / 2;
        const y = b.r * TILE + TILE / 2;
        const scale = 1 + Math.sin(t * 14) * 0.12;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, 2 - scale);
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(0, 0, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.arc(-6, -6, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 6. Water Splash Crosses
      gs.splashes.forEach((sp) => {
        const alpha = Math.min(1, sp.life / 0.42);
        const x = sp.c * TILE;
        const y = sp.r * TILE;
        ctx.fillStyle = `rgba(56, 189, 248, ${alpha * 0.85})`;
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = `rgba(224, 242, 254, ${alpha * 0.9})`;
        ctx.fillRect(x + 11, y + 11, TILE - 22, TILE - 22);
      });

      // 7. Blazing Fire Enemies (no circle/ring — pure flickering flame)
      gs.enemies.forEach((en, idx) => {
        if (!en.alive) return;
        const phase = t * 11 + idx * 1.9;
        const sway = Math.sin(phase) * 3.2;
        const stretch = Math.cos(phase * 1.4) * 3;
        const fx = en.x;
        const fy = en.y + 12;

        // Soft heat shadow at base
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.ellipse(fx, fy + 4, 13, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outer blazing red-orange flame
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.moveTo(fx, fy - 30 - stretch);
        ctx.bezierCurveTo(fx + 16, fy - 18, fx + 17, fy + 2, fx, fy + 4);
        ctx.bezierCurveTo(fx - 17, fy + 2, fx - 16, fy - 18, fx, fy - 30 - stretch);
        ctx.fill();

        // Side flame licks
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(fx - 11 + sway * 0.4, fy - 18);
        ctx.quadraticCurveTo(fx - 16, fy - 4, fx - 5, fy + 2);
        ctx.quadraticCurveTo(fx - 7, fy - 9, fx - 11 + sway * 0.4, fy - 18);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(fx + 11 - sway * 0.4, fy - 20);
        ctx.quadraticCurveTo(fx + 16, fy - 5, fx + 5, fy + 2);
        ctx.quadraticCurveTo(fx + 7, fy - 10, fx + 11 - sway * 0.4, fy - 20);
        ctx.fill();

        // Mid bright amber flame
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(fx + sway * 0.6, fy - 24 - stretch * 0.7);
        ctx.bezierCurveTo(fx + 11, fy - 13, fx + 12, fy + 1, fx, fy + 3);
        ctx.bezierCurveTo(fx - 12, fy + 1, fx - 11, fy - 13, fx + sway * 0.6, fy - 24 - stretch * 0.7);
        ctx.fill();

        // Inner white-yellow blazing core
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.moveTo(fx + sway * 0.35, fy - 15 - stretch * 0.4);
        ctx.bezierCurveTo(fx + 6.5, fy - 8, fx + 6.5, fy + 1, fx, fy + 2);
        ctx.bezierCurveTo(fx - 6.5, fy + 1, fx - 6.5, fy - 8, fx + sway * 0.35, fy - 15 - stretch * 0.4);
        ctx.fill();

        // Rising ember sparks
        const sparkY1 = fy - 26 - ((t * 28 + idx * 13) % 14);
        const sparkY2 = fy - 22 - ((t * 22 + idx * 7 + 5) % 12);
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(fx - 5 + Math.sin(phase) * 3, sparkY1, 1.8, 0, Math.PI * 2);
        ctx.arc(fx + 6 + Math.cos(phase) * 3, sparkY2, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // 8. Player (Cute Blue-Helmet Chibi Arcade Character)
      const p = gs.player;
      const blink = p.invulnTimer > 0 && Math.floor(t * 16) % 2 === 0;
      if (!blink) {
        const bounce = -Math.abs(Math.sin(p.walkPhase)) * 2.6;
        const stride = Math.sin(p.walkPhase) * 3.4;
        const px = p.x;
        const py = p.y + bounce;
        const lookX = p.dir === 'left' ? -2.4 : p.dir === 'right' ? 2.4 : 0;
        const lookY = p.dir === 'up' ? -1.5 : p.dir === 'down' ? 0.8 : 0;

        if (p.shieldTimer > 0) {
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y - 3, 24, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 17, 11.5, 4.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stubby royal-blue boots
        ctx.fillStyle = '#1e40af';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(px - 4.4, py + 13.5 + stride * 0.45, 3.6, 4.6, -0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(px + 4.4, py + 13.5 - stride * 0.45, 3.6, 4.6, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Compact round royal-blue body
        ctx.fillStyle = '#1d4ed8';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.arc(px, py + 6.5, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Criss-cross suit straps & glowing sky-blue chest orb
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px - 5, py + 2);
        ctx.lineTo(px + 5, py + 11);
        ctx.moveTo(px + 5, py + 2);
        ctx.lineTo(px - 5, py + 11);
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(px, py + 6.5, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Cute round white gloved hands
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px - 9.5, py + 6.5 - stride * 0.4, 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(px + 9.5, py + 6.5 + stride * 0.4, 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Side helmet ear-pods (left & right)
        ctx.fillStyle = '#1e40af';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.arc(px - 11.5, py - 6.5, 4.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(px + 11.5, py - 6.5, 4.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Big glossy royal-blue helmet
        const helmGrad = ctx.createRadialGradient(px - 4, py - 14, 2, px, py - 7, 14);
        helmGrad.addColorStop(0, '#3b82f6');
        helmGrad.addColorStop(0.65, '#1d4ed8');
        helmGrad.addColorStop(1, '#1e3a8a');
        ctx.fillStyle = helmGrad;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(px, py - 7.5, 13.2, 11.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Glossy top-left shine on helmet
        ctx.fillStyle = 'rgba(186, 230, 253, 0.72)';
        ctx.beginPath();
        ctx.ellipse(px - 4.5, py - 14.5, 4.2, 2.1, -0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px + 2.5, py - 15.8, 1.3, 0, Math.PI * 2);
        ctx.fill();

        if (p.dir !== 'up') {
          // Cute cream/white face visor cutout
          ctx.fillStyle = '#fffbeb';
          ctx.strokeStyle = '#1e3a8a';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.ellipse(px + lookX * 0.75, py - 5.5 + lookY * 0.4, 8.8, 6.8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Cute determined V-brows on helmet forehead
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(px - 5.5 + lookX * 0.6, py - 14.2);
          ctx.quadraticCurveTo(px - 3 + lookX * 0.6, py - 14.5, px - 1.2 + lookX * 0.6, py - 12.6);
          ctx.moveTo(px + 5.5 + lookX * 0.6, py - 14.2);
          ctx.quadraticCurveTo(px + 3 + lookX * 0.6, py - 14.5, px + 1.2 + lookX * 0.6, py - 12.6);
          ctx.stroke();

          // Tall oval glossy navy eyes
          ctx.fillStyle = '#1e3a8a';
          ctx.beginPath();
          ctx.ellipse(px - 3.3 + lookX, py - 5.5 + lookY * 0.5, 2.2, 3.6, 0, 0, Math.PI * 2);
          ctx.ellipse(px + 3.3 + lookX, py - 5.5 + lookY * 0.5, 2.2, 3.6, 0, 0, Math.PI * 2);
          ctx.fill();

          // Bright white eye highlights
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(px - 3.8 + lookX, py - 7 + lookY * 0.5, 0.9, 1.4, 0, 0, Math.PI * 2);
          ctx.ellipse(px + 2.8 + lookX, py - 7 + lookY * 0.5, 0.9, 1.4, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 9. Particles
      gs.particles.forEach((pt) => {
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, pt.life * 2);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    const loop = (now) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      if (gameStatus === 'playing') {
        update(dt);
      }
      draw(now);
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [gameStatus, stageIdx, isId, showToast]);

  const holdKey = (key, down) => {
    keysRef.current[key] = down;
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080c1c] px-4 py-6 text-[#4a3525]">
      <PixelSpaceWallpaper />
      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Top Cozy Sketch Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#5c4033] bg-[#fbf5e6] px-4 py-3 shadow-[4px_4px_0_#5c4033]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#5c4033] bg-[#9bd3ec] shadow-[2px_2px_0_#5c4033]">
              <PixelIcon name="bomb" size={24} />
            </span>
            <div>
              <div className="inline-block rounded-full border border-[#5c4033]/50 bg-[#efe3c8] px-2.5 py-0.5 font-mono text-[9.5px] font-bold tracking-wider text-[#6e4f3a] uppercase">
                {L('Cozy Sketch Edition · Karhutla', 'Edisi Sketsa · Karhutla')}
              </div>
              <h1 className="font-hand mt-0.5 text-2xl font-bold leading-tight text-[#4a3525]">
                {L('Peatland Water-Bomb Rescue', 'Misi Bom Air Penyelamat Gambut')}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(gameStatus === 'playing' || gameStatus === 'paused') && (
              <button
                type="button"
                onClick={() => setGameStatus((s) => (s === 'playing' ? 'paused' : 'playing'))}
                className="cursor-pointer rounded-xl border-2 border-[#5c4033] bg-[#f6d88c] px-3 py-1.5 font-mono text-xs font-extrabold text-[#4a3525] shadow-[2px_2px_0_#5c4033] hover:bg-[#fae2a5] active:translate-x-0.5 active:translate-y-0.5"
              >
                {gameStatus === 'playing' ? L('⏸ Pause', '⏸ Jeda') : L('▶ Resume', '▶ Lanjut')}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                ArcadeAudio.muted = !muted;
                setMuted(!muted);
              }}
              className="cursor-pointer rounded-xl border-2 border-[#5c4033] bg-[#efe3c8] px-3 py-1.5 font-mono text-xs font-extrabold text-[#4a3525] shadow-[2px_2px_0_#5c4033] hover:bg-[#f7eedb] active:translate-x-0.5 active:translate-y-0.5"
            >
              {muted ? '🔇 Muted' : '🔊 SFX'}
            </button>
            <Link
              to="/game"
              className="rounded-xl border-2 border-[#5c4033] bg-[#a8cf98] px-3 py-1.5 font-mono text-xs font-extrabold text-[#2f4528] shadow-[2px_2px_0_#5c4033] hover:bg-[#b8dba9] active:translate-x-0.5 active:translate-y-0.5"
            >
              {L('← Game Hub', '← Pilih Game')}
            </Link>
          </div>
        </div>

        {/* Cozy Sketch HUD Sticker Bar with Pixel-Art Icons */}
        <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-6">
          <div className="rounded-2xl border-2 border-[#5c4033] bg-[#fbf5e6] px-3 py-2 shadow-[3px_3px_0_#5c4033]">
            <div className="font-mono text-[9px] font-bold tracking-wider text-[#8c6b53] uppercase">
              {L('Stage', 'Level')}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 font-hand text-lg font-bold leading-tight text-[#b45309]">
              <PixelIcon name="flag" size={16} />
              <span>{stageIdx + 1} / {STAGES.length}</span>
            </div>
          </div>
          <div className="rounded-2xl border-2 border-[#5c4033] bg-[#fbf5e6] px-3 py-2 shadow-[3px_3px_0_#5c4033]">
            <div className="font-mono text-[9px] font-bold tracking-wider text-[#8c6b53] uppercase">
              {L('Lives', 'Nyawa')}
            </div>
            <div className="mt-1 flex items-center gap-1">
              {hud.lives > 0 ? (
                Array.from({ length: hud.lives }).map((_, idx) => (
                  <PixelIcon key={idx} name="heart" size={17} />
                ))
              ) : (
                <PixelIcon name="skull" size={18} />
              )}
            </div>
          </div>
          <div className="rounded-2xl border-2 border-[#5c4033] bg-[#fbf5e6] px-3 py-2 shadow-[3px_3px_0_#5c4033]">
            <div className="font-mono text-[9px] font-bold tracking-wider text-[#8c6b53] uppercase">
              {L('Rescued', 'Selamat')}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 font-hand text-lg font-bold leading-tight text-[#3f7d20]">
              <PixelIcon name="orangutan" size={18} />
              <span>{hud.rescued}/{hud.totalAnimals}</span>
            </div>
          </div>
          <div className="rounded-2xl border-2 border-[#5c4033] bg-[#fbf5e6] px-3 py-2 shadow-[3px_3px_0_#5c4033]">
            <div className="font-mono text-[9px] font-bold tracking-wider text-[#8c6b53] uppercase">
              {L('Time', 'Waktu')}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 font-hand text-lg font-bold leading-tight text-[#2563eb]">
              <PixelIcon name="clock" size={17} />
              <span>{hud.timeLeft}s</span>
            </div>
          </div>
          <div className="rounded-2xl border-2 border-[#5c4033] bg-[#fbf5e6] px-3 py-2 shadow-[3px_3px_0_#5c4033]">
            <div className="font-mono text-[9px] font-bold tracking-wider text-[#8c6b53] uppercase">
              {L('Power-Ups', 'Kekuatan')}
            </div>
            <div className="mt-1 flex items-center gap-1.5 font-mono text-xs font-extrabold text-[#4a3525]">
              <span className="inline-flex items-center gap-0.5">
                <PixelIcon name="bomb" size={14} />
                {hud.maxBombs}
              </span>
              <span className="inline-flex items-center gap-0.5">
                <PixelIcon name="wave" size={14} />
                {hud.range}
              </span>
              <span className="inline-flex items-center gap-0.5">
                <PixelIcon name="bolt" size={14} />
                {hud.speedLvl}
              </span>
            </div>
          </div>
          <div className="rounded-2xl border-2 border-[#5c4033] bg-[#fbf5e6] px-3 py-2 shadow-[3px_3px_0_#5c4033]">
            <div className="font-mono text-[9px] font-bold tracking-wider text-[#8c6b53] uppercase">
              {L('Score', 'Skor')}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 font-hand text-lg font-bold leading-tight text-[#9a3412]">
              <PixelIcon name="star" size={17} />
              <span>{score.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Main Sketch Board + Spiral Notebook Sidebar */}
        <div className="grid gap-4 lg:grid-cols-[1fr_275px]">
          <div className="relative overflow-hidden rounded-2xl border-[3px] border-[#5c4033] bg-[#243627] shadow-[5px_5px_0_#5c4033]">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="block h-auto w-full"
            />

            {/* Toast Pickup Notification */}
            {toastMsg && (
              <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-full border-2 border-[#5c4033] bg-[#fbf5e6] px-4 py-1 font-hand text-sm font-bold text-[#4a3525] shadow-[3px_3px_0_#5c4033]">
                {toastMsg}
              </div>
            )}

            {/* Overlays: Cozy Spiral Notebook Modal */}
            {gameStatus !== 'playing' && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#232b22]/75 p-5 backdrop-blur-xs">
                <div className="relative w-full max-w-md rounded-2xl border-2 border-[#5c4033] bg-[#fbf5e6] p-6 pt-7 text-center shadow-[6px_6px_0_#5c4033]">
                  {/* Spiral Notebook Binder Rings */}
                  <div className="pointer-events-none absolute -top-2.5 inset-x-0 flex justify-center gap-6">
                    {[0, 1, 2, 3, 4].map((ring) => (
                      <span
                        key={ring}
                        className="h-5 w-2.5 rounded-full border-2 border-[#5c4033] bg-[#e9dcc5]"
                      />
                    ))}
                  </div>

                  <div className="mx-auto mb-2 inline-block rounded-full border border-[#5c4033]/50 bg-[#efe3c8] px-3 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#6e4f3a] uppercase">
                    {gameStatus === 'title' && L('FIELD MISSION NOTEBOOK', 'BUKU MISI LAPANGAN')}
                    {gameStatus === 'paused' && L('MISSION PAUSED', 'MISI DIJEDA')}
                    {gameStatus === 'stage_clear' && L('SECTOR CLEARED!', 'SEKTOR AMAN!')}
                    {gameStatus === 'gameover' && L('TRY AGAIN!', 'COBA LAGI!')}
                    {gameStatus === 'victory' && L('ALL WILDLIFE SAFE!', 'SEMUA SATWA SELAMAT!')}
                  </div>

                  <div className="mb-1 text-4xl">
                    {gameStatus === 'title' && '💧🔥🦧'}
                    {gameStatus === 'paused' && '⏸️'}
                    {gameStatus === 'stage_clear' && '🎉'}
                    {gameStatus === 'gameover' && '💨'}
                    {gameStatus === 'victory' && '🏆'}
                  </div>

                  <h2 className="font-hand text-3xl font-bold text-[#4a3525]">
                    {gameStatus === 'title' &&
                      L('Karhutla Water-Bomb', 'Bom Air Karhutla')}
                    {gameStatus === 'paused' && L('Game Paused', 'Permainan Dijeda')}
                    {gameStatus === 'stage_clear' &&
                      L('Sector Cleared!', 'Sektor Aman!')}
                    {gameStatus === 'gameover' && L('Mission Failed', 'Misi Gagal')}
                    {gameStatus === 'victory' &&
                      L('All Wildlife Rescued!', 'Semua Satwa Selamat!')}
                  </h2>

                  <p className="mt-2 rounded-xl border border-[#5c4033]/25 bg-[#f4ebd9] p-3 text-xs leading-relaxed text-[#5c4033]">
                    {gameStatus === 'title' &&
                      L(
                        'Drop Water Bombs (Space) to blast burning peat crates, extinguish chasing flames, and rescue trapped animals!',
                        'Pasang Bom Air (Spasi) untuk memadamkan peti gambut terbakar, halau api pengejar, dan selamatkan satwa!',
                      )}
                    {gameStatus === 'paused' &&
                      L(
                        'Take a quick breather! Resume whenever you are ready.',
                        'Istirahat sejenak! Lanjutkan kapan saja.',
                      )}
                    {gameStatus === 'stage_clear' &&
                      L(
                        'Every trapped animal in this peatland sector reached safety. Ready for the next sector?',
                        'Semua satwa di sektor gambut ini berhasil diselamatkan. Siap lanjut ke sektor berikutnya?',
                      )}
                    {gameStatus === 'gameover' &&
                      L(
                        'The peat embers overwhelmed you. Drop water bombs around corners to trap the flames!',
                        'Bara api terlalu kuat. Gunakan bom air di tikungan untuk memadamkan api!',
                      )}
                    {gameStatus === 'victory' &&
                      L(
                        `Congratulations! You cleared all 3 wildfire sectors with ${score.toLocaleString()} pts.`,
                        `Selamat! Kamu menuntaskan seluruh 3 sektor karhutla dengan ${score.toLocaleString()} poin.`,
                      )}
                  </p>

                  {gameStatus === 'title' && (
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      {STAGES.map((st, idx) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            setScore(0);
                            startStage(idx, false);
                          }}
                          className="cursor-pointer rounded-xl border-2 border-[#5c4033] bg-[#efe3c8] px-3 py-1 font-mono text-[10px] font-bold text-[#4a3525] shadow-[2px_2px_0_#5c4033] hover:bg-[#f6d88c]"
                        >
                          {L(`Stage ${idx + 1}`, `Level ${idx + 1}`)}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    {gameStatus === 'title' && (
                      <button
                        type="button"
                        onClick={() => {
                          setScore(0);
                          startStage(0, false);
                        }}
                        className="cursor-pointer rounded-xl border-2 border-[#5c4033] bg-[#a8cf98] px-6 py-2.5 font-mono text-xs font-extrabold text-[#2f4528] shadow-[3px_3px_0_#5c4033] hover:bg-[#b8dba9] active:translate-x-0.5 active:translate-y-0.5"
                      >
                        ▶ {L('START MISSION', 'MULAI MAIN')}
                      </button>
                    )}
                    {gameStatus === 'paused' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setGameStatus('playing')}
                          className="cursor-pointer rounded-xl border-2 border-[#5c4033] bg-[#a8cf98] px-5 py-2.5 font-mono text-xs font-extrabold text-[#2f4528] shadow-[3px_3px_0_#5c4033] hover:bg-[#b8dba9] active:translate-x-0.5 active:translate-y-0.5"
                        >
                          ▶ {L('RESUME', 'LANJUTKAN')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setScore(0);
                            startStage(stageIdx, false);
                          }}
                          className="cursor-pointer rounded-xl border-2 border-[#5c4033] bg-[#efe3c8] px-4 py-2.5 font-mono text-xs font-extrabold text-[#4a3525] shadow-[3px_3px_0_#5c4033] hover:bg-[#f7eedb] active:translate-x-0.5 active:translate-y-0.5"
                        >
                          ↻ {L('RESTART', 'ULANGI')}
                        </button>
                      </>
                    )}
                    {gameStatus === 'stage_clear' && (
                      <button
                        type="button"
                        onClick={() => startStage(stageIdx + 1, true)}
                        className="cursor-pointer rounded-xl border-2 border-[#5c4033] bg-[#f6d88c] px-6 py-2.5 font-mono text-xs font-extrabold text-[#4a3525] shadow-[3px_3px_0_#5c4033] hover:bg-[#fae2a5] active:translate-x-0.5 active:translate-y-0.5"
                      >
                        {L('NEXT STAGE →', 'LEVEL BERIKUTNYA →')}
                      </button>
                    )}
                    {(gameStatus === 'gameover' || gameStatus === 'victory') && (
                      <button
                        type="button"
                        onClick={() => {
                          setScore(0);
                          startStage(0, false);
                        }}
                        className="cursor-pointer rounded-xl border-2 border-[#5c4033] bg-[#e8958a] px-6 py-2.5 font-mono text-xs font-extrabold text-[#4a221d] shadow-[3px_3px_0_#5c4033] hover:bg-[#f0a59b] active:translate-x-0.5 active:translate-y-0.5"
                      >
                        ↻ {L('PLAY AGAIN', 'MAIN LAGI')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Cozy Sketch Notebook Sidebar: Controls & Power-Ups */}
          <div className="flex flex-col gap-4">
            <div className="relative rounded-2xl border-2 border-[#5c4033] bg-[#fbf5e6] p-4 pt-5 shadow-[4px_4px_0_#5c4033]">
              {/* Notebook Rings */}
              <div className="pointer-events-none absolute -top-2 inset-x-0 flex justify-center gap-5">
                {[0, 1, 2, 3].map((ring) => (
                  <span
                    key={ring}
                    className="h-4 w-2 rounded-full border-2 border-[#5c4033] bg-[#e9dcc5]"
                  />
                ))}
              </div>
              <div className="border-b-2 border-dashed border-[#5c4033]/25 pb-2 font-hand text-lg font-bold text-[#4a3525]">
                🕹️ {L('Controls', 'Kontrol Game')}
              </div>
              <div className="mt-2.5 space-y-2 text-xs text-[#4a3525]">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-lg border-2 border-[#5c4033] bg-[#efe3c8] px-2 py-0.5 font-mono text-[10px] font-bold shadow-[1px_1px_0_#5c4033]">
                    WASD / ▲▼◀▶
                  </span>
                  <span className="font-medium text-[#6e4f3a]">
                    {L('Move', 'Gerak')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-lg border-2 border-[#5c4033] bg-[#9bd3ec] px-2 py-0.5 font-mono text-[10px] font-bold shadow-[1px_1px_0_#5c4033]">
                    Space / Enter
                  </span>
                  <span className="font-medium text-[#6e4f3a]">
                    {L('Water Bomb', 'Bom Air')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-lg border-2 border-[#5c4033] bg-[#f6d88c] px-2 py-0.5 font-mono text-[10px] font-bold shadow-[1px_1px_0_#5c4033]">
                    P / Esc
                  </span>
                  <span className="font-medium text-[#6e4f3a]">
                    {L('Pause', 'Jeda')}
                  </span>
                </div>
              </div>

              {/* Sketch D-Pad + Pastel Water Bomb Button */}
              <div className="mt-4 flex items-center justify-between gap-2 border-t-2 border-dashed border-[#5c4033]/25 pt-3.5">
                <div className="grid grid-cols-3 gap-1.5">
                  <div />
                  <button
                    type="button"
                    onMouseDown={() => holdKey('arrowup', true)}
                    onMouseUp={() => holdKey('arrowup', false)}
                    onMouseLeave={() => holdKey('arrowup', false)}
                    onTouchStart={() => holdKey('arrowup', true)}
                    onTouchEnd={() => holdKey('arrowup', false)}
                    className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#5c4033] bg-[#efe3c8] font-bold text-[#4a3525] shadow-[2px_2px_0_#5c4033] hover:bg-[#f6d88c] active:translate-x-0.5 active:translate-y-0.5"
                  >
                    ▲
                  </button>
                  <div />
                  <button
                    type="button"
                    onMouseDown={() => holdKey('arrowleft', true)}
                    onMouseUp={() => holdKey('arrowleft', false)}
                    onMouseLeave={() => holdKey('arrowleft', false)}
                    onTouchStart={() => holdKey('arrowleft', true)}
                    onTouchEnd={() => holdKey('arrowleft', false)}
                    className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#5c4033] bg-[#efe3c8] font-bold text-[#4a3525] shadow-[2px_2px_0_#5c4033] hover:bg-[#f6d88c] active:translate-x-0.5 active:translate-y-0.5"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onMouseDown={() => holdKey('arrowdown', true)}
                    onMouseUp={() => holdKey('arrowdown', false)}
                    onMouseLeave={() => holdKey('arrowdown', false)}
                    onTouchStart={() => holdKey('arrowdown', true)}
                    onTouchEnd={() => holdKey('arrowdown', false)}
                    className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#5c4033] bg-[#efe3c8] font-bold text-[#4a3525] shadow-[2px_2px_0_#5c4033] hover:bg-[#f6d88c] active:translate-x-0.5 active:translate-y-0.5"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onMouseDown={() => holdKey('arrowright', true)}
                    onMouseUp={() => holdKey('arrowright', false)}
                    onMouseLeave={() => holdKey('arrowright', false)}
                    onTouchStart={() => holdKey('arrowright', true)}
                    onTouchEnd={() => holdKey('arrowright', false)}
                    className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#5c4033] bg-[#efe3c8] font-bold text-[#4a3525] shadow-[2px_2px_0_#5c4033] hover:bg-[#f6d88c] active:translate-x-0.5 active:translate-y-0.5"
                  >
                    ▶
                  </button>
                </div>

                <button
                  type="button"
                  onClick={dropWaterBomb}
                  className="cursor-pointer flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 border-[#5c4033] bg-[#9bd3ec] text-[#1e3a5f] shadow-[3px_3px_0_#5c4033] hover:bg-[#b3dff2] active:translate-x-0.5 active:translate-y-0.5"
                >
                  <PixelIcon name="bomb" size={22} />
                  <span className="mt-0.5 font-mono text-[9px] font-extrabold uppercase">
                    {L('BOMB', 'BOM')}
                  </span>
                </button>
              </div>
            </div>

            <div className="relative rounded-2xl border-2 border-[#5c4033] bg-[#fbf5e6] p-4 pt-5 shadow-[4px_4px_0_#5c4033]">
              <div className="pointer-events-none absolute -top-2 inset-x-0 flex justify-center gap-5">
                {[0, 1, 2, 3].map((ring) => (
                  <span
                    key={ring}
                    className="h-4 w-2 rounded-full border-2 border-[#5c4033] bg-[#e9dcc5]"
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5 border-b-2 border-dashed border-[#5c4033]/25 pb-2 font-hand text-lg font-bold text-[#4a3525]">
                <PixelIcon name="star" size={16} />
                <span>{L('Power-Ups', 'Item Kekuatan')}</span>
              </div>
              <div className="mt-2.5 space-y-2 text-xs text-[#4a3525]">
                {POWERUP_TYPES.map((pu) => (
                  <div
                    key={pu.id}
                    className="flex items-center gap-2.5 rounded-xl border border-[#5c4033]/35 bg-[#f4ebd9] px-2.5 py-1.5"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#5c4033]/40 bg-[#fbf5e6]">
                      <PixelIcon name={pu.id === 'range' ? 'wave' : pu.id === 'speed' ? 'bolt' : pu.id} size={15} />
                    </span>
                    <span className="font-semibold">{isId ? pu.labelId : pu.labelEn}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t-2 border-dashed border-[#5c4033]/25 pt-2.5">
                <SdgMark goal={15} compact />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
