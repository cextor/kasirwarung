import React, { useState, useRef, useEffect } from 'react';
import { Product, Category } from '../types';
import { Plus, Trash2, Edit2, ShoppingBag, Search, Filter, RefreshCcw, Tag, X, Sparkles } from 'lucide-react';
import { formatRupiah } from '../utils/bluetoothPrinter';
import Swal from 'sweetalert2';

interface ProductManagementProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddCategory: (category: Omit<Category, 'id'>) => Promise<Category | undefined>;
}

export default function ProductManagement({
  products,
  categories,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddCategory,
}: ProductManagementProps) {
  // Form State
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priceRetail, setPriceRetail] = useState<number | ''>('');
  const [priceWholesale, setPriceWholesale] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [unit, setUnit] = useState('pcs');
  const [isActive, setIsActive] = useState(true);
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Select2 Category states
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Focus barcode input when modal is opened
  useEffect(() => {
    if (isModalOpen) {
      const timer = setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen]);

  // Global scanner listener: open add modal when scanning a barcode outside inputs
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // If modal is open, let the modal's input handle it
      if (isModalOpen) return;

      // Ignore modifier keys
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // If user is focusing on an input (like search filter), do not intercept
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      const currentTime = Date.now();
      
      // Barcode scanner typed characters are very fast (typically < 30ms delay).
      // If the delay is > 100ms, it is a slow manual type, so reset the buffer.
      if (currentTime - lastKeyTime > 100) {
        buffer = '';
      }
      
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 6 && /^\d+$/.test(buffer)) {
          e.preventDefault();
          
          // Check if barcode already exists
          const existingProduct = products.find((p) => p.barcode === buffer);
          if (existingProduct) {
            Swal.fire({
              title: 'Barcode Sudah Digunakan',
              html: `Kode barcode <strong>${buffer}</strong> sudah digunakan oleh produk:<br/><br/><strong class="text-indigo-600 text-lg">${existingProduct.name}</strong>`,
              icon: 'warning',
              confirmButtonColor: '#4f46e5'
            });
            buffer = '';
            return;
          }

          resetForm();
          setBarcode(buffer);
          setIsModalOpen(true);
          buffer = '';
        }
      } else if (e.key.length === 1 && /^\d+$/.test(e.key)) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen, products]);


  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Nama produk wajib diisi.');
    if (!categoryId) return setError('Pilih kategori produk.');
    if (priceRetail === '' || priceRetail <= 0) return setError('Harga satuan harus lebih besar dari 0.');
    if (priceWholesale === '' || priceWholesale <= 0) return setError('Harga grosir harus lebih besar dari 0.');
    if (stock === '' || stock < 0) return setError('Stok tidak boleh negatif.');
    if (!unit.trim()) return setError('Satuan produk wajib diisi.');

    const productData = {
      name: name.trim(),
      barcode: barcode.trim() || undefined,
      categoryId,
      priceRetail: Number(priceRetail),
      priceWholesale: Number(priceWholesale),
      wholesaleMinQty: 0,
      stock: Number(stock),
      unit: unit.trim().toLowerCase(),
      isActive,
    };

    // Validate unique name
    const nameLower = name.trim().toLowerCase();
    const isNameDuplicate = editingProduct
      ? products.some((p) => p.id !== editingProduct.id && p.name.toLowerCase() === nameLower)
      : products.some((p) => p.name.toLowerCase() === nameLower);

    if (isNameDuplicate) {
      Swal.fire({
        title: 'Nama Produk Sudah Digunakan',
        text: `Nama produk "${name.trim()}" sudah terdaftar di katalog. Silakan gunakan nama produk lain.`,
        icon: 'warning',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }

    // Validate unique barcode
    const barcodeTrimmed = barcode.trim();
    if (barcodeTrimmed) {
      const existingProduct = products.find(
        (p) => (editingProduct ? p.id !== editingProduct.id : true) && p.barcode === barcodeTrimmed
      );

      if (existingProduct) {
        Swal.fire({
          title: 'Barcode Sudah Digunakan',
          html: `Kode barcode <strong>${barcodeTrimmed}</strong> sudah digunakan oleh produk:<br/><br/><strong class="text-indigo-600 text-lg">${existingProduct.name}</strong>`,
          icon: 'warning',
          confirmButtonColor: '#4f46e5'
        });
        return;
      }
    }

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        ...productData,
      });
      setEditingProduct(null);
    } else {
      onAddProduct(productData);
    }

    // Reset Form
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setBarcode('');
    setCategoryId('');
    setPriceRetail('');
    setPriceWholesale('');
    setStock('');
    setUnit('pcs');
    setIsActive(true);
    setEditingProduct(null);
    setError('');
    setIsModalOpen(false);
    setIsCategoryDropdownOpen(false);
    setCategorySearch('');
  };

  const handleQuickAddCategory = () => {
    Swal.fire({
      title: 'Tambah Kategori Baru',
      input: 'text',
      inputLabel: 'Nama Kategori',
      inputPlaceholder: 'Contoh: Sembako, Rokok, Mie...',
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#94a3b8',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Nama kategori wajib diisi!';
        }
        const exists = categories.some((c) => c.name.toLowerCase() === value.trim().toLowerCase());
        if (exists) {
          return 'Nama kategori sudah digunakan!';
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const categoryName = result.value.trim();
        try {
          const created = await onAddCategory({ name: categoryName, description: '' });
          if (created) {
            setCategoryId(created.id);
            setIsCategoryDropdownOpen(false);
            setCategorySearch('');
          }
        } catch (err) {
          console.error('Gagal menambah kategori cepat:', err);
        }
      }
    });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setBarcode(product.barcode || '');
    setCategoryId(product.categoryId);
    setPriceRetail(product.priceRetail);
    setPriceWholesale(product.priceWholesale);
    setStock(product.stock);
    setUnit(product.unit);
    setIsActive(product.isActive !== false);
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Swal.fire({
      title: 'Apakah Anda yakin?',
      text: 'Produk ini akan dihapus secara permanen dari katalog!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        onDeleteProduct(id);
      }
    });
  };

  // Generate random mock barcode
  const handleGenerateBarcode = () => {
    const randomCode = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    setBarcode(randomCode);
  };

  // Filtering & Sorting Logic
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.barcode && product.barcode.includes(searchQuery));
      
      const matchesCategory = selectedCategoryFilter === '' || product.categoryId === selectedCategoryFilter;
      
      let matchesStock = true;
      if (stockFilter === 'low') {
        matchesStock = product.stock > 0 && product.stock <= 5;
      } else if (stockFilter === 'out') {
        matchesStock = product.stock === 0;
      }

      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'id'));

  return (
    <div className="flex flex-col gap-6" id="product-mgmt-container">
      {/* Product Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="product-modal">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-indigo-50/80 border-b border-indigo-100/40 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-indigo-900">
                  {editingProduct ? 'Ubah Detail Produk' : 'Tambah Produk Baru'}
                </h2>
              </div>
              <button
                onClick={resetForm}
                className="p-1 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-900 rounded-lg transition-colors cursor-pointer"
                id="close-product-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1" id="product-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Barcode */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-slate-600">
                      Barcode / Kode Produk (Opsional)
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateBarcode}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
                      id="gen-barcode-btn"
                    >
                      Acak Kode
                    </button>
                  </div>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-mono text-sm"
                    placeholder="Contoh: 8999906101901"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    id="product-barcode"
                  />
                </div>

                {/* Nama Produk */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Nama Produk <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                    placeholder="Contoh: Indomie Goreng Spesial"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    id="product-name"
                  />
                </div>
                
                {/* Kategori (Select2 replica in React) */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1" ref={categoryDropdownRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                          setCategorySearch('');
                        }}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 bg-white flex justify-between items-center text-left text-sm"
                        id="product-category-select2-btn"
                      >
                        <span className={categoryId ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                          {categories.find((c) => c.id === categoryId)?.name || 'Pilih Kategori'}
                        </span>
                        <span className="text-slate-400 text-xs">▼</span>
                      </button>

                      {isCategoryDropdownOpen && (
                        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-72">
                          {/* Search input */}
                          <div className="p-2 border-b border-slate-100 bg-slate-50">
                            <input
                              type="text"
                              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                              placeholder="Cari kategori..."
                              value={categorySearch}
                              onChange={(e) => setCategorySearch(e.target.value)}
                              autoFocus
                              id="select2-search-input"
                            />
                          </div>
                          {/* Categories List */}
                          <div className="overflow-y-auto max-h-48 divide-y divide-slate-50">
                            {[...categories].filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 ? (
                              <div className="p-3 text-xs text-slate-400 text-center">Kategori tidak ditemukan</div>
                            ) : (
                              [...categories]
                                .filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                                .sort((a, b) => a.name.localeCompare(b.name, 'id'))
                                .map((cat) => (
                                  <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => {
                                      setCategoryId(cat.id);
                                      setIsCategoryDropdownOpen(false);
                                      setCategorySearch('');
                                    }}
                                    className={`w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-indigo-50 hover:text-indigo-900 transition-all flex justify-between items-center cursor-pointer ${
                                      categoryId === cat.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                                    }`}
                                  >
                                    <span>{cat.name}</span>
                                    {categoryId === cat.id && <span className="text-indigo-600 font-bold">✓</span>}
                                  </button>
                                ))
                            )}
                          </div>

                          {/* Quick Add Category Option */}
                          <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                            <button
                              type="button"
                              onClick={handleQuickAddCategory}
                              className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                              id="quick-add-category-btn"
                            >
                              + Tambah Kategori Baru
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Add Category Button next to the input */}
                    <button
                      type="button"
                      onClick={handleQuickAddCategory}
                      className="px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer shadow-sm shadow-indigo-100 shrink-0"
                      title="Tambah Kategori Baru"
                      id="quick-add-category-input-btn"
                    >
                      <Plus className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {/* Satuan Jual */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Satuan Jual <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                    placeholder="pcs, sachet, kg, pack"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    id="product-unit"
                  />
                </div>

                {/* Harga Satuan */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Harga Satuan (Eceran) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 text-sm">Rp</span>
                    <input
                      type="number"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                      placeholder="3.500"
                      value={priceRetail}
                      onChange={(e) => setPriceRetail(e.target.value === '' ? '' : Number(e.target.value))}
                      id="product-price-retail"
                    />
                  </div>
                </div>

                {/* Harga Grosir */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Harga Grosir <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 text-sm">Rp</span>
                    <input
                      type="number"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                      placeholder="3.200"
                      value={priceWholesale}
                      onChange={(e) => setPriceWholesale(e.target.value === '' ? '' : Number(e.target.value))}
                      id="product-price-wholesale"
                    />
                  </div>
                </div>


                {/* Stok Awal */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Stok Awal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                    placeholder="100"
                    value={stock}
                    onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                    id="product-stock"
                  />
                </div>

                {/* Status Aktif */}
                <div className="flex items-center gap-3 pt-2 md:col-span-2">
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                      isActive ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                    role="switch"
                    aria-checked={isActive}
                    id="product-status-toggle"
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-800">Produk Aktif / Siap Jual</span>
                    <span className="text-xs text-slate-400">Nonaktifkan jika produk sedang tidak dijual</span>
                  </div>
                </div>
              </div>

              {error && <p className="text-xs text-red-500 font-semibold" id="product-error">{error}</p>}

              {/* Modal Footer */}
              <div className="flex gap-2 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2.5 px-6 rounded-xl transition-all text-sm cursor-pointer"
                  id="product-cancel-btn"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl shadow-md shadow-indigo-100 transition-all text-sm cursor-pointer"
                  id="product-submit-btn"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto-Scan Active Guide Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-5 rounded-2xl border border-indigo-950 shadow-md shadow-indigo-950/10 flex items-center gap-4.5 min-h-[90px] group animate-fade-in" id="catalog-autoscan-banner">
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Active Pulse green light */}
            <div className="flex items-center gap-1.5 bg-indigo-950/50 px-2.5 py-1 rounded-full border border-indigo-800/40 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-200">Auto-Scan Aktif</span>
            </div>
          </div>
          <p className="text-xs text-indigo-100 leading-relaxed font-semibold text-pretty">
            Anda dapat <strong className="text-emerald-400 underline decoration-emerald-400/30 underline-offset-2 font-black">langsung scan barcode produk</strong> yang ingin ditambah di halaman ini agar form tambah produk otomatis muncul tanpa menekan tombol tambah produk.
          </p>
        </div>

        {/* Interactive Sparkles Box */}
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-800/30 border border-indigo-700/30 text-indigo-300 shadow-inner shrink-0 group-hover:scale-105 transition-all">
          <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
        </div>
      </div>

      {/* Product List Panel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden" id="product-list-panel">
        {/* Header */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Daftar Katalog Produk</span>
            <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full" id="product-total-badge">
              {products.length} Item
            </span>
          </h2>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md shadow-indigo-100 transition-all text-xs flex items-center gap-1.5 cursor-pointer"
            id="open-add-product-modal"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-6" id="product-list-body">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3" id="filters-grid">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                placeholder="Cari nama / barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="product-search-input"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 bg-white"
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                id="category-filter-select"
              >
                <option value="">Semua Kategori</option>
                {[...categories].sort((a, b) => a.name.localeCompare(b.name, 'id')).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock status filter */}
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100" id="stock-filter-tabs">
              <button
                onClick={() => setStockFilter('all')}
                className={`flex-1 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  stockFilter === 'all'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                id="stock-filter-all"
              >
                Semua
              </button>
              <button
                onClick={() => setStockFilter('low')}
                className={`flex-1 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  stockFilter === 'low'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-amber-600'
                }`}
                id="stock-filter-low"
              >
                Stok Tipis (≤5)
              </button>
              <button
                onClick={() => setStockFilter('out')}
                className={`flex-1 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  stockFilter === 'out'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-red-600'
                }`}
                id="stock-filter-out"
              >
                Habis (0)
              </button>
            </div>
          </div>

        {/* Product Table */}
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400" id="empty-products-view">
            <ShoppingBag className="w-12 h-12 mb-3 stroke-1 text-slate-300" />
            <p className="text-sm">Produk tidak ditemukan atau belum ditambahkan.</p>
          </div>
        ) : (
          <div className="space-y-4" id="products-lists-container">
            {/* Mobile Product Card List (Visible on mobile only) */}
            <div className="md:hidden space-y-3.5" id="products-mobile-list">
              {filteredProducts.map((product) => {
                const category = categories.find((c) => c.id === product.categoryId);
                
                let stockColor = 'bg-slate-100 text-slate-700';
                if (product.stock === 0) {
                  stockColor = 'bg-red-50 text-red-700 font-semibold border border-red-100';
                } else if (product.stock <= 5) {
                  stockColor = 'bg-amber-50 text-amber-700 font-semibold border border-amber-100';
                }

                let cardStyle = 'border-l-4 border-l-indigo-500 bg-gradient-to-br from-indigo-50/10 to-white';
                if (product.categoryId === 'cat-sembako') {
                  cardStyle = 'border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50/10 to-white';
                } else if (product.categoryId === 'cat-mie') {
                  cardStyle = 'border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50/10 to-white';
                } else if (product.categoryId === 'cat-minuman') {
                  cardStyle = 'border-l-4 border-l-sky-500 bg-gradient-to-br from-sky-50/10 to-white';
                } else if (product.categoryId === 'cat-snack') {
                  cardStyle = 'border-l-4 border-l-rose-500 bg-gradient-to-br from-rose-50/10 to-white';
                }

                return (
                  <div key={product.id} className={`p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 relative ${cardStyle}`} id={`product-card-${product.id}`}>
                    <div className="flex justify-between items-start pr-16">
                      <div>
                        <h4 className="font-bold text-slate-800 leading-snug">{product.name}</h4>
                        <span className="inline-block text-[10px] uppercase font-bold px-2 py-0.5 mt-1.5 bg-slate-100 text-slate-500 rounded-md">
                          {category ? category.name : 'Tanpa Kategori'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/60 p-3 rounded-xl border border-slate-100/50">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Harga Eceran</span>
                        <span className="font-extrabold text-slate-800 text-sm">{formatRupiah(product.priceRetail)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Harga Grosir</span>
                        <span className="font-extrabold text-indigo-600 text-sm">{formatRupiah(product.priceWholesale)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex gap-1.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${stockColor}`}>
                          Stok: {product.stock} {product.unit}
                        </span>
                        
                        <button
                          onClick={() => onUpdateProduct({ ...product, isActive: product.isActive === false })}
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition-all cursor-pointer ${
                            product.isActive !== false
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-slate-100 text-slate-400 line-through border border-slate-200'
                          }`}
                          title="Klik untuk mengubah status aktif"
                          id={`status-toggle-mobile-btn-${product.id}`}
                        >
                          {product.isActive !== false ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </div>
                      
                      <span className="text-[10px] font-mono text-slate-400 font-medium">
                        BC: {product.barcode || '-'}
                      </span>
                    </div>

                    {/* Absolute positioning of action buttons in the corner */}
                    <div className="absolute right-3 top-3 flex items-center gap-0.5">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                        title="Edit Produk"
                        id={`edit-product-mobile-btn-${product.id}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 hover:bg-slate-100 text-slate-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Produk"
                        id={`delete-product-mobile-btn-${product.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Product Table (Hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto" id="products-table-wrapper">
              <table className="w-full text-left border-collapse" id="products-table">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-medium uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">Produk</th>
                    <th className="py-3 px-4 font-semibold">Kategori</th>
                    <th className="py-3 px-4 font-semibold text-right">Harga Satuan</th>
                    <th className="py-3 px-4 font-semibold text-right">Harga Grosir</th>
                    <th className="py-3 px-4 font-semibold text-center">Stok</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                    <th className="py-3 px-4 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm text-slate-700">
                  {filteredProducts.map((product) => {
                    const category = categories.find((c) => c.id === product.categoryId);
                    
                    let stockColor = 'bg-slate-100 text-slate-700';
                    if (product.stock === 0) {
                      stockColor = 'bg-red-50 text-red-700 font-semibold';
                    } else if (product.stock <= 5) {
                      stockColor = 'bg-amber-50 text-amber-700 font-semibold';
                    }

                    return (
                      <tr key={product.id} className="hover:bg-slate-50 transition-colors" id={`product-row-${product.id}`}>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 leading-tight">{product.name}</div>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400 font-mono">
                            {product.barcode ? (
                              <span>BC: {product.barcode}</span>
                            ) : (
                              <span className="italic text-slate-300">Tanpa barcode</span>
                            )}
                            <span>•</span>
                            <span>{product.unit}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {category ? category.name : <em className="text-red-400 text-xs">Tanpa Kategori</em>}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                          {formatRupiah(product.priceRetail)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-600">
                          <div className="font-semibold text-indigo-600">{formatRupiah(product.priceWholesale)}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${stockColor}`}>
                            {product.stock} {product.unit}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => onUpdateProduct({ ...product, isActive: product.isActive === false })}
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition-all hover:scale-105 ${
                              product.isActive !== false
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-slate-100 text-slate-400 line-through hover:bg-slate-200 border border-slate-200'
                            }`}
                            title="Klik untuk mengubah status aktif"
                            id={`status-toggle-btn-${product.id}`}
                          >
                            {product.isActive !== false ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                              title="Edit Produk"
                              id={`edit-product-btn-${product.id}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Produk"
                              id={`delete-product-btn-${product.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
