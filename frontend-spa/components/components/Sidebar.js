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
  watch: {
    user: {
      immediate: true,
      handler(newVal) {
        this.$nextTick(() => {
          if (newVal) {
            this._startGreetingAnimation()
          } else {
            this._stopGreetingAnimation()
          }
        })
      }
    }
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
    this._stopGreetingAnimation()
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
    },
    _startGreetingAnimation() {
      this._stopGreetingAnimation()
      const canvas = this.$refs.greetingCanvas
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      
      const resize = () => {
        const parent = canvas.parentNode
        if (!parent) return
        const W = parent.clientWidth || 212
        const H = parent.clientHeight || 64
        canvas.width = W
        canvas.height = H
      }
      resize()
      
      window.addEventListener('resize', resize)
      
      let animationFrameId
      let t = 0
      let shimmerX = -260
      
      const draw = () => {
        t += 0.01 // Faster, smooth flowing speed
        const W = canvas.width
        const H = canvas.height
        ctx.clearRect(0, 0, W, H)
        
        const bgGrad = ctx.createLinearGradient(0, 0, W, H)
        bgGrad.addColorStop(0, '#1A70F5')
        bgGrad.addColorStop(1, '#0b4ebd')
        ctx.fillStyle = bgGrad
        ctx.fillRect(0, 0, W, H)
        
        const numLines = 6
        for (let i = 0; i < numLines; i++) {
          ctx.beginPath()
          
          const offset = H * 0.15 + i * (H * 0.13)
          const amp = 6 + i * 1.5 
          const freq = 0.008 + i * 0.0012 
          const phase = t + (i * 0.45) 
          
          ctx.moveTo(0, offset)
          for (let x = 0; x <= W; x += 2) {
            const y = offset + 
                      Math.sin(x * freq - phase) * amp + 
                      Math.sin(x * 0.004 - phase) * (amp * 0.3)
            ctx.lineTo(x, y)
          }
          
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.16 - (i * 0.02)})`
          ctx.lineWidth = 1.0 + i * 0.3
          ctx.stroke()
        }
        
        // ── Purple Shimmer / Glass reflection effect ──
        shimmerX += 1.8 // speed of shimmer
        if (shimmerX > W * 1.5) {
          shimmerX = -260
        }
        ctx.save()
        ctx.globalCompositeOperation = 'lighter'
        const shimGrad = ctx.createLinearGradient(shimmerX, 0, shimmerX + 240, H) // Wider span (240px)
        shimGrad.addColorStop(0, 'rgba(147, 51, 234, 0)')       // transparent purple
        shimGrad.addColorStop(0.35, 'rgba(168, 85, 247, 0.05)')  // very subtle purple glow
        shimGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.09)')   // dim white glass shine
        shimGrad.addColorStop(0.65, 'rgba(168, 85, 247, 0.05)')  // very subtle purple glow
        shimGrad.addColorStop(1, 'rgba(147, 51, 234, 0)')       // transparent purple
        
        ctx.fillStyle = shimGrad
        ctx.fillRect(0, 0, W, H)
        ctx.restore()
        
        animationFrameId = requestAnimationFrame(draw)
      }
      
      draw()
      
      this._greetingCancel = () => {
        cancelAnimationFrame(animationFrameId)
        window.removeEventListener('resize', resize)
      }
    },
    _stopGreetingAnimation() {
      if (this._greetingCancel) {
        this._greetingCancel()
        this._greetingCancel = null
      }
    }
  },
  template: `
    <aside class="sidebar" :class="{ open: open }">
      <!-- Logo -->
      <div class="sidebar-logo" style="position:relative;z-index:1;">
        <span class="sidebar-logo-text" style="font-weight: 400;">omniacomp inventory</span>
      </div>

      <!-- User Greeting -->
      <div class="sidebar-greeting" v-if="user" style="position:relative;z-index:1;overflow:hidden;">
        <canvas ref="greetingCanvas" style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;"></canvas>
        <div class="sidebar-greeting-name" style="position:relative;z-index:1;">Selamat Datang,<br><strong>{{ user.nama }}</strong></div>
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
