<?php

namespace App\Models;

use CodeIgniter\Model;

class UserModel extends Model
{
    protected $table         = 'users';
    protected $primaryKey    = 'id';
    protected $useAutoIncrement = true;
    protected $returnType    = 'array';
    protected $useSoftDeletes = false;

    protected $allowedFields = ['nama', 'email', 'password', 'role', 'token'];

    protected $useTimestamps  = true;
    protected $createdField   = 'created_at';
    protected $updatedField   = '';

    protected $validationRules = [
        'nama'     => 'required|min_length[3]|max_length[100]',
        'email'    => 'required|max_length[150]',
        'password' => 'required',
        'role'     => 'required|in_list[admin,staff]',
    ];

    /**
     * Cari user berdasarkan email
     */
    public function findByEmail(string $email): ?array
    {
        return $this->where('email', $email)->first();
    }

    /**
     * Cari user berdasarkan token
     */
    public function findByToken(string $token): ?array
    {
        return $this->where('token', $token)->first();
    }

    /**
     * Set token untuk user
     */
    public function setToken(int $userId, string $token): bool
    {
        return $this->update($userId, ['token' => $token]);
    }

    /**
     * Hapus token (logout)
     */
    public function clearToken(int $userId): bool
    {
        return $this->update($userId, ['token' => null]);
    }
}
