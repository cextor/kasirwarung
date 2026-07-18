import React, { useState } from 'react';
import { PrinterDevice } from '../types';
import { 
  Printer, Wifi, WifiOff, Settings, MapPin, Store, HelpCircle, 
  Download, Upload, CheckCircle2, AlertTriangle, RefreshCw 
} from 'lucide-react';

interface BluetoothPrinterConnectorProps {
  activePrinter: PrinterDevice | null;
  onConnectPrinter: () => Promise<void>;
  onDisconnectPrinter: () => void;
  shopName: string;
  setShopName: (name: string) => void;
  shopAddress: string;
  setShopAddress: (address: string) => void;
  onTriggerTestPrint: () => Promise<void>;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function BluetoothPrinterConnector({
  activePrinter,
  onConnectPrinter,
  onDisconnectPrinter,
  shopName,
  setShopName,
  shopAddress,
  setShopAddress,
  onTriggerTestPrint,
  onExportData,
  onImportData,
}: BluetoothPrinterConnectorProps) {
  const [isTestPrinting, setIsTestPrinting] = useState(false);
  const [testError, setTestError] = useState('');
  const [testSuccess, setTestSuccess] = useState(false);

  const handleTestPrint = async () => {
    if (!activePrinter) return;
    setIsTestPrinting(true);
    setTestError('');
    setTestSuccess(false);
    try {
      await onTriggerTestPrint();
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setTestError('Gagal mengirim cetak uji coba. Periksa koneksi printer Anda.');
    } finally {
      setIsTestPrinting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="printer-connector-container">
      {/* LEFT: Bluetooth Printer Connection Card */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="printer-device-card">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-indigo-50/80 text-indigo-600 rounded-lg">
              <Printer className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Printer Thermal TM-58V (USB / Bluetooth)</h2>
          </div>

          {activePrinter ? (
            <div className="bg-indigo-50/30 border border-indigo-100/50 p-5 rounded-2xl flex flex-col items-center text-center space-y-3" id="printer-status-connected">
              <div className="p-3 bg-indigo-600 text-white rounded-full animate-pulse">
                <Wifi className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-extrabold text-indigo-950 text-base">Printer Terhubung</h4>
                <p className="text-xs text-indigo-600 font-mono mt-1 font-semibold">
                  {activePrinter.name} ({activePrinter.type === 'usb' ? 'Kabel USB' : 'Bluetooth Wireless'})
                </p>
              </div>

              <div className="flex gap-2 w-full pt-2">
                <button
                  disabled={isTestPrinting}
                  onClick={handleTestPrint}
                  className="flex-1 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  id="test-print-btn"
                >
                  {isTestPrinting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Printer className="w-3.5 h-3.5" />
                  )}
                  <span>{isTestPrinting ? 'Mencetak...' : 'Cetak Uji Coba'}</span>
                </button>
                <button
                  onClick={onDisconnectPrinter}
                  className="flex-1 bg-white hover:bg-red-50 border border-red-200 text-red-600 font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                  id="disconnect-printer-btn"
                >
                  Putuskan Koneksi
                </button>
              </div>

              {testSuccess && (
                <p className="text-xs font-semibold text-indigo-600 flex items-center gap-1" id="test-print-success">
                  <CheckCircle2 className="w-4 h-4" /> Cetak uji coba sukses dikirim!
                </p>
              )}
              {testError && (
                <p className="text-xs font-semibold text-red-700 flex items-center gap-1" id="test-print-error">
                  <AlertTriangle className="w-4 h-4" /> {testError}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl flex flex-col items-center text-center space-y-4" id="printer-status-disconnected">
              <div className="p-3 bg-slate-200 text-slate-400 rounded-full">
                <WifiOff className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-slate-700 text-sm">Printer Belum Terhubung</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                  Hubungkan ke printer TM-58V via kabel USB atau Bluetooth nirkabel langsung dari browser untuk mencetak struk kasir.
                </p>
              </div>

              <button
                onClick={onConnectPrinter}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
                id="connect-printer-main-btn"
              >
                <Printer className="w-4 h-4" />
                <span>Cari & Hubungkan Printer</span>
              </button>
            </div>
          )}

          {/* Connection Troubleshooting / Browser Notice */}
          <div className="mt-5 p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-2.5 text-xs text-slate-600" id="printer-troubleshoot-guide">
            <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="w-4.5 h-4.5 text-amber-600" />
              <span>Panduan Koneksi Printer TM-58V</span>
            </h5>
            <ul className="list-disc pl-4 space-y-1.5 leading-relaxed">
              <li>
                <strong>Metode Kabel USB (Rekomendasi Desktop):</strong> Colok printer ke USB komputer, klik <strong>Cari & Hubungkan Printer</strong>, pilih opsi <strong>Kabel USB</strong>, lalu klik pada perangkat USB printer Anda untuk memberi izin koneksi.
              </li>
              <li>
                <strong>Metode Bluetooth:</strong> Aktifkan Bluetooth dan Lokasi (GPS) perangkat Anda. Klik <strong>Cari & Hubungkan Printer</strong>, pilih opsi <strong>Bluetooth (Nirkabel)</strong>, dan pilih nama printer TM-58V dari daftar pairing.
              </li>
              <li>
                <strong>Browser yang Didukung:</strong> Gunakan Google Chrome, Microsoft Edge, atau Opera versi terbaru. Safari iOS belum mendukung WebUSB / WebBluetooth secara langsung.
              </li>
              <li>
                <strong>Lebar Kertas:</strong> Printer TM-58V menggunakan lebar kertas 58mm (32 kolom teks) yang dikonfigurasi otomatis oleh aplikasi.
              </li>
            </ul>
          </div>
        </div>

        {/* Database backup / LocalStorage management */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4" id="backup-card">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Backup & Pemulihan Data
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Semua data warung Anda disimpan dengan aman di memori lokal (LocalStorage) browser ini. Unduh file backup secara berkala agar data tidak hilang apabila Anda membersihkan cache browser.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Export */}
            <button
              onClick={onExportData}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              id="export-db-btn"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Data (Backup)</span>
            </button>

            {/* Import */}
            <label className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer text-center relative">
              <Upload className="w-4 h-4" />
              <span>Impor Data (Restore)</span>
              <input
                type="file"
                accept=".json"
                onChange={onImportData}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="import-db-input"
              />
            </label>
          </div>
        </div>
      </div>

      {/* RIGHT: Custom Warung Profile / Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-fit space-y-5" id="warung-settings-card">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
            <Settings className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">Profil & Pengaturan Struk</h2>
        </div>

        <div className="space-y-4" id="settings-form">
          {/* Shop Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">
              Nama Toko / Warung <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Store className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold"
                placeholder="Contoh: WARUNG SEJAHTERA"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                id="setting-shop-name"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block leading-relaxed">
              Nama toko ini akan tampil paling atas berukuran besar di struk belanja fisik Anda.
            </span>
          </div>

          {/* Shop Address */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">
              Alamat Toko / Nomor Telepon
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                placeholder="Contoh: Jl. Raya Kali No. 12 • Telp 0812345"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                id="setting-shop-address"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block leading-relaxed">
              Informasi alamat atau nomor kontak warung yang dicantumkan di bawah nama toko.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
