-- ============================================================
-- DATABASE SETUP: inventory_part_pc_db
-- Project: UAS Pemrograman Web 2 - E-Inventory Part PC
-- ============================================================

-- Hapus database lama jika ada agar bersih saat di-import ulang
-- DROP DATABASE IF EXISTS inventory_part_pc_db;

-- CREATE DATABASE IF NOT EXISTS inventory_part_pc_db
--   CHARACTER SET utf8mb4
--   COLLATE utf8mb4_unicode_ci;

-- USE inventory_part_pc_db;

-- Hapus tabel-tabel lama jika ada (berguna jika di-import ke database yang sudah ada)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS transaksi_keluar;
DROP TABLE IF EXISTS transaksi_masuk;
DROP TABLE IF EXISTS part;
DROP TABLE IF EXISTS supplier;
DROP TABLE IF EXISTS brand;
DROP TABLE IF EXISTS kategori_part;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- TABEL 1: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nama        VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  role        ENUM('admin','staff') NOT NULL DEFAULT 'staff',
  token       VARCHAR(255)  NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 2: kategori_part
-- ============================================================
CREATE TABLE IF NOT EXISTS kategori_part (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  nama_kategori  VARCHAR(100) NOT NULL,
  deskripsi      TEXT         NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 3: brand
-- ============================================================
CREATE TABLE IF NOT EXISTS brand (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nama_brand  VARCHAR(100) NOT NULL,
  logo_url    VARCHAR(255) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 4: supplier
-- ============================================================
CREATE TABLE IF NOT EXISTS supplier (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nama_supplier   VARCHAR(150) NOT NULL,
  alamat          TEXT         NULL,
  no_telp         VARCHAR(20)  NULL,
  email           VARCHAR(150) NULL,
  kontak_person   VARCHAR(100) NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 5: part (MASTER UTAMA)
-- ============================================================
CREATE TABLE IF NOT EXISTS part (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  kode_part     VARCHAR(50)  NOT NULL UNIQUE,
  nama_part     VARCHAR(200) NOT NULL,
  kategori_id   INT          NOT NULL,
  brand_id      INT          NOT NULL,
  supplier_id   INT          NOT NULL,
  spesifikasi   TEXT         NULL,
  harga_beli    DECIMAL(15,2) NOT NULL DEFAULT 0,
  harga_jual    DECIMAL(15,2) NOT NULL DEFAULT 0,
  stok          INT          NOT NULL DEFAULT 0,
  stok_minimum  INT          NOT NULL DEFAULT 5,
  satuan        ENUM('pcs','unit') NOT NULL DEFAULT 'pcs',
  gambar_url    VARCHAR(255) NULL,
  status        ENUM('aktif','discontinue') NOT NULL DEFAULT 'aktif',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_part_kategori  FOREIGN KEY (kategori_id) REFERENCES kategori_part(id) ON DELETE RESTRICT,
  CONSTRAINT fk_part_brand     FOREIGN KEY (brand_id)    REFERENCES brand(id)         ON DELETE RESTRICT,
  CONSTRAINT fk_part_supplier  FOREIGN KEY (supplier_id) REFERENCES supplier(id)      ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 6: transaksi_masuk
-- ============================================================
CREATE TABLE IF NOT EXISTS transaksi_masuk (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  part_id       INT           NOT NULL,
  supplier_id   INT           NOT NULL,
  user_id       INT           NOT NULL,
  no_invoice    VARCHAR(50)   NOT NULL,
  jumlah        INT           NOT NULL,
  harga_satuan  DECIMAL(15,2) NOT NULL,
  total_harga   DECIMAL(15,2) NOT NULL,
  tgl_masuk     DATE          NOT NULL,
  keterangan    TEXT          NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tm_part     FOREIGN KEY (part_id)     REFERENCES part(id)     ON DELETE RESTRICT,
  CONSTRAINT fk_tm_supplier FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE RESTRICT,
  CONSTRAINT fk_tm_user     FOREIGN KEY (user_id)     REFERENCES users(id)    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABEL 7: transaksi_keluar
-- ============================================================
CREATE TABLE IF NOT EXISTS transaksi_keluar (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  part_id        INT           NOT NULL,
  user_id        INT           NOT NULL,
  no_transaksi   VARCHAR(50)   NOT NULL,
  jumlah         INT           NOT NULL,
  harga_satuan   DECIMAL(15,2) NOT NULL,
  total_harga    DECIMAL(15,2) NOT NULL,
  nama_pembeli   VARCHAR(150)  NOT NULL,
  tgl_keluar     DATE          NOT NULL,
  keterangan     TEXT          NULL,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tk_part FOREIGN KEY (part_id) REFERENCES part(id)  ON DELETE RESTRICT,
  CONSTRAINT fk_tk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- DATA DUMMY
-- ============================================================

-- Users (password = MD5("password123") untuk demo)
INSERT INTO users (nama, email, password, role) VALUES
  ('Administrator', 'admin@inventorypc.com', MD5('password123'), 'admin'),
  ('Staff Gudang',  'staff@inventorypc.com', MD5('password123'), 'staff');

-- Kategori Part
INSERT INTO kategori_part (nama_kategori, deskripsi) VALUES
  ('Processor',    'Unit pemrosesan utama (CPU) komputer'),
  ('RAM',          'Memory / Random Access Memory'),
  ('Storage',      'Media penyimpanan data (SSD/HDD/NVMe)'),
  ('Motherboard',  'Papan induk / mainboard'),
  ('PSU',          'Power Supply Unit - sumber daya komputer'),
  ('VGA',          'Kartu grafis / Graphics Card'),
  ('Cooling',      'Sistem pendingin: cooler, fan, thermal paste'),
  ('Casing',       'Casing / chassis komputer');

-- Brand
INSERT INTO brand (nama_brand, logo_url) VALUES
  ('Intel', 'https://www.google.com/s2/favicons?domain=intel.com&sz=128'),
  ('AMD', 'https://www.google.com/s2/favicons?domain=amd.com&sz=128'),
  ('ASUS', 'https://www.google.com/s2/favicons?domain=asus.com&sz=128'),
  ('MSI', 'https://www.google.com/s2/favicons?domain=msi.com&sz=128'),
  ('Corsair', 'https://www.google.com/s2/favicons?domain=corsair.com&sz=128'),
  ('Samsung', 'https://www.google.com/s2/favicons?domain=samsung.com&sz=128'),
  ('Western Digital', 'https://www.google.com/s2/favicons?domain=westerndigital.com&sz=128'),
  ('Seagate', 'https://www.google.com/s2/favicons?domain=seagate.com&sz=128'),
  ('EVGA', 'https://www.google.com/s2/favicons?domain=evga.com&sz=128'),
  ('Gigabyte', 'https://www.google.com/s2/favicons?domain=gigabyte.com&sz=128'),
  ('Kingston', 'https://www.google.com/s2/favicons?domain=kingston.com&sz=128'),
  ('Noctua', 'https://www.google.com/s2/favicons?domain=noctua.at&sz=128'),
  ('DeepCool', 'https://www.google.com/s2/favicons?domain=deepcool.com&sz=128'),
  ('Fractal Design', 'https://www.google.com/s2/favicons?domain=fractal-design.com&sz=128'),
  ('be quiet!', 'https://www.google.com/s2/favicons?domain=bequiet.com&sz=128');

-- Supplier
INSERT INTO supplier (nama_supplier, alamat, no_telp, email, kontak_person) VALUES
  ('PT. Komputindo Jaya',     'Jl. Mangga Dua No.12, Jakarta',   '021-6230001', 'order@komputindojaya.com',  'Budi Santoso'),
  ('CV. Digit Mania',         'Jl. Ruko Elektronik B5, Surabaya','031-7112233', 'sales@digitmania.id',       'Dewi Lestari'),
  ('Toko IT Central',         'Jl. Pasar Baru No.88, Bandung',   '022-4233100', 'it.central@gmail.com',      'Eko Prasetyo'),
  ('PT. Global Tech Supply',  'Jl. Sudirman Kav.22, Jakarta',    '021-5702200', 'supply@globaltech.co.id',   'Fitri Handayani');

-- Part (data dummy realistis)
INSERT INTO part (kode_part, nama_part, kategori_id, brand_id, supplier_id, spesifikasi, harga_beli, harga_jual, stok, stok_minimum, satuan, gambar_url, status) VALUES
  -- Processor
  ('CPU-AMD-001', 'AMD Ryzen 5 5600X',    1, 2, 1, 'Socket AM4, 6 Core 12 Thread, 3.7GHz-4.6GHz, TDP 65W',              2650000, 3100000, 15, 3, 'pcs', 'https://m.media-amazon.com/images/I/51MFe1hs5AL._AC_SL1500_.jpg', 'aktif'),
  ('CPU-AMD-002', 'AMD Ryzen 7 5800X',    1, 2, 1, 'Socket AM4, 8 Core 16 Thread, 3.8GHz-4.7GHz, TDP 105W',             4100000, 4800000, 8,  3, 'pcs', 'https://m.media-amazon.com/images/I/51oWBjxqHvL._AC_SL1500_.jpg', 'aktif'),
  ('CPU-INT-001', 'Intel Core i5-12400F', 1, 1, 1, 'Socket LGA1700, 6 Core 12 Thread, 2.5GHz-4.4GHz, TDP 65W',          2200000, 2750000, 12, 3, 'pcs', 'https://m.media-amazon.com/images/I/61iyHIe0vnL._AC_SL1500_.jpg', 'aktif'),
  ('CPU-INT-002', 'Intel Core i7-12700K', 1, 1, 1, 'Socket LGA1700, 12 Core 20 Thread, 3.6GHz-5.0GHz, TDP 125W',        4800000, 5500000, 5,  3, 'pcs', 'https://m.media-amazon.com/images/I/617HL0dR0iL._AC_SL1500_.jpg', 'aktif'),

  -- RAM
  ('RAM-COR-001', 'Corsair Vengeance LPX 16GB DDR4', 2, 5, 2, 'DDR4 3200MHz, CL16, 2x8GB Kit, 1.35V',                  650000,  850000,  20, 5, 'pcs', 'https://m.media-amazon.com/images/I/71GEnQXEb3L._AC_SL1500_.jpg', 'aktif'),
  ('RAM-COR-002', 'Corsair Dominator 32GB DDR5',      2, 5, 2, 'DDR5 5200MHz, CL38, 2x16GB Kit, 1.25V',                 1800000, 2200000, 7,  3, 'pcs', 'https://m.media-amazon.com/images/I/71gHAqORv3L._AC_SL1500_.jpg', 'aktif'),
  ('RAM-KIN-001', 'Kingston Fury Beast 16GB DDR4',    2, 11, 2, 'DDR4 3600MHz, CL18, 2x8GB Kit, 1.35V',                 600000,  780000,  18, 5, 'pcs', 'https://m.media-amazon.com/images/I/71SDFMfpWCL._AC_SL1500_.jpg', 'aktif'),

  -- Storage
  ('SSD-SAM-001', 'Samsung 970 EVO Plus 1TB NVMe',   3, 6, 3, 'M.2 PCIe 3.0, R:3500MB/s W:3300MB/s, TLC NAND',         1150000, 1450000, 22, 5, 'pcs', 'https://m.media-amazon.com/images/I/71+J1VmCPNL._AC_SL1500_.jpg', 'aktif'),
  ('SSD-SAM-002', 'Samsung 980 Pro 2TB NVMe',         3, 6, 3, 'M.2 PCIe 4.0, R:7000MB/s W:5100MB/s, MLC NAND',         2300000, 2800000, 10, 3, 'pcs', 'https://m.media-amazon.com/images/I/71RkOhNnAXL._AC_SL1500_.jpg', 'aktif'),
  ('HDD-WD-001',  'WD Blue 2TB 3.5" HDD',             3, 7, 3, 'SATA III, 5400RPM, 256MB Cache, CMR',                   650000,  820000,  14, 5, 'pcs', 'https://m.media-amazon.com/images/I/71hMpE0mF1L._AC_SL1500_.jpg', 'aktif'),
  ('HDD-SEA-001', 'Seagate Barracuda 4TB HDD',         3, 8, 3, 'SATA III, 5400RPM, 256MB Cache, SMR',                   950000,  1200000, 8,  3, 'pcs', 'https://m.media-amazon.com/images/I/81YHDtDKmQL._AC_SL1500_.jpg', 'aktif'),

  -- Motherboard
  ('MB-ASU-001', 'ASUS ROG Strix B550-F',    4, 3, 1, 'Socket AM4, ATX, DDR4, PCIe 4.0, 2.5G LAN, WiFi 6',              2350000, 2900000, 6,  2, 'pcs', 'https://m.media-amazon.com/images/I/91-hBoSmKEL._AC_SL1500_.jpg', 'aktif'),
  ('MB-MSI-001', 'MSI MAG B660M Mortar',     4, 4, 1, 'Socket LGA1700, mATX, DDR4, PCIe 4.0, 2.5G LAN',                 1450000, 1800000, 9,  2, 'pcs', 'https://m.media-amazon.com/images/I/71T+qIBJAkL._AC_SL1500_.jpg', 'aktif'),
  ('MB-GIG-001', 'Gigabyte B550 AORUS Pro',  4, 10, 1, 'Socket AM4, ATX, DDR4, PCIe 4.0, 2.5G LAN, WiFi 6',             2100000, 2600000, 4,  2, 'pcs', 'https://m.media-amazon.com/images/I/91WKRtfmJ0L._AC_SL1500_.jpg', 'aktif'),

  -- PSU
  ('PSU-COR-001', 'Corsair RM750x 750W Gold', 5, 5, 4, '80+ Gold, Fully Modular, 750W, 10yr Warranty',                  1350000, 1700000, 11, 3, 'pcs', 'https://m.media-amazon.com/images/I/71Gp3lPADeL._AC_SL1500_.jpg', 'aktif'),
  ('PSU-EVG-001', 'EVGA SuperNOVA 850W Platinum', 5, 9, 4, '80+ Platinum, Fully Modular, 850W, 10yr Warranty',           1700000, 2100000, 5,  2, 'pcs', 'https://m.media-amazon.com/images/I/81TjKNKPr6L._AC_SL1500_.jpg', 'aktif'),

  -- VGA
  ('VGA-ASU-001', 'ASUS TUF RX 6700 XT 12GB', 6, 3, 4, 'RDNA2, 12GB GDDR6, PCIe 4.0, 3x DP + 1x HDMI, 180W TDP',     5500000, 6500000, 4,  2, 'pcs', 'https://m.media-amazon.com/images/I/71OOHy5RRWL._AC_SL1500_.jpg', 'aktif'),
  ('VGA-MSI-001', 'MSI RTX 3070 Gaming X 8GB', 6, 4, 4, 'Ampere, 8GB GDDR6, PCIe 4.0, 3x DP + 1x HDMI, 220W TDP',    7200000, 8500000, 3,  2, 'pcs', 'https://m.media-amazon.com/images/I/71w2UrLmhOL._AC_SL1500_.jpg', 'aktif'),
  ('VGA-MSI-002', 'MSI GTX 1650 Ventus XS 4GB', 6, 4, 4, 'Turing Architecture, 4GB GDDR6, 128-bit, Twin Fan, No PCIe Power Required', 2000000, 2400000, 5, 2, 'pcs', 'https://m.media-amazon.com/images/I/71p0g0S6KOL._AC_SL1500_.jpg', 'aktif'),
  ('VGA-ASU-002', 'ASUS TUF GTX 1650 Super 4GB', 6, 3, 4, 'Turing Architecture, 4GB GDDR6, 128-bit, Dual Fan, TUF Durability', 2400000, 2900000, 4, 2, 'pcs', 'https://m.media-amazon.com/images/I/71dO1S-y+8L._AC_SL1500_.jpg', 'aktif'),
  ('VGA-GIG-002', 'Gigabyte GTX 1660 OC 6GB', 6, 10, 4, 'Turing, 6GB GDDR5, 192-bit, Windforce 2X Cooling System', 3100000, 3700000, 6, 2, 'pcs', 'https://m.media-amazon.com/images/I/81577Vz-E3L._AC_SL1500_.jpg', 'aktif'),
  ('VGA-MSI-003', 'MSI GTX 1660 Super Ventus XS 6GB', 6, 4, 4, 'Turing, 6GB GDDR6, 192-bit, Ventus Dual Fan Cooling', 3400000, 4000000, 8, 2, 'pcs', 'https://m.media-amazon.com/images/I/81dG2qS+WNL._AC_SL1500_.jpg', 'aktif'),
  ('VGA-ASU-003', 'ASUS ROG Strix GTX 1660 Ti 6GB', 6, 3, 4, 'Turing, 6GB GDDR6, 192-bit, Triple Fan ROG Cooling, Aura Sync', 3800000, 4500000, 3, 2, 'pcs', 'https://m.media-amazon.com/images/I/81-e2+XwS+L._AC_SL1500_.jpg', 'aktif'),
  ('VGA-GIG-003', 'Gigabyte RTX 2060 Windforce 6GB', 6, 10, 4, 'Turing, Ray Tracing, 6GB GDDR6, 192-bit, Dual Windforce Fan', 4200000, 5000000, 5, 2, 'pcs', 'https://m.media-amazon.com/images/I/81Q1yP+0T3L._AC_SL1500_.jpg', 'aktif'),
  ('VGA-MSI-004', 'MSI RTX 2060 Super Gaming X 8GB', 6, 4, 4, 'Turing, Ray Tracing, 8GB GDDR6, 256-bit, Twin Frozr 7 Cooling', 4900000, 5800000, 4, 2, 'pcs', 'https://m.media-amazon.com/images/I/71rQ66Q+KSL._AC_SL1500_.jpg', 'aktif'),
  ('VGA-ASU-004', 'ASUS Dual RTX 3050 OC 8GB', 6, 3, 4, 'Ampere, Ray Tracing, DLSS, 8GB GDDR6, 128-bit, Dual Axial-tech Fans', 4500000, 5300000, 7, 2, 'pcs', 'https://m.media-amazon.com/images/I/71R2nS-u7oL._AC_SL1500_.jpg', 'aktif'),

  -- Cooling
  ('CLG-NOC-001', 'Noctua NH-D15 CPU Cooler',  7, 12, 2, 'Dual Tower, 2x NF-A15 PWM, TDP 250W+, Socket LGA1700/AM5',   1200000, 1550000, 8,  3, 'pcs', 'https://m.media-amazon.com/images/I/71I6LMB2g3L._AC_SL1500_.jpg', 'aktif'),
  ('CLG-DEP-001', 'DeepCool AK620 CPU Cooler', 7, 13, 2, 'Dual Tower, 2x FK120P, TDP 260W, Socket LGA1700/AM5',        650000,  850000,  12, 3, 'pcs', 'https://m.media-amazon.com/images/I/51rVcjLvKQL._AC_SL1500_.jpg', 'aktif'),

  -- Casing
  ('CAS-FRA-001', 'Fractal Design Meshify C', 8, 14, 2, 'Mid Tower, Mesh Front, 2x Fans included, ATX/mATX/ITX',        850000,  1100000, 6,  2, 'pcs', 'https://m.media-amazon.com/images/I/71yibFOfAcL._AC_SL1500_.jpg', 'aktif'),
  ('CAS-BEQ-001', 'be quiet! Pure Base 500',  8, 15, 2, 'Mid Tower, Tempered Glass, 3x Pure Wings 2 Fans, ATX',         950000,  1200000, 4,  2, 'pcs', 'https://m.media-amazon.com/images/I/71y4B+3kGRL._AC_SL1500_.jpg', 'aktif');

-- Transaksi Masuk — data realistis 30 hari terakhir (22 Mei – 20 Juni 2026)
INSERT INTO transaksi_masuk (part_id, supplier_id, user_id, no_invoice, jumlah, harga_satuan, total_harga, tgl_masuk, keterangan) VALUES
  -- Minggu 1 (22-28 Mei)
  (1,  1, 1, 'INV-2026-001', 15, 2650000, 39750000, '2026-05-22', 'Restock Ryzen 5 5600X batch Mei'),
  (2,  1, 1, 'INV-2026-001',  8, 4100000, 32800000, '2026-05-22', 'Restock Ryzen 7 5800X'),
  (3,  1, 1, 'INV-2026-001', 12, 2200000, 26400000, '2026-05-22', 'Restock Core i5-12400F'),
  (5,  2, 1, 'INV-2026-002', 20,  650000, 13000000, '2026-05-24', 'Restock RAM Corsair 16GB DDR4'),
  (7,  2, 1, 'INV-2026-002', 18,  600000, 10800000, '2026-05-24', 'Restock Kingston Fury 16GB'),
  (8,  3, 1, 'INV-2026-003', 22, 1150000, 25300000, '2026-05-26', 'Restock SSD Samsung 970 1TB'),
  (10, 3, 1, 'INV-2026-003', 14,  650000,  9100000, '2026-05-26', 'Restock HDD WD 2TB'),
  (15, 4, 1, 'INV-2026-004', 11, 1350000, 14850000, '2026-05-28', 'Restock PSU Corsair 750W'),

  -- Minggu 2 (29 Mei – 4 Jun)
  (4,  1, 1, 'INV-2026-005',  5, 4800000, 24000000, '2026-05-29', 'Restock Core i7-12700K'),
  (6,  2, 1, 'INV-2026-005',  7, 1800000, 12600000, '2026-05-29', 'Restock Corsair DDR5 32GB'),
  (9,  3, 1, 'INV-2026-006', 10, 2300000, 23000000, '2026-05-31', 'Restock SSD Samsung 980 Pro 2TB'),
  (11, 3, 1, 'INV-2026-006',  8,  950000,  7600000, '2026-05-31', 'Restock HDD Seagate 4TB'),
  (12, 1, 1, 'INV-2026-007',  6, 2350000, 14100000, '2026-06-02', 'Restock ASUS ROG Strix B550-F'),
  (13, 1, 1, 'INV-2026-007',  9, 1450000, 13050000, '2026-06-02', 'Restock MSI MAG B660M'),
  (16, 4, 1, 'INV-2026-008',  5, 1700000,  8500000, '2026-06-03', 'Restock PSU EVGA 850W Platinum'),

  -- Minggu 3 (5-11 Jun)
  (1,  1, 1, 'INV-2026-009', 10, 2650000, 26500000, '2026-06-05', 'Restock CPU AMD batch Juni W1'),
  (17, 4, 1, 'INV-2026-009',  4, 5500000, 22000000, '2026-06-05', 'Restock VGA ASUS RX 6700 XT'),
  (18, 4, 1, 'INV-2026-009',  3, 7200000, 21600000, '2026-06-05', 'Restock VGA MSI RTX 3070'),
  (5,  2, 1, 'INV-2026-010', 15,  650000,  9750000, '2026-06-07', 'Tambahan stok RAM DDR4'),
  (19, 2, 1, 'INV-2026-010',  8, 1200000,  9600000, '2026-06-07', 'Restock Noctua NH-D15'),
  (20, 2, 1, 'INV-2026-010', 12,  650000,  7800000, '2026-06-07', 'Restock DeepCool AK620'),
  (8,  3, 1, 'INV-2026-011', 10, 1150000, 11500000, '2026-06-09', 'Top-up SSD Samsung 1TB'),
  (14, 1, 1, 'INV-2026-011',  4, 2100000,  8400000, '2026-06-09', 'Restock Gigabyte B550 AORUS'),
  (3,  1, 1, 'INV-2026-012',  8, 2200000, 17600000, '2026-06-10', 'Restock i5-12400F W2 Juni'),
  (7,  2, 1, 'INV-2026-012', 10,  600000,  6000000, '2026-06-10', 'Tambah stok Kingston Fury'),

  -- Minggu 4 (12-18 Jun)
  (2,  1, 1, 'INV-2026-013',  6, 4100000, 24600000, '2026-06-12', 'Restock Ryzen 7 5800X batch 2'),
  (6,  2, 1, 'INV-2026-013',  5, 1800000,  9000000, '2026-06-12', 'Top-up Corsair DDR5'),
  (15, 4, 1, 'INV-2026-014',  8, 1350000, 10800000, '2026-06-13', 'Restock PSU Corsair W3 Juni'),
  (17, 4, 1, 'INV-2026-014',  3, 5500000, 16500000, '2026-06-13', 'Tambah VGA RX 6700 XT'),
  (21, 2, 1, 'INV-2026-015',  6,  850000,  5100000, '2026-06-14', 'Restock Casing Fractal Meshify'),
  (22, 2, 1, 'INV-2026-015',  4,  950000,  3800000, '2026-06-14', 'Restock Casing be quiet! Pure Base'),
  (9,  3, 1, 'INV-2026-016',  8, 2300000, 18400000, '2026-06-16', 'Restock SSD 980 Pro 2TB W3'),
  (11, 3, 1, 'INV-2026-016',  5,  950000,  4750000, '2026-06-16', 'Top-up Seagate 4TB'),
  (4,  1, 1, 'INV-2026-017',  4, 4800000, 19200000, '2026-06-17', 'Restock i7-12700K Juni'),
  (12, 1, 1, 'INV-2026-017',  5, 2350000, 11750000, '2026-06-17', 'Top-up ASUS ROG Strix'),
  (13, 1, 1, 'INV-2026-018',  7, 1450000, 10150000, '2026-06-18', 'Restock MSI MAG B660M W3'),
  (18, 4, 1, 'INV-2026-018',  2, 7200000, 14400000, '2026-06-18', 'Top-up MSI RTX 3070'),

  -- Minggu ini (19-20 Jun)
  (1,  1, 1, 'INV-2026-019',  8, 2650000, 21200000, '2026-06-19', 'Restock harian Ryzen 5 5600X'),
  (5,  2, 1, 'INV-2026-019', 12,  650000,  7800000, '2026-06-19', 'Restock harian RAM DDR4'),
  (8,  3, 1, 'INV-2026-020',  6, 1150000,  6900000, '2026-06-20', 'Top-up SSD Samsung hari ini'),
  (19, 2, 1, 'INV-2026-020',  5, 1200000,  6000000, '2026-06-20', 'Restock Noctua cooler hari ini');

-- Transaksi Keluar — penjualan realistis 30 hari (22 Mei – 20 Juni 2026)
INSERT INTO transaksi_keluar (part_id, user_id, no_transaksi, jumlah, harga_satuan, total_harga, nama_pembeli, tgl_keluar, keterangan) VALUES
  -- Minggu 1 (22-28 Mei)
  (1,  1, 'TRX-2026-001', 2, 3100000,  6200000, 'Andi Wirawan',    '2026-05-22', 'Build gaming entry level'),
  (5,  1, 'TRX-2026-001', 2,  850000,  1700000, 'Andi Wirawan',    '2026-05-22', 'RAM build gaming'),
  (8,  1, 'TRX-2026-001', 1, 1450000,  1450000, 'Andi Wirawan',    '2026-05-22', 'SSD build gaming'),
  (3,  2, 'TRX-2026-002', 3, 2750000,  8250000, 'Budi Hartono',    '2026-05-24', 'Upgrade PC kantor x3'),
  (7,  2, 'TRX-2026-002', 3,  780000,  2340000, 'Budi Hartono',    '2026-05-24', 'RAM kantor x3'),
  (10, 2, 'TRX-2026-003', 2,  820000,  1640000, 'Citra Dewi',      '2026-05-25', 'Tambah storage NAS'),
  (15, 1, 'TRX-2026-004', 2, 1700000,  3400000, 'Dimas Prayoga',   '2026-05-27', 'PSU pengganti'),
  (20, 1, 'TRX-2026-004', 1,  850000,   850000, 'Dimas Prayoga',   '2026-05-27', 'Cooler AK620'),

  -- Minggu 2 (29 Mei – 4 Jun)
  (2,  1, 'TRX-2026-005', 1, 4800000,  4800000, 'Eka Nugraha',     '2026-05-29', 'Build workstation'),
  (6,  1, 'TRX-2026-005', 1, 2200000,  2200000, 'Eka Nugraha',     '2026-05-29', 'RAM DDR5 workstation'),
  (9,  1, 'TRX-2026-005', 1, 2800000,  2800000, 'Eka Nugraha',     '2026-05-29', 'SSD NVMe workstation'),
  (12, 2, 'TRX-2026-006', 1, 2900000,  2900000, 'Fajar Pratama',   '2026-05-31', 'Motherboard AM4 build'),
  (19, 2, 'TRX-2026-006', 1, 1550000,  1550000, 'Fajar Pratama',   '2026-05-31', 'Noctua cooler'),
  (1,  1, 'TRX-2026-007', 3, 3100000,  9300000, 'Gilang Ramadhan', '2026-06-01', 'Batch CPU AMD x3'),
  (5,  1, 'TRX-2026-007', 3,  850000,  2550000, 'Gilang Ramadhan', '2026-06-01', 'RAM x3 batch'),
  (11, 2, 'TRX-2026-008', 2, 1200000,  2400000, 'Hana Pertiwi',    '2026-06-03', 'HDD backup server'),

  -- Minggu 3 (5-11 Jun)
  (17, 1, 'TRX-2026-009', 1, 6500000,  6500000, 'Ivan Susanto',    '2026-06-05', 'VGA RX 6700 XT gaming rig'),
  (3,  1, 'TRX-2026-009', 2, 2750000,  5500000, 'Ivan Susanto',    '2026-06-05', 'CPU i5 x2'),
  (7,  2, 'TRX-2026-010', 4,  780000,  3120000, 'Joko Widodo',     '2026-06-06', 'RAM kantor x4'),
  (8,  2, 'TRX-2026-010', 3, 1450000,  4350000, 'Joko Widodo',     '2026-06-06', 'SSD kantor x3'),
  (13, 1, 'TRX-2026-011', 2, 1800000,  3600000, 'Kartika Sari',    '2026-06-07', 'Motherboard mATX x2'),
  (15, 1, 'TRX-2026-011', 2, 1700000,  3400000, 'Kartika Sari',    '2026-06-07', 'PSU 750W x2'),
  (18, 1, 'TRX-2026-012', 1, 8500000,  8500000, 'Lutfi Hakim',     '2026-06-09', 'RTX 3070 gaming rig'),
  (2,  1, 'TRX-2026-012', 2, 4800000,  9600000, 'Lutfi Hakim',     '2026-06-09', 'CPU Ryzen 7 x2'),
  (6,  2, 'TRX-2026-013', 2, 2200000,  4400000, 'Melati Putri',    '2026-06-10', 'DDR5 upgrade x2'),
  (9,  2, 'TRX-2026-013', 2, 2800000,  5600000, 'Melati Putri',    '2026-06-10', 'NVMe SSD x2'),

  -- Minggu 4 (12-18 Jun)
  (1,  1, 'TRX-2026-014', 4, 3100000, 12400000, 'Nanda Permana',   '2026-06-12', 'Batch CPU Ryzen 5 x4'),
  (5,  1, 'TRX-2026-014', 4,  850000,  3400000, 'Nanda Permana',   '2026-06-12', 'RAM x4 batch'),
  (8,  1, 'TRX-2026-014', 4, 1450000,  5800000, 'Nanda Permana',   '2026-06-12', 'SSD x4 batch'),
  (14, 2, 'TRX-2026-015', 1, 2600000,  2600000, 'Oktavia Rahman',  '2026-06-13', 'Gigabyte AORUS Pro'),
  (20, 2, 'TRX-2026-015', 2,  850000,  1700000, 'Oktavia Rahman',  '2026-06-13', 'DeepCool cooler x2'),
  (21, 1, 'TRX-2026-016', 2, 1100000,  2200000, 'Prasetyo Andi',   '2026-06-14', 'Casing Fractal x2'),
  (3,  1, 'TRX-2026-016', 3, 2750000,  8250000, 'Prasetyo Andi',   '2026-06-14', 'CPU i5 batch x3'),
  (16, 2, 'TRX-2026-017', 1, 2100000,  2100000, 'Qori Indah',      '2026-06-15', 'PSU EVGA 850W'),
  (12, 2, 'TRX-2026-017', 2, 2900000,  5800000, 'Qori Indah',      '2026-06-15', 'Motherboard ROG x2'),
  (7,  1, 'TRX-2026-018', 5,  780000,  3900000, 'Reza Firmansyah', '2026-06-16', 'RAM Kingston x5 bulk'),
  (10, 1, 'TRX-2026-018', 3,  820000,  2460000, 'Reza Firmansyah', '2026-06-16', 'HDD WD 2TB x3'),
  (17, 1, 'TRX-2026-019', 2, 6500000, 13000000, 'Sari Bulan',      '2026-06-17', 'VGA RX 6700 XT x2'),
  (4,  1, 'TRX-2026-019', 2, 5500000, 11000000, 'Sari Bulan',      '2026-06-17', 'CPU i7 x2 highend'),
  (11, 2, 'TRX-2026-020', 3, 1200000,  3600000, 'Toni Gunawan',    '2026-06-18', 'HDD Seagate x3 NAS'),
  (22, 2, 'TRX-2026-020', 2, 1200000,  2400000, 'Toni Gunawan',    '2026-06-18', 'Casing be quiet! x2'),

  -- Minggu ini (19-20 Jun)
  (1,  1, 'TRX-2026-021', 3, 3100000,  9300000, 'Udin Sedunia',    '2026-06-19', 'Batch Ryzen 5 harian'),
  (5,  1, 'TRX-2026-021', 3,  850000,  2550000, 'Udin Sedunia',    '2026-06-19', 'RAM DDR4 harian'),
  (15, 2, 'TRX-2026-022', 2, 1700000,  3400000, 'Vina Amelia',     '2026-06-19', 'PSU Corsair x2'),
  (8,  1, 'TRX-2026-023', 2, 1450000,  2900000, 'Wahyu Prasetya',  '2026-06-20', 'SSD Samsung hari ini'),
  (19, 1, 'TRX-2026-023', 2, 1550000,  3100000, 'Wahyu Prasetya',  '2026-06-20', 'Noctua cooler hari ini');

