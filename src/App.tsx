import React, { useState, useEffect } from 'react';
import { Category, Product, Sale, PrinterDevice } from './types';
import { 
  INITIAL_CATEGORIES, 
  INITIAL_PRODUCTS, 
  INITIAL_SALES 
} from './data/mockData';
import { 
  connectBluetoothPrinter, 
  generateEscPosBytes, 
  sendToPrinter 
} from './utils/bluetoothPrinter';

// Component Imports
import TransactionCashier from './components/TransactionCashier';
import ProductManagement from './components/ProductManagement';
import CategoryManagement from './components/CategoryManagement';
import SalesHistory from './components/SalesHistory';
import TopProducts from './components/TopProducts';
import BluetoothPrinterConnector from './components/BluetoothPrinterConnector';

// Icon Imports
import { 
  ShoppingCart, ShoppingBag, FolderTree, History, 
  Trophy, Printer, Store, Menu, X, ArrowLeftRight 
} from 'lucide-react';

export default function App() {
  // State variables loaded from LocalStorage or seeded from mockData
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [shopName, setShopName] = useState('WARUNG SEJAHTERA');
  const [shopAddress, setShopAddress] = useState('Kec. Sukamaju, Jawa Barat');

  // Sidebar navigation and device settings
  const [activeTab, setActiveTab] = useState<'cashier' | 'products' | 'categories' | 'sales' | 'charts' | 'printer'>('cashier');
  const [activePrinter, setActivePrinter] = useState<PrinterDevice | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initialize and load from local storage
  useEffect(() => {
    try {
      const storedCategories = localStorage.getItem('warung_categories');
      const storedProducts = localStorage.getItem('warung_products');
      const storedSales = localStorage.getItem('warung_sales');
      const storedShopName = localStorage.getItem('warung_shop_name');
      const storedShopAddress = localStorage.getItem('warung_shop_address');

      if (storedCategories) setCategories(JSON.parse(storedCategories));
      else {
        setCategories(INITIAL_CATEGORIES);
        localStorage.setItem('warung_categories', JSON.stringify(INITIAL_CATEGORIES));
      }

      if (storedProducts) setProducts(JSON.parse(storedProducts));
      else {
        setProducts(INITIAL_PRODUCTS);
        localStorage.setItem('warung_products', JSON.stringify(INITIAL_PRODUCTS));
      }

      if (storedSales) setSales(JSON.parse(storedSales));
      else {
        setSales(INITIAL_SALES);
        localStorage.setItem('warung_sales', JSON.stringify(INITIAL_SALES));
      }

      if (storedShopName) setShopName(storedShopName);
      if (storedShopAddress) setShopAddress(storedShopAddress);
    } catch (e) {
      console.error('Failed to load storage state:', e);
    }
  }, []);

  // Sync to LocalStorage whenever states modify
  const saveCategories = (updated: Category[]) => {
    setCategories(updated);
    localStorage.setItem('warung_categories', JSON.stringify(updated));
  };

  const saveProducts = (updated: Product[]) => {
    setProducts(updated);
    localStorage.setItem('warung_products', JSON.stringify(updated));
  };

  const saveSales = (updated: Sale[]) => {
    setSales(updated);
    localStorage.setItem('warung_sales', JSON.stringify(updated));
  };

  const saveShopName = (name: string) => {
    setShopName(name);
    localStorage.setItem('warung_shop_name', name);
  };

  const saveShopAddress = (address: string) => {
    setShopAddress(address);
    localStorage.setItem('warung_shop_address', address);
  };

  // CATEGORY OPERATIONS
  const handleAddCategory = (catData: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      ...catData,
    };
    saveCategories([...categories, newCategory]);
  };

  const handleUpdateCategory = (updated: Category) => {
    saveCategories(categories.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleDeleteCategory = (id: string) => {
    saveCategories(categories.filter((c) => c.id !== id));
  };

  // PRODUCT OPERATIONS
  const handleAddProduct = (prodData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      ...prodData,
    };
    saveProducts([...products, newProduct]);
  };

  const handleUpdateProduct = (updated: Product) => {
    saveProducts(products.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleUpdateProductStock = (productId: string, newStock: number) => {
    const updatedProducts = products.map((p) => {
      if (p.id === productId) {
        return { ...p, stock: Math.max(0, newStock) };
      }
      return p;
    });
    saveProducts(updatedProducts);
  };

  const handleDeleteProduct = (id: string) => {
    saveProducts(products.filter((p) => p.id !== id));
  };

  // SALES OPERATIONS
  const handleAddSale = (newSale: Sale) => {
    saveSales([...sales, newSale]);
  };

  // Cancel transaction (Delete) & restore all item stocks!
  const handleDeleteSale = (saleId: string) => {
    const saleToDelete = sales.find((s) => s.id === saleId);
    if (!saleToDelete) return;

    // Restore stock of all sold items back to catalog products
    const restoredProducts = products.map((prod) => {
      const soldItem = saleToDelete.items.find((it) => it.productId === prod.id);
      if (soldItem) {
        return { ...prod, stock: prod.stock + soldItem.quantity };
      }
      return prod;
    });

    saveProducts(restoredProducts);
    saveSales(sales.filter((s) => s.id !== saleId));
  };

  // BLUETOOTH PRINTER MANAGEMENT
  const handleConnectPrinter = async () => {
    try {
      const device = await connectBluetoothPrinter();
      setActivePrinter(device);
    } catch (err: any) {
      alert(err.message || 'Gagal menyambungkan ke printer Bluetooth.');
    }
  };

  const handleDisconnectPrinter = () => {
    if (activePrinter && activePrinter.gattServer) {
      activePrinter.gattServer.disconnect();
    }
    setActivePrinter(null);
  };

  const handleTriggerTestPrint = async () => {
    if (!activePrinter || !activePrinter.characteristic) {
      throw new Error('Printer belum terhubung.');
    }

    // Prepare a mock sale object for test printing
    const mockSale: Sale = {
      id: 'test',
      invoiceNumber: 'TEST-PRINT',
      timestamp: new Date().toISOString(),
      items: [
        {
          productId: 'test',
          name: 'Cetak Uji Coba Kertas',
          price: 5000,
          quantity: 1,
          priceType: 'retail',
          subtotal: 5000,
        },
        {
          productId: 'test2',
          name: 'Koneksi Sukses!',
          price: 15000,
          quantity: 1,
          priceType: 'wholesale',
          subtotal: 15000,
        },
      ],
      totalAmount: 20000,
      cashPaid: 20000,
      changeDue: 0,
      paymentMethod: 'Bluetooth Printer',
    };

    const bytes = generateEscPosBytes(mockSale, shopName, shopAddress);
    await sendToPrinter(activePrinter.characteristic, bytes);
  };

  // DATA BACKUP MANAGEMENT
  const handleExportData = () => {
    const backupData = {
      categories,
      products,
      sales,
      shopName,
      shopAddress,
      version: '1.0',
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_warung_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.categories && parsed.products && parsed.sales) {
          saveCategories(parsed.categories);
          saveProducts(parsed.products);
          saveSales(parsed.sales);
          if (parsed.shopName) saveShopName(parsed.shopName);
          if (parsed.shopAddress) saveShopAddress(parsed.shopAddress);
          alert('Database warung berhasil dipulihkan!');
        } else {
          alert('Format berkas backup tidak valid.');
        }
      } catch (err) {
        alert('Gagal mengurai file JSON backup.');
      }
    };
    reader.readAsText(file);
  };

  // Render navigation tab panels
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'cashier':
        return (
          <TransactionCashier
            products={products}
            categories={categories}
            activePrinter={activePrinter}
            onConnectPrinter={handleConnectPrinter}
            onAddSale={handleAddSale}
            onUpdateProductStock={handleUpdateProductStock}
            shopName={shopName}
            shopAddress={shopAddress}
          />
        );
      case 'products':
        return (
          <ProductManagement
            products={products}
            categories={categories}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        );
      case 'categories':
        return (
          <CategoryManagement
            categories={categories}
            products={products}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        );
      case 'sales':
        return (
          <SalesHistory
            sales={sales}
            products={products}
            activePrinter={activePrinter}
            onConnectPrinter={handleConnectPrinter}
            onDeleteSale={handleDeleteSale}
            shopName={shopName}
            shopAddress={shopAddress}
          />
        );
      case 'charts':
        return (
          <TopProducts
            sales={sales}
            products={products}
            categories={categories}
          />
        );
      case 'printer':
        return (
          <BluetoothPrinterConnector
            activePrinter={activePrinter}
            onConnectPrinter={handleConnectPrinter}
            onDisconnectPrinter={handleDisconnectPrinter}
            shopName={shopName}
            setShopName={saveShopName}
            shopAddress={shopAddress}
            setShopAddress={saveShopAddress}
            onTriggerTestPrint={handleTriggerTestPrint}
            onExportData={handleExportData}
            onImportData={handleImportData}
          />
        );
      default:
        return null;
    }
  };

  const navItems = [
    { id: 'cashier', label: 'Kasir & Transaksi', icon: ShoppingCart },
    { id: 'products', label: 'Katalog Produk', icon: ShoppingBag },
    { id: 'categories', label: 'Kategori Produk', icon: FolderTree },
    { id: 'sales', label: 'Rekap Penjualan', icon: History },
    { id: 'charts', label: 'Top 10 Terlaris', icon: Trophy },
    { id: 'printer', label: 'Printer & Profil', icon: Printer },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800" id="app-root">
      {/* HEADER: Mobile and Top Navigation bar */}
      <header className="bg-gradient-to-r from-indigo-900 to-indigo-950 text-white px-4 py-3.5 shadow-md flex items-center justify-between sticky top-0 z-40 lg:hidden" id="mobile-header">
        <div className="flex items-center gap-2.5">
          <Store className="w-5.5 h-5.5 text-indigo-300" />
          <div>
            <h1 className="font-extrabold text-sm leading-none uppercase tracking-wide">{shopName}</h1>
            <span className="text-[9px] text-indigo-200 font-semibold uppercase tracking-wider">POS Kasir Pintar</span>
          </div>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1.5 bg-indigo-800/60 text-indigo-100 rounded-xl hover:text-white hover:bg-indigo-800 transition-colors cursor-pointer"
          id="toggle-sidebar-mobile"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      <div className="flex flex-1 relative" id="layout-body">
        {/* SIDEBAR: Desktop Left Navigation & Mobile drawer overlay */}
        <aside 
          className={`bg-white border-r border-slate-200 w-64 p-5 flex flex-col justify-between shrink-0 transition-all duration-300 z-50 lg:z-30 lg:relative lg:h-screen lg:sticky lg:top-0 lg:flex ${
            isSidebarOpen 
              ? 'fixed inset-y-0 left-0 translate-x-0 shadow-2xl' 
              : 'fixed inset-y-0 left-0 -translate-x-full lg:translate-x-0'
          }`}
          id="app-sidebar"
        >
          {/* Logo Brand in custom sleek container */}
          <div className="space-y-6">
            <div className="p-4 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl text-white shadow-md shadow-indigo-100 hidden lg:block">
              <div className="flex items-center gap-2.5">
                <Store className="w-6 h-6 text-white shrink-0" />
                <div className="min-w-0">
                  <h2 className="font-extrabold text-sm uppercase tracking-wide leading-tight truncate">{shopName}</h2>
                  <span className="text-[10px] text-indigo-100 font-medium opacity-85 uppercase tracking-wider">WarungDigital POS</span>
                </div>
              </div>
            </div>

            {/* Mobile Header indicator within Sidebar drawer */}
            <div className="p-4 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl text-white shadow-md shadow-indigo-100 lg:hidden block">
              <div className="flex items-center gap-2.5">
                <Store className="w-6 h-6 text-white shrink-0" />
                <div className="min-w-0">
                  <h2 className="font-extrabold text-sm uppercase tracking-wide leading-tight truncate">{shopName}</h2>
                  <span className="text-[10px] text-indigo-100 font-medium opacity-85 uppercase tracking-wider">WarungDigital POS</span>
                </div>
              </div>
            </div>

            {/* Navigation options */}
            <nav className="space-y-1" id="sidebar-nav">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-2">Menu Utama</div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsSidebarOpen(false); // Close mobile drawer
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100/50' 
                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                    }`}
                    id={`nav-item-${item.id}`}
                  >
                    <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer of Sidebar with connection status badge matching Sleek design */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            {activePrinter ? (
              <div className="flex items-center gap-3 p-3 bg-emerald-50/80 border border-emerald-100 rounded-xl text-left">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                <div className="text-xs min-w-0">
                  <p className="font-bold text-emerald-800 text-[11px] leading-tight">Printer Ready</p>
                  <p className="text-emerald-600 text-[10px] truncate max-w-[140px] font-medium mt-0.5">{activePrinter.name || 'BT-58 Printer'}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl text-left">
                <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0"></div>
                <div className="text-xs min-w-0">
                  <p className="font-bold text-slate-500 text-[11px] leading-tight">Printer Off</p>
                  <p className="text-slate-400 text-[10px] font-medium mt-0.5">Belum Terhubung</p>
                </div>
              </div>
            )}
            
            <div className="text-[9px] text-slate-400 font-semibold text-center uppercase tracking-wider">
              © {new Date().getFullYear()} Kasir Warung Pintar
            </div>
          </div>
        </aside>

        {/* MOBILE OVERLAY SHADOW */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-20 lg:hidden"
            id="mobile-drawer-overlay"
          />
        )}

        {/* MAIN CONTAINER: Workspace panel */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden" id="workspace-panel">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
}
