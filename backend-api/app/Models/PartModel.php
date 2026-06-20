<?php

namespace App\Models;

use CodeIgniter\Model;

class PartModel extends Model
{
    protected $table         = 'part';
    protected $primaryKey    = 'id';
    protected $useAutoIncrement = true;
    protected $returnType    = 'array';
    protected $useSoftDeletes = false;

    protected $allowedFields = [
        'kode_part', 'nama_part', 'kategori_id', 'brand_id', 'supplier_id',
        'spesifikasi', 'harga_beli', 'harga_jual', 'stok', 'stok_minimum',
        'satuan', 'gambar_url', 'status',
    ];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = '';

    protected $validationRules = [
        'kode_part'    => 'required|max_length[50]',
        'nama_part'    => 'required|min_length[3]|max_length[200]',
        'kategori_id'  => 'required|integer',
        'brand_id'     => 'required|integer',
        'supplier_id'  => 'required|integer',
        'harga_beli'   => 'required|decimal',
        'harga_jual'   => 'required|decimal',
        'stok'         => 'required|integer',
        'stok_minimum' => 'required|integer',
        'satuan'       => 'required|in_list[pcs,unit]',
        'status'       => 'required|in_list[aktif,discontinue]',
    ];

    /**
     * Ambil semua part dengan join ke kategori, brand, supplier
     */
    public function getAllWithRelations(): array
    {
        return $this->select('part.*, k.nama_kategori, b.nama_brand, b.logo_url AS brand_logo_url, s.nama_supplier')
            ->join('kategori_part k', 'k.id = part.kategori_id', 'left')
            ->join('brand b', 'b.id = part.brand_id', 'left')
            ->join('supplier s', 's.id = part.supplier_id', 'left')
            ->orderBy('part.id', 'ASC')
            ->findAll();
    }

    /**
     * Ambil 1 part dengan relasi
     */
    public function getOneWithRelations(int $id): ?array
    {
        return $this->select('part.*, k.nama_kategori, b.nama_brand, b.logo_url AS brand_logo_url, s.nama_supplier')
            ->join('kategori_part k', 'k.id = part.kategori_id', 'left')
            ->join('brand b', 'b.id = part.brand_id', 'left')
            ->join('supplier s', 's.id = part.supplier_id', 'left')
            ->where('part.id', $id)
            ->first();
    }

    /**
     * Ambil part yang stoknya menipis (stok <= stok_minimum)
     */
    public function getStokMenipis(): array
    {
        return $this->select('part.*, k.nama_kategori, b.nama_brand, b.logo_url AS brand_logo_url')
            ->join('kategori_part k', 'k.id = part.kategori_id', 'left')
            ->join('brand b', 'b.id = part.brand_id', 'left')
            ->where('part.stok <=', $this->db->escapeIdentifiers('part.stok_minimum'), false)
            ->where('part.status', 'aktif')
            ->orderBy('part.stok', 'ASC')
            ->findAll();
    }

    /**
     * Tambah stok (saat transaksi masuk)
     */
    public function tambahStok(int $partId, int $jumlah): bool
    {
        return $this->db->query(
            'UPDATE part SET stok = stok + ? WHERE id = ?',
            [$jumlah, $partId]
        );
    }

    /**
     * Kurangi stok (saat transaksi keluar), dengan validasi cukup tidaknya stok
     * Return false jika stok tidak cukup
     */
    public function kurangiStok(int $partId, int $jumlah): bool
    {
        $part = $this->find($partId);
        if (!$part || $part['stok'] < $jumlah) {
            return false;
        }
        return $this->db->query(
            'UPDATE part SET stok = stok - ? WHERE id = ?',
            [$jumlah, $partId]
        );
    }

    /**
     * Statistik untuk dashboard
     */
    public function getDashboardStats(): array
    {
        $totalPart      = $this->countAll();
        $totalNilaiStok = $this->db->query(
            'SELECT SUM(stok * harga_beli) as total FROM part WHERE status = "aktif"'
        )->getRow()->total ?? 0;
        $stokMenipis    = $this->db->query(
            'SELECT COUNT(*) as total FROM part WHERE stok <= stok_minimum AND status = "aktif"'
        )->getRow()->total ?? 0;
        $partAktif      = $this->where('status', 'aktif')->countAllResults();

        $totalKategori  = $this->db->table('kategori_part')->countAllResults();
        $totalBrand     = $this->db->table('brand')->countAllResults();
        $totalSupplier  = $this->db->table('supplier')->countAllResults();

        return [
            'total_part'       => $totalPart,
            'part_aktif'       => $partAktif,
            'stok_menipis'     => (int) $stokMenipis,
            'total_nilai_stok' => (float) $totalNilaiStok,
            'total_kategori'   => $totalKategori,
            'total_brand'      => $totalBrand,
            'total_supplier'   => $totalSupplier,
        ];
    }
}
