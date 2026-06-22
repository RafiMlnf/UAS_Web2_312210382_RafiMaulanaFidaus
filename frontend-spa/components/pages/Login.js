import icons from '../icons.js'

export default {
  name: 'LoginPage',
  data() {
    return {
      icons,
      form: { email: '', password: '' },
      showPassword: false,
      loading: false,
      error: '',
    }
  },
  methods: {
    async handleLogin() {
      this.error = ''
      if (!this.form.email || !this.form.password) {
        this.error = 'Username/Email dan password wajib diisi.'
        return
      }
      this.loading = true
      try {
        const res = await axios.post('/api/auth/login', {
          email: this.form.email,
          password: this.form.password,
        })
        const { token, user } = res.data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        this.$router.push('/dashboard')
      } catch (err) {
        this.error = err.response?.data?.message ?? 'Terjadi kesalahan. Coba lagi.'
      } finally {
        this.loading = false
      }
    }
  },
  template: `
    <div class="login-page">

      <!-- Left panel: branding -->
      <div class="login-brand">
        <div class="login-brand-inner">
          <div style="margin-bottom: 36px;">
            <img src="./assets/img/logoweb.png" alt="Logo" style="height: 52px; object-fit: contain;" />
          </div>
          <h2>Kelola inventaris<br>komponen PC dengan<br><span>mudah dan efisien.</span></h2>
          <p>Pantau stok, kelola transaksi, dan kendalikan seluruh gudang dari satu dasbor terpusat.</p>

          <div class="login-stats">
            <div class="login-stat">
              <div class="login-stat-value">7+</div>
              <div class="login-stat-label">Entitas Data</div>
            </div>
            <div class="login-stat-divider"></div>
            <div class="login-stat">
              <div class="login-stat-value">RESTful</div>
              <div class="login-stat-label">API Backend</div>
            </div>
            <div class="login-stat-divider"></div>
            <div class="login-stat">
              <div class="login-stat-value">Realtime</div>
              <div class="login-stat-label">Stok Update</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right panel: form -->
      <div class="login-form-panel">
        <div class="login-card">

          <!-- Logo mobile -->
          <div class="login-card-logo">
            <img src="./assets/img/logoweb.png" alt="Logo" style="height: 32px; object-fit: contain;" />
            <span>Omniacomp</span>
          </div>

          <!-- Heading -->
          <div class="login-card-heading">
            <h1>Selamat Datang</h1>
            <p>Masukkan akun anda untuk login</p>
          </div>

          <!-- Alert error -->
          <div v-if="error" class="alert alert-danger" style="display:flex;align-items:center;gap:8px;">
            <span v-html="icons.warning" style="flex-shrink:0;"></span>
            {{ error }}
          </div>

          <!-- Form -->
          <form @submit.prevent="handleLogin">

            <div class="form-group">
              <label class="form-label">Username</label>
              <div class="input-group">
                <span class="input-group-icon" v-html="icons.user"></span>
                <input
                  id="input-email"
                  type="text"
                  class="form-control"
                  v-model="form.email"
                  placeholder="Masukkan username atau email"
                  autocomplete="username"
                  :class="{ 'is-invalid': error && !form.email }"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Password</label>
              <div class="input-group">
                <span class="input-group-icon" v-html="icons.bookmark" style="opacity:0.6;"></span>
                <input
                  id="input-password"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-control"
                  v-model="form.password"
                  placeholder="Masukkan password"
                  autocomplete="current-password"
                  :class="{ 'is-invalid': error && !form.password }"
                />
                <span class="input-group-suffix">
                  <button
                    type="button"
                    class="eye-toggle"
                    @click="showPassword = !showPassword"
                    :title="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
                  >
                    <span v-if="showPassword" v-html="icons.eyeOff"></span>
                    <span v-else v-html="icons.eye"></span>
                  </button>
                </span>
              </div>
            </div>

            <button
              id="btn-login"
              type="submit"
              class="btn btn-primary btn-block btn-lg"
              style="margin-top:8px;"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner"></span>
              <span v-else v-html="icons.arrowDown" style="transform:rotate(-90deg);display:flex;"></span>
              <span>{{ loading ? 'Memverifikasi...' : 'Masuk ke Sistem' }}</span>
            </button>

          </form>


        </div>
      </div>

    </div>
  `
}
