export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  barcode?: string;
  categoryId: string;
  priceRetail: number; // Harga Satuan
  priceWholesale: number; // Harga Grosir
  wholesaleMinQty: number; // Minimal pembelian untuk harga grosir
  stock: number;
  unit: string; // pcs, kg, sachet, pack, dll.
  isActive?: boolean; // Status aktif / non-aktif
}

export interface CartItem {
  product: Product;
  quantity: number;
  priceType: 'retail' | 'wholesale' | 'manual';
  customPrice?: number; // Jika ada penyesuaian harga manual
}

export interface SaleItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  priceType: 'retail' | 'wholesale' | 'manual';
  subtotal: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  timestamp: string; // ISO String
  items: SaleItem[];
  totalAmount: number;
  cashPaid: number;
  changeDue: number;
  paymentMethod: 'Cash' | 'Bluetooth Printer' | 'Lainnya';
}

export interface PrinterDevice {
  name: string;
  id: string;
  type: 'bluetooth' | 'usb';
  gattServer?: any;
  characteristic?: any;
  usbDevice?: any;
  interfaceNumber?: number;
  endpointOut?: number;
}
