import React, { useState, useRef, useEffect } from 'react';
import { Product, Category, CartItem, Sale, PrinterDevice } from '../types';
import { 
  Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, 
  CheckCircle2, Printer, X, Sparkles, Copy, AlertCircle, RefreshCw 
} from 'lucide-react';
import { formatRupiah, formatReceiptText, generateEscPosBytes, sendToPrinter } from '../utils/bluetoothPrinter';

interface TransactionCashierProps {
  products: Product[];
  categories: Category[];
  activePrinter: PrinterDevice | null;
  onConnectPrinter: () => Promise<void>;
  onAddSale: (sale: Sale) => void;
  onUpdateProductStock: (productId: string, newStock: number) => void;
  shopName: string;
  shopAddress: string;
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
}: TransactionCashierProps) {
  // Shopping Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');
  
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
      if (matchedProduct.stock <= 0) {
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
          alert(`Stok tidak mencukupi. Stok maksimal: ${product.stock}`);
          return prevCart;
        }

        // Check if quantity triggers wholesale pricing automatically
        const priceType = newQty >= product.wholesaleMinQty ? 'wholesale' : 'retail';

        const updatedCart = [...prevCart];
        updatedCart[existingIndex] = {
          ...item,
          quantity: newQty,
          priceType,
        };
        return updatedCart;
      } else {
        // New item - starts at qty 1, price type is retail unless wholesaleMinQty is 1 (rare but possible)
        const priceType = 1 >= product.wholesaleMinQty ? 'wholesale' : 'retail';
        return [...prevCart, { product, quantity: 1, priceType }];
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
              alert(`Stok tidak mencukupi. Stok maksimal: ${item.product.stock}`);
              return item;
            }

            // Determine price type automatically based on new qty
            const priceType = newQty >= item.product.wholesaleMinQty ? 'wholesale' : 'retail';

            return {
              ...item,
              quantity: newQty,
              priceType,
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
  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
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

    // Deduct stock for all products
    cart.forEach((item) => {
      onUpdateProductStock(item.product.id, item.product.stock - item.quantity);
    });

    // Add sale to history
    onAddSale(newSale);
    setLastCompletedSale(newSale);

    // Reset checkout flow
    setIsPaymentModalOpen(false);
    setCart([]);
    setIsReceiptModalOpen(true);

    // Auto-trigger Bluetooth print if printer is already connected and active!
    if (activePrinter && activePrinter.characteristic) {
      triggerBluetoothPrint(newSale);
    }
  };

  // Perform actual BLE print
  const triggerBluetoothPrint = async (sale: Sale) => {
    if (!activePrinter || !activePrinter.characteristic) {
      setPrintError('Printer Bluetooth belum terhubung.');
      return;
    }

    setIsPrinting(true);
    setPrintError('');
    try {
      const bytes = generateEscPosBytes(sale, shopName, shopAddress);
      await sendToPrinter(activePrinter.characteristic, bytes);
    } catch (err: any) {
      console.error(err);
      setPrintError('Gagal mencetak. Hubungkan ulang printer Bluetooth.');
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
    return matchesSearch && matchesCategory;
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
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center mb-4" id="catalog-search-filters">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-800"
                placeholder="Cari nama produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="catalog-search-input"
              />
            </div>

            {/* Category horizontal pills */}
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1" id="catalog-category-pills">
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
                return (
                  <button
                    key={product.id}
                    disabled={isOutOfStock}
                    onClick={() => addToCart(product)}
                    className={`p-3.5 rounded-xl border border-slate-100 shadow-sm text-left flex flex-col justify-between transition-all h-36 relative overflow-hidden group cursor-pointer ${
                      isOutOfStock
                        ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'
                        : 'bg-white hover:border-indigo-500 hover:shadow-md'
                    }`}
                    id={`catalog-item-${product.id}`}
                  >
                    <div>
                      {/* Name */}
                      <h4 className="font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-700 transition-colors">
                        {product.name}
                      </h4>
                      {/* Subtitle / Unit */}
                      <span className="text-[10px] uppercase font-semibold text-slate-400 mt-1 block">
                        {product.unit}
                      </span>
                    </div>

                    <div className="mt-3">
                      {/* Prices */}
                      <div className="text-sm font-extrabold text-slate-900">
                        {formatRupiah(product.priceRetail)}
                      </div>
                      <div className="text-[10px] text-indigo-600 font-semibold flex items-center gap-0.5 mt-0.5">
                        <span>Grosir:</span>
                        <span>{formatRupiah(product.priceWholesale)}</span>
                        <span className="text-[8px] text-slate-400 font-normal">(min {product.wholesaleMinQty})</span>
                      </div>
                    </div>

                    {/* Stock Tag */}
                    <div className="absolute right-2 top-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        product.stock <= 0
                          ? 'bg-red-100 text-red-700'
                          : product.stock <= 5
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        Stok: {product.stock}
                      </span>
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
                onClick={() => setCart([])}
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
                        onClick={() => removeFromCart(item.product.id)}
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
  </div>
  );
}
