import icons from '../icons.js'

export default {
  name: 'DashboardPage',
  data() {
    return {
      icons,
      loading: true,
      chartLoading: false,
      isMobile: window.__mq ? window.__mq.is : false,
      stats: { total_part: 0, part_aktif: 0, stok_menipis: 0, total_nilai_stok: 0 },
      stokMenipis: [],
      transaksiMasuk: [],
      transaksiKeluar: [],
      activeTab: 'masuk',
      chartPeriod: 'daily',
      chartData: { labels: [], masuk: [], keluar: [], masukTx: [], keluarTx: [] },
      chartInstance: null,
      _chartTimer: null,
      _mqListener: null,
      categories: [],
      selectedKategoriId: '',
    }
  },
  computed: {
    user() {
      const raw = localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    },
    recentList() {
      return this.activeTab === 'masuk'
        ? this.transaksiMasuk.slice(0, 6)
        : this.transaksiKeluar.slice(0, 6)
    },
    statCards() {
      return [
        {
          label: 'Total Part',
          value: this.stats.total_part,
          sub: 'jenis komponen terdaftar',
          icon: 'box',
          iconBg: '#EBF2FF',
          iconColor: '#1A70F5',
        },
        {
          label: 'Part Aktif',
          value: this.stats.part_aktif,
          sub: `dari ${this.stats.total_part} total part`,
          icon: 'check',
          iconBg: '#ECFDF5',
          iconColor: '#10B981',
        },
        {
          label: 'Stok Menipis',
          value: this.stats.stok_menipis,
          sub: 'perlu segera restock',
          icon: 'warning',
          iconBg: this.stats.stok_menipis > 0 ? '#FEF2F2' : '#ECFDF5',
          iconColor: this.stats.stok_menipis > 0 ? '#EF4444' : '#10B981',
          highlight: this.stats.stok_menipis > 0,
        },
        {
          label: 'Nilai Stok',
          value: this.formatRupiah(this.stats.total_nilai_stok),
          sub: 'estimasi total harga beli',
          icon: 'tag',
          iconBg: '#F5F0FF',
          iconColor: '#7C3AED',
          isString: true,
        },
      ]
    },
    periodLabel() {
      return { daily: 'Harian', weekly: 'Mingguan', monthly: 'Bulanan' }[this.chartPeriod]
    },
    periodSubLabel() {
      return {
        daily:   '30 hari terakhir',
        weekly:  '12 minggu terakhir',
        monthly: '12 bulan terakhir',
      }[this.chartPeriod]
    },
    totalMasukChart() {
      return this.chartData.masuk.reduce((a, b) => a + b, 0)
    },
    totalKeluarChart() {
      return this.chartData.keluar.reduce((a, b) => a + b, 0)
    },
  },
  async created() {
    await this.loadAll()
  },
  mounted() {
    this._mqListener = () => { this.isMobile = window.__mq ? window.__mq.is : false }
    window.addEventListener('resize', this._mqListener)
    this.$nextTick(() => {
      if (!this.loading) this.scheduleRenderChart()
    })
  },
  watch: {
    loading(val) {
      if (!val) this.$nextTick(() => this.scheduleRenderChart())
    },
  },
  beforeUnmount() {
    if (this._mqListener) window.removeEventListener('resize', this._mqListener)
    if (this._chartTimer) {
      clearTimeout(this._chartTimer)
      this._chartTimer = null
    }
    if (this.chartInstance) {
      this.chartInstance.destroy()
      this.chartInstance = null
    }
  },
  methods: {
    async loadAll() {
      this.loading = true
      try {
        let chartUrl = '/api/part/chart-stats?period=daily'
        if (this.selectedKategoriId) {
          chartUrl += `&kategori_id=${this.selectedKategoriId}`
        }
        const [statsRes, menipis, masuk, keluar, chartRes, kategoriRes] = await Promise.all([
          axios.get('/api/part/dashboard-stats'),
          axios.get('/api/part/stok-menipis'),
          axios.get('/api/transaksi-masuk'),
          axios.get('/api/transaksi-keluar'),
          axios.get(chartUrl),
          axios.get('/api/kategori'),
        ])
        this.stats           = statsRes.data.data
        this.stokMenipis     = menipis.data.data
        this.transaksiMasuk  = masuk.data.data
        this.transaksiKeluar = keluar.data.data
        this.chartData       = chartRes.data.data
        this.categories      = kategoriRes.data.data
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        this.loading = false
      }
    },

    async fetchChartData() {
      this.chartLoading = true
      try {
        let url = `/api/part/chart-stats?period=${this.chartPeriod}`
        if (this.selectedKategoriId) {
          url += `&kategori_id=${this.selectedKategoriId}`
        }
        const res = await axios.get(url)
        this.chartData = res.data.data
        this.chartLoading = false
        this.$nextTick(() => this.scheduleRenderChart())
      } catch (err) {
        console.error('Chart fetch error:', err)
        this.chartLoading = false
      }
    },

    async switchPeriod(period) {
      if (this.chartPeriod === period && !this.chartLoading) return
      this.chartPeriod = period
      await this.fetchChartData()
    },

    async changeKategoriFilter(event) {
      this.selectedKategoriId = event.target.value
      await this.fetchChartData()
    },

    scheduleRenderChart() {
      if (this._chartTimer) clearTimeout(this._chartTimer)
      this._chartTimer = setTimeout(() => {
        this._chartTimer = null
        this.renderChart()
      }, 60)
    },

    renderChart() {
      const canvas = this.$refs.trendChart
      // Guard: canvas gone (navigation, unmount) or Chart.js not loaded yet
      if (!canvas || typeof Chart === 'undefined') return
      // Guard: canvas no longer attached to the live DOM
      if (!document.body.contains(canvas)) return

      if (this.chartInstance) {
        this.chartInstance.destroy()
        this.chartInstance = null
      }

      const { labels, masuk, keluar } = this.chartData

      if (!labels || labels.length === 0) return

      // Dynamic Vertical Gradients for Stock In (Green with low yellow fade)
      const getMasukGradient = (context) => {
        const chart = context.chart
        const { ctx, chartArea } = chart
        if (!chartArea) return '#10B981'
        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top)
        gradient.addColorStop(0, '#FDE047')   // Bright yellow at the very bottom (low values)
        gradient.addColorStop(0.15, '#F59E0B') // Amber transition at 15%
        gradient.addColorStop(0.4, '#10B981')  // Green starts early at 40% height
        gradient.addColorStop(1, '#10B981')   // Green all the way to the top
        return gradient
      }

      const getMasukFillGradient = (context) => {
        const chart = context.chart
        const { ctx, chartArea } = chart
        if (!chartArea) return 'rgba(16, 185, 129, 0.05)'
        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top)
        gradient.addColorStop(0, 'rgba(253, 224, 71, 0.02)')  // Transparent yellow
        gradient.addColorStop(0.15, 'rgba(245, 158, 11, 0.05)') // Low opacity amber
        gradient.addColorStop(0.4, 'rgba(16, 185, 129, 0.18)')  // Green fill starts at 40%
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.22)')   // Solid green fill at top
        return gradient
      }

      this.chartInstance = new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Unit Masuk',
              data: masuk,
              borderColor: getMasukGradient,
              backgroundColor: getMasukFillGradient,
              borderWidth: 2.5,
              tension: 0.45,
              fill: true,
              pointBackgroundColor: getMasukGradient,
              pointRadius: 4,
              pointHoverRadius: 7,
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
            },
            {
              label: 'Unit Keluar',
              data: keluar,
              borderColor: '#EF4444',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              borderWidth: 2.5,
              tension: 0.45,
              fill: true,
              pointBackgroundColor: '#EF4444',
              pointRadius: 4,
              pointHoverRadius: 7,
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 500, easing: 'easeInOutQuart' },
          interaction: { intersect: false, mode: 'index' },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(10, 10, 18, 0.90)',
              titleFont: { size: 11, family: "'Product Sans', sans-serif", weight: '600' },
              bodyFont: { size: 12, family: "'Product Sans', sans-serif" },
              padding: 12,
              cornerRadius: 10,
              displayColors: true,
              boxWidth: 8,
              boxHeight: 8,
              boxPadding: 4,
              callbacks: {
                label(ctx) {
                  const ds  = ctx.dataset.label
                  const val = ctx.parsed.y
                  return `  ${ds}: ${val} unit`
                },
              },
            },
          },
          scales: {
            x: {
              grid: { color: 'rgba(0,0,0,0.04)' },
              border: { display: false },
              ticks: {
                font: { size: 10, family: "'Product Sans', sans-serif" },
                color: '#9CA3AF',
                maxRotation: 0,
                maxTicksLimit: 10,
              },
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(0,0,0,0.04)' },
              border: { display: false, dash: [3, 3] },
              ticks: {
                font: { size: 10, family: "'Product Sans', sans-serif" },
                color: '#9CA3AF',
                precision: 0,
                stepSize: 1,
                maxTicksLimit: 6,
              },
            },
          },
        },
      })
    },

    formatRupiah(amount) {
      if (!amount) return 'Rp 0'
      const n = parseFloat(amount)
      if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`
      if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)} jt`
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
    },
    formatDate(d) {
      if (!d) return '-'
      return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    },
    stockPercent(stok, min) {
      return Math.min(Math.max((stok / (min * 2)) * 100, 4), 100)
    },
    stockBarColor(stok, min) {
      if (stok <= min)       return '#EF4444'
      if (stok <= min * 1.5) return '#F59E0B'
      return '#10B981'
    },
  },

  template: `
    <div v-if="loading" class="flex items-center justify-center h-64 text-gray-400">
      <div class="flex flex-col items-center gap-3">
        <div class="spinner" style="border-color:rgba(26,112,245,0.2);border-top-color:#1A70F5;width:32px;height:32px;border-width:3px;"></div>
        <span class="text-sm">Memuat data dashboard...</span>
      </div>
    </div>

    <div v-else>

      <!-- ── Page Header ─────────────────────── -->
      <div class="page-header mb-6">
        <div class="page-header-title">
          <h1>Dashboard</h1>
          <p v-if="user">Selamat datang kembali, <strong>{{ user.nama }}</strong> — berikut ringkasan inventaris hari ini.</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-outline btn-sm flex items-center gap-2" @click="loadAll">
            <span v-html="icons.check" style="opacity:0.6;"></span>
            Refresh Data
          </button>
        </div>
      </div>

      <!-- ── Stat Cards: Desktop 4-col grid ───────── -->
      <div v-if="!isMobile" class="grid grid-cols-4 gap-4 mb-6">
        <div
          v-for="(card, i) in statCards"
          :key="i"
          class="stat-card relative overflow-hidden"
          :class="card.highlight ? 'ring-1 ring-red-200' : ''"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="stat-card-label">{{ card.label }}</div>
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              :style="{ background: card.iconBg, color: card.iconColor }"
              v-html="icons[card.icon]"
            ></div>
          </div>
          <div
            class="stat-card-value animate-swipe-up-fade"
            :style="{ color: card.highlight ? '#EF4444' : '', animationDelay: (i * 100) + 'ms' }"
          >
            {{ card.value }}
          </div>
          <div class="stat-card-sub">{{ card.sub }}</div>
          <div v-if="card.highlight" class="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
        </div>
      </div>

      <!-- ── Stat Cards: Mobile compact strip ──────── -->
      <div v-else class="mobile-stat-strip">
        <div v-for="(card, i) in statCards" :key="i" class="ms-item">
          <div class="ms-icon" :style="{ background: card.iconBg, color: card.iconColor }" v-html="icons[card.icon]"></div>
          <div style="flex:1">
            <div class="ms-label">{{ card.label }}</div>
            <div class="ms-value" :style="{ color: card.highlight ? '#EF4444' : '' }">{{ card.value }}</div>
            <div class="ms-sub">{{ card.sub }}</div>
          </div>
          <div v-if="card.highlight" class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
        </div>
      </div>

      <!-- ── Trend Chart Card ────────────────── -->
      <div class="card mb-6" :class="isMobile ? 'p-4' : 'p-6'">

        <!-- Header row -->
        <div class="flex items-center justify-between mb-4" :class="isMobile ? 'flex-col items-start gap-2' : ''">
          <div>
            <h2 class="text-base font-bold text-gray-900">Tren Transaksi</h2>
            <p class="text-xs text-gray-400 mt-0.5">{{ periodSubLabel }} — masuk vs keluar</p>
          </div>

          <!-- Filters & Period tabs -->
          <div class="flex items-center gap-2" :class="isMobile ? 'w-full' : ''">
            <!-- Category filter dropdown -->
            <select
              :value="selectedKategoriId"
              @change="changeKategoriFilter"
              class="h-9 px-2 py-0 text-xs font-semibold rounded-xl bg-gray-50 border border-gray-800/30 text-gray-700 focus:outline-none transition-all cursor-pointer hover:bg-blue-50/60 hover:text-blue-600"
              :class="isMobile ? 'flex-1' : 'max-w-[200px]'"
            >
              <option value="">Semua Kategori</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.nama_kategori }}</option>
            </select>

            <!-- Period tabs -->
            <div class="flex items-center gap-0.5 bg-gray-100 rounded-xl p-1 border border-gray-800/30 h-9">
              <button
                v-for="p in [{k:'daily',s:'H',l:'Hari'},{k:'weekly',s:'M',l:'Minggu'},{k:'monthly',s:'B',l:'Bulan'}]"
                :key="p.k"
                class="h-7 px-2.5 text-xs font-semibold rounded-lg transition-all border flex items-center justify-center"
                :class="chartPeriod === p.k ? 'bg-white border-gray-800/30 text-gray-900 shadow-sm' : 'bg-transparent border-transparent text-gray-400 hover:bg-blue-50/60 hover:text-blue-600'"
                @click="switchPeriod(p.k)"
                :disabled="chartLoading"
              >{{ isMobile ? p.s : p.l }}</button>
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="flex items-center gap-4 mb-3">
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full" style="background:#10B981"></span>
            <span class="text-[11px] text-gray-500">Masuk</span>
            <span class="text-[11px] font-bold text-gray-800">{{ totalMasukChart }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-red-400"></span>
            <span class="text-[11px] text-gray-500">Keluar</span>
            <span class="text-[11px] font-bold text-gray-800">{{ totalKeluarChart }}</span>
          </div>
          <div class="ml-auto">
            <span
              class="text-[11px] font-bold px-2 py-0.5 rounded-full"
              :style="totalMasukChart - totalKeluarChart >= 0 ? 'background:#ECFDF5;color:#059669' : 'background:#FEF2F2;color:#DC2626'"
            >{{ totalMasukChart - totalKeluarChart >= 0 ? '+' : '' }}{{ totalMasukChart - totalKeluarChart }} unit</span>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="chartLoading" class="flex items-center justify-center" :style="isMobile ? 'height:150px' : 'height:220px'">
          <div class="spinner" style="border-color:rgba(26,112,245,0.2);border-top-color:#1A70F5;width:24px;height:24px;border-width:2px;"></div>
        </div>

        <!-- Canvas -->
        <div v-show="!chartLoading" :style="isMobile ? 'height:150px;position:relative' : 'height:220px;position:relative'">
          <canvas ref="trendChart"></canvas>
        </div>

        <div v-if="!chartLoading && chartData.labels.length === 0" class="flex items-center justify-center text-gray-400 text-xs" :style="isMobile ? 'height:150px' : 'height:220px'">
          Belum ada data transaksi.
        </div>
      </div>

      <!-- ── Summary Row ──────────────────── -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <!-- Dark card: Transaksi Masuk -->
        <div class="card-dark p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Stok Masuk</div>
              <div class="text-2xl font-bold text-white">{{ transaksiMasuk.length }}</div>
              <div class="text-xs text-gray-500 mt-1">total transaksi tercatat</div>
            </div>
            <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white" v-html="icons.arrowDown"></div>
          </div>
          <div class="border-t border-white/10 pt-4">
            <div class="text-xs text-gray-500 mb-1">Total nilai masuk</div>
            <div class="text-sm font-bold text-white">
              {{ formatRupiah(transaksiMasuk.reduce((s, t) => s + parseFloat(t.total_harga || 0), 0)) }}
            </div>
          </div>
        </div>

        <!-- White card: Transaksi Keluar -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="stat-card-label">Total Stok Keluar</div>
              <div class="stat-card-value mt-2">{{ transaksiKeluar.length }}</div>
              <div class="stat-card-sub mt-1">total transaksi penjualan</div>
            </div>
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                 style="background:#F5F0FF;color:#7C3AED;" v-html="icons.arrowUp"></div>
          </div>
          <div class="pt-3 border-t border-gray-100">
            <div class="text-xs text-gray-400 mb-1">Total nilai keluar</div>
            <div class="text-sm font-bold text-gray-900">
              {{ formatRupiah(transaksiKeluar.reduce((s, t) => s + parseFloat(t.total_harga || 0), 0)) }}
            </div>
          </div>
        </div>
      </div>

      <!-- ── Transaksi Terbaru ────────────────── -->
      <div class="card p-6 mb-6">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="text-base font-bold text-gray-900">Transaksi Terbaru</h2>
            <p class="text-xs text-gray-400 mt-0.5">6 transaksi terakhir</p>
          </div>
          <div class="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              class="px-4 py-1.5 text-xs font-semibold rounded-lg transition-all"
              :class="activeTab === 'masuk' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'"
              @click="activeTab = 'masuk'"
            >Stok Masuk</button>
            <button
              class="px-4 py-1.5 text-xs font-semibold rounded-lg transition-all"
              :class="activeTab === 'keluar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'"
              @click="activeTab = 'keluar'"
            >Stok Keluar</button>
          </div>
        </div>

        <!-- Table: Desktop -->
        <div v-if="!isMobile" class="table-wrapper">
          <table class="data-table compact">
            <thead>
              <tr>
                <th>{{ activeTab === 'masuk' ? 'No. Invoice' : 'No. Transaksi' }}</th>
                <th>Part</th>
                <th>{{ activeTab === 'masuk' ? 'Supplier' : 'Pembeli' }}</th>
                <th>Jumlah</th>
                <th>Total</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="recentList.length === 0">
                <td colspan="6" class="text-center py-8 text-gray-400 text-sm">Belum ada transaksi.</td>
              </tr>
              <tr v-for="t in recentList" :key="t.id">
                <td>
                  <span class="inline-flex items-center gap-1.5">
                    <span class="rounded-lg flex items-center justify-center flex-shrink-0"
                          :style="activeTab==='masuk' ? 'background:#ECFDF5;color:#10B981;width:16px;height:16px' : 'background:#FEF2F2;color:#EF4444;width:16px;height:16px'"
                          v-html="activeTab==='masuk' ? icons.arrowDown : icons.arrowUp"></span>
                    <code class="text-[11px] font-mono text-gray-600 bg-gray-50/70 px-1.5 py-0.5 rounded border border-gray-100/80 whitespace-nowrap">{{ activeTab === 'masuk' ? t.no_invoice : t.no_transaksi }}</code>
                  </span>
                </td>
                <td>
                  <div class="font-medium text-gray-900 text-sm">{{ t.nama_part }}</div>
                  <div class="text-xs text-gray-400">{{ t.kode_part }}</div>
                </td>
                <td class="text-sm text-gray-600">{{ activeTab === 'masuk' ? t.nama_supplier : t.nama_pembeli }}</td>
                <td>
                  <span class="badge" :class="activeTab === 'masuk' ? 'badge-success' : 'badge-danger'">
                    {{ activeTab === 'masuk' ? '+' : '-' }}{{ t.jumlah }} pcs
                  </span>
                </td>
                <td class="font-semibold text-sm">{{ formatRupiah(t.total_harga) }}</td>
                <td class="text-sm text-gray-400">{{ formatDate(activeTab === 'masuk' ? t.tgl_masuk : t.tgl_keluar) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Card List: Mobile -->
        <div v-else class="mobile-card-list">
          <div v-if="recentList.length === 0" class="text-center py-6 text-gray-400 text-sm">Belum ada transaksi.</div>
          <div v-for="t in recentList" :key="t.id" class="mc-item">
            <div class="mc-row">
              <div>
                <div class="mc-title">{{ t.nama_part }}</div>
                <div class="mc-subtitle">{{ t.kode_part }}</div>
              </div>
              <span
                class="mc-badge"
                :style="activeTab === 'masuk' ? 'background:#ECFDF5;color:#059669' : 'background:#FEF2F2;color:#DC2626'"
              >{{ activeTab === 'masuk' ? '+' : '-' }}{{ t.jumlah }} pcs</span>
            </div>
            <div class="mc-row" style="font-size:11px;color:var(--text-2)">
              <span>{{ activeTab === 'masuk' ? t.no_invoice : t.no_transaksi }}</span>
              <span>{{ formatDate(activeTab === 'masuk' ? t.tgl_masuk : t.tgl_keluar) }}</span>
            </div>
            <div class="mc-row">
              <span style="font-size:11px;color:var(--text-2)">{{ activeTab === 'masuk' ? t.nama_supplier : t.nama_pembeli }}</span>
              <span style="font-size:13px;font-weight:700;color:var(--text-1)">{{ formatRupiah(t.total_harga) }}</span>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-100 flex justify-end">
          <router-link
            :to="activeTab === 'masuk' ? '/transaksi-masuk' : '/transaksi-keluar'"
            class="btn btn-outline btn-sm flex items-center gap-1.5"
          >
            Lihat Semua Transaksi
            <span v-html="icons.chevronRight"></span>
          </router-link>
        </div>
      </div>

      <!-- ── Alert Stok Menipis (BAWAH) ─────── -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="text-base font-bold text-gray-900">⚠️ Alert Stok Menipis</h2>
            <p class="text-xs text-gray-400 mt-0.5">Part dengan stok di bawah atau mendekati batas minimum</p>
          </div>
          <router-link to="/part" class="btn btn-outline btn-sm flex items-center gap-1.5">
            Lihat Semua
            <span v-html="icons.chevronRight"></span>
          </router-link>
        </div>

        <div v-if="stokMenipis.length === 0" class="empty-state py-10">
          <div class="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-3" style="color:#10B981;">
            <span v-html="icons.check"></span>
          </div>
          <h3 class="text-sm font-semibold text-gray-800">Semua stok aman</h3>
          <p class="text-xs text-gray-400 mt-1">Tidak ada part yang memerlukan restock saat ini.</p>
        </div>

        <div v-else class="grid grid-cols-2 gap-3">
          <div
            v-for="item in stokMenipis"
            :key="item.id"
            class="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-red-50/50 transition-colors border border-gray-100"
          >
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-gray-900 truncate">{{ item.nama_part }}</div>
              <div class="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                <span class="flex items-center gap-1">
                  <span class="text-primary-DEFAULT/70" v-html="icons.getCategoryIcon(item.nama_kategori)"></span>
                  <span>{{ item.nama_kategori }}</span>
                </span>
                <span>·</span>
                <span>{{ item.nama_brand }}</span>
              </div>
              <div class="mt-1.5 w-full bg-gray-200 rounded-full h-1.5">
                <div
                  class="h-1.5 rounded-full transition-all"
                  :style="{ width: stockPercent(item.stok, item.stok_minimum) + '%', background: stockBarColor(item.stok, item.stok_minimum) }"
                ></div>
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="text-sm font-bold" :style="{ color: stockBarColor(item.stok, item.stok_minimum) }">{{ item.stok }}</div>
              <div class="text-xs text-gray-400">min {{ item.stok_minimum }}</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `
}
