import { Sale } from '../types';

// Helper to format currency in Indonesian Rupiah
export const formatRupiah = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Formats a receipt text to fit exactly 32 columns (standard 58mm printer)
export function formatReceiptText(
  sale: Sale,
  shopName: string = 'WARUNG PINTAR',
  shopAddress: string = 'Kec. Sukamaju, Indonesia'
): string {
  const width = 32;
  const lines: string[] = [];

  // Helper to center text
  const center = (text: string): string => {
    if (text.length >= width) return text.slice(0, width);
    const leftPad = Math.floor((width - text.length) / 2);
    return ' '.repeat(leftPad) + text;
  };

  // Helper to space-between text
  const spaceBetween = (left: string, right: string): string => {
    const spaceLength = width - left.length - right.length;
    if (spaceLength <= 0) {
      return (left + ' ' + right).slice(0, width);
    }
    return left + ' '.repeat(spaceLength) + right;
  };

  // Build the receipt text
  lines.push(center(shopName.toUpperCase()));
  lines.push(center(shopAddress));
  lines.push(center(new Date(sale.timestamp).toLocaleString('id-ID')));
  lines.push(center(`No: ${sale.invoiceNumber}`));
  lines.push('='.repeat(width));

  sale.items.forEach((item) => {
    // Row 1: Product Name
    lines.push(item.name.slice(0, width));
    // Row 2: Qty x Price and Subtotal
    const priceStr = `${item.quantity} x ${item.price.toLocaleString('id-ID')}`;
    const subtotalStr = item.subtotal.toLocaleString('id-ID');
    lines.push(spaceBetween(`  ${priceStr}`, subtotalStr));
  });

  lines.push('-'.repeat(width));
  lines.push(spaceBetween('TOTAL', sale.totalAmount.toLocaleString('id-ID')));
  lines.push(spaceBetween('BAYAR', sale.cashPaid.toLocaleString('id-ID')));
  lines.push(spaceBetween('KEMBALI', sale.changeDue.toLocaleString('id-ID')));
  lines.push('='.repeat(width));
  lines.push(center('TERIMA KASIH'));
  lines.push(center('SELAMAT BELANJA KEMBALI'));
  lines.push('\n\n\n'); // Feed space

  return lines.join('\n');
}

// Generate ESC/POS binary data for 58mm thermal printers
export function generateEscPosBytes(
  sale: Sale,
  shopName: string = 'WARUNG PINTAR',
  shopAddress: string = 'Kec. Sukamaju, Indonesia'
): Uint8Array {
  const encoder = new TextEncoder();
  const bytes: number[] = [];

  // ESC/POS Commands
  const ESC = 0x1b;
  const GS = 0x1d;

  // Initialize printer
  bytes.push(ESC, 0x40);

  // Align Center
  const setCenter = () => bytes.push(ESC, 0x61, 0x01);
  // Align Left
  const setLeft = () => bytes.push(ESC, 0x61, 0x00);
  // Align Right
  const setRight = () => bytes.push(ESC, 0x61, 0x02);
  // Bold Text
  const setBold = (on: boolean) => bytes.push(ESC, 0x45, on ? 0x01 : 0x00);
  // Double height/width
  const setLarge = (on: boolean) => bytes.push(GS, 0x21, on ? 0x11 : 0x00);

  const addText = (text: string) => {
    const raw = encoder.encode(text);
    for (let i = 0; i < raw.length; i++) {
      bytes.push(raw[i]);
    }
  };

  const addLine = (text: string) => {
    addText(text + '\n');
  };

  const width = 32;
  const spaceBetween = (left: string, right: string): string => {
    const spaceLength = width - left.length - right.length;
    if (spaceLength <= 0) return (left + ' ' + right).slice(0, width);
    return left + ' '.repeat(spaceLength) + right;
  };

  // Header
  setCenter();
  setLarge(true);
  setBold(true);
  addLine(shopName.toUpperCase());
  
  setLarge(false);
  setBold(false);
  addLine(shopAddress);
  addLine(new Date(sale.timestamp).toLocaleString('id-ID'));
  addLine(`No: ${sale.invoiceNumber}`);
  
  setLeft();
  addLine('='.repeat(width));

  // Items
  sale.items.forEach((item) => {
    setBold(true);
    addLine(item.name.slice(0, width));
    
    setBold(false);
    const priceStr = `  ${item.quantity} x ${item.price.toLocaleString('id-ID')}`;
    const subtotalStr = item.subtotal.toLocaleString('id-ID');
    addLine(spaceBetween(priceStr, subtotalStr));
  });

  addLine('-'.repeat(width));
  
  // Total & Details
  setBold(true);
  addLine(spaceBetween('TOTAL', sale.totalAmount.toLocaleString('id-ID')));
  setBold(false);
  addLine(spaceBetween('BAYAR', sale.cashPaid.toLocaleString('id-ID')));
  addLine(spaceBetween('KEMBALI', sale.changeDue.toLocaleString('id-ID')));
  
  addLine('='.repeat(width));
  
  // Footer
  setCenter();
  setBold(true);
  addLine('TERIMA KASIH');
  addLine('SELAMAT BELANJA KEMBALI');
  
  // Feed & Cut
  bytes.push(0x0a, 0x0a, 0x0a, 0x0a); // 4 line feeds
  bytes.push(GS, 0x56, 0x42, 0x00);   // Paper Cut (feed and half cut)

  return new Uint8Array(bytes);
}

// Scan and Connect to Bluetooth Printer
export async function connectBluetoothPrinter(): Promise<any> {
  if (!('bluetooth' in navigator)) {
    throw new Error('Web Bluetooth tidak didukung di browser ini. Gunakan Google Chrome.');
  }

  try {
    const device = await (navigator as any).bluetooth.requestDevice({
      filters: [
        // Match common printer services
        { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
        { namePrefix: 'Printer' },
        { namePrefix: 'PRINTER' },
        { namePrefix: 'MPT' },
        { namePrefix: 'POS' }
      ],
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', 
        '00001101-0000-1000-8000-00805f9b34fb',
        'e7810a71-73ae-499d-8c15-faa9ae90611a' // Raw thermal protocol
      ],
      acceptAllDevices: false
    });

    const gattServer = await device.gatt.connect();
    
    // Find service
    let service;
    try {
      service = await gattServer.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
    } catch {
      try {
        service = await gattServer.getPrimaryService('e7810a71-73ae-499d-8c15-faa9ae90611a');
      } catch {
        // Fallback: try to get any services
        const services = await gattServer.getPrimaryServices();
        if (services.length > 0) {
          service = services[0];
        } else {
          throw new Error('Tidak dapat menemukan layanan printer.');
        }
      }
    }

    // Find writable characteristic
    const characteristics = await service.getCharacteristics();
    const writeCharacteristic = characteristics.find(
      (c: any) => c.properties.write || c.properties.writeWithoutResponse
    );

    if (!writeCharacteristic) {
      throw new Error('Layanan printer tidak mendukung operasi penulisan data.');
    }

    return {
      name: device.name || 'Bluetooth Printer',
      id: device.id,
      device,
      gattServer,
      characteristic: writeCharacteristic
    };
  } catch (error: any) {
    console.error('Bluetooth connection error:', error);
    throw error;
  }
}

// Send bytes to Bluetooth printer, chunked to prevent buffer overflow (common in cheap thermal printers)
export async function sendToPrinter(characteristic: any, bytes: Uint8Array): Promise<void> {
  const chunkSize = 20; // 20 bytes is safe for ble
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    if (characteristic.writeValueWithoutResponse) {
      await characteristic.writeValueWithoutResponse(chunk);
    } else {
      await characteristic.writeValue(chunk);
    }
    // Small sleep to ensure the printer buffer keeps up
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
}
