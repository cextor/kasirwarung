CREATE DATABASE IF NOT EXISTS kasirwarung;
USE kasirwarung;

CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    barcode VARCHAR(50) NULL UNIQUE,
    category_id VARCHAR(50) NOT NULL,
    price_retail DECIMAL(12,2) NOT NULL,
    price_wholesale DECIMAL(12,2) NOT NULL,
    wholesale_min_qty INT NOT NULL DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL DEFAULT 'pcs',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(50) PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(12,2) NOT NULL,
    cash_paid DECIMAL(12,2) NOT NULL,
    change_due DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NULL,
    name VARCHAR(150) NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    quantity INT NOT NULL,
    price_type VARCHAR(20) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
    `key` VARCHAR(50) PRIMARY KEY,
    `value` TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
