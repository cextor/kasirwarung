USE kasirwarung;

-- Clear tables first just in case
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE sale_items;
TRUNCATE TABLE sales;
TRUNCATE TABLE products;
TRUNCATE TABLE categories;
TRUNCATE TABLE settings;
SET FOREIGN_KEY_CHECKS = 1;

-- Categories
INSERT INTO categories (id, name, description) VALUES
('cat-sembako', 'Sembako', 'Bahan makanan pokok kebutuhan sehari-hari'),
('cat-mie', 'Mie Instan', 'Aneka mie rebus dan mie goreng instan'),
('cat-minuman', 'Minuman Dingin', 'Air mineral, soda, jus, teh botol'),
('cat-snack', 'Camilan / Snack', 'Krupuk, keripik, biskuit, cokelat');

-- Products
INSERT INTO products (id, name, barcode, category_id, price_retail, price_wholesale, wholesale_min_qty, stock, unit) VALUES
('prod-beras', 'Beras Ramos Premium 1 Kg', '8999906101901', 'cat-sembako', 15500.00, 14500.00, 5, 65, 'kg'),
('prod-minyak', 'Minyak Goreng Bimoli 1 Liter', '8999906101902', 'cat-sembako', 19500.00, 18500.00, 6, 28, 'pcs'),
('prod-gula', 'Gula Pasir Putih 1 Kg', '8999906101903', 'cat-sembako', 16000.00, 15200.00, 5, 45, 'kg'),
('prod-telur', 'Telur Ayam Negeri (Butir)', '8999906101904', 'cat-sembako', 2200.00, 1950.00, 10, 140, 'pcs'),
('prod-indogoreng', 'Indomie Goreng Spesial', '8990024401119', 'cat-mie', 3500.00, 3100.00, 5, 180, 'pcs'),
('prod-indosoto', 'Indomie Kuah Soto Mie', '8990024401120', 'cat-mie', 3300.00, 2950.00, 5, 95, 'pcs'),
('prod-aqua600', 'Aqua Air Mineral 600ml', '8990024401121', 'cat-minuman', 3500.00, 2900.00, 12, 144, 'pcs'),
('prod-cocacola', 'Coca Cola Kaleng 330ml', '8990024401122', 'cat-minuman', 7000.00, 6400.00, 12, 48, 'pcs'),
('prod-chitato', 'Chitato Sapi Panggang 68g', '8990024401123', 'cat-snack', 11500.00, 10700.00, 5, 35, 'pcs');

-- Settings
INSERT INTO settings (`key`, `value`) VALUES
('shop_name', 'WARUNG SEJAHTERA'),
('shop_address', 'Kec. Sukamaju, Jawa Barat');

-- Sales
INSERT INTO sales (id, invoice_number, timestamp, total_amount, cash_paid, change_due, payment_method) VALUES
('sale-1', 'INV-32810931', DATE_SUB(NOW(), INTERVAL 2 DAY), 111500.00, 120000.00, 8500.00, 'Cash'),
('sale-2', 'INV-54910283', DATE_SUB(NOW(), INTERVAL 1 DAY), 77300.00, 100000.00, 22700.00, 'Cash'),
('sale-3', 'INV-18270942', NOW(), 71000.00, 100000.00, 29000.00, 'Cash');

-- Sale Items
INSERT INTO sale_items (sale_id, product_id, name, price, quantity, price_type, subtotal) VALUES
('sale-1', 'prod-beras', 'Beras Ramos Premium 1 Kg', 14500.00, 5, 'wholesale', 72500.00),
('sale-1', 'prod-minyak', 'Minyak Goreng Bimoli 1 Liter', 19500.00, 2, 'retail', 39000.00),
('sale-2', 'prod-indogoreng', 'Indomie Goreng Spesial', 3100.00, 10, 'wholesale', 31000.00),
('sale-2', 'prod-aqua600', 'Aqua Air Mineral 600ml', 2900.00, 12, 'wholesale', 34800.00),
('sale-2', 'prod-chitato', 'Chitato Sapi Panggang 68g', 11500.00, 1, 'retail', 11500.00),
('sale-3', 'prod-telur', 'Telur Ayam Negeri (Butir)', 1950.00, 20, 'wholesale', 39000.00),
('sale-3', 'prod-gula', 'Gula Pasir Putih 1 Kg', 16000.00, 2, 'retail', 32000.00);
