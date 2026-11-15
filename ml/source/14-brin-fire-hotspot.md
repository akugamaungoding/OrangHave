# BRIN Fire Hotspot

- **Source URL:** https://hotspot.brin.go.id/
- **Priority for OrangHave / H.O.M.E.:** Utama
- **Relevance:** Sistem pemantauan titik panas nasional BRIN (VIIRS/MODIS) — rujukan nasional untuk validasi silang titik api FIRMS yang ditampilkan H.O.M.E.
- **Extracted:** 2026-11-15 ±15:00 WIB (tampilan "Last 24H", wilayah Indonesia)

## Ringkasan

Peta web "BRIN Fire Hotspot" menampilkan titik panas (hotspot) di Indonesia dari satelit VIIRS dan MODIS, dengan filter waktu (Last 24H), tingkat kepercayaan (ikon merah / kuning / hijau), mode cluster, dan unduhan. Panduan resmi: "Panduan LAPAN Fire Hotspot v2.0 (Juli 2020)" — https://hotspot.brin.go.id/guide/Panduan%20Website%20LAPAN%20Fire%20Hotspot%20v2.0%20(Juli%202020).pdf

## Snapshot saat diakses (Last 24H, Indonesia)

```
Total Hotspot
365
 6
 350
 9
MODIS
0
VIIRS
365
```

- Total Hotspot 365 dalam 24 jam terakhir; seluruhnya dari VIIRS (MODIS 0).
- Tiga angka per kelas kepercayaan: 6 · 350 · 9 (ikon legenda: merah, kuning, hijau).

## Format data (endpoint publik yang dipakai peta)

`GET https://hotspot.brin.go.id/getHS?class=hotspot&conf_lvl=low&mode=cluster&time=last24h&loc={"stt":"Indonesia","disp":"Indonesia"}` mengembalikan GeoJSON `FeatureCollection`. Contoh satu fitur:

```json
{"id": 4900397, "type": "Feature",
 "geometry": {"type": "Point", "coordinates": [115.21156311, -8.71830463]},
 "properties": {"c": 8, "r": 1125, "s": "noaa20"}}
```

- `s` = satelit (contoh: `noaa20` = NOAA-20 VIIRS).
- `c` = kode kelas (nilai 8 paling banyak dan sejalan dengan kelas 350 di atas — kemungkinan kelas kepercayaan menengah; belum dikonfirmasi dari dokumentasi).
- `r` = atribut numerik (makna belum dikonfirmasi dari dokumentasi).

## Relevansi untuk H.O.M.E. (karhutla)

- H.O.M.E. saat ini menampilkan deteksi NASA FIRMS (VIIRS 375 m) + arsip multi-pulau. BRIN Fire Hotspot adalah **sumber nasional** dengan sensor yang sama (VIIRS NOAA-20) sehingga cocok untuk **validasi silang** titik api di Kalimantan & Sumatra.
- "Titik panas" adalah anomali termal, bukan otomatis kebakaran hutan — sama dengan catatan di `ml-scores.json` H.O.M.E.
- Endpoint `getHS` berpotensi diintegrasikan sebagai lapisan data kedua (perlu cek CORS & izin penggunaan).
