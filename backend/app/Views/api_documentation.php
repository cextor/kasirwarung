<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kasir Warung Pintar - Dokumentasi API</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0b0f19;
            --panel-bg: #111827;
            --border-color: #1f2937;
            --text-main: #f3f4f6;
            --text-muted: #9ca3af;
            --primary: #6366f1;
            --primary-hover: #4f46e5;
            --success: #10b981;
            --info: #0ea5e9;
            --warning: #f59e0b;
            --danger: #ef4444;
            --font-sans: 'Plus Jakarta Sans', sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: var(--font-sans);
            background-color: var(--bg-color);
            color: var(--text-main);
            line-height: 1.6;
            padding-bottom: 80px;
        }

        header {
            background-color: var(--panel-bg);
            border-bottom: 1px solid var(--border-color);
            padding: 24px 40px;
            position: sticky;
            top: 0;
            z-index: 10;
            backdrop-filter: blur(12px);
            background-color: rgba(17, 24, 39, 0.85);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .header-title h1 {
            font-size: 20px;
            font-weight: 800;
            letter-spacing: -0.5px;
            background: linear-gradient(to right, #a5b4fc, #6366f1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .header-title p {
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 2px;
        }

        .badge-version {
            background-color: rgba(99, 102, 241, 0.1);
            color: #818cf8;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 99px;
            border: 1px solid rgba(99, 102, 241, 0.2);
        }

        .container {
            max-width: 1200px;
            margin: 40px auto;
            padding: 0 20px;
            display: grid;
            grid-template-columns: 280px 1fr;
            gap: 40px;
        }

        /* Sidebar Navigation */
        aside {
            position: sticky;
            top: 110px;
            height: fit-content;
        }

        .sidebar-nav {
            list-style: none;
            display: flex;
            flex-col: column;
            flex-direction: column;
            gap: 6px;
        }

        .sidebar-group-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-muted);
            margin: 16px 0 6px 12px;
        }

        .sidebar-group-title:first-child {
            margin-top: 0;
        }

        .sidebar-nav a {
            color: var(--text-muted);
            text-decoration: none;
            font-size: 13px;
            font-weight: 600;
            padding: 10px 14px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.2s ease;
        }

        .sidebar-nav a:hover {
            color: var(--text-main);
            background-color: rgba(255, 255, 255, 0.03);
        }

        .sidebar-nav a.active {
            color: var(--text-main);
            background-color: rgba(99, 102, 241, 0.15);
            border-left: 3px solid var(--primary);
        }

        /* Main Content */
        main {
            display: flex;
            flex-direction: column;
            gap: 48px;
        }

        .intro-card {
            background-color: var(--panel-bg);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            padding: 30px;
            position: relative;
            overflow: hidden;
        }

        .intro-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background-color: var(--primary);
        }

        .intro-card h2 {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 12px;
            letter-spacing: -0.5px;
        }

        .intro-card p {
            color: var(--text-muted);
            font-size: 14px;
            margin-bottom: 16px;
        }

        .base-url-box {
            background-color: rgba(0, 0, 0, 0.2);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 14px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-family: var(--font-mono);
            font-size: 13px;
        }

        .base-url-label {
            color: var(--text-muted);
            font-weight: 500;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-right: 12px;
        }

        .base-url-value {
            color: #818cf8;
            font-weight: 600;
        }

        .section-title {
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.5px;
            margin-bottom: 24px;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        /* API Endpoint Design */
        .endpoint-card {
            background-color: var(--panel-bg);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            overflow: hidden;
            margin-bottom: 20px;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .endpoint-card:hover {
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }

        /* Header of endpoint */
        .endpoint-header {
            padding: 16px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            user-select: none;
            background-color: rgba(255, 255, 255, 0.01);
        }

        .endpoint-identity {
            display: flex;
            align-items: center;
            gap: 14px;
        }

        .method-badge {
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: 800;
            padding: 6px 12px;
            border-radius: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            min-width: 80px;
            text-align: center;
        }

        .method-badge.get {
            background-color: rgba(16, 185, 129, 0.1);
            color: var(--success);
            border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .method-badge.post {
            background-color: rgba(14, 165, 233, 0.1);
            color: var(--info);
            border: 1px solid rgba(14, 165, 233, 0.2);
        }

        .method-badge.put {
            background-color: rgba(245, 158, 11, 0.1);
            color: var(--warning);
            border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .method-badge.delete {
            background-color: rgba(239, 68, 68, 0.1);
            color: var(--danger);
            border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .endpoint-path {
            font-family: var(--font-mono);
            font-size: 14px;
            font-weight: 600;
            color: var(--text-main);
        }

        .endpoint-summary {
            font-size: 13px;
            color: var(--text-muted);
            font-weight: 500;
        }

        /* Detail/Body of endpoint */
        .endpoint-details {
            border-top: 1px solid var(--border-color);
            padding: 24px;
            background-color: rgba(0, 0, 0, 0.1);
            display: block; /* always expanded for easy viewing */
        }

        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }

        @media (max-width: 900px) {
            .details-grid {
                grid-template-columns: 1fr;
            }
            .container {
                grid-template-columns: 1fr;
            }
            aside {
                position: relative;
                top: 0;
            }
        }

        .panel-title {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted);
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        /* Parameter Table */
        .params-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }

        .params-table th, .params-table td {
            padding: 10px 12px;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }

        .params-table th {
            color: var(--text-muted);
            font-weight: 600;
        }

        .param-name {
            font-family: var(--font-mono);
            font-weight: 600;
            color: #818cf8;
        }

        .param-type {
            font-family: var(--font-mono);
            font-size: 11px;
            color: var(--text-muted);
            background-color: rgba(255, 255, 255, 0.05);
            padding: 2px 6px;
            border-radius: 4px;
        }

        .param-required {
            color: var(--danger);
            font-size: 11px;
            font-weight: 600;
        }

        .param-optional {
            color: var(--success);
            font-size: 11px;
            font-weight: 600;
        }

        /* JSON Block */
        pre {
            background-color: #060913;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 16px;
            overflow-x: auto;
            max-height: 280px;
            font-family: var(--font-mono);
            font-size: 12px;
        }

        code {
            color: #38bdf8;
        }

        .json-key {
            color: #f43f5e;
        }

        .json-string {
            color: #10b981;
        }

        .json-number {
            color: #f59e0b;
        }

        .json-boolean {
            color: #6366f1;
        }

        .copy-btn {
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            font-size: 11px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: color 0.2s;
        }

        .copy-btn:hover {
            color: var(--text-main);
        }
    </style>
</head>
<body>

    <header>
        <div class="header-title">
            <h1>KASIR WARUNG PINTAR</h1>
            <p>Dokumentasi Resmi & Standar Endpoint API</p>
        </div>
        <div class="badge-version">v1.0.0 Stable</div>
    </header>

    <div class="container">
        <!-- Sidebar Navigation -->
        <aside>
            <ul class="sidebar-nav">
                <li><a href="#intro" class="active">Pendahuluan</a></li>
                <div class="sidebar-group-title">Endpoints</div>
                <li><a href="#categories">Kategori Produk</a></li>
                <li><a href="#products">Daftar Produk</a></li>
                <li><a href="#sales">Transaksi Penjualan</a></li>
                <li><a href="#settings">Pengaturan Warung</a></li>
            </ul>
        </aside>

        <!-- Main Content -->
        <main>
            <!-- Introduction Section -->
            <section id="intro" class="intro-card">
                <h2>Dokumentasi API Kasir</h2>
                <p>API Kasir Warung Pintar dirancang dengan arsitektur RESTful standar, mengembalikan respons berformat JSON, dan menggunakan kode status HTTP standar untuk menandai status keberhasilan atau kegagalan transaksi.</p>
                
                <div class="base-url-box">
                    <div>
                        <span class="base-url-label">Base URL</span>
                        <span class="base-url-value" id="js-base-url">http://localhost:8080/api</span>
                    </div>
                </div>
            </section>

            <!-- Categories Section -->
            <section id="categories">
                <h2 class="section-title">Kategori Produk</h2>

                <!-- GET Categories -->
                <div class="endpoint-card">
                    <div class="endpoint-header">
                        <div class="endpoint-identity">
                            <span class="method-badge get">GET</span>
                            <span class="endpoint-path">/categories</span>
                        </div>
                        <span class="endpoint-summary">Ambil semua kategori</span>
                    </div>
                    <div class="endpoint-details">
                        <div class="details-grid">
                            <div>
                                <div class="panel-title">Deskripsi</div>
                                <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">Mengambil seluruh daftar kategori produk yang tersedia di database.</p>
                                <div class="panel-title">Query Parameters</div>
                                <p style="font-size: 12px; color: var(--text-muted);">Tidak membutuhkan query parameters.</p>
                            </div>
                            <div>
                                <div class="panel-title">Response (200 OK)</div>
                                <pre><code>[
  {
    <span class="json-key">"id"</span>: <span class="json-string">"cat-sembako"</span>,
    <span class="json-key">"name"</span>: <span class="json-string">"Sembako / Bahan Pokok"</span>
  },
  {
    <span class="json-key">"id"</span>: <span class="json-string">"cat-mie"</span>,
    <span class="json-key">"name"</span>: <span class="json-string">"Mie Instan"</span>
  }
]</code></pre>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- POST Category -->
                <div class="endpoint-card">
                    <div class="endpoint-header">
                        <div class="endpoint-identity">
                            <span class="method-badge post">POST</span>
                            <span class="endpoint-path">/categories</span>
                        </div>
                        <span class="endpoint-summary">Buat kategori baru</span>
                    </div>
                    <div class="endpoint-details">
                        <div class="details-grid">
                            <div>
                                <div class="panel-title">Request Body</div>
                                <pre><code>{
  <span class="json-key">"id"</span>: <span class="json-string">"cat-rokok"</span>,
  <span class="json-key">"name"</span>: <span class="json-string">"Rokok & Tembakau"</span>
}</code></pre>
                            </div>
                            <div>
                                <div class="panel-title">Response (201 Created)</div>
                                <pre><code>{
  <span class="json-key">"id"</span>: <span class="json-string">"cat-rokok"</span>,
  <span class="json-key">"name"</span>: <span class="json-string">"Rokok & Tembakau"</span>
}</code></pre>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- DELETE Category -->
                <div class="endpoint-card">
                    <div class="endpoint-header">
                        <div class="endpoint-identity">
                            <span class="method-badge delete">DELETE</span>
                            <span class="endpoint-path">/categories/{id}</span>
                        </div>
                        <span class="endpoint-summary">Hapus kategori</span>
                    </div>
                    <div class="endpoint-details">
                        <div class="details-grid">
                            <div>
                                <div class="panel-title">URL Parameters</div>
                                <table class="params-table">
                                    <thead>
                                        <tr>
                                            <th>Nama</th>
                                            <th>Tipe</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td class="param-name">id</td>
                                            <td class="param-type">string</td>
                                            <td class="param-required">Wajib</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div>
                                <div class="panel-title">Response (200 OK)</div>
                                <pre><code>{
  <span class="json-key">"id"</span>: <span class="json-string">"cat-rokok"</span>,
  <span class="json-key">"message"</span>: <span class="json-string">"Kategori berhasil dihapus"</span>
}</code></pre>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Products Section -->
            <section id="products">
                <h2 class="section-title">Daftar Produk</h2>

                <!-- GET Products -->
                <div class="endpoint-card">
                    <div class="endpoint-header">
                        <div class="endpoint-identity">
                            <span class="method-badge get">GET</span>
                            <span class="endpoint-path">/products</span>
                        </div>
                        <span class="endpoint-summary">Ambil semua produk</span>
                    </div>
                    <div class="endpoint-details">
                        <div class="details-grid">
                            <div>
                                <div class="panel-title">Deskripsi</div>
                                <p style="font-size: 13px; color: var(--text-muted);">Mengambil data seluruh produk yang terdaftar dalam format camelCase untuk kompabilitas frontend.</p>
                            </div>
                            <div>
                                <div class="panel-title">Response (200 OK)</div>
                                <pre><code>[
  {
    <span class="json-key">"id"</span>: <span class="json-string">"prod-indomie-soto"</span>,
    <span class="json-key">"name"</span>: <span class="json-string">"Indomie Rasa Soto 75g"</span>,
    <span class="json-key">"barcode"</span>: <span class="json-string">"077330023901"</span>,
    <span class="json-key">"categoryId"</span>: <span class="json-string">"cat-mie"</span>,
    <span class="json-key">"priceRetail"</span>: <span class="json-number">3500</span>,
    <span class="json-key">"priceWholesale"</span>: <span class="json-number">3200</span>,
    <span class="json-key">"wholesaleMinQty"</span>: <span class="json-number">10</span>,
    <span class="json-key">"stock"</span>: <span class="json-number">40</span>,
    <span class="json-key">"unit"</span>: <span class="json-string">"bungkus"</span>,
    <span class="json-key">"isActive"</span>: <span class="json-boolean">true</span>
  }
]</code></pre>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- POST Product -->
                <div class="endpoint-card">
                    <div class="endpoint-header">
                        <div class="endpoint-identity">
                            <span class="method-badge post">POST</span>
                            <span class="endpoint-path">/products</span>
                        </div>
                        <span class="endpoint-summary">Tambah produk baru</span>
                    </div>
                    <div class="endpoint-details">
                        <div class="details-grid">
                            <div>
                                <div class="panel-title">Request Body (camelCase)</div>
                                <pre><code>{
  <span class="json-key">"id"</span>: <span class="json-string">"prod-minyak-1l"</span>,
  <span class="json-key">"name"</span>: <span class="json-string">"Minyak Goreng Bimoli 1L"</span>,
  <span class="json-key">"barcode"</span>: <span class="json-string">"899238382711"</span>,
  <span class="json-key">"categoryId"</span>: <span class="json-string">"cat-sembako"</span>,
  <span class="json-key">"priceRetail"</span>: <span class="json-number">18500</span>,
  <span class="json-key">"priceWholesale"</span>: <span class="json-number">17900</span>,
  <span class="json-key">"wholesaleMinQty"</span>: <span class="json-number">6</span>,
  <span class="json-key">"stock"</span>: <span class="json-number">12</span>,
  <span class="json-key">"unit"</span>: <span class="json-string">"botol"</span>,
  <span class="json-key">"isActive"</span>: <span class="json-boolean">true</span>
}</code></pre>
                            </div>
                            <div>
                                <div class="panel-title">Response (210 Created)</div>
                                <pre><code>{
  <span class="json-key">"id"</span>: <span class="json-string">"prod-minyak-1l"</span>,
  <span class="json-key">"name"</span>: <span class="json-string">"Minyak Goreng Bimoli 1L"</span>,
  <span class="json-key">"stock"</span>: <span class="json-number">12</span>
}</code></pre>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Sales Section -->
            <section id="sales">
                <h2 class="section-title">Transaksi Penjualan</h2>

                <!-- GET Sales -->
                <div class="endpoint-card">
                    <div class="endpoint-header">
                        <div class="endpoint-identity">
                            <span class="method-badge get">GET</span>
                            <span class="endpoint-path">/sales</span>
                        </div>
                        <span class="endpoint-summary">Ambil riwayat penjualan</span>
                    </div>
                    <div class="endpoint-details">
                        <div class="details-grid">
                            <div>
                                <div class="panel-title">Deskripsi</div>
                                <p style="font-size: 13px; color: var(--text-muted);">Mengambil daftar riwayat seluruh transaksi penjualan diurutkan berdasarkan waktu terbaru (Descending).</p>
                            </div>
                            <div>
                                <div class="panel-title">Response (200 OK)</div>
                                <pre><code>[
  {
    <span class="json-key">"id"</span>: <span class="json-string">"sale-tr-998822"</span>,
    <span class="json-key">"invoiceNumber"</span>: <span class="json-string">"INV-77881122"</span>,
    <span class="json-key">"timestamp"</span>: <span class="json-string">"2026-07-19 15:30:00"</span>,
    <span class="json-key">"totalAmount"</span>: <span class="json-number">10500</span>,
    <span class="json-key">"cashPaid"</span>: <span class="json-number">15000</span>,
    <span class="json-key">"changeDue"</span>: <span class="json-number">4500</span>,
    <span class="json-key">"paymentMethod"</span>: <span class="json-string">"Cash"</span>,
    <span class="json-key">"items"</span>: [
      {
        <span class="json-key">"productId"</span>: <span class="json-string">"prod-indomie-soto"</span>,
        <span class="json-key">"name"</span>: <span class="json-string">"Indomie Rasa Soto 75g"</span>,
        <span class="json-key">"price"</span>: <span class="json-number">3500</span>,
        <span class="json-key">"quantity"</span>: <span class="json-number">3</span>,
        <span class="json-key">"priceType"</span>: <span class="json-string">"retail"</span>,
        <span class="json-key">"subtotal"</span>: <span class="json-number">10500</span>
      }
    ]
  }
]</code></pre>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- POST Sale -->
                <div class="endpoint-card">
                    <div class="endpoint-header">
                        <div class="endpoint-identity">
                            <span class="method-badge post">POST</span>
                            <span class="endpoint-path">/sales</span>
                        </div>
                        <span class="endpoint-summary">Catat transaksi baru</span>
                    </div>
                    <div class="endpoint-details">
                        <div class="details-grid">
                            <div>
                                <div class="panel-title">Request Body</div>
                                <pre><code>{
  <span class="json-key">"id"</span>: <span class="json-string">"sale-tr-998822"</span>,
  <span class="json-key">"invoiceNumber"</span>: <span class="json-string">"INV-77881122"</span>,
  <span class="json-key">"totalAmount"</span>: <span class="json-number">10500</span>,
  <span class="json-key">"cashPaid"</span>: <span class="json-number">15000</span>,
  <span class="json-key">"changeDue"</span>: <span class="json-number">4500</span>,
  <span class="json-key">"paymentMethod"</span>: <span class="json-string">"Cash"</span>,
  <span class="json-key">"items"</span>: [
    {
      <span class="json-key">"productId"</span>: <span class="json-string">"prod-indomie-soto"</span>,
      <span class="json-key">"name"</span>: <span class="json-string">"Indomie Rasa Soto"</span>,
      <span class="json-key">"price"</span>: <span class="json-number">3500</span>,
      <span class="json-key">"quantity"</span>: <span class="json-number">3</span>,
      <span class="json-key">"priceType"</span>: <span class="json-string">"retail"</span>,
      <span class="json-key">"subtotal"</span>: <span class="json-number">10500</span>
    }
  ]
}</code></pre>
                            </div>
                            <div>
                                <div class="panel-title">Info Efek</div>
                                <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">
                                    Menyimpan transaksi dan otomatis mengurangi jumlah stok produk terkait di database dalam mode transaksi aman (SQL Transaction).
                                </p>
                                <div class="panel-title">Response (210 Created)</div>
                                <pre><code>{
  <span class="json-key">"status"</span>: <span class="json-string">"success"</span>,
  <span class="json-key">"message"</span>: <span class="json-string">"Transaksi berhasil disimpan."</span>
}</code></pre>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Settings Section -->
            <section id="settings">
                <h2 class="section-title">Pengaturan Warung</h2>

                <!-- GET Settings -->
                <div class="endpoint-card">
                    <div class="endpoint-header">
                        <div class="endpoint-identity">
                            <span class="method-badge get">GET</span>
                            <span class="endpoint-path">/settings</span>
                        </div>
                        <span class="endpoint-summary">Ambil setelan warung</span>
                    </div>
                    <div class="endpoint-details">
                        <div class="details-grid">
                            <div>
                                <div class="panel-title">Deskripsi</div>
                                <p style="font-size: 13px; color: var(--text-muted);">Mengambil setelan nama warung dan alamat warung yang dicetak pada struk thermal.</p>
                            </div>
                            <div>
                                <div class="panel-title">Response (200 OK)</div>
                                <pre><code>{
  <span class="json-key">"shopName"</span>: <span class="json-string">"WARUNG PINTAR BAROKAH"</span>,
  <span class="json-key">"shopAddress"</span>: <span class="json-string">"Jl. Mawar Merah No. 45, Jakarta"</span>
}</code></pre>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- POST Settings -->
                <div class="endpoint-card">
                    <div class="endpoint-header">
                        <div class="endpoint-identity">
                            <span class="method-badge post">POST</span>
                            <span class="endpoint-path">/settings</span>
                        </div>
                        <span class="endpoint-summary">Simpan setelan warung</span>
                    </div>
                    <div class="endpoint-details">
                        <div class="details-grid">
                            <div>
                                <div class="panel-title">Request Body</div>
                                <pre><code>{
  <span class="json-key">"shopName"</span>: <span class="json-string">"WARUNG PINTAR BAROKAH"</span>,
  <span class="json-key">"shopAddress"</span>: <span class="json-string">"Jl. Mawar Merah No. 45, Jakarta"</span>
}</code></pre>
                            </div>
                            <div>
                                <div class="panel-title">Response (200 OK)</div>
                                <pre><code>{
  <span class="json-key">"status"</span>: <span class="json-string">"success"</span>,
  <span class="json-key">"message"</span>: <span class="json-string">"Pengaturan berhasil disimpan"</span>
}</code></pre>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    </div>

    <script>
        // Set dynamic base URL based on current host
        const baseApi = window.location.origin + '/api';
        document.getElementById('js-base-url').innerText = baseApi;

        // Auto highlight current section in navigation bar based on scrolling
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.sidebar-nav a');

        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                if (pageYOffset >= sectionTop - 150) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + current) {
                    link.classList.add('active');
                }
            });
        });
    </script>
</body>
</html>
