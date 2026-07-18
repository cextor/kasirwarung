import React, { useState } from 'react';
import { Sale, Product, PrinterDevice } from '../types';
import { 
  Calendar, Search, Printer, Trash2, ChevronDown, ChevronUp, 
  TrendingUp, ShoppingCart, DollarSign, CalendarRange, Eye, RefreshCw 
} from 'lucide-react';
import { formatRupiah, generateEscPosBytes, sendToPrinter, sendToUsbPrinter } from '../utils/bluetoothPrinter';
import Swal from 'sweetalert2';

interface SalesHistoryProps {
  sales: Sale[];
  products: Product[];
  activePrinter: PrinterDevice | null;
  onConnectPrinter: () => Promise<void>;
  onDeleteSale: (saleId: string) => void;
  shopName: string;
  shopAddress: string;
}

export default function SalesHistory({
  sales,
  products,
  activePrinter,
  onConnectPrinter,
  onDeleteSale,
  shopName,
  shopAddress,
}: SalesHistoryProps) {
  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(''); // empty means all-time
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  
  // Printing states
  const [isPrinting, setIsPrinting] = useState<string | null>(null); // holds saleId if printing

  // Filter Sales Logic
  const filteredSales = sales.filter((sale) => {
    // Date match
    const saleDate = new Date(sale.timestamp).toISOString().split('T')[0];
    const matchesDate = selectedDate === '' || saleDate === selectedDate;

    // Search query match (invoice number)
    const matchesSearch = sale.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDate && matchesSearch;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Statistics calculation for filtered list
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalTransactions = filteredSales.length;
  const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const totalItemsSold = filteredSales.reduce((sum, s) => sum + s.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

  // Toggle detail rows
  const toggleExpandSale = (id: string) => {
    setExpandedSaleId(expandedSaleId === id ? null : id);
  };

  // Reprint Receipt trigger
  const handleReprint = async (sale: Sale) => {
    if (!activePrinter) {
      Swal.fire({
        title: 'Printer Belum Terhubung',
        text: 'Hubungkan printer Bluetooth/USB Anda terlebih dahulu melalui panel Kasir atau Koneksi Printer.',
        icon: 'warning',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }

    setIsPrinting(sale.id);
    try {
      const bytes = generateEscPosBytes(sale, shopName, shopAddress);
      if (activePrinter.type === 'bluetooth' && activePrinter.characteristic) {
        await sendToPrinter(activePrinter.characteristic, bytes);
      } else if (activePrinter.type === 'usb' && activePrinter.usbDevice && activePrinter.endpointOut !== undefined) {
        await sendToUsbPrinter(activePrinter.usbDevice, activePrinter.endpointOut, bytes);
      } else {
        throw new Error('Metode cetak printer tidak dikenal.');
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'Gagal Mencetak',
        text: 'Gagal mencetak ulang struk. Silakan hubungkan ulang printer.',
        icon: 'error',
        confirmButtonColor: '#4f46e5'
      });
    } finally {
      setIsPrinting(null);
    }
  };

  // Handle Delete Sale and Restore Stock
  const handleDeleteSale = (sale: Sale) => {
    Swal.fire({
      title: 'Batalkan Transaksi?',
      text: `Apakah Anda yakin ingin membatalkan transaksi ${sale.invoiceNumber}? Tindakan ini akan mengembalikan stok barang dan menghapus rekap penjualan ini secara permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Ya, batalkan!',
      cancelButtonText: 'Kembali'
    }).then((result) => {
      if (result.isConfirmed) {
        onDeleteSale(sale.id);
      }
    });
  };

  // Set date filter helpers
  const setTodayFilter = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setSelectedDate(todayStr);
  };

  const clearDateFilter = () => {
    setSelectedDate('');
  };

  return (
    <div className="space-y-6" id="sales-history-container">
      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="sales-stats-cards">
        {/* Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Omset Penjualan
            </span>
            <span className="text-lg font-black text-slate-800" id="stats-revenue">
              {formatRupiah(totalRevenue)}
            </span>
          </div>
        </div>

        {/* Transactions count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Transaksi
            </span>
            <span className="text-lg font-black text-slate-800" id="stats-transactions">
              {totalTransactions} Nota
            </span>
          </div>
        </div>

        {/* Average transaction amount */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Rerata Belanja
            </span>
            <span className="text-lg font-black text-slate-800" id="stats-average">
              {formatRupiah(averageTransaction)}
            </span>
          </div>
        </div>

        {/* Items Sold count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <CalendarRange className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Barang Terjual
            </span>
            <span className="text-lg font-black text-slate-800" id="stats-items-sold">
              {totalItemsSold} Unit
            </span>
          </div>
        </div>
      </div>

      {/* Filter and History Table Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="history-table-card">
        {/* Filters Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5" id="history-filter-bar">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <span>Rekapitulasi Penjualan</span>
            <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2.5 py-0.5 rounded-full" id="filtered-sales-count">
              {filteredSales.length} Nota Terbit
            </span>
          </h2>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center" id="history-filter-inputs">
            {/* Search Invoice */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                className="w-full sm:w-48 pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                placeholder="Cari No. Invoice/Nota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="search-invoice-input"
              />
            </div>

            {/* Date Picker Input */}
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  className="pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  id="date-filter-picker"
                />
              </div>
              <button
                onClick={setTodayFilter}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                id="btn-filter-today"
              >
                Hari Ini
              </button>
              {selectedDate && (
                <button
                  onClick={clearDateFilter}
                  className="px-2 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  id="btn-clear-date-filter"
                  title="Bersihkan Tanggal"
                >
                  Semua
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        {filteredSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400" id="empty-history-view">
            <CalendarRange className="w-12 h-12 mb-3 stroke-1 text-slate-300" />
            <p className="text-sm">Tidak ada transaksi yang sesuai pada kriteria ini.</p>
          </div>
        ) : (
          <div className="space-y-4" id="sales-history-container">
            {/* Mobile View: Visible on mobile screens */}
            <div className="md:hidden space-y-3.5" id="sales-history-mobile-list">
              {filteredSales.map((sale) => {
                const isExpanded = expandedSaleId === sale.id;
                const itemQuantityTotal = sale.items.reduce((acc, it) => acc + it.quantity, 0);

                return (
                  <div key={sale.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 relative" id={`sale-card-${sale.id}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-extrabold text-sm text-slate-800">{sale.invoiceNumber}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(sale.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline text-xs text-slate-500 font-medium">
                      <span>
                        {new Date(sale.timestamp).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                      </span>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold text-[10px]">{itemQuantityTotal} Item</span>
                    </div>

                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-50">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider">Total Belanja</span>
                        <span className="font-black text-slate-900 text-sm">{formatRupiah(sale.totalAmount)}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleExpandSale(sale.id)}
                          className="px-2.5 py-1.5 hover:bg-slate-50 text-indigo-600 hover:text-indigo-700 rounded-lg transition-colors font-bold text-xs flex items-center gap-0.5 cursor-pointer"
                          id={`expand-mobile-${sale.id}`}
                        >
                          {isExpanded ? 'Tutup' : 'Detail'}
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => handleReprint(sale)}
                          disabled={isPrinting === sale.id}
                          className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                          title="Cetak Ulang Struk"
                          id={`reprint-mobile-${sale.id}`}
                        >
                          {isPrinting === sale.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                          ) : (
                            <Printer className="w-4.5 h-4.5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteSale(sale)}
                          className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                          title="Batalkan Transaksi & Kembalikan Stok"
                          id={`delete-mobile-${sale.id}`}
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Detail View */}
                    {isExpanded && (
                      <div className="mt-2 pt-3.5 border-t border-dashed border-slate-200 bg-slate-50/50 -mx-4 -mb-4 p-4 rounded-b-2xl space-y-3 text-xs">
                        <div className="font-extrabold text-slate-400 uppercase tracking-widest text-[9px] mb-1">Rincian Pembelian:</div>
                        <div className="space-y-1.5 divide-y divide-slate-100">
                          {sale.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center py-2">
                              <div>
                                <span className="font-bold text-slate-800 leading-tight block">{item.name}</span>
                                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                  {item.quantity} x {item.price.toLocaleString('id-ID')}
                                  <span className={`ml-1.5 px-1 py-0.5 rounded text-[8px] font-bold ${
                                    item.priceType === 'wholesale' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/30' : 'bg-blue-50 text-blue-700 border border-blue-100/30'
                                  }`}>
                                    {item.priceType === 'wholesale' ? 'Grosir' : 'Eceran'}
                                  </span>
                                </div>
                              </div>
                              <span className="font-extrabold text-slate-800">{formatRupiah(item.subtotal)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-slate-200/60 pt-3 mt-3 space-y-2 text-[11px] text-slate-500 bg-white p-3 rounded-xl border border-slate-100">
                          <div className="flex justify-between font-semibold">
                            <span>Subtotal Tagihan:</span>
                            <span className="font-bold text-slate-800">{formatRupiah(sale.totalAmount)}</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span>Tunai Diterima:</span>
                            <span className="font-bold text-slate-800">{formatRupiah(sale.cashPaid)}</span>
                          </div>
                          <div className="flex justify-between text-indigo-700 font-extrabold text-xs pt-1 border-t border-slate-50">
                            <span>Kembalian:</span>
                            <span>{formatRupiah(sale.changeDue)}</span>
                          </div>
                        </div>

                        {/* Reprinter helper button */}
                        <button
                          onClick={() => handleReprint(sale)}
                          disabled={isPrinting === sale.id}
                          className="w-full mt-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10 uppercase tracking-wider transition-all"
                        >
                          {isPrinting === sale.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Printer className="w-3.5 h-3.5" />
                          )}
                          <span>{isPrinting === sale.id ? 'Mencetak...' : 'Cetak Struk Bluetooth'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Visible on md screens and above */}
            <div className="hidden md:block overflow-x-auto" id="sales-history-table-wrapper">
              <table className="w-full text-left border-collapse" id="sales-history-table">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-medium uppercase tracking-wider">
                    <th className="py-3 px-4 w-10"></th>
                    <th className="py-3 px-4 font-semibold">No. Invoice</th>
                    <th className="py-3 px-4 font-semibold">Waktu & Tanggal</th>
                    <th className="py-3 px-4 font-semibold text-center">Jumlah Barang</th>
                    <th className="py-3 px-4 font-semibold text-right">Total Belanja</th>
                    <th className="py-3 px-4 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm text-slate-700">
                  {filteredSales.map((sale) => {
                    const isExpanded = expandedSaleId === sale.id;
                    const itemQuantityTotal = sale.items.reduce((acc, it) => acc + it.quantity, 0);

                    return (
                      <React.Fragment key={sale.id}>
                        {/* Parent row summary */}
                        <tr className={`hover:bg-slate-50/50 transition-colors ${isExpanded ? 'bg-slate-50/70' : ''}`} id={`sale-row-${sale.id}`}>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => toggleExpandSale(sale.id)}
                              className="p-1 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors cursor-pointer"
                              id={`expand-btn-${sale.id}`}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                            {sale.invoiceNumber}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {new Date(sale.timestamp).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-center font-medium text-slate-600">
                            {itemQuantityTotal} Item
                          </td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                            {formatRupiah(sale.totalAmount)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Expand toggle */}
                              <button
                                onClick={() => toggleExpandSale(sale.id)}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                                title="Lihat Detail Transaksi"
                                id={`detail-view-btn-${sale.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              {/* Reprint */}
                              <button
                                onClick={() => handleReprint(sale)}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                                title="Cetak Ulang Struk"
                                id={`reprint-btn-${sale.id}`}
                              >
                                {isPrinting === sale.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                                ) : (
                                  <Printer className="w-4 h-4" />
                                )}
                              </button>

                              {/* Delete Transaction */}
                              <button
                                onClick={() => handleDeleteSale(sale)}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                                title="Batalkan Transaksi & Kembalikan Stok"
                                id={`delete-sale-btn-${sale.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded details row */}
                        {isExpanded && (
                          <tr className="bg-slate-50/30" id={`sale-detail-${sale.id}`}>
                            <td colSpan={6} className="py-4 px-8 border-t border-b border-slate-100">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id={`detail-grid-${sale.id}`}>
                                {/* Left column: List of products purchased */}
                                <div>
                                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    Rincian Pembelian
                                  </span>
                                  <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
                                    {sale.items.map((item, idx) => (
                                      <div key={idx} className="p-3 flex justify-between items-center text-sm">
                                        <div>
                                          <div className="font-semibold text-slate-800">{item.name}</div>
                                          <div className="text-xs text-slate-400 font-medium mt-0.5">
                                            {item.quantity} x {item.price.toLocaleString('id-ID')} 
                                            <span className={`ml-1.5 inline-block text-[9px] font-bold px-1 rounded ${
                                              item.priceType === 'wholesale' 
                                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                                            }`}>
                                              {item.priceType === 'wholesale' ? 'Grosir' : 'Eceran'}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="font-bold text-slate-800">
                                          {formatRupiah(item.subtotal)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Right column: Audit payment details */}
                                <div className="space-y-4">
                                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Informasi Pembayaran
                                  </span>
                                  <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-slate-500 font-medium">Total Tagihan:</span>
                                      <span className="font-bold text-slate-800">{formatRupiah(sale.totalAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-slate-500 font-medium">Uang Diterima:</span>
                                      <span className="font-bold text-slate-800">{formatRupiah(sale.cashPaid)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm border-t border-slate-100 pt-2">
                                      <span className="text-indigo-700 font-bold">Uang Kembalian:</span>
                                      <span className="font-extrabold text-indigo-800">{formatRupiah(sale.changeDue)}</span>
                                    </div>
                                  </div>

                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => handleReprint(sale)}
                                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-100 cursor-pointer"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                      <span>Cetak Struk Ke Printer Bluetooth</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
