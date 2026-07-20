import React, { useState, useEffect } from 'react';
import { Category, Product, Sale, PrinterDevice } from './types';
import {
  apiGetCategories, apiCreateCategory, apiUpdateCategory, apiDeleteCategory,
  apiGetProducts, apiCreateProduct, apiUpdateProduct, apiDeleteProduct,
  apiGetSales, apiCreateSale, apiDeleteSale,
  apiGetSettings, apiSaveSettings
} from './utils/api';
import { 
  connectBluetoothPrinter, 
  connectUsbPrinter,
  generateEscPosBytes, 
  sendToPrinter,
  sendToUsbPrinter
} from './utils/bluetoothPrinter';
import Swal from 'sweetalert2';

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

  // Initialize and load from API backend
  useEffect(() => {
    async function loadData() {
      try {
        const [cats, prods, sles, settings] = await Promise.all([
          apiGetCategories(),
          apiGetProducts(),
          apiGetSales(),
          apiGetSettings()
        ]);
        setCategories(cats);
        setProducts(prods);
        setSales(sles);
        setShopName(settings.shopName);
        setShopAddress(settings.shopAddress);
      } catch (err: any) {
        console.error('Gagal mengambil data dari API backend:', err);
      }
    }
    loadData();
  }, []);

  const saveShopName = async (name: string) => {
    try {
      await apiSaveSettings({ shopName: name });
      setShopName(name);
    } catch (err: any) {
      Swal.fire({ title: 'Gagal!', text: 'Gagal menyimpan nama warung: ' + err.message, icon: 'error', confirmButtonColor: '#4f46e5' });
    }
  };

  const saveShopAddress = async (address: string) => {
    try {
      await apiSaveSettings({ shopAddress: address });
      setShopAddress(address);
    } catch (err: any) {
      Swal.fire({ title: 'Gagal!', text: 'Gagal menyimpan alamat warung: ' + err.message, icon: 'error', confirmButtonColor: '#4f46e5' });
    }
  };

  // CATEGORY OPERATIONS
  const handleAddCategory = async (catData: Omit<Category, 'id'>) => {
    const id = `cat-${Date.now()}`;
    const newCategory = { id, ...catData };
    try {
      const created = await apiCreateCategory(newCategory);
      setCategories(prev => [...prev, created]);
      Swal.fire({
        title: 'Berhasil!',
        text: 'Kategori produk berhasil ditambahkan.',
        icon: 'success',
        confirmButtonColor: '#4f46e5',
        timer: 1500
      });
      return created;
    } catch (err: any) {
      Swal.fire({ title: 'Gagal!', text: 'Gagal menambah kategori: ' + err.message, icon: 'error', confirmButtonColor: '#4f46e5' });
    }
  };

  const handleUpdateCategory = async (updated: Category) => {
    try {
      const resp = await apiUpdateCategory(updated);
      setCategories(prev => prev.map((c) => (c.id === resp.id ? resp : c)));
      Swal.fire({
        title: 'Berhasil!',
        text: 'Kategori produk berhasil diperbarui.',
        icon: 'success',
        confirmButtonColor: '#4f46e5',
        timer: 1500
      });
    } catch (err: any) {
      Swal.fire({ title: 'Gagal!', text: 'Gagal memperbarui kategori: ' + err.message, icon: 'error', confirmButtonColor: '#4f46e5' });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await apiDeleteCategory(id);
      setCategories(prev => prev.filter((c) => c.id !== id));
      // Also refetch products since category deletion deletes products under it in DB
      const updatedProducts = await apiGetProducts();
      setProducts(updatedProducts);
      Swal.fire({
        title: 'Berhasil!',
        text: 'Kategori produk berhasil dihapus.',
        icon: 'success',
        confirmButtonColor: '#4f46e5',
        timer: 1500
      });
    } catch (err: any) {
      Swal.fire({ title: 'Gagal!', text: 'Gagal menghapus kategori: ' + err.message, icon: 'error', confirmButtonColor: '#4f46e5' });
    }
  };

  // PRODUCT OPERATIONS
  const handleAddProduct = async (prodData: Omit<Product, 'id'>) => {
    const id = `prod-${Date.now()}`;
    const newProduct = { id, ...prodData };
    try {
      const created = await apiCreateProduct(newProduct);
      setProducts(prev => [...prev, created]);
      Swal.fire({
        title: 'Berhasil!',
        text: 'Produk berhasil ditambahkan.',
        icon: 'success',
        confirmButtonColor: '#4f46e5',
        timer: 1500
      });
    } catch (err: any) {
      Swal.fire({ title: 'Gagal!', text: 'Gagal menambah produk: ' + err.message, icon: 'error', confirmButtonColor: '#4f46e5' });
    }
  };

  const handleUpdateProduct = async (updated: Product) => {
    try {
      const resp = await apiUpdateProduct(updated);
      setProducts(prev => prev.map((p) => (p.id === resp.id ? resp : p)));
      Swal.fire({
        title: 'Berhasil!',
        text: 'Produk berhasil diperbarui.',
        icon: 'success',
        confirmButtonColor: '#4f46e5',
        timer: 1500
      });
    } catch (err: any) {
      Swal.fire({ title: 'Gagal!', text: 'Gagal memperbarui produk: ' + err.message, icon: 'error', confirmButtonColor: '#4f46e5' });
    }
  };

  const handleUpdateProductStock = async (productId: string, newStock: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const updatedProduct = { ...product, stock: Math.max(0, newStock) };
    try {
      const resp = await apiUpdateProduct(updatedProduct);
      setProducts(prev => prev.map((p) => (p.id === resp.id ? resp : p)));
    } catch (err: any) {
      console.error('Gagal memperbarui stok produk:', err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await apiDeleteProduct(id);
      setProducts(prev => prev.filter((p) => p.id !== id));
      Swal.fire({
        title: 'Berhasil!',
        text: 'Produk berhasil dihapus.',
        icon: 'success',
        confirmButtonColor: '#4f46e5',
        timer: 1500
      });
    } catch (err: any) {
      Swal.fire({ title: 'Gagal!', text: 'Gagal menghapus produk: ' + err.message, icon: 'error', confirmButtonColor: '#4f46e5' });
    }
  };

  // SALES OPERATIONS
  const handleAddSale = async (newSale: Sale) => {
    try {
      const created = await apiCreateSale(newSale);
      setSales(prev => [created, ...prev]);
      // Refetch products to sync stock changes
      const updatedProducts = await apiGetProducts();
      setProducts(updatedProducts);
    } catch (err: any) {
      Swal.fire({ title: 'Gagal!', text: 'Gagal menyimpan transaksi: ' + err.message, icon: 'error', confirmButtonColor: '#4f46e5' });
      throw err;
    }
  };

  // Cancel transaction (Delete) & restore all item stocks!
  const handleDeleteSale = async (saleId: string) => {
    try {
      await apiDeleteSale(saleId);
      setSales(prev => prev.filter((s) => s.id !== saleId));
      // Refetch products to sync stock restoration
      const updatedProducts = await apiGetProducts();
      setProducts(updatedProducts);
    } catch (err: any) {
      Swal.fire({ title: 'Gagal!', text: 'Gagal menghapus/membatalkan transaksi: ' + err.message, icon: 'error', confirmButtonColor: '#4f46e5' });
    }
  };

  // PRINTER MANAGEMENT (BLUETOOTH & USB)
  const handleConnectPrinter = async () => {
    Swal.fire({
      title: 'Pilih Metode Koneksi',
      text: 'Bagaimana printer TM-58V disambungkan ke perangkat Anda?',
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Bluetooth (Nirkabel)',
      denyButtonText: 'Kabel USB',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#4f46e5',
      denyButtonColor: '#0f172a',
      cancelButtonColor: '#94a3b8'
    }).then(async (result) => {
      if (result.isConfirmed) {
        // Bluetooth
        try {
          const device = await connectBluetoothPrinter();
          setActivePrinter({
            name: device.name,
            id: device.id,
            type: 'bluetooth',
            gattServer: device.gattServer,
            characteristic: device.characteristic
          });
          Swal.fire({ title: 'Koneksi Sukses!', text: `Terhubung ke printer Bluetooth: ${device.name}`, icon: 'success', confirmButtonColor: '#4f46e5', timer: 1500 });
        } catch (err: any) {
          if (err.name !== 'NotFoundError' && err.message !== 'User cancelled the requestDevice() chooser.') {
            Swal.fire({ title: 'Koneksi Gagal', text: err.message || 'Gagal menyambungkan ke printer Bluetooth.', icon: 'error', confirmButtonColor: '#4f46e5' });
          }
        }
      } else if (result.isDenied) {
        // USB
        try {
          const device = await connectUsbPrinter();
          setActivePrinter({
            name: device.name,
            id: device.id,
            type: 'usb',
            usbDevice: device.device,
            interfaceNumber: device.interfaceNumber,
            endpointOut: device.endpointOut
          });
          Swal.fire({ title: 'Koneksi Sukses!', text: `Terhubung ke printer USB: ${device.name}`, icon: 'success', confirmButtonColor: '#4f46e5', timer: 1500 });
        } catch (err: any) {
          if (err.name !== 'NotFoundError' && err.message !== 'User cancelled the requestDevice() chooser.') {
            Swal.fire({ title: 'Koneksi Gagal', text: err.message || 'Gagal menyambungkan ke printer USB.', icon: 'error', confirmButtonColor: '#4f46e5' });
          }
        }
      }
    });
  };

  const handleDisconnectPrinter = async () => {
    if (activePrinter) {
      if (activePrinter.type === 'bluetooth' && activePrinter.gattServer) {
        activePrinter.gattServer.disconnect();
      } else if (activePrinter.type === 'usb' && activePrinter.usbDevice) {
        try {
          await activePrinter.usbDevice.releaseInterface(activePrinter.interfaceNumber);
          await activePrinter.usbDevice.close();
        } catch (e) {
          console.error('Error closing USB connection:', e);
        }
      }
    }
    setActivePrinter(null);
  };

  const handleTriggerTestPrint = async () => {
    if (!activePrinter) {
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
    if (activePrinter.type === 'bluetooth' && activePrinter.characteristic) {
      await sendToPrinter(activePrinter.characteristic, bytes);
    } else if (activePrinter.type === 'usb' && activePrinter.usbDevice && activePrinter.endpointOut !== undefined) {
      await sendToUsbPrinter(activePrinter.usbDevice, activePrinter.endpointOut, bytes);
    } else {
      throw new Error('Konfigurasi printer tidak valid.');
    }
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

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.categories && parsed.products && parsed.sales) {
          Swal.fire({
            title: 'Memulihkan Data',
            text: 'Memulihkan database warung dari berkas cadangan, mohon tunggu...',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });
          
          // Import settings
          if (parsed.shopName) await saveShopName(parsed.shopName);
          if (parsed.shopAddress) await saveShopAddress(parsed.shopAddress);

          // Import categories, products, sales sequentially to DB
          for (const cat of parsed.categories) {
            await apiCreateCategory(cat);
          }
          for (const prod of parsed.products) {
            await apiCreateProduct(prod);
          }
          for (const sale of parsed.sales) {
            await apiCreateSale(sale);
          }

          // Refetch everything to update state
          const [cats, prods, sles] = await Promise.all([
            apiGetCategories(),
            apiGetProducts(),
            apiGetSales()
          ]);
          setCategories(cats);
          setProducts(prods);
          setSales(sles);

          Swal.fire({ title: 'Berhasil!', text: 'Database warung berhasil dipulihkan!', icon: 'success', confirmButtonColor: '#4f46e5' });
        } else {
          Swal.fire({ title: 'Gagal!', text: 'Format berkas backup tidak valid.', icon: 'error', confirmButtonColor: '#4f46e5' });
        }
      } catch (err: any) {
        Swal.fire({ title: 'Gagal!', text: 'Gagal memulihkan database: ' + err.message, icon: 'error', confirmButtonColor: '#4f46e5' });
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
            sales={sales}
            onDeleteSale={handleDeleteSale}
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
            onAddCategory={handleAddCategory}
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
    { id: 'categories', label: 'Kategori Produk', icon: FolderTree },
    { id: 'products', label: 'Katalog Produk', icon: ShoppingBag },
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
                </div>
              </div>
            </div>

            {/* Mobile Header indicator within Sidebar drawer */}
            <div className="p-4 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl text-white shadow-md shadow-indigo-100 lg:hidden block">
              <div className="flex items-center gap-2.5">
                <Store className="w-6 h-6 text-white shrink-0" />
                <div className="min-w-0">
                  <h2 className="font-extrabold text-sm uppercase tracking-wide leading-tight truncate">{shopName}</h2>
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
