# AetherWave — Radio Online Global Berbasis Dynamic Glassmorphism

Aplikasi pemutar radio online lintas negara bergaya Android modern dengan antarmuka **Dynamic Glassmorphism** yang secara otomatis mengekstrak dan menyesuaikan warna atmosfer kaca buram berdasarkan sampul dan identitas stasiun radio yang sedang diputar.

## User Review & Critical Decisions

> [!IMPORTANT]
> Berikut adalah rangkuman keputusan fitur dan desain yang telah dikonfirmasi dari preferensi Anda sebelum pembangunan aplikasi dimulai:

- **Mode Eksplorasi Utama**: Kombinasi **Peta Dunia Interaktif** (titik koordinat negara & kota dengan jumlah stasiun aktif) dan **Direktori Negara & Genre** yang dapat difilter secara instan.
- **Fitur Pemutar Lengkap**:
  - **Favorit, Riwayat Putar, & Sleep Timer** (penghitung waktu mundur otomatis menghentikan streaming).
  - **Visualizer Audio Real-Time & Equalizer Multi-Band** (5-band EQ kustom + preset seperti Bass Boost, Vocal, Jazz, Rock, Flat).
  - **Perekam Siaran Langsung & Alarm Radio** (merekam potongan audio siaran ke file lokal yang dapat diunduh serta penjadwal waktu bangun dengan stasiun pilihan).
  - **Mode Hemat Data & Pemilih Kualitas Bitrate** (filter dan sakelar otomatis untuk memilih aliran bitrate rendah $\le 64\text{ kbps}$ atau kualitas tinggi $\ge 128\text{ kbps}$).
- **Identitas Visual**: **Dynamic Glassmorphism** — permukaan kaca translusen (`backdrop-blur-xl`) dengan pencahayaan latar (*ambient mesh glow*) yang berubah secara dinamis mengikuti palet warna dominan dari sampul/ikon stasiun radio aktif.

---

## 1. Overview & Core Concept

- **What It Does**: Menghubungkan pendengar ke ribuan stasiun radio langsung dari seluruh dunia menggunakan integrasi langsung **Radio Browser API** (direktori radio open-source global terbesar) dilengkapi stasiun kurasi unggulan dari Indonesia, Jepang, Inggris, Amerika Serikat, Korea Selatan, Prancis, Jerman, Brasil, Arab Saudi, dan Australia agar langsung siap diputar tanpa jeda.
- **Target Audience / Persona**: Pecinta musik global, pelancong virtual, pelajar bahasa asing, dan diaspora yang menginginkan pengalaman mendengarkan radio dunia dengan estetika seluler premium dan kontrol audio tingkat lanjut.
- **Key Value**: Menggabungkan penjelajahan geografis interaktif, kontrol audio kelas studio (EQ + Visualizer + Perekam), dan efisiensi kuota data dalam satu antarmuka sentuh yang responsif di layar ponsel maupun layar penuh desktop.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Eksplorasi Peta Dunia & Negara**: Pengguna membuka tab *Jelajah Dunia*, mengetuk negara pada peta dunia interaktif (atau memilih dari daftar negara berbenderakan dan pencarian cepat), lalu melihat daftar stasiun radio populer dan berkualitas di negara tersebut.
2. **Pemutaran & Dynamic Glass Adaptation**: Saat stasiun dipilih, pemutar langsung mengalirkan audio, mengekstrak palet warna dari logo stasiun, dan mentransisikan latar belakang kaca buram serta *waveform visualizer* ke rona warna stasiun tersebut.
3. **Studio Audio (EQ, Visualizer, & Rekaman)**: Membuka laci atau panel *Studio Audio* untuk mengatur 5-band Equalizer, mengganti mode spektrum visualizer (Bar, Wave, Circular Orb), atau menekan tombol *Rekam Siaran* untuk menyimpan klip audio langsung ke daftar rekaman.
4. **Utilitas Tidur, Alarm & Hemat Data**: Mengaktifkan *Sleep Timer* (15m, 30m, 45m, 60m) sebelum tidur, menyetel *Alarm Radio* pada jam tertentu agar berbunyi otomatis dengan stasiun pilihan, atau menyalakan *Mode Hemat Data* untuk memprioritaskan aliran audio hemat kuota.

### Visual Identity & Theme
- **Aesthetic Direction**: *Tactile Dynamic Glassmorphism* — memadukan kedalaman kaca berlapis (`backdrop-blur-2xl`), batas kilau halus (`1px solid rgba(255,255,255,0.14)`), dan pendaran warna dinamis dari sampul stasiun di atas kanvas gelap pekat (`#090D16`) agar teks tetap memiliki kontras tinggi (WCAG AA).
- **Color Palette & Mood**:
  - `--background`: `#090D16` (Deep Obsidian Night sebagai kanvas dasar 60%).
  - `--surface-glass`: `rgba(255, 255, 255, 0.07)` hingga `rgba(255, 255, 255, 0.12)` dengan `backdrop-filter: blur(24px)` (30% permukaan struktural).
  - `--dynamic-primary` & `--dynamic-accent`: Diekstrak secara real-time dari logo stasiun aktif (default: `#38BDF8` Sky Cyan & `#818CF8` Indigo Glow untuk 10% aksen interaktif).
- **Typography & Hierarchy**:
  - *Display /Judul*: `Plus Jakarta Sans` (SemiBold/Bold) untuk nama stasiun, tajuk negara, dan navigasi utama.
  - *Body Prose*: `DM Sans` untuk informasi program, negara, dan genre.
  - *Data & Telemetry*: `JetBrains Mono` dengan `tabular-nums` untuk frekuensi, bitrate (`128 kbps`), durasi rekaman (`02:45`), timer mundur, dan jam lokal negara stasiun.
- **Component Styling & Ergonomic Layout**:
  - Dirancang dengan prinsip *Mobile & Touch-First* (target sentuh minimum $44 \times 44\text{px}$, navigasi ibu jari di bagian bawah pada layar mobile $375\text{px}$–$430\text{px}$) sekaligus beradaptasi menjadi tata letak multi-kolom penuh (`max-w-7xl` dengan 3 panel berdampingan: Navigasi/Negara, Peta & Daftar Stasiun, serta Panel Studio Pemutar Aktif) pada layar desktop $1440\text{px}$.
  - Metadata stasiun (Negara · Kota · Genre · Bitrate) ditampilkan sebagai teks bersih dengan pemisah tipografi `·` tanpa kotak kapsul yang berlebihan (*Zero-Pill Metadata Discipline*).

### Interactive Feedback & Motion
- Transisi halus $\le 200\text{ms}$ (`cubic-bezier(0.16, 1, 0.3, 1)`) pada seluruh tombol kontrol dan perpindahan tab.
- Visualizer kanvas 60fps yang merespons frekuensi audio nyata atau simulasi gelombang akustik sinkron saat kebijakan CORS streaming eksternal membatasi inspeksi byte mentah.
- Penanganan status pemuatan (*buffering*), pemulihan otomatis ke server cadangan bila stream radio sedang *offline*, dan indikator visual yang jelas untuk perekaman aktif serta timer tidur.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Sumber Data Stasiun Radio Global**
  - *Chosen Approach*: Integrasi langsung ke **Radio Browser API** (`all.api.radio-browser.info` / `de1.api.radio-browser.info`) dikombinasikan dengan katalog stasiun kurasi terverifikasi per negara sebagai *instant fallback*.
  - *Why*: Memberikan akses ke lebih dari 30.000 stasiun radio asli di seluruh dunia berdasarkan kode negara (`countrycode`), tag, dan bitrate, sambil menjamin aplikasi tetap responsif dan langsung berbunyi meskipun salah satu server direktori publik sedang lambat.
- **Decision 2: Pemrosesan Audio, Visualizer & Perekam Siaran**
  - *Chosen Approach*: Menggunakan HTML5 `Audio` + **Web Audio API** (`AudioContext`, `AnalyserNode`, dan 5-band `BiquadFilterNode`) serta `MediaRecorder` / tangkapan stream langsung dengan mekanisme *graceful fallback* untuk stream radio yang tidak mengirimkan header CORS.
  - *Why*: Banyak server Icecast/Shoutcast radio dunia tidak menyertakan header `Access-Control-Allow-Origin`. Dengan deteksi CORS otomatis dan rute proxy streaming ringan di sisi server bila diperlukan, audio tetap terdengar jernih tanpa terblokir oleh pembatasan browser.
- **Decision 3: Ekstraksi Warna Dynamic Glassmorphism**
  - *Chosen Approach*: Ekstraksi warna dominan kanvas HTML5 dari ikon stasiun dengan generator palet harmonis berbasis identitas stasiun/negara apabila ikon gagal dimuat.
  - *Why*: Menjamin setiap perpindahan stasiun menghasilkan perubahan atmosfer warna kaca yang kaya, lembut, dan selalu menjaga keterbacaan teks putih di atasnya.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AETHERWAVE DYNAMIC GLASS SHELL                       │
│   (Dynamic Ambient Color Engine + Responsive Mobile/Desktop Layout)     │
└───────────────┬─────────────────────────────────────────┬───────────────┘
                │                                         │
                ▼                                         ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────┐
│     EXPLORATION & DISCOVERY VIEWS     │ │   ACTIVE PLAYER & AUDIO STUDIO│
│                                       │ │                               │
│ ┌───────────────────────────────────┐ │ │ ┌───────────────────────────┐ │
│ │ Interactive World Map Explorer    │ │ │ │ Dynamic Glass Player Deck │ │
│ │ (Country Pins, Region Zoom,       │ │ │ │ (Artwork, Metadata,       │ │
│ │  Live Local Time & Station Count) │ │ │ │  Play/Pause/Skip, Bitrate)│ │
│ └─────────────────┬─────────────────┘ │ │ └─────────────┬─────────────┘ │
│                   ▼                   │ │               ▼               │
│ ┌───────────────────────────────────┐ │ │ ┌───────────────────────────┐ │
│ │ Country, Genre & Bitrate Filter   │ │ │ │ Real-Time Audio Visualizer│ │
│ │ (Search, Data-Saver Toggle,       │ │ │ │ & 5-Band Equalizer Studio │ │
│ │  Sort by Popularity / Bitrate)    │ │ │ └─────────────┬─────────────┘ │
│ └─────────────────┬─────────────────┘ │ │               ▼               │
│                   ▼                   │ │ ┌───────────────────────────┐ │
│ ┌───────────────────────────────────┐ │ │ │ Utilities & Library Drawer│ │
│ │ Station Tap List & Quick Actions  │ │ │ │ • Live Stream Recorder    │ │
│ │ (Play, Favorite, Bitrate Info)    │ │ │ │ • Sleep Timer & Alarm     │ │
│ └───────────────────────────────────┘ │ │ │ • Favorites & History     │ │
└───────────────────┬───────────────────┘ └───────────────┬───────────────┘
                    │                                     │
                    └──────────────────┬──────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   AUDIO, STREAMING & PERSISTENCE LAYER                  │
│  • Radio Browser API Client + Verified Global Curated Stations          │
│  • HTML5 Audio + Web Audio API (AnalyserNode + 5x BiquadFilterNode)     │
│  • Stream Recorder Engine (Blob Capture & Downloadable Audio Clips)     │
│  • LocalStorage Sync (Favorites, Play History, Saved Recordings, Alarms)│
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State
- **Station**: `stationuuid`, `name`, `url_resolved`, `favicon`, `country`, `countrycode`, `state`, `language`, `tags`, `bitrate`, `codec`, `votes`, `lat`, `lng`, `themeColor`.
- **AudioStudioState**:
  - `isPlaying`, `isBuffering`, `volume`, `isMuted`
  - `dataSaverMode` (boolean — memfilter/memilih stream $\le 64\text{ kbps}$)
  - `preferredBitrate` (`'all' | 'low' | 'medium' | 'high'`)
  - `eqBands` (`[60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz]` dalam rentang `-12dB` hingga `+12dB`) & `eqPreset`
  - `visualizerMode` (`'bars' | 'wave' | 'orb'`)
- **Timers & Recording State**:
  - `sleepTimerRemaining` (detik mundur aktif)
  - `alarms` (daftar jadwal jam `HH:MM`, `stationId`, `enabled`, `days`)
  - `activeRecording` (status perekaman, durasi berjalan, dan daftar klip rekaman tersimpan beserta tautan unduh `.webm`/`.mp3`)

### Interactive Component & State Mapping
- **Peta Dunia Interaktif & Pemilih Negara**: Mengetuk titik negara di peta atau memilih negara di bilah filter langsung memperbarui state `selectedCountry`, menampilkan waktu lokal negara tersebut, dan memuat daftar stasiun radio dari negara terpilih.
- **Mode Hemat Data & Filter Bitrate**: Mengaktifkan sakelar *Hemat Data* secara instan menyaring daftar stasiun ke aliran ber-bitrate rendah dan memberikan indikator penghematan kuota per jam (misal: `~28 MB/jam` vs `~90 MB/jam`).
- **Equalizer 5-Band & Preset**: Menggeser slider frekuensi (`60Hz` s/d `14kHz`) atau memilih preset langsung mengubah nilai `gain.value` pada `BiquadFilterNode` secara real-time.
- **Perekam Siaran & Sleep Timer**: Menekan *Mulai Rekam* menangkap aliran audio ke memori dan menyimpannya ke tab *Rekaman Saya* lengkap dengan pemutar ulang dan tombol unduh; menyetel *Sleep Timer* menjalankan penghitung mundur per detik yang secara otomatis menghentikan pemutar saat mencapai `00:00`.
