<p align="center">
  <img src="frontend-spa/assets/img/logoweb.png" alt="Omniacomp Logo" width="400" /><br>
</p>
     
---
      
Link Demo      : https://omniacomprafimf.freedev.app/    
Link Youtube   : https://youtu.be/FSXjpvFUBds  
  
## Deskripsi Proyek

Omniacomp Inventory adalah sistem manajemen inventaris gudang dan toko komponen PC berbasis web. Sistem ini dirancang untuk mengelola data komponen PC (seperti prosesor, RAM, storage, motherboard, pendingin, dan casing), brand, supplier, serta transaksi stok masuk dan keluar secara real-time.

Proyek ini dibangun menggunakan Arsitektur Terpisah (Decoupled Architecture) yang memisahkan secara penuh antara Server (Backend) dan Klien (Frontend):
- Backend: RESTful API Engine menggunakan PHP Framework CodeIgniter 4.
- Frontend: Single Page Application (SPA) menggunakan VueJS 3 via CDN dengan penataan gaya menggunakan TailwindCSS.

---

## Fitur Utama

1. Manajemen Data Master (CRUD):
   - Data Part / Komponen PC (kode SKU, nama, kategori, brand, supplier, stok, harga beli, harga jual, status).
   - Kategori Part.
   - Brand / Produsen Komponen.
   - Supplier / Pemasok Barang.
2. Manajemen Transaksi Stok:
   - Transaksi Stok Masuk (restock otomatis menambah persediaan barang).
   - Transaksi Stok Keluar (mengurangi persediaan barang dengan validasi kecukupan stok).
3. Dashboard Admin:
   - Informasi ringkasan total part, transaksi, kategori, dan supplier.
   - Sistem Peringatan Stok Menipis (jika stok saat ini berada di bawah batas minimum).
4. Otentikasi dan Keamanan:
   - Autentikasi berbasis Bearer Token pada backend.
   - Navigation Guard di frontend untuk membatasi akses halaman admin.
   - Axios Interceptor untuk penyuntikan token otomatis dan penanganan error 401 secara global.
5. Antarmuka Premium:
   - Desain modern berbasis glassmorphism.
   - Efek gelombang dinamis pada kartu ucapan sidebar.
   - Efek kilauan kaca (shimmer) diagonal pada sidebar.

---

## Struktur Database

Sistem menggunakan database relational MySQL/MariaDB dengan nama database inventory_part_pc_db yang terdiri dari 7 tabel saling berelasi:
- users: Menyimpan informasi akun pengguna (admin/staff).
- kategori_part: Menyimpan kategori komponen PC.
- brand: Menyimpan brand manufaktur komponen.
- supplier: Menyimpan data supplier pemasok barang.
- part: Menyimpan data spesifik komponen PC (tabel master utama).
- transaksi_masuk: Mencatat histori barang masuk dan pemasok terkait.
- transaksi_keluar: Mencatat histori penjualan/pengeluaran barang.

### Skema Relasi Database

![Skema Relasi Database](frontend-spa/assets/img/relasidb.png)


---

## Uji Coba Error 401 Postman (Proteksi Token Gagal)

Berikut adalah hasil pengujian endpoint terproteksi (seperti `POST /api/part`) menggunakan Postman untuk memvalidasi proteksi token:

* **Skenario A: Tanpa Mengirimkan Token (No Auth)**
  ![Error 401 No Auth](frontend-spa/assets/img/401(no-auth).png)

* **Skenario B: Menggunakan Token Salah (Invalid Bearer Token)**
  ![Error 401 Bearer Token](frontend-spa/assets/img/401(bearer-token).png)

---

## Screenshot Antarmuka

Berikut adalah tampilan antarmuka aplikasi Omniacomp:

### 1. Halaman Landing Page (Public)
![Hero Landing Page](frontend-spa/assets/img/dash1.png)
![Katalog Landing Page](frontend-spa/assets/img/dash2.png)

### 2. Halaman Login
![Halaman Login](frontend-spa/assets/img/loginform.png)

### 3. Halaman Dashboard Admin
![Halaman Dashboard Admin](frontend-spa/assets/img/dashboardadmin.png)

### 4. Halaman CRUD Part dan Modal Tambah/Edit Data
![Halaman CRUD Part dan Modal Tambah/Edit Data](frontend-spa/assets/img/formmodal.png)

### 5. Tabel Visualisasi Data Komponen PC (Transaksi Masuk)
![Tabel Visualisasi Data Komponen PC](frontend-spa/assets/img/tabel.png)

---

## Panduan Instalasi Lokal

Ikuti langkah-langkah di bawah ini untuk menjalankan proyek di komputer lokal Anda:

### Prasyarat
- PHP versi 8.1 ke atas
- Composer
- XAMPP atau Laragon (Apache dan MySQL)
- Web Browser modern (Chrome, Edge, Firefox, dll)

### Langkah 1: Persiapan Database
1. Buka phpMyAdmin (atau database client pilihan Anda).
2. Buat database baru dengan nama: inventory_part_pc_db
3. Import file database_setup.sql yang terletak di root direktori proyek ini ke dalam database tersebut.
4. Database ini secara otomatis terisi dengan data awal (seed) serta beberapa akun pengguna siap pakai.

### Langkah 2: Konfigurasi dan Jalankan Backend (RESTful API)
1. Masuk ke direktori backend-api:
   cd backend-api
2. Gandakan file env menjadi .env jika belum ada, lalu sesuaikan konfigurasi database Anda:  
```
   database.default.hostname = localhost  
   database.default.database = inventory_part_pc_db  
   database.default.username = root  
   database.default.password =   
   database.default.DBDriver = MySQLi  
   database.default.port = 3306  
```
3. Jalankan server local CodeIgniter 4 menggunakan Spark CLI:
   php spark serve
4. Backend API secara default akan berjalan di URL: http://localhost:8080/

### Langkah 3: Konfigurasi dan Jalankan Frontend (SPA)
1. Masuk ke direktori frontend-spa:
   cd frontend-spa
2. Jalankan server lokal untuk melayani file statis index.html. Anda dapat menggunakan Apache dari XAMPP dengan menaruh folder proyek di dalam htdocs, lalu mengaksesnya lewat web browser.
3. Misalnya, jika ditaruh di XAMPP htdocs, Anda dapat mengakses frontend di:
   http://localhost:85/Web2-Inventory/frontend-spa/
4. Pastikan file frontend-spa/components/axios-config.js memiliki konfigurasi baseURL yang mengarah ke server backend Anda (http://localhost:8080/api/).

---

## Akun Pengguna Default (Kredensial Login)

Gunakan akun berikut untuk menguji sistem:

| Peran | Username / Email | Password |
|---|---|---|
| Administrator (Baru) | admin | 123 |
| Staff (Baru) | staff | 123 |
| Administrator (Lama) | admin@inventorypc.com | password123 |


