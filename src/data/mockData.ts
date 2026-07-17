import { Category, Product, Sale } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-sembako', name: 'Sembako', description: 'Bahan makanan pokok kebutuhan sehari-hari' },
  { id: 'cat-mie', name: 'Mie Instan', description: 'Aneka mie rebus dan mie goreng instan' },
  { id: 'cat-minuman', name: 'Minuman Dingin', description: 'Air mineral, soda, jus, teh botol' },
  { id: 'cat-snack', name: 'Camilan / Snack', description: 'Krupuk, keripik, biskuit, cokelat' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-beras',
    name: 'Beras Ramos Premium 1 Kg',
    barcode: '8999906101901',
    categoryId: 'cat-sembako',
    priceRetail: 15500,
    priceWholesale: 14500,
    wholesaleMinQty: 5,
    stock: 65,
    unit: 'kg',
  },
  {
    id: 'prod-minyak',
    name: 'Minyak Goreng Bimoli 1 Liter',
    barcode: '8999906101902',
    categoryId: 'cat-sembako',
    priceRetail: 19500,
    priceWholesale: 18500,
    wholesaleMinQty: 6,
    stock: 28,
    unit: 'pcs',
  },
  {
    id: 'prod-gula',
    name: 'Gula Pasir Putih 1 Kg',
    barcode: '8999906101903',
    categoryId: 'cat-sembako',
    priceRetail: 16000,
    priceWholesale: 15200,
    wholesaleMinQty: 5,
    stock: 45,
    unit: 'kg',
  },
  {
    id: 'prod-telur',
    name: 'Telur Ayam Negeri (Butir)',
    barcode: '8999906101904',
    categoryId: 'cat-sembako',
    priceRetail: 2200,
    priceWholesale: 1950,
    wholesaleMinQty: 10,
    stock: 140,
    unit: 'pcs',
  },
  {
    id: 'prod-indogoreng',
    name: 'Indomie Goreng Spesial',
    barcode: '8990024401119',
    categoryId: 'cat-mie',
    priceRetail: 3500,
    priceWholesale: 3100,
    wholesaleMinQty: 5,
    stock: 180,
    unit: 'pcs',
  },
  {
    id: 'prod-indosoto',
    name: 'Indomie Kuah Soto Mie',
    barcode: '8990024401120',
    categoryId: 'cat-mie',
    priceRetail: 3300,
    priceWholesale: 2950,
    wholesaleMinQty: 5,
    stock: 95,
    unit: 'pcs',
  },
  {
    id: 'prod-aqua600',
    name: 'Aqua Air Mineral 600ml',
    barcode: '8990024401121',
    categoryId: 'cat-minuman',
    priceRetail: 3500,
    priceWholesale: 2900,
    wholesaleMinQty: 12,
    stock: 144,
    unit: 'pcs',
  },
  {
    id: 'prod-cocacola',
    name: 'Coca Cola Kaleng 330ml',
    barcode: '8990024401122',
    categoryId: 'cat-minuman',
    priceRetail: 7000,
    priceWholesale: 6400,
    wholesaleMinQty: 12,
    stock: 48,
    unit: 'pcs',
  },
  {
    id: 'prod-chitato',
    name: 'Chitato Sapi Panggang 68g',
    barcode: '8990024401123',
    categoryId: 'cat-snack',
    priceRetail: 11500,
    priceWholesale: 10700,
    wholesaleMinQty: 5,
    stock: 35,
    unit: 'pcs',
  },
];

const yesterday = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString();
};

const twoDaysAgo = () => {
  const date = new Date();
  date.setDate(date.getDate() - 2);
  return date.toISOString();
};

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-1',
    invoiceNumber: 'INV-32810931',
    timestamp: twoDaysAgo(),
    items: [
      {
        productId: 'prod-beras',
        name: 'Beras Ramos Premium 1 Kg',
        price: 14500, // wholesale
        quantity: 5,
        priceType: 'wholesale',
        subtotal: 72500,
      },
      {
        productId: 'prod-minyak',
        name: 'Minyak Goreng Bimoli 1 Liter',
        price: 19500, // retail
        quantity: 2,
        priceType: 'retail',
        subtotal: 39000,
      },
    ],
    totalAmount: 111500,
    cashPaid: 120000,
    changeDue: 8500,
    paymentMethod: 'Cash',
  },
  {
    id: 'sale-2',
    invoiceNumber: 'INV-54910283',
    timestamp: yesterday(),
    items: [
      {
        productId: 'prod-indogoreng',
        name: 'Indomie Goreng Spesial',
        price: 3100, // wholesale
        quantity: 10,
        priceType: 'wholesale',
        subtotal: 31000,
      },
      {
        productId: 'prod-aqua600',
        name: 'Aqua Air Mineral 600ml',
        price: 2900, // wholesale
        quantity: 12,
        priceType: 'wholesale',
        subtotal: 34800,
      },
      {
        productId: 'prod-chitato',
        name: 'Chitato Sapi Panggang 68g',
        price: 11500, // retail
        quantity: 1,
        priceType: 'retail',
        subtotal: 11500,
      },
    ],
    totalAmount: 77300,
    cashPaid: 100000,
    changeDue: 22700,
    paymentMethod: 'Cash',
  },
  {
    id: 'sale-3',
    invoiceNumber: 'INV-18270942',
    timestamp: new Date().toISOString(),
    items: [
      {
        productId: 'prod-telur',
        name: 'Telur Ayam Negeri (Butir)',
        price: 1950, // wholesale
        quantity: 20,
        priceType: 'wholesale',
        subtotal: 39000,
      },
      {
        productId: 'prod-gula',
        name: 'Gula Pasir Putih 1 Kg',
        price: 16000, // retail
        quantity: 2,
        priceType: 'retail',
        subtotal: 32000,
      },
    ],
    totalAmount: 71000,
    cashPaid: 100000,
    changeDue: 29000,
    paymentMethod: 'Cash',
  },
];
