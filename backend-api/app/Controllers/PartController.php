<?php

namespace App\Controllers;

use App\Models\PartModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;

class PartController extends ResourceController
{
    protected $modelName = PartModel::class;
    protected $format    = 'json';

    /** GET /api/part */
    public function index()
    {
        $data = $this->model->getAllWithRelations();
        return $this->respond(['status' => true, 'data' => $data]);
    }

    /** GET /api/part/{id} */
    public function show($id = null)
    {
        $item = $this->model->getOneWithRelations((int) $id);
        if (!$item) {
            return $this->respond(['status' => false, 'message' => 'Part tidak ditemukan.'], ResponseInterface::HTTP_NOT_FOUND);
        }
        return $this->respond(['status' => true, 'data' => $item]);
    }

    /** POST /api/part */
    public function create()
    {
        $body = $this->request->getJSON(true) ?? $this->request->getPost();

        $rules = [
            'kode_part'    => 'required|max_length[50]|is_unique[part.kode_part]',
            'nama_part'    => 'required|min_length[3]|max_length[200]',
            'kategori_id'  => 'required|integer',
            'brand_id'     => 'required|integer',
            'supplier_id'  => 'required|integer',
            'harga_beli'   => 'required|decimal',
            'harga_jual'   => 'required|decimal',
            'stok'         => 'required|integer',
            'stok_minimum' => 'required|integer',
            'satuan'       => 'required|in_list[pcs,unit]',
            'status'       => 'permit_empty|in_list[aktif,discontinue]',
        ];

        if (!$this->validate($rules)) {
            return $this->respond(['status' => false, 'errors' => $this->validator->getErrors()], ResponseInterface::HTTP_BAD_REQUEST);
        }

        $id = $this->model->insert([
            'kode_part'    => $body['kode_part'],
            'nama_part'    => $body['nama_part'],
            'kategori_id'  => $body['kategori_id'],
            'brand_id'     => $body['brand_id'],
            'supplier_id'  => $body['supplier_id'],
            'spesifikasi'  => $body['spesifikasi']  ?? null,
            'harga_beli'   => $body['harga_beli'],
            'harga_jual'   => $body['harga_jual'],
            'stok'         => $body['stok']         ?? 0,
            'stok_minimum' => $body['stok_minimum'] ?? 5,
            'satuan'       => $body['satuan']        ?? 'pcs',
            'gambar_url'   => $body['gambar_url']   ?? null,
            'status'       => $body['status']        ?? 'aktif',
        ]);

        return $this->respond([
            'status'  => true,
            'message' => 'Part berhasil ditambahkan.',
            'data'    => $this->model->getOneWithRelations($id),
        ], ResponseInterface::HTTP_CREATED);
    }

    /** PUT /api/part/{id} */
    public function update($id = null)
    {
        $item = $this->model->find($id);
        if (!$item) {
            return $this->respond(['status' => false, 'message' => 'Part tidak ditemukan.'], ResponseInterface::HTTP_NOT_FOUND);
        }

        $body = $this->request->getJSON(true) ?? $this->request->getRawInput();

        // Validasi kode_part unik kecuali untuk record ini sendiri
        $rules = [
            'kode_part' => "permit_empty|max_length[50]|is_unique[part.kode_part,id,{$id}]",
            'satuan'    => 'permit_empty|in_list[pcs,unit]',
            'status'    => 'permit_empty|in_list[aktif,discontinue]',
        ];

        if (!$this->validate($rules)) {
            return $this->respond(['status' => false, 'errors' => $this->validator->getErrors()], ResponseInterface::HTTP_BAD_REQUEST);
        }

        $this->model->update($id, [
            'kode_part'    => $body['kode_part']    ?? $item['kode_part'],
            'nama_part'    => $body['nama_part']    ?? $item['nama_part'],
            'kategori_id'  => $body['kategori_id']  ?? $item['kategori_id'],
            'brand_id'     => $body['brand_id']     ?? $item['brand_id'],
            'supplier_id'  => $body['supplier_id']  ?? $item['supplier_id'],
            'spesifikasi'  => $body['spesifikasi']  ?? $item['spesifikasi'],
            'harga_beli'   => $body['harga_beli']   ?? $item['harga_beli'],
            'harga_jual'   => $body['harga_jual']   ?? $item['harga_jual'],
            'stok'         => $body['stok']         ?? $item['stok'],
            'stok_minimum' => $body['stok_minimum'] ?? $item['stok_minimum'],
            'satuan'       => $body['satuan']        ?? $item['satuan'],
            'gambar_url'   => $body['gambar_url']   ?? $item['gambar_url'],
            'status'       => $body['status']        ?? $item['status'],
        ]);

        return $this->respond([
            'status'  => true,
            'message' => 'Part berhasil diupdate.',
            'data'    => $this->model->getOneWithRelations((int) $id),
        ]);
    }

    /** DELETE /api/part/{id} */
    public function delete($id = null)
    {
        $item = $this->model->find($id);
        if (!$item) {
            return $this->respond(['status' => false, 'message' => 'Part tidak ditemukan.'], ResponseInterface::HTTP_NOT_FOUND);
        }
        $this->model->delete($id);
        return $this->respond(['status' => true, 'message' => 'Part berhasil dihapus.']);
    }

    /**
     * GET /api/part/stok-menipis
     * Daftar part dengan stok <= stok_minimum
     */
    public function stokMenipis()
    {
        $data = $this->model->getStokMenipis();
        return $this->respond(['status' => true, 'data' => $data]);
    }

    /**
     * GET /api/part/chart-stats?period=daily|weekly|monthly
     * Statistik tren transaksi masuk & keluar per periode
     */
    public function chartStats()
    {
        $period = $this->request->getGet('period') ?? 'daily';
        $kategoriId = $this->request->getGet('kategori_id');
        $db     = \Config\Database::connect();

        $kategoriCond = '';
        if ($kategoriId && is_numeric($kategoriId)) {
            $kategoriCond = "AND p.kategori_id = " . (int)$kategoriId;
        }

        // Tentukan format grouping dan jumlah periode
        switch ($period) {
            case 'weekly':
                $groupFmt  = "YEARWEEK(%s, 1)";   // ISO week
                $labelFmt  = "DATE_FORMAT(MIN(%s), '%%d %%b')";
                $dateFilter = 'INTERVAL 12 WEEK';
                break;
            case 'monthly':
                $groupFmt  = "DATE_FORMAT(%s, '%%Y-%%m')";
                $labelFmt  = "DATE_FORMAT(MIN(%s), '%%b %%Y')";
                $dateFilter = 'INTERVAL 12 MONTH';
                break;
            default: // daily
                $groupFmt  = "DATE(%s)";
                $labelFmt  = "DATE_FORMAT(MIN(%s), '%%d %%b')";
                $dateFilter = 'INTERVAL 30 DAY';
        }

        // Query masuk
        $masukSql = sprintf(
            "SELECT {$labelFmt} as label,
                    {$groupFmt} as grp,
                    SUM(jumlah) as jumlah_unit,
                    COUNT(*) as jumlah_tx
             FROM transaksi_masuk tm
             JOIN part p ON tm.part_id = p.id
             WHERE tm.tgl_masuk >= DATE_SUB(CURDATE(), %s) {$kategoriCond}
             GROUP BY grp
             ORDER BY grp ASC",
            'tm.tgl_masuk', 'tm.tgl_masuk', $dateFilter
        );

        // Query keluar
        $keluarSql = sprintf(
            "SELECT {$labelFmt} as label,
                    {$groupFmt} as grp,
                    SUM(jumlah) as jumlah_unit,
                    COUNT(*) as jumlah_tx
             FROM transaksi_keluar tk
             JOIN part p ON tk.part_id = p.id
             WHERE tk.tgl_keluar >= DATE_SUB(CURDATE(), %s) {$kategoriCond}
             GROUP BY grp
             ORDER BY grp ASC",
            'tk.tgl_keluar', 'tk.tgl_keluar', $dateFilter
        );

        $masukRaw  = $db->query($masukSql)->getResultArray();
        $keluarRaw = $db->query($keluarSql)->getResultArray();

        // Generate complete period ranges to ensure all gaps (e.g. all 12 months) are filled with 0
        $allGrps = [];
        $labelsIdx = [];

        if ($period === 'monthly') {
            for ($i = 11; $i >= 0; $i--) {
                $time = strtotime("-$i months");
                $grp = date('Y-m', $time);
                $allGrps[] = $grp;
                $labelsIdx[$grp] = date('M Y', $time);
            }
        } elseif ($period === 'weekly') {
            for ($i = 11; $i >= 0; $i--) {
                $time = strtotime("-$i weeks");
                $grp = date('oW', $time);
                $allGrps[] = $grp;
                
                $w = date('N', $time);
                $mondayTime = $time - ($w - 1) * 86400;
                $labelsIdx[$grp] = date('d M', $mondayTime);
            }
        } else { // daily
            for ($i = 29; $i >= 0; $i--) {
                $time = strtotime("-$i days");
                $grp = date('Y-m-d', $time);
                $allGrps[] = $grp;
                $labelsIdx[$grp] = date('d M', $time);
            }
        }

        // Index masuk & keluar by grp
        $masukIdx  = array_column($masukRaw,  null, 'grp');
        $keluarIdx = array_column($keluarRaw, null, 'grp');

        $labels     = [];
        $masuk      = [];
        $keluar     = [];
        $masukTx    = [];
        $keluarTx   = [];

        foreach ($allGrps as $grp) {
            $labels[]   = $masukIdx[$grp]['label']  ?? $keluarIdx[$grp]['label']  ?? ($labelsIdx[$grp] ?? $grp);
            $masuk[]    = (int) ($masukIdx[$grp]['jumlah_unit']  ?? 0);
            $keluar[]   = (int) ($keluarIdx[$grp]['jumlah_unit'] ?? 0);
            $masukTx[]  = (int) ($masukIdx[$grp]['jumlah_tx']    ?? 0);
            $keluarTx[] = (int) ($keluarIdx[$grp]['jumlah_tx']   ?? 0);
        }

        return $this->respond([
            'status' => true,
            'period' => $period,
            'data'   => compact('labels', 'masuk', 'keluar', 'masukTx', 'keluarTx'),
        ]);
    }

    /**
     * GET /api/part/dashboard-stats
     * Statistik untuk Dashboard
     */
    public function dashboardStats()
    {
        $stats = $this->model->getDashboardStats();
        return $this->respond(['status' => true, 'data' => $stats]);
    }
}
