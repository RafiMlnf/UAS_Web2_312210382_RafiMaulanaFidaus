import icons from '../icons.js'

export default {
  name: 'AppSidebar',
  props: {
    user: { type: Object, default: null },
    open: { type: Boolean, default: false },
  },
  emits: ['logout', 'close'],
  data() {
    return { icons }
  },
  computed: {
    navItems() {
      return [
        {
          section: 'HOME',
          items: [
            { label: 'Dashboard',  to: '/dashboard', icon: 'dashboard' },
            { label: 'Part',       to: '/part',      icon: 'box' },
            { label: 'Kategori',   to: '/kategori',  icon: 'tag' },
            { label: 'Brand',      to: '/brand',     icon: 'bookmark' },
            { label: 'Supplier',   to: '/supplier',  icon: 'truck' },
          ]
        },
        {
          section: 'TRANSAKSI',
          items: [
            { label: 'Stok Masuk',  to: '/transaksi-masuk',  icon: 'arrowDown' },
            { label: 'Stok Keluar', to: '/transaksi-keluar', icon: 'arrowUp' },
          ]
        },
      ]
    }
  },
  mounted() {
    this._drawHalftone()
  },
  beforeUnmount() {
    if (this._htCanvas) {
      this._htCanvas.remove()
      this._htCanvas = null
    }
  },
  methods: {
    isActive(path) {
      return this.$route.path === path || this.$route.path.startsWith(path + '/')
    },
    _drawHalftone() {
      const aside = this.$el
      if (!aside) return

      const canvas = document.createElement('canvas')
      canvas.style.cssText = `
        position:absolute; bottom:0; left:0;
        width:100%; height:100%;
        pointer-events:none; z-index:0;
      `
      aside.insertBefore(canvas, aside.firstChild)
      this._htCanvas = canvas

      const W = aside.offsetWidth
      const H = aside.offsetHeight
      canvas.width  = W
      canvas.height = H

      const ctx = canvas.getContext('2d')

      // Seeded pseudo-random (lcg)
      let seed = 42
      const rand = () => {
        seed = (seed * 1664525 + 1013904223) & 0xffffffff
        return (seed >>> 0) / 0xffffffff
      }

      const cols = 9
      const rows = 18
      const cellW = W / cols
      const cellH = H / rows

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          // Distance from bottom-left corner (0, rows-1)
          const dist = Math.sqrt(
            Math.pow(col, 2) + Math.pow(rows - 1 - row, 2)
          )
          const maxDist = Math.sqrt(
            Math.pow(cols - 1, 2) + Math.pow(rows - 1, 2)
          )
          const fade = 1 - dist / maxDist   // 1 near BL, 0 near TR

          // Random size variation seeded per cell
          const sizeNoise = 0.5 + rand() * 0.5  // 0.5 – 1.0
          const maxR = (Math.min(cellW, cellH) / 2) * 0.55
          const r = maxR * fade * sizeNoise

          if (r < 0.5) continue

          const cx = col * cellW + cellW / 2
          const cy = row * cellH + cellH / 2

          // Opacity also fades with distance
          const alpha = fade * 0.035 * sizeNoise

          ctx.beginPath()
          ctx.arc(cx, cy, r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`
          ctx.fill()
        }
      }
    }
  },
  template: `
    <aside class="sidebar" :class="{ open: open }">
      <!-- Logo -->
      <div class="sidebar-logo" style="position:relative;z-index:1;">
        <div class="sidebar-logo-icon" v-html="icons.logo"></div>
        <span class="sidebar-logo-text">E-Inventory PC</span>
      </div>

      <!-- User Greeting -->
      <div class="sidebar-greeting" v-if="user" style="position:relative;z-index:1;">
        <div class="sidebar-greeting-name">Selamat Datang,<br><strong>{{ user.nama }}</strong></div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav" style="position:relative;z-index:1;">
        <div v-for="group in navItems" :key="group.section" class="sidebar-group">
          <div class="section-label" style="padding: 0 10px; margin-top: 6px;">{{ group.section }}</div>
          <router-link
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="sidebar-link"
            :class="{ active: isActive(item.to) }"
          >
            <span class="sidebar-link-icon" v-html="icons[item.icon]"></span>
            <span>{{ item.label }}</span>
          </router-link>
        </div>
      </nav>

      <!-- Logout -->
      <div class="sidebar-footer" style="position:relative;z-index:1;">
        <button class="sidebar-logout" @click="$emit('logout')">
          <span v-html="icons.logout"></span>
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  `
}
