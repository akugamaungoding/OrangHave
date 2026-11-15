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
      ArcadeAudio.ctx.resume().catch(() => {});
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
            ctx.fillStyle = gs.stage.solidColor;
            ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
            ctx.fillStyle = '#2d5a40';
            ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 12);
            ctx.strokeStyle = '#0c1912';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
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

      // 7. Ember Spark Enemies
      gs.enemies.forEach((en) => {
        if (!en.alive) return;
        const pulse = 16 + Math.sin(t * 10) * 2.5;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.beginPath();
        ctx.arc(en.x, en.y, pulse + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(en.x, en.y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔥', en.x, en.y + 1);
      });

      // 8. Ranger Player
      const p = gs.player;
      const blink = p.invulnTimer > 0 && Math.floor(t * 16) % 2 === 0;
      if (!blink) {
        const bob = Math.sin(p.walkPhase) * 2;
        if (p.shieldTimer > 0) {
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 22, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = '#065f46';
        ctx.beginPath();
        ctx.arc(p.x, p.y + bob, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fde68a';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧑‍🚒', p.x, p.y + bob + 1);
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
    <div className="min-h-screen bg-[#0b1610] px-4 py-6 text-[#faf6ee]">
      <div className="mx-auto max-w-5xl">
        {/* Top Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#2d523c] bg-[#13261b]/95 px-4 py-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5c787]/40 bg-[#1c3b29] text-xl shadow-xs">
              💧
            </span>
            <div>
              <div className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#e5c787] uppercase">
                {L('Crazy Arcade · Karhutla Edition', 'Gaya Crazy Arcade · Edisi Karhutla')}
              </div>
              <h1 className="font-display text-lg font-extrabold tracking-tight text-white">
                {L('Peatland Water-Bomb Rescue', 'Misi Bom Air Penyelamat Gambut')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                ArcadeAudio.muted = !muted;
                setMuted(!muted);
              }}
              className="cursor-pointer rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 font-mono text-xs font-bold text-[#faf6ee] hover:bg-white/20"
            >
              {muted ? '🔇 Muted' : '🔊 SFX'}
            </button>
            <Link
              to="/map"
              className="rounded-lg border border-[#e5c787]/50 bg-[#e5c787]/15 px-3 py-1.5 font-mono text-xs font-bold text-[#f5e7c6] hover:bg-[#e5c787]/25"
            >
              {L('← Back to Map', '← Kembali ke Peta')}
            </Link>
          </div>
        </div>

        {/* Arcade HUD Bar */}
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-6">
          <div className="rounded-xl border border-[#2d523c] bg-[#13261b] px-3 py-2">
            <div className="font-mono text-[9px] text-[#9cb8a7] uppercase">
              {L('Stage', 'Level')}
            </div>
            <div className="font-mono text-xs font-extrabold text-[#e5c787]">
              {stageIdx + 1} / {STAGES.length}
            </div>
          </div>
          <div className="rounded-xl border border-[#2d523c] bg-[#13261b] px-3 py-2">
            <div className="font-mono text-[9px] text-[#9cb8a7] uppercase">
              {L('Lives', 'Nyawa')}
            </div>
            <div className="text-sm font-bold text-rose-400">
              {'❤️'.repeat(Math.max(0, hud.lives)) || '💀'}
            </div>
          </div>
          <div className="rounded-xl border border-[#2d523c] bg-[#13261b] px-3 py-2">
            <div className="font-mono text-[9px] text-[#9cb8a7] uppercase">
              {L('Rescued', 'Selamat')}
            </div>
            <div className="font-mono text-sm font-extrabold text-emerald-400">
              🦧 {hud.rescued} / {hud.totalAnimals}
            </div>
          </div>
          <div className="rounded-xl border border-[#2d523c] bg-[#13261b] px-3 py-2">
            <div className="font-mono text-[9px] text-[#9cb8a7] uppercase">
              {L('Time', 'Waktu')}
            </div>
            <div className="font-mono text-sm font-extrabold text-sky-300">
              ⏱ {hud.timeLeft}s
            </div>
          </div>
          <div className="rounded-xl border border-[#2d523c] bg-[#13261b] px-3 py-2">
            <div className="font-mono text-[9px] text-[#9cb8a7] uppercase">
              {L('Power-Ups', 'Kekuatan')}
            </div>
            <div className="font-mono text-[11px] font-bold text-white">
              💧{hud.maxBombs} · 🌊{hud.range} · ⚡{hud.speedLvl}
            </div>
          </div>
          <div className="rounded-xl border border-[#2d523c] bg-[#13261b] px-3 py-2">
            <div className="font-mono text-[9px] text-[#9cb8a7] uppercase">
              {L('Score', 'Skor')}
            </div>
            <div className="font-mono text-sm font-extrabold text-amber-300">
              {score.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Main Arcade Cabinet + Side Guide */}
        <div className="grid gap-4 lg:grid-cols-[1fr_270px]">
          <div className="relative overflow-hidden rounded-2xl border-4 border-[#2d523c] bg-[#0a140f] shadow-[0_24px_60px_rgba(0,0,0,0.65)]">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="block h-auto w-full"
            />

            {/* Toast Pickup Notification */}
            {toastMsg && (
              <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-full border border-[#e5c787]/60 bg-[#13261b]/95 px-4 py-1 font-mono text-xs font-extrabold text-[#fef08a] shadow-lg">
                {toastMsg}
              </div>
            )}

            {/* Overlays: Title / Paused / Stage Clear / Game Over / Victory */}
            {gameStatus !== 'playing' && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#07100b]/82 p-6 backdrop-blur-xs">
                <div className="w-full max-w-md rounded-2xl border-2 border-[#e5c787]/60 bg-[#13261b] p-6 text-center shadow-2xl">
                  <div className="mb-2 text-4xl">
                    {gameStatus === 'title' && '💧🔥🦧'}
                    {gameStatus === 'paused' && '⏸️'}
                    {gameStatus === 'stage_clear' && '🎉'}
                    {gameStatus === 'gameover' && '💨'}
                    {gameStatus === 'victory' && '🏆'}
                  </div>

                  <h2 className="font-display text-2xl font-extrabold text-white">
                    {gameStatus === 'title' &&
                      L('Karhutla Water-Bomb Arcade', 'Arcade Bom Air Karhutla')}
                    {gameStatus === 'paused' && L('Game Paused', 'Permainan Dijeda')}
                    {gameStatus === 'stage_clear' &&
                      L('Sector Cleared!', 'Sektor Aman!')}
                    {gameStatus === 'gameover' && L('Mission Failed', 'Misi Gagal')}
                    {gameStatus === 'victory' &&
                      L('All Wildlife Rescued!', 'Semua Satwa Selamat!')}
                  </h2>

                  <p className="mt-2 text-xs leading-relaxed text-[#c6d6cc]">
                    {gameStatus === 'title' &&
                      L(
                        'Drop Water Bombs (Space) to blast burning peat brush, extinguish ember sparks, grab power-ups, and rescue trapped endemic animals!',
                        'Letakkan Bom Air (Spasi) untuk meledakkan semak gambut terbakar, padamkan bara api, ambil item kekuatan, dan selamatkan satwa endemik yang terjebak!',
                      )}
                    {gameStatus === 'stage_clear' &&
                      L(
                        'Every trapped animal in this peatland sector reached safety. Ready for the next sector?',
                        'Semua satwa di sektor gambut ini berhasil diselamatkan. Siap lanjut ke sektor berikutnya?',
                      )}
                    {gameStatus === 'gameover' &&
                      L(
                        'The peat embers overwhelmed the ranger. Try again and use water bombs to clear a safe path!',
                        'Bara gambut terlalu kuat. Coba lagi dan manfaatkan bom air untuk membuka jalur aman!',
                      )}
                    {gameStatus === 'victory' &&
                      L(
                        `Congratulations! You cleared all 3 Kalimantan & Sumatra wildfire sectors with ${score.toLocaleString()} pts.`,
                        `Selamat! Anda menuntaskan seluruh 3 sektor karhutla dengan skor ${score.toLocaleString()} poin.`,
                      )}
                  </p>

                  <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                    {gameStatus === 'title' && (
                      <button
                        type="button"
                        onClick={() => {
                          setScore(0);
                          startStage(0, false);
                        }}
                        className="cursor-pointer rounded-xl border border-[#fde68a] bg-[#e5c787] px-5 py-2.5 font-mono text-xs font-extrabold text-[#13261b] shadow-md hover:bg-[#f0d69b]"
                      >
                        ▶ {L('START ARCADE', 'MULAI MAIN')}
                      </button>
                    )}
                    {gameStatus === 'paused' && (
                      <button
                        type="button"
                        onClick={() => setGameStatus('playing')}
                        className="cursor-pointer rounded-xl bg-[#10b981] px-5 py-2.5 font-mono text-xs font-extrabold text-white hover:bg-[#059669]"
                      >
                        ▶ {L('RESUME', 'LANJUTKAN')}
                      </button>
                    )}
                    {gameStatus === 'stage_clear' && (
                      <button
                        type="button"
                        onClick={() => startStage(stageIdx + 1, true)}
                        className="cursor-pointer rounded-xl bg-[#e5c787] px-5 py-2.5 font-mono text-xs font-extrabold text-[#13261b] hover:bg-[#f0d69b]"
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
                        className="cursor-pointer rounded-xl bg-[#e5c787] px-5 py-2.5 font-mono text-xs font-extrabold text-[#13261b] hover:bg-[#f0d69b]"
                      >
                        ↻ {L('PLAY AGAIN', 'MAIN LAGI')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Arcade Manual & Touch D-Pad */}
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-[#2d523c] bg-[#13261b] p-4">
              <div className="font-mono text-[10px] font-bold tracking-wider text-[#e5c787] uppercase">
                {L('Arcade Controls', 'Kontrol Arcade')}
              </div>
              <div className="mt-2 space-y-1.5 text-xs text-[#d6e4dc]">
                <div>
                  <span className="font-mono font-bold text-white">WASD / Arrows</span> —{' '}
                  {L('Move Ranger', 'Gerak Ranger')}
                </div>
                <div>
                  <span className="font-mono font-bold text-sky-300">Space / Enter</span> —{' '}
                  {L('Drop Water Bomb', 'Pasang Bom Air')}
                </div>
                <div>
                  <span className="font-mono font-bold text-amber-300">P / Esc</span> —{' '}
                  {L('Pause', 'Jeda')}
                </div>
              </div>

              {/* Touch / Mouse D-Pad */}
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                <div className="grid grid-cols-3 gap-1">
                  <div />
                  <button
                    type="button"
                    onMouseDown={() => holdKey('arrowup', true)}
                    onMouseUp={() => holdKey('arrowup', false)}
                    onMouseLeave={() => holdKey('arrowup', false)}
                    onTouchStart={() => holdKey('arrowup', true)}
                    onTouchEnd={() => holdKey('arrowup', false)}
                    className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 font-bold hover:bg-white/20"
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
                    className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 font-bold hover:bg-white/20"
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
                    className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 font-bold hover:bg-white/20"
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
                    className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 font-bold hover:bg-white/20"
                  >
                    ▶
                  </button>
                </div>

                <button
                  type="button"
                  onClick={dropWaterBomb}
                  className="cursor-pointer flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 border-sky-300 bg-sky-600 text-white shadow-lg active:scale-95"
                >
                  <span className="text-xl">💧</span>
                  <span className="font-mono text-[8.5px] font-extrabold uppercase">
                    {L('BOMB', 'BOM')}
                  </span>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[#2d523c] bg-[#13261b] p-4">
              <div className="font-mono text-[10px] font-bold tracking-wider text-[#e5c787] uppercase">
                {L('Power-Ups', 'Item Kekuatan')}
              </div>
              <div className="mt-2 space-y-1.5 text-xs text-[#d6e4dc]">
                {POWERUP_TYPES.map((pu) => (
                  <div key={pu.id} className="flex items-center gap-2">
                    <span>{pu.icon}</span>
                    <span>{isId ? pu.labelId : pu.labelEn}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t border-white/10 pt-2.5">
                <SdgMark goal={15} compact />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
