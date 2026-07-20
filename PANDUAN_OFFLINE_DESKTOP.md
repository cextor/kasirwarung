# PANDUAN INSTALASI & MENJALANKAN KASIR WARUNG SECARA OFFLINE (XAMPP - MULTI DRIVE C/D/E)

Panduan ini ditujukan bagi pengguna awam untuk menjalankan aplikasi **Kasir Warung** secara offline menggunakan XAMPP yang terpasang di **Drive C:, D:, atau E:** pada OS Windows 10 Compact. Panduan dilengkapi cara membuat shortcut sekali klik langsung dari Desktop.

---

## 🛠️ Langkah 1: Persiapan Folder Aplikasi & Database

1. **Salin Folder Aplikasi ke htdocs**:
   * Pindahkan atau salin folder **`kasirwarung`** Anda ke dalam direktori XAMPP htdocs Anda (misalnya di Drive E: atau D:).
   * Jalur lengkap folder aplikasi Anda harus berupa:
     `E:\xampp\htdocs\kasirwarung` (atau `D:\xampp\htdocs\kasirwarung` jika di drive D).

2. **Membuat Database di phpMyAdmin**:
   * Buka XAMPP Control Panel secara manual untuk pertama kali, lalu **Start** layanan **Apache** dan **MySQL**.
   * Buka browser Anda dan akses alamat:
     http://localhost/phpmyadmin
   * Buat database baru dengan nama: **`kasirwarung`** (klik menu **New / Baru** -> ketik `kasirwarung` -> klik **Create / Buat**).
   * Pilih database `kasirwarung` yang baru dibuat tersebut, masuk ke tab **Import / Impor**, pilih file **`schema.sql`** yang berada di dalam folder `[DRIVE_XAMPP]:\xampp\htdocs\kasirwarung\backend\schema.sql`, lalu klik **Import / Kirim** di bagian bawah.
   * *(Opsional)* Jika ingin menambahkan data contoh (seperti kategori mie, sembako, minuman, snack, dan beberapa barang demo), impor juga file **`seed.sql`** yang berada di folder `backend\seed.sql`.

3. **Konfigurasi File Environment (.env)**:
   * Masuk ke folder `[DRIVE_XAMPP]:\xampp\htdocs\kasirwarung\backend`
   * Buka file bernama **`.env`** menggunakan Notepad.
   * Pastikan pengaturan database di dalamnya mencantumkan:
     ```env
     database.default.hostname = localhost
     database.default.database = kasirwarung
     database.default.username = root
     database.default.password = 
     database.default.DBDriver = MySQLi
     ```
   * Simpan file tersebut (**Ctrl + S**), lalu tutup Notepad.

---

## 🚀 Langkah 2: Membuat Shortcut Sekali Klik di Desktop

Dengan metode ini, Anda **tidak perlu** membuka XAMPP Control Panel secara manual setiap kali ingin menggunakan aplikasi. Cukup klik ikon di Desktop, maka server Apache, database MySQL, dan halaman kasir akan menyala otomatis!

1. Buka folder **`[DRIVE_XAMPP]:\xampp\htdocs\kasirwarung`**.
2. Cari file bernama **`Jalankan_Kasir.bat`**.
3. **Klik kanan** pada file `Jalankan_Kasir.bat` -> pilih **Send to (Kirim ke)** -> lalu klik **Desktop (create shortcut)**.
4. Pergi ke halaman Desktop Windows 10 Anda. Anda akan melihat shortcut baru bernama `Jalankan_Kasir.bat - Shortcut`.
5. **Ubah nama shortcut** tersebut agar lebih rapi:
   * Klik kanan pada shortcut tersebut -> pilih **Rename (Ubah Nama)** -> ketik **`Kasir Warung Pintar`**.

---

## 🎨 Langkah 3: Mengganti Ikon Shortcut (Agar Tampilan Premium)

Agar shortcut di Desktop Anda memiliki ikon profesional (bukan ikon CMD default):

1. **Klik kanan** pada shortcut `Kasir Warung Pintar` di Desktop Anda -> pilih **Properties**.
2. Pada tab **Shortcut**, klik tombol **Change Icon...** di bagian bawah.
3. Windows akan menampilkan pesan peringatan kecil, cukup klik **OK**.
4. Klik tombol **Browse...** dan navigasikan ke ikon bawaan Windows yang menarik (misal di folder `C:\Windows\System32\shell32.dll` atau `imageres.dll` yang menyediakan banyak ikon keranjang belanja, komputer, atau kasir).
5. Pilih ikon pilihan Anda (misalnya ikon bergambar **kunci**, **komputer**, atau **tas belanja**) -> klik **OK** -> klik **Apply** -> klik **OK**.

---

## 💻 Langkah 4: Cara Penggunaan Sehari-hari

Mulai sekarang, ketika Anda ingin membuka aplikasi kasir toko Anda:
1. Nyalakan laptop/PC Anda.
2. **Double-click** (klik dua kali) shortcut **`Kasir Warung Pintar`** di Desktop Anda.
3. Sebuah jendela CMD akan muncul selama 3 detik untuk secara otomatis mendeteksi lokasi XAMPP (baik di C:, D:, atau E:) dan menyalakan server Apache & database MySQL di latar belakang.
4. Browser Google Chrome atau browser default Anda akan otomatis terbuka dan langsung menampilkan halaman aplikasi kasir siap pakai di alamat:
   http://localhost/kasirwarung/backend/public/
5. Anda siap melakukan transaksi scan barcode atau kelola katalog produk!

---

## 🔍 Troubleshooting (Pecahkan Masalah & Solusi Error)

### 1. Error Printer USB: `Access Denied` / `Failed to execute 'open' on 'USBDevice'`
* **Mengapa ini terjadi?**
  Windows secara bawaan mengunci perangkat printer USB untuk digunakan oleh sistem pencetakan Windows sendiri (driver `usbprint.sys`). Hal ini membuat browser (Chrome/Edge) tidak diberi izin akses langsung.
* **Cara Mengatasinya (Sangat Mudah)**:
  1. Unduh aplikasi gratis **Zadig** di: [https://zadig.akeo.ie/](https://zadig.akeo.ie/)
  2. Pastikan Printer Thermal Anda tersambung ke komputer via kabel USB dan dalam kondisi menyala.
  3. Buka aplikasi **Zadig**, pilih menu **Options** -> centang **List All Devices**.
  4. Pada kolom pilihan (dropdown), pilih nama printer Anda (misalnya: *POS-58, Thermal Printer, atau USB Printing Support*).
  5. Di sebelah kanan anak panah hijau, pastikan driver tujuan yang dipilih adalah **`WinUSB`**.
  6. Klik tombol besar **Replace Driver** (atau **Install Driver**). Tunggu hingga proses selesai.
  7. Buka kembali aplikasi kasir Anda di Chrome, klik Hubungkan Printer USB, dan printer akan langsung terhubung tanpa error!

### 2. Error Konsol: `GET http://localhost:8080/index.php?debugbar net::ERR_CONNECTION_REFUSED`
* **Mengapa ini terjadi?**
  Aplikasi masih berjalan dalam mode Pengembangan (*Development*). Fitur Toolbar Debugging mencari port 8080.
* **Cara Mengatasinya**:
  1. Masuk ke folder `[DRIVE_XAMPP]:\xampp\htdocs\kasirwarung\backend`.
  2. Buka file **`.env`** dengan Notepad.
  3. Cari baris `CI_ENVIRONMENT` dan ubah nilainya menjadi `production`:
     ```env
     CI_ENVIRONMENT = production
     ```
  4. Simpan file (**Ctrl + S**). Toolbar debug akan mati otomatis, mempercepat loading, dan menghilangkan error tersebut.
