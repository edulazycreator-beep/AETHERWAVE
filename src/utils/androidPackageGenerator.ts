import { CURATED_STATIONS } from '../data/curatedStations';

/**
 * Generates a complete, self-contained portable Android HTML5 application file
 * that works directly on any Android phone browser or inside an Android WebView APK
 * (`app/src/main/assets/index.html`) without requiring an external web server.
 */
export function generateStandaloneAndroidHtml(): string {
  const stationsJson = JSON.stringify(
    CURATED_STATIONS.map((s) => ({
      id: s.stationuuid,
      name: s.name,
      url: s.url_resolved || s.url,
      fallback: s.FallbackUrl || 'https://ice1.somafm.com/groovesalad-128-mp3',
      country: s.country,
      code: s.countrycode,
      state: s.state,
      tags: s.tags,
      bitrate: s.bitrate,
      freq: s.frequency || '100.0 FM',
      color: s.themePalette?.hex || '#38BDF8',
      rgb: s.themePalette?.primary || [56, 189, 248],
    }))
  );

  return `<!doctype html>
<html lang="id" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="theme-color" content="#090D16" />
  <meta name="mobile-web-app-capable" content="yes" />
  <title>AetherWave — Global Glass Radio (Android Edition)</title>
  <style>
    :root {
      --primary: 56, 189, 248;
      --hex: #38BDF8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #090D16;
      color: #F8FAFC;
      min-height: 100vh;
      overflow-x: hidden;
      padding-bottom: 32px;
    }
    .aurora {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      background: radial-gradient(circle at 20% 15%, rgba(var(--primary), 0.28) 0%, transparent 55%),
                  radial-gradient(circle at 80% 75%, rgba(129, 140, 248, 0.2) 0%, transparent 55%);
      transition: background 0.6s ease;
    }
    .container { position: relative; z-index: 1; max-width: 540px; margin: 0 auto; padding: 16px; }
    .glass {
      background: linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 24px;
      padding: 18px;
      margin-bottom: 16px;
    }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .brand { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
    .player-top { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
    .art {
      width: 68px; height: 68px; border-radius: 20px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 20px;
      background: rgba(var(--primary), 0.32);
      border: 1px solid rgba(255,255,255,0.22);
      box-shadow: 0 8px 24px -4px rgba(var(--primary), 0.45);
      flex-shrink: 0;
    }
    .st-title { font-size: 18px; font-weight: 800; line-height: 1.25; }
    .st-meta { font-size: 12px; color: #94A3B8; margin-top: 4px; }
    canvas {
      width: 100%; height: 84px; border-radius: 16px;
      background: rgba(9, 13, 22, 0.65);
      border: 1px solid rgba(255,255,255,0.08);
      display: block; margin-bottom: 14px;
    }
    .controls { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 12px; }
    .btn {
      border: none; cursor: pointer; color: #fff;
      background: rgba(255,255,255,0.1); border-radius: 16px;
      min-width: 46px; min-height: 46px; font-weight: 700; font-size: 13px;
      display: inline-flex; align-items: center; justify-content: center; padding: 0 14px;
    }
    .btn-play {
      width: 60px; height: 60px; border-radius: 22px;
      background: var(--hex); color: #090D16; font-size: 15px; font-weight: 800;
      box-shadow: 0 8px 24px -4px rgba(var(--primary), 0.6);
    }
    .chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 10px; }
    .chip {
      border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.05);
      color: #CBD5E1; padding: 8px 14px; border-radius: 14px; font-size: 12px; font-weight: 600;
      white-space: nowrap; cursor: pointer;
    }
    .chip.active { background: rgba(var(--primary), 0.25); border-color: var(--hex); color: #fff; }
    .st-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 10px; border-bottom: 1px solid rgba(255,255,255,0.07);
      cursor: pointer; border-radius: 14px;
    }
    .st-row.active { background: rgba(255,255,255,0.09); }
    .row-info { min-width: 0; flex: 1; margin-right: 10px; }
    .row-name { font-size: 14px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .row-sub { font-size: 11px; color: #94A3B8; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="aurora"></div>
  <div class="container">
    <div class="header">
      <div class="brand">AetherWave Radio</div>
      <button class="btn" id="randomBtn">Acak Dunia</button>
    </div>

    <div class="glass">
      <div class="player-top">
        <div class="art" id="artBox">ID</div>
        <div>
          <div class="st-title" id="stName">Memuat Stasiun...</div>
          <div class="st-meta" id="stMeta">Indonesia · 102.2 FM · 128 kbps</div>
        </div>
      </div>
      <canvas id="vizCanvas" width="480" height="84"></canvas>
      <div class="controls">
        <button class="btn" id="prevBtn">Sebelumnya</button>
        <button class="btn btn-play" id="playBtn">PUTAR</button>
        <button class="btn" id="nextBtn">Berikutnya</button>
      </div>
    </div>

    <div class="glass">
      <div class="chips" id="countryBar"></div>
      <div id="stationList"></div>
    </div>
  </div>

  <audio id="audio" preload="none"></audio>
  <script>
    const STATIONS = ${stationsJson};
    let currentIdx = 0;
    let isPlaying = false;
    let selectedCountry = 'ALL';
    const audio = document.getElementById('audio');
    const playBtn = document.getElementById('playBtn');
    const stName = document.getElementById('stName');
    const stMeta = document.getElementById('stMeta');
    const artBox = document.getElementById('artBox');
    const countryBar = document.getElementById('countryBar');
    const stationList = document.getElementById('stationList');

    function updateTheme(st) {
      document.documentElement.style.setProperty('--primary', st.rgb.join(','));
      document.documentElement.style.setProperty('--hex', st.color);
      stName.textContent = st.name;
      stMeta.textContent = st.country + ' · ' + st.freq + ' · ' + st.bitrate + ' kbps · ' + st.tags;
      artBox.textContent = st.code;
      renderList();
    }

    function playStation(idx) {
      currentIdx = idx;
      const st = STATIONS[currentIdx];
      updateTheme(st);
      audio.src = st.url;
      playBtn.textContent = '...';
      audio.play().then(() => {
        isPlaying = true;
        playBtn.textContent = 'JEDA';
      }).catch(() => {
        audio.src = st.fallback;
        audio.play().then(() => {
          isPlaying = true;
          playBtn.textContent = 'JEDA';
        }).catch(() => {
          isPlaying = false;
          playBtn.textContent = 'PUTAR';
        });
      });
    }

    playBtn.onclick = () => {
      if (isPlaying) {
        audio.pause();
        isPlaying = false;
        playBtn.textContent = 'PUTAR';
      } else {
        playStation(currentIdx);
      }
    };

    document.getElementById('prevBtn').onclick = () => {
      playStation((currentIdx - 1 + STATIONS.length) % STATIONS.length);
    };
    document.getElementById('nextBtn').onclick = () => {
      playStation((currentIdx + 1) % STATIONS.length);
    };
    document.getElementById('randomBtn').onclick = () => {
      playStation(Math.floor(Math.random() * STATIONS.length));
    };

    const countries = ['ALL', ...Array.from(new Set(STATIONS.map(s => s.country)))];
    function renderCountries() {
      countryBar.innerHTML = '';
      countries.forEach(c => {
        const b = document.createElement('button');
        b.className = 'chip' + (selectedCountry === c ? ' active' : '');
        b.textContent = c === 'ALL' ? 'Semua Negara' : c;
        b.onclick = () => { selectedCountry = c; renderCountries(); renderList(); };
        countryBar.appendChild(b);
      });
    }

    function renderList() {
      stationList.innerHTML = '';
      STATIONS.forEach((st, idx) => {
        if (selectedCountry !== 'ALL' && st.country !== selectedCountry) return;
        const row = document.createElement('div');
        row.className = 'st-row' + (idx === currentIdx ? ' active' : '');
        row.innerHTML = '<div class="row-info"><div class="row-name">' + st.name + '</div><div class="row-sub">' + st.country + ' · ' + st.tags + ' · ' + st.bitrate + ' kbps</div></div><div style="font-size:12px;font-weight:700;color:' + st.color + '">' + (idx === currentIdx && isPlaying ? 'LIVE' : 'Putar') + '</div>';
        row.onclick = () => playStation(idx);
        stationList.appendChild(row);
      });
    }

    // Canvas Visualizer
    const canvas = document.getElementById('vizCanvas');
    const ctx = canvas.getContext('2d');
    let phase = 0;
    function drawViz() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      phase += isPlaying ? 0.09 : 0.02;
      const st = STATIONS[currentIdx];
      const bars = 32;
      const gap = 4;
      const bw = (canvas.width - gap * (bars - 1)) / bars;
      for (let i = 0; i < bars; i++) {
        const amp = isPlaying ? (0.35 + Math.sin(phase * 2 + i * 0.4) * 0.25 + Math.cos(phase * 3 - i * 0.5) * 0.2) : 0.08;
        const bh = Math.max(6, amp * (canvas.height - 16));
        const x = i * (bw + gap);
        const y = (canvas.height - bh) / 2;
        ctx.fillStyle = st.color;
        ctx.beginPath();
        ctx.roundRect(x, y, bw, bh, 8);
        ctx.fill();
      }
      requestAnimationFrame(drawViz);
    }

    renderCountries();
    updateTheme(STATIONS[0]);
    drawViz();
  </script>
</body>
</html>`;
}

/**
 * Minimal uncompressed ZIP archive creator in pure TypeScript (zero external dependencies)
 * Used to package a complete Android Studio project (.zip) that compiles into AetherWave.apk
 */
export function createZipArchive(files: Array<{ name: string; content: string }>): Blob {
  const encoder = new TextEncoder();
  const fileEntries = files.map((f) => ({
    nameBytes: encoder.encode(f.name),
    dataBytes: encoder.encode(f.content),
  }));

  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(bytes: Uint8Array): number {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      c = (c >>> 8) ^ crcTable[(c ^ bytes[i]) & 0xff];
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of fileEntries) {
    const crc = crc32(entry.dataBytes);
    const size = entry.dataBytes.length;
    const nameLen = entry.nameBytes.length;

    // Local file header (30 bytes + name)
    const localHeader = new Uint8Array(30 + nameLen);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true); // store (no compression)
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameLen, true);
    lv.setUint16(28, 0, true);
    localHeader.set(entry.nameBytes, 30);

    // Central directory header (46 bytes + name)
    const centralHeader = new Uint8Array(46 + nameLen);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameLen, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(entry.nameBytes, 46);

    localParts.push(localHeader, entry.dataBytes);
    centralParts.push(centralHeader);
    offset += localHeader.length + size;
  }

  const centralSize = centralParts.reduce((acc, p) => acc + p.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, fileEntries.length, true);
  ev.setUint16(10, fileEntries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, eocd], {
    type: 'application/zip',
  });
}

export function buildAndroidStudioProjectZip(): Blob {
  const standaloneHtml = generateStandaloneAndroidHtml();

  const files = [
    {
      name: 'AetherWave-Android/CARA-PASANG-DAN-BUILD-APK.txt',
      content: `======================================================================
AETHERWAVE — GLOBAL GLASS RADIO (PAKET APLIKASI ANDROID)
======================================================================

Di dalam paket ZIP ini sudah tersedia:
1. File langsung pakai di HP Android tanpa perlu kompilasi:
   -> app/src/main/assets/index.html
   (Kirim file tersebut ke HP Android Anda via WhatsApp/Telegram lalu buka
    di Chrome Android untuk langsung mendengarkan radio dunia!)

2. Proyek lengkap Android Studio + GitHub Actions Otomatis (.apk):
   - Cara Termudah Tanpa Android Studio (Gratis via GitHub):
     a) Buat repository baru di GitHub dan unggah isi folder ini.
     b) Buka tab "Actions" di GitHub repository Anda.
     c) GitHub Actions (.github/workflows/build-apk.yml) akan otomatis
        mengompilasi dan menghasilkan file "AetherWave-debug.apk" yang
        siap Anda unduh dan instal di HP Android!

   - Cara via Android Studio:
     a) Buka folder "AetherWave-Android" di Android Studio.
     b) Klik menu Build > Build Bundle(s) / APK(s) > Build APK(s).
======================================================================
`,
    },
    {
      name: 'AetherWave-Android/settings.gradle',
      content: `rootProject.name = "AetherWave"\ninclude ':app'\n`,
    },
    {
      name: 'AetherWave-Android/build.gradle',
      content: `buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.2'
    }
}
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
`,
    },
    {
      name: 'AetherWave-Android/gradle.properties',
      content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8\nandroid.useAndroidX=true\n`,
    },
    {
      name: 'AetherWave-Android/app/build.gradle',
      content: `plugins {
    id 'com.android.application'
}

android {
    namespace 'id.aetherwave.radio'
    compileSdk 34

    defaultConfig {
        applicationId "id.aetherwave.radio"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }

    buildTypes {
        release {
            minifyEnabled false
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
}
`,
    },
    {
      name: 'AetherWave-Android/app/src/main/AndroidManifest.xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:allowBackup="true"
        android:label="AetherWave Radio"
        android:usesCleartextTraffic="true"
        android:theme="@style/Theme.AppCompat.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`,
    },
    {
      name: 'AetherWave-Android/app/src/main/java/id/aetherwave/radio/MainActivity.java',
      content: `package id.aetherwave.radio;

import android.annotation.SuppressLint;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Window;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window window = getWindow();
        window.setStatusBarColor(Color.parseColor("#090D16"));
        window.setNavigationBarColor(Color.parseColor("#090D16"));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#090D16"));
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        webView.loadUrl("file:///android_asset/index.html");
        setContentView(webView);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
`,
    },
    {
      name: 'AetherWave-Android/app/src/main/assets/index.html',
      content: standaloneHtml,
    },
    {
      name: 'AetherWave-Android/.github/workflows/build-apk.yml',
      content: `name: Build AetherWave Android APK

on:
  push:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v3
      - name: Build Debug APK
        run: gradle assembleDebug
      - name: Upload Compiled APK
        uses: actions/upload-artifact@v4
        with:
          name: AetherWave-Android-APK
          path: app/build/outputs/apk/debug/*.apk
`,
    },
  ];

  return createZipArchive(files);
}
