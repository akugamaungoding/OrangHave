# Katalog Inderaja — Pusdatin BRIN

- **Source URL:** https://inderaja-catalog.brin.go.id/
- **Priority for OrangHave / H.O.M.E.:** Utama
- **Relevance:** Katalog nasional citra satelit optik & radar SAR (Sentinel-1, ALOS PALSAR, TerraSAR-X) milik Pusdatin BRIN — sumber resmi untuk memperluas lensa radar H.O.M.E. di lahan gambut.
- **Extracted:** 2026-11-15

## Ringkasan

Katalog Inderaja adalah sebuah katalog data penginderaan jauh yang telah terintegrasi dengan data citra satelit penginderaan jauh berbagai resolusi, digunakan untuk pengecekan ketersediaan data satelit penginderaan jauh Pusdatin-BRIN. Menyediakan data penginderaan jauh berlisensi Pemerintah Indonesia bagi seluruh Kementerian/Lembaga, TNI, POLRI, dan Pemerintah Daerah.

## Jenis data yang tersedia

- **Citra Satelit Resolusi Rendah:** Aqua-modis 1B, Terra-modis 1B, NPP-VIIRS, Himawari-8, NOAA-19, NOAA-20
- **Citra Satelit Resolusi Menengah:** Landsat 5, Landsat 7, Landsat 8, Landsat 9, SPOT 2, SPOT 4, Sentinel-2
- **Citra Satelit Resolusi Tinggi (CSRT):** SPOT 5, SPOT 6, SPOT 7, ALOS, RapidEye, IKONOS
- **Citra Satelit Resolusi Sangat Tinggi (CSRST):** Pleiades, GeoEye, QuickBird, WorldView
- **Data Satelit Radar:** TerraSAR-X, Sentinel-1, ALOS PALSAR
- **Data Mosaik:** Mosaik Landsat, Mosaik SPOT, Mosaik Planetscope, Mosaik Pleiades

Katalog juga menautkan **BRIN FIRE HOTSPOT**: "Akses mudah ke data satelit resolusi rendah untuk monitoring lingkungan, cuaca, dan perubahan global. Sistem ini menyediakan data MODIS dan satelit sejenis untuk analisis skala besar."

## Pertanyaan umum (FAQ)

- **Apakah semua produk citra satelit penginderaan jauh terbuka untuk umum?** Citra satelit resolusi rendah dan menengah dapat diperoleh oleh pengguna secara bebas. Sementara untuk citra satelit resolusi tinggi (CSRT) dan sangat tinggi (CSRST) pengguna harus melengkapi persyaratan yang sudah ditentukan.
- **Apakah Perguruan Tinggi/Mahasiswa bisa melakukan permintaan data?** Perguruan tinggi dibolehkan melakukan permintaan data citra satelit dengan syarat tambahan yaitu bersedia memberikan hasil penelitiannya berupa hardcopy dan/atau softcopy kepada Pusdatin.
- **Peta dasar:** Open Street Map, World Imagery, World Street, dan Hybrid.
- Akses katalog: https://inderaja-catalog.brin.go.id/DD4/

Kontak: Badan Riset dan Inovasi Nasional · ppid@brin.go.id · Gedung B.J. Habibie, Jl. M.H. Thamrin No. 8, Jakarta Pusat 10340

## Relevansi untuk H.O.M.E. (karhutla)

- **ALOS PALSAR (L-band)** dan **Sentinel-1 (C-band)** di katalog ini adalah dua pita radar yang dibandingkan H.O.M.E. (L-band vs C-band) untuk membaca kanopi di balik awan.
- **NPP-VIIRS / NOAA-20 / Himawari-8** adalah sensor termal yang sama dengan sumber titik panas karhutla.
- Landsat 8/9 & Sentinel-2 (resolusi menengah, terbuka bebas) dapat dipakai untuk mengganti tabel NDVI contoh di `ml/ndvi_samples.json` dengan statistik nyata.
