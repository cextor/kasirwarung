import React, { useState } from 'react';
import { Sale, Product, Category } from '../types';
import { Trophy, Medal, ShoppingBag, DollarSign, TrendingUp, Sparkles } from 'lucide-react';
import { formatRupiah } from '../utils/bluetoothPrinter';

interface TopProductsProps {
  sales: Sale[];
  products: Product[];
  categories: Category[];
}

interface ProductSalesAggregate {
  product: Product;
  categoryName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export default function TopProducts({ sales, products, categories }: TopProductsProps) {
  const [metric, setMetric] = useState<'quantity' | 'revenue'>('quantity');

  // Aggregate product sales
  const getTopProducts = (): ProductSalesAggregate[] => {
    const aggregates: { [productId: string]: { qty: number; rev: number } } = {};

    // Sum quantities and revenues from all transactions
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!aggregates[item.productId]) {
          aggregates[item.productId] = { qty: 0, rev: 0 };
        }
        aggregates[item.productId].qty += item.quantity;
        aggregates[item.productId].rev += item.subtotal;
      });
    });

    // Map to Product objects and sort
    const result: ProductSalesAggregate[] = Object.keys(aggregates).map((productId) => {
      const product = products.find((p) => p.id === productId) || {
        id: productId,
        name: 'Produk Terhapus',
        categoryId: '',
        priceRetail: 0,
        priceWholesale: 0,
        wholesaleMinQty: 0,
        stock: 0,
        unit: 'unit',
      } as Product;

      const category = categories.find((c) => c.id === product.categoryId);
      const categoryName = category ? category.name : 'Tanpa Kategori';

      return {
        product,
        categoryName,
        totalQuantity: aggregates[productId].qty,
        totalRevenue: aggregates[productId].rev,
      };
    });

    // Sort by chosen metric
    if (metric === 'quantity') {
      return result.sort((a, b) => b.totalQuantity - a.totalQuantity).slice(0, 10);
    } else {
      return result.sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);
    }
  };

  const topTen = getTopProducts();

  // Find max value for setting relative bar widths
  const maxVal = topTen.length > 0 
    ? (metric === 'quantity' ? topTen[0].totalQuantity : topTen[0].totalRevenue)
    : 1;

  // Render ranking medal or badge
  const renderRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-black text-sm border-2 border-amber-200">
            <Trophy className="w-4.5 h-4.5 text-amber-600" />
          </div>
        );
      case 1:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-800 font-black text-sm border-2 border-slate-300">
            <Medal className="w-4.5 h-4.5 text-slate-600" />
          </div>
        );
      case 2:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-800 font-black text-sm border-2 border-amber-100">
            <Medal className="w-4.5 h-4.5 text-amber-800" />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs">
            {index + 1}
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="top-products-container">
      {/* LEFT COL: Explanation and toggle */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-fit space-y-4" id="top-products-intro-card">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Trophy className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">Analisis Produk Terlaris</h2>
        </div>

        <p className="text-sm text-slate-500 leading-relaxed">
          Pantau produk terlaris di warung Anda untuk memastikan ketersediaan stok, merencanakan promosi, atau memfokuskan penjualan grosir.
        </p>

        {/* Toggle metric */}
        <div className="space-y-2 pt-2">
          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Urutkan Berdasarkan
          </span>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-150" id="metric-toggles">
            <button
              onClick={() => setMetric('quantity')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                metric === 'quantity'
                  ? 'bg-white text-indigo-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              id="toggle-metric-qty"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Jumlah Terjual (Unit)</span>
            </button>
            <button
              onClick={() => setMetric('revenue')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                metric === 'revenue'
                  ? 'bg-white text-indigo-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              id="toggle-metric-rev"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Nilai Omset (Rupiah)</span>
            </button>
          </div>
        </div>

        {/* Highlight Insights Box */}
        {topTen.length > 0 && (
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 text-xs text-indigo-800 space-y-2" id="top-insights-box">
            <div className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Insight Hari Ini</span>
            </div>
            <p className="leading-relaxed">
              Produk paling favorit di warung Anda saat ini adalah <strong className="font-extrabold">{topTen[0].product.name}</strong> dengan penjualan sebanyak{' '}
              <strong className="font-extrabold">
                {metric === 'quantity' 
                  ? `${topTen[0].totalQuantity} ${topTen[0].product.unit}` 
                  : formatRupiah(topTen[0].totalRevenue)}
              </strong>.
            </p>
          </div>
        )}
      </div>

      {/* RIGHT COL: Visual Leaderboard list (2 cols on lg) */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col" id="top-products-leaderboard">
        <div className="flex items-center justify-between mb-6" id="leaderboard-header">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-800">
              Top 10 Produk Terlaris ({metric === 'quantity' ? 'Terjual terbanyak' : 'Omset terbesar'})
            </h3>
          </div>
          <span className="text-[10px] font-bold uppercase px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full">
            Real-time
          </span>
        </div>

        {topTen.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 flex-1" id="empty-leaderboard">
            <Trophy className="w-14 h-14 mb-3 stroke-1 text-slate-200" />
            <p className="text-sm font-medium">Belum ada data penjualan tercatat.</p>
            <p className="text-xs text-slate-400 mt-1">Lakukan transaksi di Kasir terlebih dahulu.</p>
          </div>
        ) : (
          <div className="space-y-4" id="leaderboard-items">
            {topTen.map((item, index) => {
              const currentVal = metric === 'quantity' ? item.totalQuantity : item.totalRevenue;
              const ratioPercent = Math.max(5, (currentVal / maxVal) * 100);

              return (
                <div key={item.product.id} className="flex gap-3 items-center group" id={`top-item-${item.product.id}`}>
                  {/* Rank badge */}
                  <div className="shrink-0">{renderRankBadge(index)}</div>

                  {/* Visual Bar & Name Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-baseline gap-2">
                      {/* Name & Category */}
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-slate-800 truncate block">
                          {item.product.name}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          Kategori: {item.categoryName} • Unit: {item.product.unit}
                        </span>
                      </div>

                      {/* Selling Metrics */}
                      <div className="shrink-0 text-right">
                        <span className="font-black text-sm text-slate-900 block font-mono">
                          {metric === 'quantity' 
                            ? `${item.totalQuantity.toLocaleString('id-ID')} ${item.product.unit}` 
                            : formatRupiah(item.totalRevenue)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Stok Saat Ini: {item.product.stock}
                        </span>
                      </div>
                    </div>

                    {/* Progress visual bar */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          index === 0 
                            ? 'bg-gradient-to-r from-amber-500 to-amber-400' 
                            : index === 1 
                            ? 'bg-gradient-to-r from-slate-400 to-slate-300'
                            : index === 2 
                            ? 'bg-gradient-to-r from-amber-700 to-amber-600'
                            : 'bg-gradient-to-r from-indigo-500 to-indigo-400'
                        }`}
                        style={{ width: `${ratioPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
