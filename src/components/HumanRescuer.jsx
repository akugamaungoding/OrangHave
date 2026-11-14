import React from 'react';

/**
 * HumanRescuer.jsx
 * Realistic Animated Human Wildlife Rescuer / Forest Ranger Character for H.O.M.E.
 * Features:
 * - Detailed Ranger Uniform: High-visibility rescue vest, protective helmet, headlamp beam,
 *   respirator mask, rugged field boots, rescue harness backpack.
 * - Dynamic walking animation (alternating legs, swinging arms, torso bob).
 * - Multi-directional facing: 'up', 'down', 'left', 'right'.
 * - Carried rescued animal companion (Tuki, Liku, Madu, Kecil, Rangkong) in rescue sling.
 * - Headlamp flashlight cone illuminating the smoke ahead.
 */
export default function HumanRescuer({
  direction = 'down', // 'up' | 'down' | 'left' | 'right'
  isWalking = false,
  carriedAnimal = null, // e.g. { name: 'Tuki', emoji: '🦧', species: 'Orangutan' }
  scale = 1,
  className = '',
}) {
  // Flip horizontally if facing left
  const isLeft = direction === 'left';
  const isUp = direction === 'up';
  const isDown = direction === 'down';
  const isSide = direction === 'left' || direction === 'right';

  return (
    <div
      className={`relative select-none pointer-events-none flex items-center justify-center ${className}`}
      style={{
        width: `${48 * scale}px`,
        height: `${48 * scale}px`,
        transform: isLeft ? 'scaleX(-1)' : 'scaleX(1)',
        transition: 'transform 0.15s ease-out',
      }}
    >
      {/* Sinar Senter Kepala (Headlamp Light Beam) menembus asap ke arah hadap */}
      <div
        className={`absolute pointer-events-none z-10 transition-opacity duration-300 ${
          isWalking ? 'opacity-90' : 'opacity-70'
        }`}
        style={{
          top: isUp ? '-36px' : isDown ? '20px' : '-4px',
          left: isSide ? (isLeft ? '-32px' : '22px') : '-12px',
          width: isSide ? '50px' : '72px',
          height: isSide ? '36px' : '50px',
          background: isUp
            ? 'radial-gradient(ellipse at bottom, rgba(254, 240, 138, 0.55) 0%, rgba(250, 204, 21, 0.2) 50%, transparent 80%)'
            : isDown
            ? 'radial-gradient(ellipse at top, rgba(254, 240, 138, 0.6) 0%, rgba(250, 204, 21, 0.25) 50%, transparent 80%)'
            : 'radial-gradient(ellipse at left, rgba(254, 240, 138, 0.6) 0%, rgba(250, 204, 21, 0.25) 50%, transparent 80%)',
          transform: isSide
            ? 'rotate(0deg)'
            : isUp
            ? 'rotate(0deg)'
            : 'rotate(0deg)',
          filter: 'blur(2px)',
        }}
      />

      {/* SVG Avatar Manusia Penyelamat Hutan */}
      <svg
        viewBox="0 0 100 120"
        className="w-full h-full filter drop-shadow-md overflow-visible"
      >
        <defs>
          {/* Bayangan jejak kaki di tanah */}
          <radialGradient id="shadow-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

          {/* Gradien Seragam Ranger Khaki & Hijau Hutan */}
          <linearGradient id="ranger-suit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4d7c0f" /> {/* moss green */}
            <stop offset="100%" stopColor="#365314" />
          </linearGradient>

          {/* Gradien Rompi Keselamatan Oranye Reflektif */}
          <linearGradient id="safety-vest" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f97316" /> {/* safety orange */}
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>

          {/* Gradien Helm Lapangan Khaki */}
          <linearGradient id="helmet-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>

          {/* Gradien Kulit Manusia */}
          <linearGradient id="skin-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {/* 1. Bayangan di Tanah */}
        <ellipse cx="50" cy="112" rx="26" ry="7" fill="url(#shadow-grad)" />

        {/* 2. Tubuh Utama dengan Animasi Gerak Langkah Kaki */}
        <g
          className={isWalking ? 'animate-rescuer-bob' : ''}
          style={{ transformOrigin: '50% 90%' }}
        >
          {/* TAS RANSEL OKSIGEN DI PUNGGUNG (Tampak saat menghadap atas atau samping) */}
          {(isUp || isSide) && (
            <g id="oxygen-backpack">
              {/* Tabung Oksigen Baja */}
              <rect
                x="34"
                y="38"
                width="14"
                height="32"
                rx="6"
                fill="#0284c7"
                stroke="#0369a1"
                strokeWidth="2"
              />
              <rect
                x="52"
                y="38"
                width="14"
                height="32"
                rx="6"
                fill="#0284c7"
                stroke="#0369a1"
                strokeWidth="2"
              />
              {/* Valve regulator pernapasan */}
              <circle cx="41" cy="36" r="3.5" fill="#e2e8f0" stroke="#64748b" strokeWidth="1.5" />
              <circle cx="59" cy="36" r="3.5" fill="#e2e8f0" stroke="#64748b" strokeWidth="1.5" />
              {/* Selang oksigen fleksibel ke masker */}
              <path
                d="M 59 36 Q 72 45 68 56"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* KAKI KIRI & SEPATU BOT GUNUNG (BERJALAN BERGANTIAN) */}
          <g
            className={isWalking ? 'animate-rescuer-leg-left' : ''}
            style={{ transformOrigin: '38% 78%' }}
          >
            {/* Celana kargo taktis */}
            <path
              d="M 33 76 L 31 100 L 45 100 L 45 76 Z"
              fill="#365314"
              stroke="#1a2e05"
              strokeWidth="1.5"
            />
            {/* Kantong kargo celana */}
            <rect x="30" y="82" width="10" height="9" rx="2" fill="#2d4a0e" />
            {/* Sepatu bot gunung tebal */}
            <path
              d="M 28 98 L 46 98 L 47 108 L 26 108 Z"
              fill="#451a03"
              stroke="#290f02"
              strokeWidth="2"
            />
            <rect x="25" y="105" width="23" height="4" rx="2" fill="#1c0a00" />
          </g>

          {/* KAKI KANAN & SEPATU BOT GUNUNG */}
          <g
            className={isWalking ? 'animate-rescuer-leg-right' : ''}
            style={{ transformOrigin: '62% 78%' }}
          >
            <path
              d="M 55 76 L 55 100 L 69 100 L 67 76 Z"
              fill="#365314"
              stroke="#1a2e05"
              strokeWidth="1.5"
            />
            <rect x="60" y="82" width="10" height="9" rx="2" fill="#2d4a0e" />
            <path
              d="M 54 98 L 72 98 L 74 108 L 53 108 Z"
              fill="#451a03"
              stroke="#290f02"
              strokeWidth="2"
            />
            <rect x="52" y="105" width="23" height="4" rx="2" fill="#1c0a00" />
          </g>

          {/* BADAN & ROMPI RESCUE RANGER */}
          <g id="torso">
            {/* Kemeja lapangan */}
            <path
              d="M 28 42 L 72 42 L 68 78 L 32 78 Z"
              fill="url(#ranger-suit)"
              stroke="#1a2e05"
              strokeWidth="1.5"
            />

            {/* Rompi Safety Oranye Terang (High-Vis Vest) */}
            <path
              d="M 31 43 L 69 43 L 66 76 L 34 76 Z"
              fill="url(#safety-vest)"
              stroke="#c2410c"
              strokeWidth="1.5"
            />

            {/* Pita Reflektif Silver pada rompi */}
            <rect x="33" y="52" width="34" height="4" fill="#f8fafc" opacity="0.9" />
            <rect x="34" y="66" width="32" height="4" fill="#f8fafc" opacity="0.9" />

            {/* Sabuk Perlengkapan Taktis dengan Gesper Emas */}
            <rect x="31" y="74" width="38" height="6" fill="#1c1917" />
            <rect x="46" y="73" width="8" height="8" rx="1.5" fill="#facc15" stroke="#713f12" strokeWidth="1" />

            {/* Lencana Lambang Ranger / H.O.M.E. di dada */}
            <circle cx="40" cy="50" r="3.5" fill="#15803d" stroke="#fef08a" strokeWidth="1" />
            <path d="M 39 49 L 41 50 L 40 52 Z" fill="#ffffff" />
          </g>

          {/* TANGAN KIRI (MENGAYUN) */}
          <g
            className={isWalking ? 'animate-rescuer-arm-left' : ''}
            style={{ transformOrigin: '28% 44%' }}
          >
            <path
              d="M 29 44 L 20 62 L 25 64 L 33 46 Z"
              fill="#4d7c0f"
              stroke="#1a2e05"
              strokeWidth="1.2"
            />
            {/* Sarung tangan kerja pelindung panas */}
            <circle cx="19" cy="65" r="5" fill="#78350f" stroke="#451a03" strokeWidth="1" />
          </g>

          {/* TANGAN KANAN (MEMEGANG SENTER / DETEKTOR) */}
          <g
            className={isWalking ? 'animate-rescuer-arm-right' : ''}
            style={{ transformOrigin: '72% 44%' }}
          >
            <path
              d="M 71 44 L 79 62 L 74 64 L 67 46 Z"
              fill="#4d7c0f"
              stroke="#1a2e05"
              strokeWidth="1.2"
            />
            <circle cx="81" cy="65" r="5" fill="#78350f" stroke="#451a03" strokeWidth="1" />
            {/* Alat pemindai radar genggam / walkie-talkie */}
            <rect x="79" y="58" width="6" height="12" rx="2" fill="#1e293b" />
            <line x1="82" y1="58" x2="82" y2="52" stroke="#64748b" strokeWidth="1.5" />
            <circle cx="82" cy="52" r="1.5" fill="#ef4444" className="animate-pulse" />
          </g>

          {/* SATWA YANG SEDANG DIGENDONG & DISELAMATKAN */}
          {carriedAnimal && (
            <g id="carried-animal-in-sling" className="animate-pulse">
              {/* Kain Gendongan Rescue di dada */}
              <path
                d="M 34 50 Q 50 64 66 50 L 63 68 Q 50 78 37 68 Z"
                fill="#0284c7"
                stroke="#0369a1"
                strokeWidth="1.5"
                opacity="0.9"
              />
              {/* Kepala Satwa Muncul Selamat */}
              <circle cx="50" cy="55" r="11" fill="#fff" opacity="0.9" />
              <text
                x="50"
                y="60"
                textAnchor="middle"
                fontSize="15"
                fontFamily="sans-serif"
                style={{ filter: 'none' }}
              >
                {carriedAnimal.emoji || '🦧'}
              </text>
              {/* Ikon Hati Penyelamatan */}
              <text x="64" y="48" fontSize="11">
                ❤️
              </text>
            </g>
          )}

          {/* LEHER & KEPALA RANGER */}
          <g id="head">
            {/* Leher */}
            <rect x="45" y="35" width="10" height="9" fill="url(#skin-grad)" />

            {/* Wajah / Kepala */}
            <circle cx="50" cy="27" r="14" fill="url(#skin-grad)" stroke="#d97706" strokeWidth="1" />

            {/* Jika Menghadap Depan (Down) atau Samping: Gambar Masker Respirator Asap */}
            {!isUp && (
              <g id="respirator-mask">
                {/* Masker N95 / Respirator Gas Asap Karhutla */}
                <path
                  d="M 42 27 Q 50 36 58 27 L 57 36 Q 50 40 43 36 Z"
                  fill="#f1f5f9"
                  stroke="#64748b"
                  strokeWidth="1.5"
                />
                {/* Filter Cartridge Respirator Kiri-Kanan */}
                <circle cx="43" cy="32" r="3.5" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
                <circle cx="57" cy="32" r="3.5" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
                {/* Tali masker */}
                <line x1="39" y1="28" x2="43" y2="32" stroke="#64748b" strokeWidth="1.5" />
                <line x1="61" y1="28" x2="57" y2="32" stroke="#64748b" strokeWidth="1.5" />

                {/* Mata Penyelamat Fokus (Kacamata Safety Goggles Bening) */}
                <rect x="41" y="20" width="18" height="7" rx="3.5" fill="#bae6fd" opacity="0.8" stroke="#0284c7" strokeWidth="1" />
                <circle cx="46" cy="23.5" r="1.8" fill="#1e293b" />
                <circle cx="54" cy="23.5" r="1.8" fill="#1e293b" />
              </g>
            )}

            {/* HELM SAFETY RANGER LAPANGAN */}
            <g id="safety-helmet">
              {/* Batok Helm Keras */}
              <path
                d="M 33 24 Q 50 6 67 24 Z"
                fill="url(#helmet-grad)"
                stroke="#a16207"
                strokeWidth="1.8"
              />
              {/* Bibir/Pet Helm */}
              <ellipse cx="50" cy="24" rx="19" ry="4" fill="#eab308" stroke="#a16207" strokeWidth="1.5" />

              {/* Senter Kepala (Headlamp) di dahi helm */}
              <rect x="46" y="16" width="8" height="6" rx="2" fill="#334155" />
              <circle cx="50" cy="19" r="3" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
              {/* Titik pendar lampu led senter */}
              <circle cx="50" cy="19" r="1.5" fill="#ffffff" className="animate-ping" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
