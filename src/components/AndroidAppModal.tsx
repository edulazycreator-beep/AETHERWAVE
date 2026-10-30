import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  Check,
  X,
  ShieldCheck,
  FileArchive,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { DynamicPalette } from '../utils/colorExtractor';
import {
  buildAndroidStudioProjectZip,
  generateStandaloneAndroidHtml,
} from '../utils/androidPackageGenerator';

interface AndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  palette: DynamicPalette;
}

export const AndroidAppModal: React.FC<AndroidAppModalProps> = ({
  isOpen,
  onClose,
  palette,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [downloadedPortable, setDownloadedPortable] = useState(false);
  const [downloadedZip, setDownloadedZip] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPortableApp = () => {
    const htmlContent = generateStandaloneAndroidHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AetherWave-Android-App.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedPortable(true);
    setTimeout(() => setDownloadedPortable(false), 3500);
  };

  const handleDownloadAndroidZip = () => {
    const zipBlob = buildAndroidStudioProjectZip();
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AetherWave-Android-Studio-Project.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedZip(true);
    setTimeout(() => setDownloadedZip(false), 3500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl glass-sheet sm:glass-panel border border-white/15 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle on Mobile */}
        <div className="w-10 h-1.5 bg-white/20 rounded-full mx-auto sm:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shrink-0"
              style={{
                background: `linear-gradient(135deg, ${palette.hex}, ${palette.secondaryHex})`,
              }}
            >
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                Unduh Aplikasi Android AetherWave
              </h2>
              <p className="text-xs text-slate-300">
                Package ID: <span className="font-mono text-white">id.aetherwave.radio</span> · v1.0.0
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white shrink-0"
            aria-label="Tutup jendela unduhan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Opsi 1: Unduh Aplikasi Mandiri 1-File (Langsung Jalan di HP Tanpa Server) */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/15 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Sparkles className="w-4 h-4" style={{ color: palette.hex }} />
            <span>Opsi 1: Unduh File Aplikasi Mandiri (Langsung Buka di HP Android)</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Tidak perlu server atau hosting! Unduh file aplikasi mandiri{' '}
            <code className="text-white">AetherWave-Android-App.html</code> di bawah ini, kirimkan ke HP
            Android Anda (via WhatsApp / Telegram / Kabel Data), lalu ketuk untuk membuka aplikasi
            radio langsung di HP Anda.
          </p>

          <button
            type="button"
            onClick={handleDownloadPortableApp}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-slate-950 flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-98 min-h-[46px]"
            style={{
              background: `linear-gradient(135deg, ${palette.hex}, ${palette.secondaryHex})`,
            }}
          >
            {downloadedPortable ? (
              <>
                <Check className="w-4 h-4" />
                <span>AetherWave-Android-App.html Berhasil Diunduh!</span>
              </>
            ) : (
              <>
                <FileCode className="w-4 h-4" />
                <span>Unduh Aplikasi Mandiri (AetherWave-Android-App.html)</span>
              </>
            )}
          </button>
        </div>

        {/* Opsi 2: Unduh Paket Proyek Android Studio & Auto-APK (.zip) */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/15 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <FileArchive className="w-4 h-4 text-sky-400" />
            <span>Opsi 2: Unduh Proyek Android Studio &amp; Auto-APK (.ZIP Lengkap)</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Berisi source code lengkap Android Native (<code className="text-white">MainActivity.java</code>,{' '}
            <code className="text-white">AndroidManifest.xml</code>, <code className="text-white">build.gradle</code>,
            aset aplikasi tertanam, serta workflow otomatis GitHub Actions) untuk menghasilkan file{' '}
            <code className="text-white">AetherWave-debug.apk</code>.
          </p>

          <button
            type="button"
            onClick={handleDownloadAndroidZip}
            className="w-full py-3 px-4 rounded-xl bg-white/12 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center justify-center gap-2 min-h-[46px] transition-colors"
          >
            {downloadedZip ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>AetherWave-Android-Studio-Project.zip Terunduh!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" style={{ color: palette.hex }} />
                <span>Unduh Proyek Android Lengkap (.ZIP)</span>
              </>
            )}
          </button>
        </div>

        {/* Opsi 3: Instal Langsung sebagai PWA Android */}
        <div className="p-4 rounded-2xl bg-slate-950/65 border border-white/10 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Opsi 3: Pasang Langsung dari Browser (PWA Standalone)</span>
          </div>

          {isInstalled ? (
            <div className="text-xs text-emerald-300 font-medium">
              AetherWave sudah terpasang sebagai aplikasi di perangkat ini.
            </div>
          ) : isInstallable ? (
            <button
              type="button"
              onClick={install}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 min-h-[42px]"
            >
              <Download className="w-4 h-4" />
              <span>Instal Langsung ke Perangkat Ini</span>
            </button>
          ) : (
            <p className="text-xs text-slate-400 leading-relaxed">
              Catatan: Jika Anda ingin membuka tautan aplikasi langsung di HP lain melalui internet,
              klik tombol <strong>Share / Deploy</strong> di pojok kanan atas layar AI Studio terlebih
              dahulu agar tautan publik diaktifkan oleh server, atau gunakan{' '}
              <strong>Opsi 1 &amp; Opsi 2</strong> di atas yang dapat diunduh langsung sekarang juga.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
