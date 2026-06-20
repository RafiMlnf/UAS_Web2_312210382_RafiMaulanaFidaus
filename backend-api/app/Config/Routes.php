<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */

// =============================================================
// PUBLIC ROUTES (tanpa auth)
// =============================================================

// Auth
$routes->post('api/auth/login',  'AuthController::login');
$routes->post('api/auth/logout', 'AuthController::logout', ['filter' => 'auth']);

// Public read-only: list part, kategori, brand, supplier
$routes->get('api/part/stok-menipis',    'PartController::stokMenipis');
$routes->get('api/part/dashboard-stats', 'PartController::dashboardStats');
$routes->get('api/part/chart-stats',     'PartController::chartStats');
$routes->get('api/part',     'PartController::index');
$routes->get('api/part/(:num)', 'PartController::show/$1');


$routes->get('api/kategori',         'KategoriController::index');
$routes->get('api/kategori/(:num)',   'KategoriController::show/$1');

$routes->get('api/brand',            'BrandController::index');
$routes->get('api/brand/(:num)',      'BrandController::show/$1');

$routes->get('api/supplier',         'SupplierController::index');
$routes->get('api/supplier/(:num)',   'SupplierController::show/$1');

$routes->get('api/transaksi-masuk',          'TransaksiMasukController::index');
$routes->get('api/transaksi-masuk/(:num)',    'TransaksiMasukController::show/$1');

$routes->get('api/transaksi-keluar',         'TransaksiKeluarController::index');
$routes->get('api/transaksi-keluar/(:num)',   'TransaksiKeluarController::show/$1');

// =============================================================
// PROTECTED ROUTES (butuh Bearer Token)
// =============================================================

$routes->group('api', ['filter' => 'auth'], function ($routes) {

    // Part — Create, Update, Delete
    $routes->post('part',          'PartController::create');
    $routes->put('part/(:num)',    'PartController::update/$1');
    $routes->delete('part/(:num)', 'PartController::delete/$1');

    // Kategori — CUD
    $routes->post('kategori',          'KategoriController::create');
    $routes->put('kategori/(:num)',    'KategoriController::update/$1');
    $routes->delete('kategori/(:num)', 'KategoriController::delete/$1');

    // Brand — CUD
    $routes->post('brand',          'BrandController::create');
    $routes->put('brand/(:num)',    'BrandController::update/$1');
    $routes->delete('brand/(:num)', 'BrandController::delete/$1');

    // Supplier — CUD
    $routes->post('supplier',          'SupplierController::create');
    $routes->put('supplier/(:num)',    'SupplierController::update/$1');
    $routes->delete('supplier/(:num)', 'SupplierController::delete/$1');

    // Transaksi Masuk
    $routes->post('transaksi-masuk',          'TransaksiMasukController::create');
    $routes->delete('transaksi-masuk/(:num)', 'TransaksiMasukController::delete/$1');

    // Transaksi Keluar
    $routes->post('transaksi-keluar',          'TransaksiKeluarController::create');
    $routes->delete('transaksi-keluar/(:num)', 'TransaksiKeluarController::delete/$1');
});
