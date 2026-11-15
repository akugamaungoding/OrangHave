/**
 * Pengetahuan NISAR/SAR yang diambil dari dokumen hasil scraping di ml/source/*.md.
 *
 * - Daftar sumber (judul, URL, prioritas) dibaca langsung dari file markdown saat build,
 *   jadi menambah/mengubah file di ml/source otomatis memperbarui daftar sumber di aplikasi.
 * - Setiap fakta menyimpan `quote`: potongan teks asli dari file sumbernya. Di mode dev,
 *   kutipan yang tidak ditemukan di file akan memunculkan peringatan di console agar
 *   teks di peta/game tidak melenceng dari data scraping.
 */

const RAW_SOURCES = import.meta.glob('../ml/source/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const fileName = (path) => path.split('/').pop();

function parseSource(path, raw) {
  const title = (raw.match(/^#\s+(.+)$/m) || [])[1]?.trim() || fileName(path);
  const url = (raw.match(/\*\*Source URL:\*\*\s*(\S+)/) || [])[1] || '';
  const priority = (raw.match(/\*\*Priority for OrangHave \/ H\.O\.M\.E\.:\*\*\s*(\S+)/) || [])[1] || '';
  return { file: fileName(path), title, url, priority };
}

/** Semua dokumen sumber di ml/source (kecuali README), urut sesuai nomor file. */
export const ML_SOURCES = Object.entries(RAW_SOURCES)
  .filter(([path]) => !/README\.md$/i.test(path))
  .map(([path, raw]) => parseSource(path, raw))
  .sort((a, b) => a.file.localeCompare(b.file));

/** Sumber berprioritas "Utama" (inti tema Dancing with the SARs). */
export const ML_PRIMARY_SOURCES = ML_SOURCES.filter((s) => s.priority === 'Utama');

const rawByFile = Object.fromEntries(
  Object.entries(RAW_SOURCES).map(([path, raw]) => [fileName(path), raw]),
);

export const NISAR_FACTS = {
  lband: {
    file: '03-nisar-data-user-guide.md',
    quote: 'operates at a wavelength of 24 cm',
    id: 'Radar L-band NISAR bekerja pada panjang gelombang 24 cm.',
    en: "NISAR's L-band radar operates at a wavelength of 24 cm.",
  },
  allWeather: {
    file: '03-nisar-data-user-guide.md',
    quote: 'regardless of light or cloud conditions',
    id: 'Radar dua-band NISAR memotret permukaan Bumi tanpa bergantung pada cahaya atau awan.',
    en: "NISAR's dual-band radar images Earth's surface regardless of light or cloud conditions.",
  },
  canopy: {
    file: '05-intro-to-sar.md',
    quote: 'penetrate more deeply through a tree canopy',
    id: 'Sinyal L-band menembus kanopi lebih dalam dan berinteraksi dengan cabang besar serta batang pohon — bukan hanya daun di pucuk.',
    en: 'An L-band signal penetrates more deeply through a tree canopy, interacting with large branches and trunks — not just the top leaves.',
  },
  cloudsCanopy: {
    file: '05-intro-to-sar.md',
    quote: 'covered with clouds or under a dense canopy of trees',
    id: 'Gelombang radar (skala sentimeter–meter) tetap bisa memetakan daratan yang tertutup awan atau kanopi pohon yang rapat.',
    en: 'Radar wavelengths (centimetres to metres) can image land covered with clouds or under a dense canopy of trees.',
  },
  volume: {
    file: '05-intro-to-sar.md',
    quote: 'Volume scattering caused by the leaves and branches in a forest canopy is most sensitive to cross-polarized data',
    id: 'Hamburan volume dari daun dan cabang kanopi paling peka di polarisasi silang (HV/VH) — sinyal inilah yang berubah ketika kanopi hangus.',
    en: 'Volume scattering from leaves and branches is most sensitive to cross-polarized data (HV/VH) — the signal that changes when a canopy burns.',
  },
  gcov: {
    file: '03-nisar-data-user-guide.md',
    quote: 'biomass estimation, soil moisture estimation, disturbance detection',
    id: 'Produk GCOV NISAR dirancang untuk estimasi biomassa, kelembapan tanah, dan deteksi gangguan hutan.',
    en: "NISAR's GCOV product supports biomass estimation, soil moisture estimation, and disturbance detection.",
  },
  swath: {
    file: '03-nisar-data-user-guide.md',
    quote: 'swath width of about 240 km',
    id: 'Satu sapuan L-band NISAR selebar sekitar 240 km.',
    en: 'Most NISAR L-band acquisitions have a swath width of about 240 km.',
  },
  openData: {
    file: '03-nisar-data-user-guide.md',
    quote: 'All NISAR science data is freely available and open to the public',
    id: 'Semua data sains NISAR gratis dan terbuka untuk publik.',
    en: 'All NISAR science data is freely available and open to the public.',
  },
  validated: {
    file: '03-nisar-data-user-guide.md',
    quote: 'Validated NISAR Level 0-2 products were released on November 6, 2026',
    id: 'Produk NISAR L-band level 0–2 yang tervalidasi dirilis 6 November 2026.',
    en: 'Validated NISAR L-band Level 0–2 products were released on November 6, 2026.',
  },
  arsetFire: {
    file: '06-nasa-arset-trainings.md',
    quote: 'Post-fire burn severity mapping',
    id: 'NASA ARSET memberi pelatihan gratis untuk deteksi api & asap aktif hingga pemetaan tingkat keparahan bekas terbakar.',
    en: 'NASA ARSET offers free training from active fire and smoke detection to post-fire burn severity mapping.',
  },
};

/** Ambil fakta dalam bahasa aktif + sumbernya. */
export function getFact(key, isId = true) {
  const fact = NISAR_FACTS[key];
  if (!fact) return null;
  const source = ML_SOURCES.find((s) => s.file === fact.file) || null;
  return { text: isId ? fact.id : fact.en, source, file: fact.file };
}

// Jaga agar setiap fakta benar-benar berasal dari dokumen scraping
if (import.meta.env.DEV) {
  Object.entries(NISAR_FACTS).forEach(([key, fact]) => {
    const raw = rawByFile[fact.file];
    if (!raw) {
      console.warn(`[nisarKnowledge] Sumber "${fact.file}" untuk fakta "${key}" tidak ada di ml/source.`);
    } else if (!raw.replace(/\s+/g, ' ').includes(fact.quote)) {
      console.warn(`[nisarKnowledge] Kutipan fakta "${key}" tidak ditemukan di ${fact.file}.`);
    }
  });
}
