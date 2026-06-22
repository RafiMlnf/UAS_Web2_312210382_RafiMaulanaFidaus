import Sidebar from './components/Sidebar.js'

export default {
  name: 'App',
  components: { Sidebar },
  data() {
    return {
      user: null,
      sidebarOpen: false,
    }
  },
  computed: {
    isFullWidthPage() {
      return ['/login', '/', '/home'].includes(this.$route.path)
    },
    pageTitle() {
      const map = {
        '/dashboard': 'Dashboard',
        '/part': 'Part',
        '/kategori': 'Kategori',
        '/brand': 'Brand',
        '/supplier': 'Supplier',
        '/transaksi-masuk': 'Stok Masuk',
        '/transaksi-keluar': 'Stok Keluar',
      }
      return map[this.$route.path] || 'Omniacomp'
    }
  },
  watch: {
    $route() {
      this.syncUser()
      this.sidebarOpen = false   // close sidebar on navigation
    }
  },
  created() {
    this.syncUser()
    window.__vueRouter__ = this.$router
  },
  methods: {
    syncUser() {
      const raw = localStorage.getItem('user')
      this.user = raw ? JSON.parse(raw) : null
    },
    async handleLogout() {
      try {
        await axios.post('/api/auth/logout')
      } catch (_) { /* ignore */ }
      localStorage.clear()
      this.user = null
      this.sidebarOpen = false
      this.$router.push('/login')
    }
  },
  template: `
    <template v-if="isFullWidthPage">
      <router-view />
    </template>
    <template v-else>
      <!-- Sidebar backdrop (mobile) -->
      <div
        class="sidebar-overlay"
        :class="{ active: sidebarOpen }"
        @click="sidebarOpen = false"
      ></div>

      <div class="app-layout">
        <Sidebar :user="user" :open="sidebarOpen" @logout="handleLogout" @close="sidebarOpen = false" />
        <main class="app-main">
          <!-- Mobile topbar -->
          <div class="mobile-topbar">
            <button class="hamburger" @click="sidebarOpen = !sidebarOpen" aria-label="Menu">
              <span></span><span></span><span></span>
            </button>
            <span class="mobile-topbar-title">{{ pageTitle }}</span>
          </div>
          <div class="page-content">
            <router-view />
          </div>
        </main>
      </div>
    </template>
  `
}
