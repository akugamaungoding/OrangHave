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

/** Sumber berprioritas "Utama" (inti tema karhutla + radar SAR). */
export const ML_PRIMARY_SOURCES = ML_SOURCES.filter((s) => s.priority === 'Utama');

/** Riset & data nasional (ITENAS, BRIN) — file 12–17 di ml/source. */
export const ML_NATIONAL_SOURCES = ML_SOURCES.filter((s) => /^1[2-7]-/.test(s.file));

/** Ekosistem inovasi (BLOCK71, Innovation Factory, SKALA) — prioritas "Ekosistem". */
export const ML_ECOSYSTEM_SOURCES = ML_SOURCES.filter((s) => s.priority === 'Ekosistem');

/** Ambil satu sumber berdasarkan nama file. */
export const getSource = (file) => ML_SOURCES.find((s) => s.file === file) || null;

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

  /* ── Riset & data nasional (ditambahkan 2026-11-15) ── */
  itenasSar: {
    file: '13-itenas-eprints-geodesi.md',
    quote: 'X-, C-, and L-Band Polarimetric SAR Imaging',
    id: 'Teknik Geodesi ITENAS memodelkan hamburan radar SAR polarimetrik X-, C-, dan L-band untuk membaca kanopi perkebunan sawit (Darmawan dkk., 2014).',
    en: 'ITENAS Geodesy modelled X-, C-, and L-band polarimetric SAR scattering to read oil-palm canopies (Darmawan et al., 2014).',
  },
  itenasFusion: {
    file: '13-itenas-eprints-geodesi.md',
    quote: 'LANDSAT 8 AND ALOS PALSAR DATA',
    id: 'Riset ITENAS–BRIN menggabungkan citra optik Landsat 8 dengan radar L-band ALOS PALSAR untuk menduga biomassa (Winarso, Vetrita, Purwanto & Darmawan, 2015).',
    en: 'ITENAS–BRIN research fused Landsat 8 optical imagery with ALOS PALSAR L-band radar to estimate biomass (Winarso, Vetrita, Purwanto & Darmawan, 2015).',
  },
  itenasJournal: {
    file: '12-itenas-reka-geomatika.md',
    quote: 'survei dan pemetaan, sistem informasi geografis (SIG), pengindraan jauh',
    id: 'Jurnal Reka Geomatika ITENAS memuat riset pengindraan jauh, SIG, dan deteksi perubahan tutupan lahan berbasis Landsat.',
    en: "ITENAS' Reka Geomatika journal publishes remote sensing, GIS, and Landsat-based land-cover change research.",
  },
  brinHotspot: {
    file: '14-brin-fire-hotspot.md',
    quote: 'Total Hotspot 365 dalam 24 jam terakhir',
    id: 'BRIN Fire Hotspot mencatat 365 titik panas di Indonesia dalam 24 jam — seluruhnya dari VIIRS (snapshot 15 Nov 2026).',
    en: 'BRIN Fire Hotspot recorded 365 hotspots across Indonesia in 24 hours — all from VIIRS (snapshot 15 Nov 2026).',
  },
  brinRadarCatalog: {
    file: '15-brin-katalog-inderaja.md',
    quote: 'TerraSAR-X, Sentinel-1, ALOS PALSAR',
    id: 'Katalog Inderaja BRIN menyediakan data radar TerraSAR-X, Sentinel-1, dan ALOS PALSAR, plus VIIRS, MODIS, dan Himawari-8.',
    en: "BRIN's Inderaja catalogue holds TerraSAR-X, Sentinel-1, and ALOS PALSAR radar data, plus VIIRS, MODIS, and Himawari-8.",
  },
  brinOpenData: {
    file: '15-brin-katalog-inderaja.md',
    quote: 'Citra satelit resolusi rendah dan menengah dapat diperoleh oleh pengguna secara bebas',
    id: 'Citra satelit resolusi rendah dan menengah di BRIN dapat diperoleh secara bebas — cukup untuk mengganti tabel NDVI contoh dengan statistik nyata.',
    en: "Low- and medium-resolution imagery from BRIN is freely available — enough to replace the sample NDVI table with real statistics.",
  },
  spbnHotspot: {
    file: '16-brin-spbn.md',
    quote: 'Titik Panas (Hotspot)',
    id: 'SPBN BRIN memasukkan Titik Panas (Hotspot) ke kategori Peringatan Dini Bencana — karhutla diperlakukan sebagai bencana yang bisa diantisipasi.',
    en: "BRIN's SPBN lists Hotspots under Disaster Early Warning — wildfire treated as a disaster that can be anticipated.",
  },
  rinLulc: {
    file: '17-brin-rin-dataverse.md',
    quote: 'The 2016 map specifically captures major changes following the 2014–2015 fire events',
    id: 'Dataset BRIN memetakan tutupan lahan gambut Kapuas-Barito (Kalteng) 1990–2022 pada 30 m; peta 2016 merekam perubahan besar setelah kebakaran 2014–2015.',
    en: 'A BRIN dataset maps land cover across the Kapuas-Barito peatland (Central Kalimantan) 1990–2022 at 30 m; the 2016 map captures major changes after the 2014–2015 fires.',
  },
  block71: {
    file: '18-block71-indonesia.md',
    quote: "run with the Salim Group's Innovation Factory",
    id: 'BLOCK71 telah mendukung 1.600+ startup sejak 2011; di Indonesia (Jakarta, Bandung, Yogyakarta) dijalankan bersama Innovation Factory.',
    en: 'BLOCK71 has supported 1,600+ startups since 2011; in Indonesia (Jakarta, Bandung, Yogyakarta) it is run with Innovation Factory.',
  },
  innofactory: {
    file: '19-innovation-factory.md',
    quote: 'As the operator of BLOCK71 Indonesia',
    id: 'Innovation Factory — operator BLOCK71 Indonesia — menjalankan pilar Build, Access, Sustain dengan 50+ mitra VC dan 200+ mitra korporasi & komunitas.',
    en: 'Innovation Factory — operator of BLOCK71 Indonesia — runs Build, Access, Sustain with 50+ VC partners and 200+ corporate & community partners.',
  },
  skala: {
    file: '20-skala-accelerator.md',
    quote: "Indonesia's first metrics-driven and growth-focused pre-seed accelerator program",
    id: 'SKALA adalah akselerator pre-seed berbasis metrik pertama di Indonesia (Innovation Factory): 1.500+ pendaftar, 50+ mentor.',
    en: "SKALA is Indonesia's first metrics-driven pre-seed accelerator (Innovation Factory): 1,500+ applications, 50+ mentors.",
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
