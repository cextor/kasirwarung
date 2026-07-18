import React, { useState, useRef, useEffect } from 'react';
import { Product, Category, CartItem, Sale, PrinterDevice } from '../types';
import { 
  Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, 
  CheckCircle2, Printer, X, Sparkles, Copy, AlertCircle, RefreshCw,
  Eye, ChevronDown, ChevronUp
} from 'lucide-react';
import { formatRupiah, formatReceiptText, generateEscPosBytes, sendToPrinter, sendToUsbPrinter } from '../utils/bluetoothPrinter';
import Swal from 'sweetalert2';

interface TransactionCashierProps {
  products: Product[];
  categories: Category[];
  activePrinter: PrinterDevice | null;
  onConnectPrinter: () => Promise<void>;
  onAddSale: (sale: Sale) => Promise<void>;
  onUpdateProductStock: (productId: string, newStock: number) => void;
  shopName: string;
  shopAddress: string;
  sales: Sale[];
  onDeleteSale: (saleId: string) => void;
}

export default function TransactionCashier({
  products,
  categories,
  activePrinter,
  onConnectPrinter,
  onAddSale,
  onUpdateProductStock,
  shopName,
  shopAddress,
  sales,
  onDeleteSale,
}: TransactionCashierProps) {
  // Shopping Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');
  
  // Sales History states inside Cashier
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [isPrintingSaleId, setIsPrintingSaleId] = useState<string | null>(null);
  
  // Barcode quick scan state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanMessage, setScanMessage] = useState({ text: '', isError: false });
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [cashPaid, setCashPaid] = useState<number | ''>('');
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Print state
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState('');
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Focus barcode input on mount
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Handle direct barcode scanning input
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matchedProduct = products.find(
      (p) => p.barcode && p.barcode.trim() === barcodeInput.trim()
    );

    if (matchedProduct) {
      if (matchedProduct.isActive === false) {
        setScanMessage({ text: `Gagal: Produk ${matchedProduct.name} sedang tidak aktif!`, isError: true });
      } else if (matchedProduct.stock <= 0) {
        setScanMessage({ text: `Gagal: Stok ${matchedProduct.name} habis!`, isError: true });
      } else {
        addToCart(matchedProduct);
        setScanMessage({ text: `Berhasil menambahkan: ${matchedProduct.name}`, isError: false });
      }
    } else {
      setScanMessage({ text: `Barcode "${barcodeInput}" tidak terdaftar!`, isError: true });
    }

    setBarcodeInput('');
    
    // Auto clear scan feedback after 3s
    setTimeout(() => {
      setScanMessage({ text: '', isError: false });
    }, 3000);
  };

  // Add Product to Cart
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);

      if (existingIndex > -1) {
        const item = prevCart[existingIndex];
        const newQty = item.quantity + 1;
        
        if (newQty > product.stock) {
          Swal.fire({
            title: 'Stok Tidak Cukup',
            text: `Stok tidak mencukupi. Stok maksimal: ${product.stock}`,
            icon: 'warning',
            confirmButtonColor: '#4f46e5'
          });
          return prevCart;
        }

        const updatedCart = [...prevCart];
        updatedCart[existingIndex] = {
          ...item,
          quantity: newQty,
        };
        return updatedCart;
      } else {
        // New item - starts at qty 1, defaults to retail price
        return [...prevCart, { product, quantity: 1, priceType: 'retail' }];
      }
    });

    // Keep scanner field focused
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  // Remove / decrement qty in cart
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null; // will be filtered out

            if (newQty > item.product.stock) {
              Swal.fire({
                title: 'Stok Tidak Cukup',
                text: `Stok tidak mencukupi. Stok maksimal: ${item.product.stock}`,
                icon: 'warning',
                confirmButtonColor: '#4f46e5'
              });
              return item;
            }

            return {
              ...item,
              quantity: newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Force price type override
  const handlePriceTypeChange = (productId: string, type: 'retail' | 'wholesale') => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product.id === productId) {
          return {
            ...item,
            priceType: type,
          };
        }
        return item;
      })
    );
  };

  // Remove from cart entirely
  const removeFromCart = (productId: string, productName: string) => {
    Swal.fire({
      title: 'Hapus Produk?',
      text: `Apakah Anda yakin ingin menghapus "${productName}" dari keranjang belanja?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
      }
    });
  };

  const handleClearCart = () => {
    Swal.fire({
      title: 'Kosongkan Keranjang?',
      text: 'Semua produk yang ada di dalam keranjang belanja akan dihapus!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Ya, kosongkan!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        setCart([]);
      }
    });
  };

  // Calculate cart subtotal
  const getCartSubtotal = () => {
    return cart.reduce((total, item) => {
      const price = item.priceType === 'wholesale' ? item.product.priceWholesale : item.product.priceRetail;
      return total + price * item.quantity;
    }, 0);
  };

  const totalAmount = getCartSubtotal();

  // Handle Quick Cash Selectors
  const handleQuickCash = (amount: number) => {
    setCashPaid(amount);
  };

  // Trigger Checkout
  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setCashPaid('');
    setIsPaymentModalOpen(true);
  };

  // Complete sale creation
  const handleCompletePayment = () => {
    if (cashPaid === '' || Number(cashPaid) < totalAmount) return;

    const invoiceNo = `INV-${Date.now().toString().slice(-8)}`;
    const saleItems = cart.map((item) => {
      const price = item.priceType === 'wholesale' ? item.product.priceWholesale : item.product.priceRetail;
      return {
        productId: item.product.id,
        name: item.product.name,
        price,
        quantity: item.quantity,
        priceType: item.priceType,
        subtotal: price * item.quantity,
      };
    });

    const newSale: Sale = {
      id: Math.random().toString(36).substring(2, 9),
      invoiceNumber: invoiceNo,
      timestamp: new Date().toISOString(),
      items: saleItems,
      totalAmount,
      cashPaid: Number(cashPaid),
      changeDue: Number(cashPaid) - totalAmount,
      paymentMethod: 'Cash',
    };

    Swal.fire({
      title: 'Konfirmasi Pembayaran',
      html: `Apakah Anda yakin ingin menyelesaikan transaksi ini?<br/><br/><div class="text-left bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-600 font-medium"><div>Total Belanja: <strong class="text-slate-800 text-sm">${formatRupiah(totalAmount)}</strong></div><div>Uang Diterima: <strong class="text-indigo-600 text-sm">${formatRupiah(Number(cashPaid))}</strong></div><div>Kembalian: <strong class="text-emerald-600 text-sm">${formatRupiah(Number(cashPaid) - totalAmount)}</strong></div></div>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Selesaikan!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Add sale to history in database
          await onAddSale(newSale);

          // Success alert
          Swal.fire({
            title: 'Berhasil!',
            text: 'Transaksi telah berhasil disimpan.',
            icon: 'success',
            confirmButtonColor: '#4f46e5',
            timer: 1500
          });

          // Deduct stock for all products locally
          cart.forEach((item) => {
            onUpdateProductStock(item.product.id, item.product.stock - item.quantity);
          });

          setLastCompletedSale(newSale);

          // Reset checkout flow
          setIsPaymentModalOpen(false);
          setCart([]);
          setIsReceiptModalOpen(true);

          // Auto-trigger Bluetooth print if printer is already connected and active!
          if (activePrinter && activePrinter.characteristic) {
            triggerBluetoothPrint(newSale);
          }
        } catch (error: any) {
          console.error('Checkout failed:', error);
        }
      }
    });
  };

  // Recent Sales Helpers inside Cashier
  const toggleExpandSale = (id: string) => {
    setExpandedSaleId(expandedSaleId === id ? null : id);
  };

  const handleReprint = async (sale: Sale) => {
    if (!activePrinter) {
      Swal.fire({
        title: 'Printer Belum Terhubung',
        text: 'Hubungkan printer Bluetooth/USB Anda terlebih dahulu.',
        icon: 'warning',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }

    setIsPrintingSaleId(sale.id);
    try {
      const bytes = generateEscPosBytes(sale, shopName, shopAddress);
      if (activePrinter.type === 'bluetooth' && activePrinter.characteristic) {
        await sendToPrinter(activePrinter.characteristic, bytes);
      } else if (activePrinter.type === 'usb' && activePrinter.usbDevice && activePrinter.endpointOut !== undefined) {
        await sendToUsbPrinter(activePrinter.usbDevice, activePrinter.endpointOut, bytes);
      } else {
        throw new Error('Metode cetak printer tidak dikenal.');
      }
      Swal.fire({
        title: 'Berhasil!',
        text: 'Struk berhasil dicetak ulang.',
        icon: 'success',
        confirmButtonColor: '#4f46e5',
        timer: 1500
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'Gagal Mencetak',
        text: 'Gagal mencetak ulang struk. Silakan hubungkan ulang printer.',
        icon: 'error',
        confirmButtonColor: '#4f46e5'
      });
    } finally {
      setIsPrintingSaleId(null);
    }
  };

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

  // Perform actual BLE/USB print
  const triggerBluetoothPrint = async (sale: Sale) => {
    if (!activePrinter) {
      setPrintError('Printer belum terhubung.');
      return;
    }

    setIsPrinting(true);
    setPrintError('');
    try {
      const bytes = generateEscPosBytes(sale, shopName, shopAddress);
      if (activePrinter.type === 'bluetooth' && activePrinter.characteristic) {
        await sendToPrinter(activePrinter.characteristic, bytes);
      } else if (activePrinter.type === 'usb' && activePrinter.usbDevice && activePrinter.endpointOut !== undefined) {
        await sendToUsbPrinter(activePrinter.usbDevice, activePrinter.endpointOut, bytes);
      } else {
        throw new Error('Metode cetak printer tidak dikenal.');
      }
    } catch (err: any) {
      console.error(err);
      setPrintError('Gagal mencetak. Hubungkan ulang printer Anda.');
    } finally {
      setIsPrinting(false);
    }
  };

  // Copy plain text receipt to clipboard
  const handleCopyReceipt = () => {
    if (!lastCompletedSale) return;
    const text = formatReceiptText(lastCompletedSale, shopName, shopAddress);
    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  // Standard browser print
  const handleBrowserPrint = () => {
    window.print();
  };

  // Filter catalog
  const filteredCatalog = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(searchQuery));
    const matchesCategory = selectedCategoryId === '' || p.categoryId === selectedCategoryId;
    const matchesActive = p.isActive !== false;
    return matchesSearch && matchesCategory && matchesActive;
  });

  return (
    <div className="space-y-4">
      {/* Mobile Tab Toggle inside TransactionCashier */}
      <div className="flex lg:hidden bg-slate-100 p-1.5 rounded-2xl border border-slate-200" id="cashier-mobile-tabs">
        <button
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2.5 text-center text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
            mobileTab === 'catalog'
              ? 'bg-white text-indigo-700 shadow-sm shadow-slate-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
          id="mobile-tab-catalog-btn"
        >
          Katalog ({filteredCatalog.length})
        </button>
        <button
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2.5 text-center text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'cart'
              ? 'bg-white text-indigo-700 shadow-sm shadow-slate-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
          id="mobile-tab-cart-btn"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Keranjang ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start" id="cashier-layout">
        {/* LEFT PANEL: Catalog Selection (7 cols on lg) */}
        <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'catalog' ? 'block' : 'hidden lg:block'}`} id="cashier-left-panel">
        {/* Quick Barcode Scanner Form */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm" id="barcode-scan-panel">
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2 items-center">
            <div className="relative flex-1">
              <span className="absolute left-3 top-3.5 text-[10px] font-bold text-slate-400 font-sans tracking-wider uppercase">
                Barcode:
              </span>
              <input
                ref={barcodeInputRef}
                type="text"
                className="w-full pl-20 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-mono font-semibold text-sm"
                placeholder="Arahkan scanner / ketik barcode & tekan Enter..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                id="barcode-quick-input"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all text-sm cursor-pointer shadow-sm shadow-indigo-100"
              id="quick-scan-submit"
            >
              Cari
            </button>
          </form>

          {scanMessage.text && (
            <div 
              className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                scanMessage.isError ? 'bg-red-50 text-red-700' : 'bg-indigo-50 text-indigo-700'
              }`}
              id="scan-message"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{scanMessage.text}</span>
            </div>
          )}
        </div>

        {/* Search, Filter & Grid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col" id="catalog-panel">
          <div className="flex flex-col gap-3.5 mb-4" id="catalog-search-filters">
            {/* Search Input (Full Width) */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-800"
                placeholder="Cari nama produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="catalog-search-input"
              />
            </div>

            {/* Category horizontal pills (Below Search) */}
            <div className="flex gap-2 overflow-x-auto w-full pb-1" id="catalog-category-pills">
              <button
                onClick={() => setSelectedCategoryId('')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all shrink-0 cursor-pointer ${
                  selectedCategoryId === ''
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                id="pill-all-categories"
              >
                Semua
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all shrink-0 cursor-pointer ${
                    selectedCategoryId === cat.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  id={`pill-cat-${cat.id}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Grid */}
          {filteredCatalog.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400" id="empty-catalog-view">
              <AlertCircle className="w-12 h-12 mb-3 stroke-1 text-slate-300" />
              <p className="text-sm">Produk tidak ditemukan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3 overflow-y-auto max-h-[500px] pr-1" id="catalog-grid">
              {filteredCatalog.map((product) => {
                const isOutOfStock = product.stock <= 0;
                let cardStyle = 'border-l-4 border-l-indigo-500 bg-gradient-to-br from-indigo-50/20 to-white hover:border-indigo-500 hover:shadow-md';
                if (!isOutOfStock) {
                  if (product.categoryId === 'cat-sembako') {
                    cardStyle = 'border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50/20 to-white hover:border-emerald-500 hover:shadow-md';
                  } else if (product.categoryId === 'cat-mie') {
                    cardStyle = 'border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50/20 to-white hover:border-amber-500 hover:shadow-md';
                  } else if (product.categoryId === 'cat-minuman') {
                    cardStyle = 'border-l-4 border-l-sky-500 bg-gradient-to-br from-sky-50/20 to-white hover:border-sky-500 hover:shadow-md';
                  } else if (product.categoryId === 'cat-snack') {
                    cardStyle = 'border-l-4 border-l-rose-500 bg-gradient-to-br from-rose-50/20 to-white hover:border-rose-500 hover:shadow-md';
                  }
                } else {
                  cardStyle = 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed';
                }

                return (
                  <button
                    key={product.id}
                    disabled={isOutOfStock}
                    onClick={() => addToCart(product)}
                    className={`p-3.5 rounded-xl border border-slate-100 shadow-sm text-left flex flex-col justify-between transition-all h-36 relative overflow-hidden group cursor-pointer ${cardStyle}`}
                    id={`catalog-item-${product.id}`}
                  >
                    <div>
                      {/* Name */}
                      <h4 className="font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-700 transition-colors">
                        {product.name}
                      </h4>
                      {/* Subtitle / Unit & Stock inline to avoid overlapping */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] uppercase font-semibold text-slate-400">
                          {product.unit}
                        </span>
                        <span className="text-[10px] text-slate-300">•</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          product.stock <= 0
                            ? 'bg-red-100 text-red-700'
                            : product.stock <= 5
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          Stok: {product.stock}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      {/* Prices */}
                      <div className="text-sm font-extrabold text-slate-900">
                        {formatRupiah(product.priceRetail)}
                      </div>
                      <div className="text-[10px] text-indigo-600 font-semibold flex items-center gap-0.5 mt-0.5">
                        <span>Grosir:</span>
                        <span>{formatRupiah(product.priceWholesale)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Shopping Cart / Order Summary (5 cols on lg) */}
      <div className={`lg:col-span-5 ${mobileTab === 'cart' ? 'block' : 'hidden lg:block'}`} id="cashier-right-panel">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full sticky top-6" id="cart-panel">
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl" id="cart-header">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
              <ShoppingCart className="w-5 h-5 text-indigo-600" />
              <span>Keranjang Belanja</span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 cursor-pointer"
                id="clear-cart-btn"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan</span>
              </button>
            )}
          </div>

          {/* Cart List */}
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 flex-1" id="empty-cart-view">
              <ShoppingCart className="w-14 h-14 mb-3 stroke-1 text-slate-300" />
              <p className="text-sm font-medium">Keranjang masih kosong.</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px] text-center leading-relaxed">
                Pilih produk di katalog sebelah kiri atau scan barcode produk.
              </p>
            </div>
          ) : (
            <div className="flex-1 divide-y divide-slate-100 max-h-[380px] overflow-y-auto" id="cart-items-list">
              {cart.map((item) => {
                const price = item.priceType === 'wholesale' ? item.product.priceWholesale : item.product.priceRetail;
                const subtotal = price * item.quantity;

                return (
                  <div key={item.product.id} className="p-4 hover:bg-slate-50/50 transition-colors" id={`cart-item-${item.product.id}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h5 className="font-bold text-slate-800 leading-tight">
                          {item.product.name}
                        </h5>
                        <div className="flex items-center gap-2 mt-1">
                          {/* Price type override toggler */}
                          <select
                            value={item.priceType}
                            onChange={(e) => handlePriceTypeChange(item.product.id, e.target.value as any)}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer ${
                              item.priceType === 'wholesale'
                                ? 'bg-indigo-100 text-indigo-800 border-indigo-200/50'
                                : 'bg-blue-100 text-blue-800 border-blue-200/50'
                            }`}
                            id={`price-type-select-${item.product.id}`}
                          >
                            <option value="retail">Eceran ({formatRupiah(item.product.priceRetail)})</option>
                            <option value="wholesale">Grosir ({formatRupiah(item.product.priceWholesale)})</option>
                          </select>
                          <span className="text-[10px] text-slate-400">
                            Stok: {item.product.stock}
                          </span>
                        </div>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right font-extrabold text-slate-900 text-sm">
                        {formatRupiah(subtotal)}
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-3">
                      {/* Qty controller */}
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="px-2 py-1 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
                          id={`qty-minus-${item.product.id}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 py-1 font-mono text-xs font-bold text-slate-800 text-center min-w-[32px]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="px-2 py-1 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
                          id={`qty-plus-${item.product.id}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => removeFromCart(item.product.id, item.product.name)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50 cursor-pointer"
                        title="Hapus"
                        id={`cart-remove-${item.product.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl" id="cart-footer">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-semibold text-slate-500">Total Pembayaran</span>
                <span className="text-xl font-black text-slate-900" id="cart-total-amount">
                  {formatRupiah(totalAmount)}
                </span>
              </div>

              {/* Printer connectivity indicator status */}
              <div className="flex justify-between items-center mb-3 bg-white p-2.5 rounded-xl border border-slate-100 text-xs">
                <div className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className={`w-2.5 h-2.5 rounded-full ${activePrinter ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`} />
                  <span>
                    Printer: {activePrinter ? activePrinter.name : 'Belum Terhubung'}
                  </span>
                </div>
                {!activePrinter && (
                  <button
                    onClick={onConnectPrinter}
                    className="text-indigo-600 hover:text-indigo-700 font-bold transition-all flex items-center gap-0.5 cursor-pointer"
                    id="connect-printer-cart"
                  >
                    Hubungkan
                  </button>
                )}
              </div>

              <button
                onClick={handleOpenPayment}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-indigo-500/10 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                id="checkout-btn"
              >
                <CreditCard className="w-4 h-4" />
                <span>Bayar Sekarang</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Payment Input Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="payment-modal">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <span>Penerimaan Pembayaran</span>
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                id="close-payment-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="bg-indigo-50/80 p-4 rounded-2xl border border-indigo-100/50 text-center">
                <span className="text-xs font-semibold text-indigo-700 uppercase tracking-widest block mb-1">
                  Tagihan Transaksi
                </span>
                <span className="text-2xl font-black text-indigo-900" id="payment-modal-due">
                  {formatRupiah(totalAmount)}
                </span>
              </div>

              {/* Cash Paid Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">
                  Jumlah Uang Diterima <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-lg font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    autoFocus
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-lg font-bold text-slate-800 font-mono"
                    placeholder="Masukkan jumlah pembayaran..."
                    value={cashPaid}
                    onChange={(e) => setCashPaid(e.target.value === '' ? '' : Number(e.target.value))}
                    id="payment-cash-input"
                  />
                </div>
              </div>

              {/* Quick Cash Buttons */}
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Uang Pas & Nominal Cepat
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleQuickCash(totalAmount)}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer text-center"
                    id="quick-cash-pas"
                  >
                    Uang Pas
                  </button>
                  {[10000, 20000, 50000, 100000].map((val) => {
                    if (val < totalAmount) return null;
                    return (
                      <button
                        key={val}
                        onClick={() => handleQuickCash(val)}
                        className="py-2.5 px-3 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200/50 border border-transparent text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer text-center"
                        id={`quick-cash-${val}`}
                      >
                        {val.toLocaleString('id-ID')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Change (Kembalian) Calculation */}
              {cashPaid !== '' && (
                <div className={`p-4 rounded-2xl border text-center transition-all ${
                  Number(cashPaid) >= totalAmount
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                    : 'bg-red-50 border-red-100 text-red-800'
                }`} id="change-result-panel">
                  <span className="text-xs font-semibold uppercase tracking-wider block mb-1">
                    {Number(cashPaid) >= totalAmount ? 'Kembalian' : 'Kekurangan'}
                  </span>
                  <span className="text-xl font-extrabold font-mono">
                    {formatRupiah(Math.abs(Number(cashPaid) - totalAmount))}
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-2">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex-1 py-3 px-4 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-colors cursor-pointer"
                id="cancel-payment"
              >
                Batal
              </button>
              <button
                disabled={cashPaid === '' || Number(cashPaid) < totalAmount}
                onClick={handleCompletePayment}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer text-center flex items-center justify-center gap-1.5 uppercase"
                id="complete-payment"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Selesaikan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Receipt Printing / Success Modal */}
      {isReceiptModalOpen && lastCompletedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" id="receipt-modal">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 my-8">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                <span>Pembayaran Sukses!</span>
              </h3>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                id="close-receipt-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body: Contains Simulated thermal receipt printer */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start" id="receipt-modal-body">
              {/* Virtual Receipt Preview */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2.5">
                  Pratinjau Struk
                </span>
                
                {/* Scroll receipt wrapper */}
                <div className="relative bg-slate-100 p-4 rounded-xl w-full flex justify-center shadow-inner border border-slate-200">
                  <div 
                    className="bg-white p-4 font-mono text-[10px] text-black w-[220px] shadow-lg relative border-t-2 border-dashed border-slate-300 flex flex-col min-h-[250px]"
                    style={{ lineHeight: '1.25' }}
                    id="simulated-receipt"
                  >
                    {/* Raw formatted receipt preview */}
                    <pre className="whitespace-pre-wrap select-all text-slate-800 font-mono">
                       {formatReceiptText(lastCompletedSale, shopName, shopAddress)}
                    </pre>

                    {/* Paper zig-zag tear design effect at the bottom */}
                    <div className="absolute -bottom-1 left-0 right-0 h-1 bg-[linear-gradient(135deg,transparent_25%,#fff_25%,#fff_50%,transparent_50%,transparent_75%,#fff_75%)] bg-[length:6px_6px]" />
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="space-y-4 flex flex-col justify-center h-full">
                <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-100/50">
                  <div className="flex items-center gap-2 mb-1.5 text-indigo-800 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Transaksi Berhasil</span>
                  </div>
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    Stok barang otomatis terpotong. Rekap penjualan ter-update real-time.
                  </p>
                </div>

                {/* Print Controls */}
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Opsi Cetak & Salin
                  </span>

                  {/* Bluetooth Printer trigger button */}
                  <button
                    onClick={() => triggerBluetoothPrint(lastCompletedSale)}
                    disabled={isPrinting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    id="bluetooth-print-btn"
                  >
                    {isPrinting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Printer className="w-4 h-4" />
                    )}
                    <span>
                      {isPrinting ? 'Mencetak...' : activePrinter ? `Cetak via ${activePrinter.name}` : 'Cetak Struk (Bluetooth)'}
                    </span>
                  </button>

                  {!activePrinter && (
                    <button
                      onClick={onConnectPrinter}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                      id="connect-bt-receipt"
                    >
                      <span>Hubungkan Printer Bluetooth Baru</span>
                    </button>
                  )}

                  {/* Plain Text Clipboard Copy */}
                  <button
                    onClick={handleCopyReceipt}
                    className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    id="copy-plain-receipt-btn"
                  >
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>{copiedReceipt ? 'Disalin!' : 'Salin Teks Struk'}</span>
                  </button>

                  {/* Browser Native Print */}
                  <button
                    onClick={handleBrowserPrint}
                    className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium py-1.5 px-4 rounded-xl text-[10px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    id="browser-print-btn"
                  >
                    <span>Print via Browser (Kertas HVS/A4)</span>
                  </button>
                </div>

                {printError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-1.5 font-medium border border-red-100" id="print-error-display">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{printError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  setLastCompletedSale(null);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-sm transition-colors cursor-pointer uppercase tracking-wider text-center flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/10"
                id="new-transaction-btn"
              >
                <span>Mulai Transaksi Baru</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* BOTTOM PANEL: Recent Transaction History */}
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col mt-6" id="recent-sales-panel">
      {/* Header */}
      <div className="border-b border-slate-150 pb-4 mb-4 flex items-center justify-between">
        <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
          <span>Riwayat Transaksi Terbaru (Hari Ini)</span>
          <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full">
            {sales.filter(s => new Date(s.timestamp).toDateString() === new Date().toDateString()).length} Transaksi
          </span>
        </h3>
      </div>

      {/* Table/List */}
      {sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400" id="empty-recent-sales">
          <CheckCircle2 className="w-12 h-12 mb-3 stroke-1 text-slate-300" />
          <p className="text-sm font-medium">Belum ada transaksi hari ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3" id="recent-sales-mobile">
            {sales.slice(0, 5).map((sale) => {
              const isExpanded = expandedSaleId === sale.id;
              const totalQty = sale.items.reduce((sum, item) => sum + item.quantity, 0);
              return (
                <div key={sale.id} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3 relative">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-extrabold text-sm text-slate-800">{sale.invoiceNumber}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(sale.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 font-medium pt-2 border-t border-slate-100/50">
                    <span>Total: <strong className="text-slate-800 font-extrabold">{formatRupiah(sale.totalAmount)}</strong></span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleExpandSale(sale.id)}
                        className="text-indigo-600 hover:text-indigo-700 font-extrabold text-xs flex items-center gap-0.5 cursor-pointer"
                      >
                        {isExpanded ? 'Tutup' : 'Detail'}
                      </button>
                      <button
                        onClick={() => handleReprint(sale)}
                        disabled={isPrintingSaleId === sale.id}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer"
                        title="Cetak Ulang Struk"
                      >
                        {isPrintingSaleId === sale.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        ) : (
                          <Printer className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteSale(sale)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                        title="Batalkan Transaksi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 pt-3 border-t border-dashed border-slate-200 bg-slate-100/80 p-3 rounded-xl space-y-2 text-xs">
                      <div className="font-extrabold text-slate-400 uppercase tracking-widest text-[9px] mb-1">Daftar Barang:</div>
                      <div className="space-y-1.5 divide-y divide-slate-200/50">
                        {sale.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between py-1">
                            <span className="font-semibold text-slate-700">{item.name} (x{item.quantity})</span>
                            <span className="font-bold text-slate-800">{formatRupiah(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto" id="recent-sales-desktop">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-medium uppercase tracking-wider">
                  <th className="py-2.5 px-4 w-10"></th>
                  <th className="py-2.5 px-4 font-semibold">No. Invoice</th>
                  <th className="py-2.5 px-4 font-semibold">Waktu / Tanggal</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Jumlah Barang</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Total Belanja</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm text-slate-700">
                {sales.slice(0, 5).map((sale) => {
                  const isExpanded = expandedSaleId === sale.id;
                  const totalQty = sale.items.reduce((sum, item) => sum + item.quantity, 0);
                  return (
                    <React.Fragment key={sale.id}>
                      <tr className={`hover:bg-slate-50/50 transition-colors ${isExpanded ? 'bg-slate-50/70' : ''}`}>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => toggleExpandSale(sale.id)}
                            className="p-1 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{sale.invoiceNumber}</td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(sale.timestamp).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600 font-medium">{totalQty} Item</td>
                        <td className="py-3 px-4 text-right font-extrabold text-slate-900">{formatRupiah(sale.totalAmount)}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View detail button */}
                            <button
                              onClick={() => toggleExpandSale(sale.id)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg cursor-pointer"
                              title="Lihat Detail Transaksi"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {/* Print */}
                            <button
                              onClick={() => handleReprint(sale)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg cursor-pointer"
                              title="Cetak Struk"
                            >
                              {isPrintingSaleId === sale.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                              ) : (
                                <Printer className="w-4 h-4" />
                              )}
                            </button>
                            
                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteSale(sale)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-red-600 rounded-lg cursor-pointer"
                              title="Batalkan Transaksi & Kembalikan Stok"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-50/30">
                          <td colSpan={6} className="py-4 px-8 border-t border-b border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Left purchased products */}
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
                                            item.priceType === 'wholesale' ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'
                                          }`}>
                                            {item.priceType === 'wholesale' ? 'Grosir' : 'Eceran'}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="font-bold text-slate-800">{formatRupiah(item.subtotal)}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Right payment audit */}
                              <div className="space-y-4">
                                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                  Informasi Pembayaran
                                </span>
                                <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Total Belanja:</span>
                                    <span className="font-bold text-slate-800">{formatRupiah(sale.totalAmount)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Uang Tunai:</span>
                                    <span className="font-bold text-slate-800">{formatRupiah(sale.cashPaid)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm border-t border-slate-100 pt-2">
                                    <span className="text-indigo-700 font-bold">Kembalian:</span>
                                    <span className="font-extrabold text-indigo-800">{formatRupiah(sale.changeDue)}</span>
                                  </div>
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
