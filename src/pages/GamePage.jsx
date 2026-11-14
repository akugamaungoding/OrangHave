import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n';
import SdgMark from '../components/SdgMark';

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
  { id: 'f1', x: 530, y: 195, rx: 85, ry: 55, name: 'Karhutla Kubah Gambut Tengah', intensity: 1.1 },
  { id: 'f2', x: 740, y: 150, rx: 65, ry: 48, name: 'Titik Api Kanopi Meranti Timur', intensity: 0.9 },
  { id: 'f3', x: 730, y: 470, rx: 60, ry: 45, name: 'Bara Api Semak Sisi Timur', intensity: 0.95 },
  { id: 'f4', x: 370, y: 580, rx: 70, ry: 50, name: 'Kebakaran Rawa Gambut Selatan', intensity: 1.05 },
  { id: 'f5', x: 220, y: 390, rx: 62, ry: 46, name: 'Api Tajuk Belukar Barat', intensity: 0.85 },
  { id: 'f6', x: 600, y: 730, rx: 55, ry: 40, name: 'Rekahan Bara Bawah Tanah Tenggara', intensity: 0.8 },
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

export default function GamePage() {
  const { locale } = useTranslation();
  const isId = locale === 'id';

  const canvasRef = useRef(null);

  // Status Game
  const [lives, setLives] = useState(3);
  const [rescuedCount, setRescuedCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 menit
  const [isPaused, setIsPaused] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [failReason, setFailReason] = useState('');

  // Skenario Titik Kebakaran Aktif (Dinamis / Bisa Banyak & Diacak)
  const [fireHotspots, setFireHotspots] = useState(DEFAULT_FIRE_HOTSPOTS);

  // Mode Layer Radar NISAR
  const [radarLayer, setRadarLayer] = useState('optical');

  // Pulsa Radar NISAR untuk Menembus Kabut Asap
  const [radarActive, setRadarActive] = useState(false);
  const [radarCharges, setRadarCharges] = useState(4);
  const radarWaveRef = useRef(0);
  const smokeParticlesRef = useRef([]);

  // Misi Satwa Aktif (Index 0 s.d 4)
  const [missionIndex, setMissionIndex] = useState(0);
  const currentMission = WILDLIFE_MISSIONS[missionIndex];

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
      ? `Fase 1: Cari keberadaan ${currentMission.name} yang tersesat di antara banyak titik kebakaran hutan!`
      : `Phase 1: Search and find ${currentMission.nameEn} stranded between multiple wildfire hotspots!`
  );

  // Modal Encounter saat Pertama Kali Menemukan Satwa
  const [showFoundModal, setShowFoundModal] = useState(false);

  // Countdown Timer Game
  useEffect(() => {
    if (isPaused || gameWon || gameOver) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setGameOver(true);
          setFailReason(
            isId
              ? 'Waktu penyelamatan habis! Kobaran api karhutla meluas di berbagai sektor hutan.'
              : 'Time ran out! Wildfire hotspots have expanded across multiple sectors.'
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, gameWon, gameOver, isId]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Inisialisasi Partikel Kabut Asap Karhutla (65 Partikel Organik)
  useEffect(() => {
    const smokes = [];
    for (let i = 0; i < 65; i++) {
      smokes.push({
        x: Math.random() * 1000,
        y: Math.random() * 800,
        radius: 45 + Math.random() * 60,
        opacity: 0.38 + Math.random() * 0.42,
        vx: 0.15 + Math.random() * 0.35,
        vy: -0.06 + (Math.random() - 0.5) * 0.15,
      });
    }
    smokeParticlesRef.current = smokes;
  }, [fireHotspots]);

  // Pulsa Radar NISAR L-band Menembus Kabut Asap Seketika
  const triggerRadar = useCallback(() => {
    if (radarCharges <= 0 || radarActive) return;
    setRadarCharges((prev) => prev - 1);
    setRadarActive(true);
    radarWaveRef.current = 10;
    GameAudio.playRadarPulse();

    setRangerDialogue(
      isId
        ? '🛰️ Pulsa radar gelombang mikro NISAR L-band berhasil menembus kabut asap karhutla!'
        : '🛰️ NISAR L-band microwave radar pulse slicing straight through the dense smoke!'
    );

    setTimeout(() => {
      setRadarActive(false);
    }, 6500);
  }, [radarCharges, radarActive, isId]);

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

  // Reset Sektor / Mulai Ulang Misi (Dengan Opsi Mengacak Titik Api Baru!)
  const restartMission = useCallback((randomizeFires = false) => {
    setLives(3);
    setRescuedCount(0);
    setTimeRemaining(180);
    setIsPaused(false);
    setGameWon(false);
    setGameOver(false);
    setFailReason('');
    setMissionIndex(0);
    setAnimalState('SEARCHING');
    setShowFoundModal(false);
    setRadarActive(false);
    setRadarCharges(4);
    radarWaveRef.current = 0;

    if (randomizeFires) {
      // Acak posisi titik api karhutla baru agar tantangan bervariasi!
      const randomized = DEFAULT_FIRE_HOTSPOTS.map((f, i) => {
        const jx = (Math.sin(Date.now() + i * 2.3) * 35);
        const jy = (Math.cos(Date.now() + i * 1.9) * 30);
        return {
          ...f,
          x: Math.max(160, Math.min(800, f.x + jx)),
          y: Math.max(130, Math.min(740, f.y + jy)),
          rx: f.rx + (Math.random() - 0.5) * 15,
          ry: f.ry + (Math.random() - 0.5) * 12,
        };
      });
      setFireHotspots(randomized);
    }

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
      x: WILDLIFE_MISSIONS[0].lostPos.x,
      y: WILDLIFE_MISSIONS[0].lostPos.y,
      angle: 0,
      walkCycle: 0,
    };

    setRangerDialogue(
      isId
        ? `Fase 1: Cari keberadaan ${WILDLIFE_MISSIONS[0].name} yang tersesat di antara banyak titik kebakaran hutan!`
        : `Phase 1: Search and find ${WILDLIFE_MISSIONS[0].nameEn} stranded between multiple wildfire hotspots!`
    );
  }, [isId]);

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
  }, [gameOver, gameWon, isPaused, showFoundModal, triggerRadar]);

  /* ────────────────────────────────────────────────────────────────────────
     60 FPS ENGINE RENDERING: MULTI-FIREFRONT + SATWA KE HABITAT ASLI
     ──────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    lastTimeRef.current = performance.now();

    const render = (now) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      const ranger = rangerRef.current;
      const animal = animalPosRef.current;

      // 1. UPDATE FISIKA GERAK RANGER MANUSIA
      const dx = ranger.targetX - ranger.x;
      const dy = ranger.targetY - ranger.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 3 && !gameOver && !gameWon && !isPaused && !showFoundModal) {
        ranger.isMoving = true;
        ranger.angle = Math.atan2(dy, dx);
        const moveStep = Math.min(dist, ranger.speed * dt);
        ranger.x += (dx / dist) * moveStep;
        ranger.y += (dy / dist) * moveStep;
        ranger.walkCycle += moveStep * 0.18;

        stepSoundTimerRef.current += dt;
        if (stepSoundTimerRef.current > 0.28) {
          GameAudio.playFootstep();
          stepSoundTimerRef.current = 0;
        }

        // FASE 1: RANGER MENCARI SATWA
        if (animalState === 'SEARCHING') {
          const dToAnimal = Math.hypot(ranger.x - animal.x, ranger.y - animal.y);
          if (dToAnimal < 45) {
            GameAudio.playFoundAnimal();
            setAnimalState('FOLLOWING');
            setShowFoundModal(true);
            setRangerDialogue(
              isId
                ? `Kamu berhasil menemukan ${currentMission.name}! Sekarang tuntun dia ke ${currentMission.habitat.name}!`
                : `You found ${currentMission.nameEn}! Now guide it safely to ${currentMission.habitat.nameEn}!`
            );
          }
        }

        // FASE 2: SATWA SUDAH DITEMUKAN & MENGIKUTI RANGER MENUJU HABITAT ASLINYA
        if (animalState === 'FOLLOWING') {
          const adx = (ranger.x - Math.cos(ranger.angle) * 38) - animal.x;
          const ady = (ranger.y - Math.sin(ranger.angle) * 38) - animal.y;
          const adist = Math.hypot(adx, ady);
          if (adist > 5) {
            animal.angle = Math.atan2(ady, adx);
            animal.x += (adx / adist) * Math.min(adist, (ranger.speed * 1.05) * dt);
            animal.y += (ady / adist) * Math.min(adist, (ranger.speed * 1.05) * dt);
            animal.walkCycle += dt * 8;
          }

          // CEK JIKA BERHASIL MENCAPAI HABITAT ASLINYA
          const dHabitat = Math.hypot(animal.x - currentMission.habitat.x, animal.y - currentMission.habitat.y);
          if (dHabitat < currentMission.habitat.radius + 15) {
            GameAudio.playRescueChime();
            const nextCount = rescuedCount + 1;
            setRescuedCount(nextCount);

            if (nextCount >= WILDLIFE_MISSIONS.length) {
              setGameWon(true);
            } else {
              const nextIdx = missionIndex + 1;
              setMissionIndex(nextIdx);
              const nextMission = WILDLIFE_MISSIONS[nextIdx];

              animal.x = nextMission.lostPos.x;
              animal.y = nextMission.lostPos.y;
              setAnimalState('SEARCHING');

              setRangerDialogue(
                isId
                  ? `Luar biasa! ${currentMission.name} telah sampai di habitatnya. Sekarang ayo cari ${nextMission.name}!`
                  : `Wonderful! ${currentMission.nameEn} is safe at home. Now let's search for ${nextMission.nameEn}!`
              );
            }
          }
        }

        // CEK JIKA MENYENTUH SALAH SATU DARI BANYAK TITIK KEBAKARAN
        const hitFire = fireHotspots.find((fz) => {
          const fdx = ranger.x - fz.x;
          const fdy = ranger.y - fz.y;
          return (fdx * fdx) / ((fz.rx * 0.72) * (fz.rx * 0.72)) + (fdy * fdy) / ((fz.ry * 0.72) * (fz.ry * 0.72)) < 1.0;
        });

        if (hitFire) {
          GameAudio.playDangerWarning();
          setLives((prev) => {
            const next = prev - 1;
            if (next <= 0) {
              setGameOver(true);
              setFailReason(
                isId
                  ? `Ranger terkena jilatan kobaran api di "${hitFire.name}"! Perhatikan sebaran titik api satelit.`
                  : `Ranger was trapped by the flames at "${hitFire.name}"! Use SAR radar to dodge hotspots.`
              );
            } else {
              setRangerDialogue(
                isId
                  ? `Awas! Area "${hitFire.name}" sedang membara hebat! Mundur dan cari jalur yang aman.`
                  : `Warning! "${hitFire.name}" is intensely burning! Retreat and find a safe corridor.`
              );
              ranger.x -= Math.cos(ranger.angle) * 35;
              ranger.y -= Math.sin(ranger.angle) * 35;
              ranger.targetX = ranger.x;
              ranger.targetY = ranger.y;
            }
            return next;
          });
        }
      } else {
        ranger.isMoving = false;
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
        // Render Heatmap di setiap titik api
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

      // (D) BANYAK TITIK KEBAKARAN KARHUTLA DI BERBAGAI PENJURU (SEPERTI REFERENSI NYATA)
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

          // Ikon Api & Pendar Membara
          ctx.font = `${Math.round(20 * fz.intensity)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('🔥', fz.x, fz.y + Math.sin(now * 0.007 + idx) * 3);
          ctx.restore();
        });
      }

      // (E) 400+ POHON KANOPI RIMBUN DUNIA NYATA
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

        // Bayangan
        ctx.fillStyle = 'rgba(6, 22, 10, 0.5)';
        ctx.beginPath();
        ctx.ellipse(5, 7, tree.radius, tree.radius * 0.75, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Daun Dasar
        const p = tree.palette;
        ctx.fillStyle = p.base;
        ctx.beginPath();
        ctx.arc(0, 0, tree.radius, 0, Math.PI * 2);
        ctx.fill();

        // Sub-Daun
        tree.subLeaves.forEach((sl) => {
          ctx.fillStyle = p.mid;
          ctx.beginPath();
          ctx.arc(sl.ox, sl.oy, sl.r, 0, Math.PI * 2);
          ctx.fill();
        });

        // Highlight Matahari
        ctx.fillStyle = p.light;
        ctx.beginPath();
        ctx.arc(-tree.radius * 0.22, -tree.radius * 0.22, tree.radius * 0.58, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // (F) HABITAT ASLI MASING-MASING SATWA (LOKASI BERBEDA & BUKAN DI SUNGAI)
      const hab = currentMission.habitat;
      ctx.save();
      const pulseHab = Math.sin(now * 0.006) * 7;
      ctx.strokeStyle = hab.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(hab.x, hab.y, hab.radius + pulseHab, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 8;
      ctx.stroke();

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

      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(hab.name, hab.x, hab.y + 36);
      ctx.shadowBlur = 0;
      ctx.restore();

      // (G) JALUR PENUNTUN (DASHED PATH & PAWPRINTS) JIKA SATWA SUDAH DITEMUKAN
      if (animalState === 'FOLLOWING') {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([8, 12]);
        ctx.beginPath();
        ctx.moveTo(animal.x, animal.y);
        ctx.quadraticCurveTo((animal.x + hab.x) / 2, (animal.y + hab.y) / 2 - 30, hab.x, hab.y);
        ctx.stroke();
        ctx.setLineDash([]);

        const midX = (animal.x + hab.x) / 2;
        const midY = (animal.y + hab.y) / 2 - 15;
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🐾', midX, midY);
        ctx.restore();
      }

      // (H) POSISI SATWA
      ctx.save();
      ctx.translate(animal.x, animal.y);

      if (animalState === 'SEARCHING') {
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
        ctx.fillText('CARI AKU!', 0, -26);
      } else {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.stroke();
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

      // (I) GADIS RANGER DENGAN RANSEL PENYELAMAT
      ctx.save();
      ctx.translate(ranger.x, ranger.y);

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

      // Sepatu Bot
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-5, -8 + legOffset, 10, 4);
      ctx.fillRect(-5, 4 - legOffset, 10, 4);

      // Celana Pendek
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-6, -6, 7, 12);

      // Tas Ransel
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.roundRect(-16, -7, 10, 14, 3);
      ctx.fill();

      // Baju Safari
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.roundRect(-7, -8, 14, 16, 4);
      ctx.fill();

      // Lengan
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-2 + armOffset, -10, 5, 3);
      ctx.fillRect(-2 - armOffset, 7, 5, 3);

      // Rambut Cokelat & Topi Ranger
      ctx.fillStyle = '#713f12';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();

      // Wajah
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

      // (K) PARTIKEL KABUT ASAP KARHUTLA & SINAR RADAR PENEMBUS KABUT NISAR
      if (smokeParticlesRef.current && smokeParticlesRef.current.length > 0) {
        ctx.save();
        smokeParticlesRef.current.forEach((sm) => {
          sm.x += sm.vx;
          sm.y += sm.vy;
          if (sm.x > canvas.width + 60) sm.x = -60;
          if (sm.x < -60) sm.x = canvas.width + 60;
          if (sm.y > canvas.height + 60) sm.y = -60;
          if (sm.y < -60) sm.y = canvas.height + 60;

          // Sinar senter & radius sekitar ranger membersihkan kabut asap
          const distToRanger = Math.hypot(sm.x - ranger.x, sm.y - ranger.y);
          let rangerClear = 1;
          if (distToRanger < 130) {
            rangerClear = Math.max(0.08, (distToRanger - 40) / 90);
          }

          // Habitat tujuan juga relatif lebih bersih
          const distToHab = Math.hypot(sm.x - hab.x, sm.y - hab.y);
          let habClear = 1;
          if (distToHab < 90) {
            habClear = Math.max(0.2, (distToHab - 30) / 60);
          }

          // JIKA RADAR NISAR AKTIF: Gelombang mikro L-band menembus kabut asap secara dramatis!
          const radarPierce = radarActive ? 0.08 : 1.0;
          const finalAlpha = sm.opacity * rangerClear * habClear * radarPierce;

          if (finalAlpha > 0.02) {
            const smokeGrad = ctx.createRadialGradient(sm.x, sm.y, 4, sm.x, sm.y, sm.radius);
            smokeGrad.addColorStop(0, `rgba(45, 38, 32, ${finalAlpha * 0.88})`);
            smokeGrad.addColorStop(0.5, `rgba(38, 30, 24, ${finalAlpha * 0.52})`);
            smokeGrad.addColorStop(1, 'rgba(25, 20, 16, 0)');
            ctx.fillStyle = smokeGrad;
            ctx.beginPath();
            ctx.arc(sm.x, sm.y, sm.radius, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.restore();
      }

      // (L) VISUALISASI GELOMBANG RADAR NISAR GELOMBANG MIKRO L-BAND
      if (radarActive) {
        ctx.save();
        radarWaveRef.current += 380 * dt;
        if (radarWaveRef.current > 1400) radarWaveRef.current = 15;
        const waveR = radarWaveRef.current;

        // Lingkaran Gelombang Radar yang Menjalar Keluar
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.85)';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([14, 10]);
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, waveR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, Math.max(0, waveR - 45), 0, Math.PI * 2);
        ctx.stroke();

        // Scanlines Radar Grid
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

        // Radar Crosshair Reticle: Mengunci posisi satwa yang tersembunyi di balik asap
        if (animalState === 'SEARCHING') {
          const reticlePulse = Math.sin(now * 0.015) * 6;
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(animal.x, animal.y, 34 + reticlePulse, 0, Math.PI * 2);
          ctx.stroke();

          // Garis bidik silang (crosshair)
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

          // Teks Deteksi Satwa L-Band
          ctx.fillStyle = '#22c55e';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`📡 NISAR TARGET LOCK: ${currentMission.emoji}`, animal.x, animal.y - 44);
        }

        ctx.restore();
      }

      animIdRef.current = requestAnimationFrame(render);
    };

    animIdRef.current = requestAnimationFrame(render);
    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, [treeCanopyData, radarLayer, missionIndex, currentMission, animalState, rescuedCount, gameOver, gameWon, isPaused, showFoundModal, fireHotspots, radarActive, isId]);

  /* ──────────────────────────────────────────────────────────────────────────
     METRIK HASIL AKHIR MISI YANG DINAMIS & BERVARIASI (DYNAMIC MISSION ENDING)
     ────────────────────────────────────────────────────────────────────────── */
  const missionResults = useMemo(() => {
    // Rating Bintang (1 - 3) berdasarkan sisa nyawa dan kecepatan waktu
    let stars = 3;
    let rankTitleId = '🏆 Legenda Penjaga Rimba Kalimantan';
    let rankTitleEn = '🏆 Legend of Borneo Peatlands';
    let badgeColor = 'from-amber-400 to-yellow-500';

    if (lives === 2 || timeRemaining < 60) {
      stars = 2;
      rankTitleId = '🌟 Pahlawan Penyelamat Tangguh';
      rankTitleEn = '🌟 Resilient Wildlife Guardian';
      badgeColor = 'from-emerald-400 to-teal-500';
    } else if (lives === 1 || timeRemaining < 30) {
      stars = 1;
      rankTitleId = '🎖️ Ranger Konservasi Pemberani';
      rankTitleEn = '🎖️ Brave Conservation Ranger';
      badgeColor = 'from-blue-400 to-indigo-500';
    }

    // Luas restorasi & pemulihan lingkungan
    const restorationScore = Math.min(100, Math.round(92 + (lives * 2) + (timeRemaining > 80 ? 2 : 0)));

    // Dampak Kualitas Udara (AQI)
    const aqiSaved = 140 + (lives * 20);

    return {
      stars,
      rankTitle: isId ? rankTitleId : rankTitleEn,
      badgeColor,
      restorationScore,
      aqiSaved,
      elapsedTime: formatTime(180 - timeRemaining),
    };
  }, [lives, timeRemaining, isId]);

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
                <span>{rescuedCount}/5</span>
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
                ) : (
                  <span className="text-emerald-300">
                    🐾 {isId ? `Tuntun ke ${currentMission.habitat.icon}` : `Guide to ${currentMission.habitat.icon}`}
                  </span>
                )}
              </div>
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

          {/* ── KARTU NISAR RADAR LAYER (DI POJOK KIRI ATAS) ── */}
          <div className="absolute top-20 left-4 z-30 w-44 sm:w-48 bg-[#0a1c11]/90 backdrop-blur-md rounded-2xl border border-emerald-600/60 p-2.5 shadow-2xl text-xs font-sans text-cream-100">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-emerald-800/80">
              <span className="font-bold text-[11px] text-emerald-300 flex items-center gap-1">
                <span>🛰️</span> NISAR Radar Layer
              </span>
              <span className="text-[10px] opacity-60">ℹ️</span>
            </div>

            <div className="space-y-1.5">
              <button
                onClick={() => setRadarLayer('before')}
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
                onClick={() => setRadarLayer('after')}
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
                onClick={() => setRadarLayer('change')}
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
                onClick={() => setRadarLayer('optical')}
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

        {/* ── MODAL SAAT RANGER PERTAMA KALI MENEMUKAN SATWA ── */}
        {showFoundModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-[#0b1c11] max-w-lg w-full rounded-3xl border-2 border-amber-400 shadow-2xl p-6 text-center text-cream-50">
              <div className="text-6xl my-2 animate-bounce">{currentMission.emoji}</div>
              <h2 className="font-hand text-3xl font-bold text-amber-300 mt-2">
                {currentMission.name} {isId ? 'Ditemukan!' : 'Discovered!'}
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
                <p className="text-cream-200 font-bold">{currentMission.habitat.name}</p>
                <p className="text-emerald-300/80 text-[11px]">{currentMission.habitat.desc}</p>
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

        {/* ── MODAL MISSION COMPLETE DINAMIS & BERVARIASI ── */}
        {gameWon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
            <div className="bg-[#0c2215] max-w-xl w-full rounded-3xl border-2 border-amber-400 shadow-2xl p-6 sm:p-8 text-center text-cream-50 relative overflow-hidden">
              {/* Bintang Kemenangan Berdasarkan Performa Pemain ⭐⭐⭐ */}
              <div className="text-4xl sm:text-5xl my-1 animate-bounce tracking-widest text-amber-300">
                {'⭐'.repeat(missionResults.stars)}
                {'☆'.repeat(3 - missionResults.stars)}
              </div>

              <div className={`inline-block bg-gradient-to-r ${missionResults.badgeColor} text-charcoal-950 font-hand text-2xl sm:text-3xl font-bold px-6 py-1.5 rounded-2xl shadow-lg border border-white/40 my-2`}>
                {missionResults.rankTitle}
              </div>

              <p className="font-serif italic text-emerald-200 text-xs sm:text-sm mt-1">
                {isId
                  ? 'Semua satwa telah berhasil dipulangkan ke habitat aslinya melewati berbagai kepungan api karhutla!'
                  : 'All wildlife have returned safely to their natural habitats through multi-front wildfires!'}
              </p>

              {/* Ringkasan Skor & Dampak Lingkungan Nyata */}
              <div className="my-4 p-4 rounded-2xl bg-black/60 border border-emerald-600/50 text-left font-sans space-y-2.5 text-xs sm:text-sm">
                <div className="font-bold text-amber-300 uppercase tracking-wider text-xs border-b border-emerald-900 pb-1 flex justify-between">
                  <span>Mission Performance Results</span>
                  <span className="text-emerald-400">Score: {missionResults.restorationScore}%</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🐾</span>
                    <div>
                      <div className="text-[10px] text-cream-200/70">{isId ? 'Satwa Selamat' : 'Rescued'}</div>
                      <strong className="text-amber-400 font-mono">5 / 5 Satwa</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-base">⏱️</span>
                    <div>
                      <div className="text-[10px] text-cream-200/70">{isId ? 'Waktu Tempuh' : 'Time Elapsed'}</div>
                      <strong className="text-cream-100 font-mono">{missionResults.elapsedTime}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-base">❤️</span>
                    <div>
                      <div className="text-[10px] text-cream-200/70">{isId ? 'Sisa Nyawa Ranger' : 'Lives Left'}</div>
                      <strong className="text-red-400 font-mono">{lives} / 3</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-base">🌳</span>
                    <div>
                      <div className="text-[10px] text-cream-200/70">{isId ? 'Koridor Hutan Pulih' : 'Restored'}</div>
                      <strong className="text-emerald-400 font-mono">{missionResults.restorationScore}%</strong>
                    </div>
                  </div>
                </div>

                {/* Dampak Polusi Udara Regional */}
                <div className="pt-2 border-t border-emerald-900/80 text-[11px] text-emerald-300/90 leading-relaxed">
                  🌍 <strong>{isId ? 'Dampak Lintas Batas:' : 'Regional Impact:'}</strong>{' '}
                  {isId
                    ? `Indeks kabut asap regional berkurang -${missionResults.aqiSaved} poin! Langit Kalimantan dan negara tetangga kembali biru & sehat.`
                    : `Regional smoke pollution dropped by -${missionResults.aqiSaved} AQI points! Skies over Borneo and neighbor countries cleared.`}
                </div>
              </div>

              {/* Galeri Kisah Satwa di Rumah Aslinya (Epilogue Mini-Cards) */}
              <div className="my-3 text-left">
                <div className="text-[11px] font-bold text-emerald-300 font-mono mb-2 uppercase tracking-wider">
                  {isId ? 'Kisah Satwa di Habitat Aslinya:' : 'Wildlife in Their Natural Homes:'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-sans">
                  {WILDLIFE_MISSIONS.slice(0, 4).map((m) => (
                    <div key={m.id} className="p-2 rounded-xl bg-black/40 border border-emerald-900/60 flex items-start gap-2">
                      <span className="text-xl shrink-0">{m.emoji}</span>
                      <p className="text-cream-200/80 leading-tight">
                        {isId ? m.storyEpilogueId : m.storyEpilogueEn}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tombol Aksi Menarik */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mt-4">
                <button
                  onClick={() => restartMission(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-charcoal-950 font-bold text-xs sm:text-sm hover:from-amber-400 hover:to-amber-500 transition-all shadow-md active:scale-95"
                >
                  {isId ? '🎲 Skenario Baru (Acak Titik Api) 🔄' : '🎲 New Scenario (Randomize Fires) 🔄'}
                </button>

                <button
                  onClick={() => restartMission(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-cream-50 font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95"
                >
                  {isId ? 'Main Ulang 🔁' : 'Replay 🔁'}
                </button>

                <Link
                  to="/"
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-950 border border-emerald-700 text-cream-200 font-bold text-xs sm:text-sm hover:bg-emerald-900 transition-colors"
                >
                  {isId ? 'Beranda 🏠' : 'Home 🏠'}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL GAME OVER ── */}
        {gameOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
            <div className="bg-[#180907] max-w-md w-full rounded-3xl border-2 border-red-500 shadow-2xl p-6 text-center text-cream-50">
              <div className="text-5xl my-2">🔥🚨</div>
              <h2 className="font-hand text-3xl font-bold text-red-400 mt-2">
                {isId ? 'Misi Penyelamatan Terhenti!' : 'Mission Failed!'}
              </h2>
              <p className="font-sans text-xs text-cream-200/90 mt-2 leading-relaxed">
                {failReason}
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <button
                  onClick={() => restartMission(false)}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-colors shadow-lg active:scale-95"
                >
                  {isId ? 'Coba Lagi 🔄' : 'Try Again 🔄'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── FOOTER EDUKASI SDGS & SAINS RADAR NISAR ── */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#09180e] p-4 rounded-2xl border border-emerald-900/80 text-xs">
            <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5 font-mono">
              <span>🛰️</span> Mengapa Radar NISAR?
            </h3>
            <p className="text-emerald-200/80 leading-relaxed font-sans">
              Gelombang mikro L-band NISAR (~24 cm) berukuran jauh lebih besar daripada partikel asap aerosol karhutla, sehingga mampu menembus kabut asap secara instan untuk memetakan tajuk pohon dan mengarahkan jalur evakuasi satwa.
            </p>
          </div>

          <div className="bg-[#09180e] p-4 rounded-2xl border border-emerald-900/80 text-xs">
            <h3 className="font-bold text-emerald-300 mb-1 flex items-center gap-1.5 font-mono">
              <span>🦧</span> 5 Satwa & Habitat Aslinya
            </h3>
            <p className="text-emerald-200/80 leading-relaxed font-sans">
              Kancil di semak riparian sejuk, Orangutan di kanopi pohon ulin tenggara, Trenggiling di liang bukit lembap, Beruang Madu di pohon sarang lebah raksasa, dan Enggang Gading di puncak bukit utara.
            </p>
          </div>

          <div className="bg-[#09180e] p-4 rounded-2xl border border-emerald-900/80 text-xs">
            <h3 className="font-bold text-cream-100 mb-1 flex items-center gap-1.5 font-mono">
              <span>🌍</span> Sasaran SDGs PBB
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
