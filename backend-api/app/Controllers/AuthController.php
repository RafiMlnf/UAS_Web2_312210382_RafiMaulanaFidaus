<?php

namespace App\Controllers;

use App\Models\UserModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;

class AuthController extends ResourceController
{
    protected $format = 'json';

    /**
     * POST /api/auth/login
     * Body: { email, password }
     */
    public function login()
    {
        $rules = [
            'email'    => 'required',
            'password' => 'required',
        ];

        if (!$this->validate($rules)) {
            return $this->respond([
                'status'  => false,
                'message' => 'Validasi gagal.',
                'errors'  => $this->validator->getErrors(),
            ], ResponseInterface::HTTP_BAD_REQUEST);
        }

        $model    = new UserModel();
        $email    = $this->request->getJSON(true)['email']    ?? $this->request->getPost('email');
        $password = $this->request->getJSON(true)['password'] ?? $this->request->getPost('password');

        $user = $model->findByEmail($email);

        if (!$user || $user['password'] !== md5($password)) {
            return $this->respond([
                'status'  => false,
                'message' => 'Email atau password salah.',
            ], ResponseInterface::HTTP_UNAUTHORIZED);
        }

        // Generate token: random hash
        $token = bin2hex(random_bytes(32));
        $model->setToken($user['id'], $token);

        unset($user['password'], $user['token']);

        return $this->respond([
            'status'  => true,
            'message' => 'Login berhasil.',
            'token'   => $token,
            'user'    => $user,
        ], ResponseInterface::HTTP_OK);
    }

    /**
     * POST /api/auth/logout
     * Header: Authorization: Bearer {token}
     */
    public function logout()
    {
        $token = $this->getBearerToken();
        if (!$token) {
            return $this->respond([
                'status'  => false,
                'message' => 'Token tidak ditemukan.',
            ], ResponseInterface::HTTP_UNAUTHORIZED);
        }

        $model = new UserModel();
        $user  = $model->findByToken($token);

        if (!$user) {
            return $this->respond([
                'status'  => false,
                'message' => 'Token tidak valid.',
            ], ResponseInterface::HTTP_UNAUTHORIZED);
        }

        $model->clearToken($user['id']);

        return $this->respond([
            'status'  => true,
            'message' => 'Logout berhasil.',
        ], ResponseInterface::HTTP_OK);
    }

    /**
     * Ambil Bearer Token dari header Authorization
     */
    private function getBearerToken(): ?string
    {
        $authHeader = $this->request->getHeaderLine('Authorization');
        if (preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
            return $matches[1];
        }
        return null;
    }
}
