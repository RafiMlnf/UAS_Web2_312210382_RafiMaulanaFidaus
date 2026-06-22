import icons from '../icons.js'

export default {
  name: 'HomePage',
  data() {
    return {
      icons,
      loading: true,
      stats: {
        total_part: 0,
        total_kategori: 0,
        total_brand: 0,
        total_supplier: 0
      },
      parts: [],
      categories: [],
      searchQuery: '',
      filterCategory: '',
      isLoggedIn: false,
      tickerInterval: null
    }
  },
  computed: {
    filteredParts() {
      return this.parts.filter(p => {
        const matchesCategory = !this.filterCategory || Number(p.kategori_id) === Number(this.filterCategory)
        const query = this.searchQuery.toLowerCase()
        const matchesSearch = (
          p.nama_part.toLowerCase().includes(query) ||
          p.kode_part.toLowerCase().includes(query) ||
          p.nama_kategori.toLowerCase().includes(query) ||
          p.nama_brand.toLowerCase().includes(query)
        )
        return matchesCategory && matchesSearch
      })
    }
  },
  async created() {
    this.isLoggedIn = !!localStorage.getItem('token')
    await Promise.all([
      this.loadStats(),
      this.loadParts(),
      this.loadCategories()
    ])
  },
  mounted() {
    this.startTicker()
  },
  beforeUnmount() {
    this.stopTicker()
  },
  methods: {
    async loadCategories() {
      try {
        const res = await axios.get('/api/kategori')
        if (res.data.status) {
          this.categories = res.data.data
        }
      } catch (err) {
        console.error('Failed to load categories', err)
      }
    },
    async loadStats() {
      try {
        const res = await axios.get('/api/part/dashboard-stats')
        if (res.data.status) {
          this.stats = res.data.data
        }
      } catch (err) {
        console.error('Failed to load stats', err)
      }
    },
    async loadParts() {
      this.loading = true
      try {
        const res = await axios.get('/api/part')
        if (res.data.status) {
          this.parts = res.data.data
        }
      } catch (err) {
        console.error('Failed to load parts', err)
      } finally {
        this.loading = false
      }
    },
    formatRupiah(value) {
      if (!value) return 'Rp 0'
      return 'Rp ' + parseFloat(value).toLocaleString('id-ID', { minimumFractionDigits: 0 })
    },
    getStockBadgeClass(p) {
      if (p.stok === 0) return 'bg-red-50 text-red-700 border-red-100'
      if (p.stok <= p.stok_minimum) return 'bg-amber-50 text-amber-700 border-amber-100'
      return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    },
    startTicker() {
      console.log('startTicker called');
      this.stopTicker()
      this.tickerInterval = setInterval(() => {
        const el = this.$refs.tickerContainer
        if (!el || this.parts.length === 0) return

        const cardWidth = 276 // width (260px) + gap (16px)
        const maxScroll = el.scrollWidth - el.clientWidth
        
        let newScrollLeft = el.scrollLeft + cardWidth
        if (newScrollLeft >= maxScroll + 10) {
          el.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          el.scrollTo({ left: newScrollLeft, behavior: 'smooth' })
        }
      }, 4000) // Scroll slowly every 4 seconds (satu-satu)
    },
    stopTicker() {
      console.log('stopTicker called, interval active:', !!this.tickerInterval);
      if (this.tickerInterval) {
        clearInterval(this.tickerInterval)
        this.tickerInterval = null
      }
    }
  },
  template: `
    <div class="public-landing">
      <!-- Glow ambient background effects -->
      <div class="glow-sphere" style="top: -10%; left: 10%; width: 450px; height: 450px; background: radial-gradient(circle, rgba(26,112,245,0.08) 0%, rgba(26,112,245,0) 70%);"></div>
      <div class="glow-sphere" style="top: 40%; right: -5%; width: 500px; height: 500px; background: radial-gradient(circle, rgba(99,102,241,0.06) 0%, rgba(99,102,241,0) 70%);"></div>

      <!-- Hero Section -->
      <div class="hero-section text-left w-full mb-12 animate-swipe-up-fade">
        <img src="./assets/img/logoweb.png" alt="Logo" style="height: 120px; width: auto; object-fit: contain; margin-bottom: 24px; display: block;" />
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-5">
          <h1 class="text-3xl md:text-5xl font-extrabold text-gray-950 tracking-tight leading-tight flex-1">
            Portal Manajemen Inventaris & Distribusi Komponen PC
          </h1>
          <div class="flex-shrink-0">
            <router-link v-if="isLoggedIn" to="/dashboard" class="btn btn-sm flex items-center gap-1.5 shadow-sm bg-white text-gray-900 border border-gray-800/30 hover:bg-blue-50/60 hover:text-blue-600 hover:border-blue-200 transition-all">
              <span>Ke Dashboard</span>
              <span v-html="icons.chevronRight"></span>
            </router-link>
            <router-link v-else to="/login" class="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm border border-gray-800/30">
              <span>Masuk Ke Sistem</span>
              <span v-html="icons.chevronRight"></span>
            </router-link>
          </div>
        </div>
        <p class="text-base text-gray-600 leading-relaxed max-w-2xl">
          Sistem kontrol logistik dan ketersediaan komponen PC secara real-time. Pantau ketersediaan stok processor, VGA, RAM, storage, dan peripheral lainnya secara akurat untuk kelancaran rantai pasok Anda.
        </p>
      </div>

      <!-- Autoscroll Ticker -->
      <div v-if="!loading && parts.length > 0" class="relative overflow-hidden w-full mb-10 py-3 glass-card rounded-xl shadow-sm border border-white/40">
        <div ref="tickerContainer" class="flex gap-4 px-4 overflow-x-auto scroll-smooth no-scrollbar" style="scrollbar-width: none;" @mouseenter="stopTicker" @mouseleave="startTicker">
          <div v-for="p in parts" :key="'ticker-' + p.id" class="flex items-center gap-3 bg-white/60 backdrop-blur-md border border-white/80 rounded-xl p-2.5 min-w-[260px] max-w-[260px] flex-shrink-0 shadow-xs transition-all duration-300 hover:scale-[1.02] hover:bg-white/80">
            <div class="w-12 h-12 rounded-lg bg-white border border-gray-150 flex items-center justify-center p-1 overflow-hidden flex-shrink-0 shadow-2xs">
              <img v-if="p.gambar_url" :src="p.gambar_url" :alt="p.nama_part" class="max-w-full max-h-full object-contain" referrerpolicy="no-referrer" />
              <span v-else class="text-gray-300 w-6 h-6 flex items-center justify-center" v-html="icons.box"></span>
            </div>
            <div class="text-left leading-tight flex-1 min-w-0">
              <div class="text-xs font-bold text-gray-950 truncate">{{ p.nama_part }}</div>
              <div class="text-[10px] text-gray-500 mt-0.5 truncate">{{ p.nama_kategori }} • {{ p.nama_brand }}</div>
              <div class="flex items-center justify-between mt-1">
                <span class="text-xs font-semibold text-blue-600">{{ formatRupiah(p.harga_jual) }}</span>
                <span class="text-[9px] font-semibold px-1.5 py-0.2 rounded-full border" :class="Number(p.stok) === 0 ? 'bg-red-50 text-red-700 border-red-100' : (Number(p.stok) <= Number(p.stok_minimum) ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100')">
                  Stok: {{ p.stok }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Grid Ringkasan Data -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <!-- Card 1 -->
        <div class="glass-card p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold text-gray-400 tracking-wider">TOTAL KOMPONEN</span>
            <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600" v-html="icons.box"></div>
          </div>
          <div class="text-2xl font-bold text-gray-900">{{ stats.total_part }}</div>
          <div class="text-[10px] text-gray-400 mt-1">Item PC Terdaftar</div>
        </div>

        <!-- Card 2 -->
        <div class="glass-card p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold text-gray-400 tracking-wider">KATEGORI</span>
            <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600" v-html="icons.tag"></div>
          </div>
          <div class="text-2xl font-bold text-gray-900">{{ stats.total_kategori }}</div>
          <div class="text-[10px] text-gray-400 mt-1">Pengelompokan Komponen</div>
        </div>

        <!-- Card 3 -->
        <div class="glass-card p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold text-gray-400 tracking-wider">BRAND / PRODUSEN</span>
            <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600" v-html="icons.bookmark"></div>
          </div>
          <div class="text-2xl font-bold text-gray-900">{{ stats.total_brand }}</div>
          <div class="text-[10px] text-gray-400 mt-1">Produsen Komponen</div>
        </div>

        <!-- Card 4 -->
        <div class="glass-card p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold text-gray-400 tracking-wider">MITRA SUPPLIER</span>
            <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600" v-html="icons.truck"></div>
          </div>
          <div class="text-2xl font-bold text-gray-900">{{ stats.total_supplier }}</div>
          <div class="text-[10px] text-gray-400 mt-1">Pemasok Terpercaya</div>
        </div>
      </div>

      <!-- Catalog / List Section -->
      <div class="glass-card p-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 class="text-base font-bold text-gray-950">Katalog Komponen PC</h2>
            <p class="text-xs text-gray-400 mt-0.5">Daftar stok barang di gudang yang terupdate saat ini.</p>
          </div>
          <div class="relative w-full md:max-w-xs">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400" v-html="icons.search"></span>
            <input
              type="text"
              class="form-control pl-10"
              placeholder="Cari nama, SKU, kategori..."
              v-model="searchQuery"
            />
          </div>
        </div>

        <!-- Category Filter Chips with Spacing -->
        <div v-if="categories.length > 0" class="flex flex-wrap gap-2.5 mb-6 border-b border-gray-150/40 pb-5">
          <button
            class="px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200"
            :class="!filterCategory ? 'bg-blue-600 text-white border-gray-800/30 shadow-sm' : 'bg-white/80 text-gray-600 border-gray-800/30 hover:bg-blue-50/60 hover:text-blue-600 hover:border-blue-200'"
            @click="filterCategory = ''"
          >
            Semua Komponen
          </button>
          <button
            v-for="cat in categories"
            :key="cat.id"
            class="px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 flex items-center gap-1.5"
            :class="filterCategory == cat.id ? 'bg-blue-600 text-white border-gray-800/30 shadow-sm' : 'bg-white/80 text-gray-600 border-gray-800/30 hover:bg-blue-50/60 hover:text-blue-600 hover:border-blue-200'"
            @click="filterCategory = cat.id"
          >
            <span v-html="icons.getCategoryIcon(cat.nama_kategori)" class="opacity-70"></span>
            {{ cat.nama_kategori }}
          </button>
        </div>
 
        <div v-if="loading" class="flex items-center justify-center py-20 text-gray-400">
          <div class="flex flex-col items-center gap-3">
            <div class="spinner" style="border-color:rgba(26,112,245,0.2);border-top-color:#1A70F5;width:28px;height:28px;border-width:2.5px;"></div>
            <span class="text-xs">Memuat katalog...</span>
          </div>
        </div>

        <div v-else-if="filteredParts.length === 0" class="empty-state py-16">
          <div class="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3 text-gray-400" v-html="icons.box"></div>
          <h3 class="text-sm font-semibold text-gray-800">Tidak ada komponen ditemukan</h3>
          <p class="text-xs text-gray-400 mt-1">Gunakan kata kunci pencarian yang lain.</p>
        </div>

        <div v-else class="table-wrapper">
          <table class="data-table compact">
            <thead>
              <tr>
                <th class="w-32">Kode SKU</th>
                <th>Nama Komponen</th>
                <th>Kategori</th>
                <th>Brand</th>
                <th class="text-right">Stok</th>
                <th class="text-right">Harga Jual</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in filteredParts" :key="p.id" class="hover:bg-gray-50/50">
                <td>
                  <span class="text-xs font-mono font-semibold text-gray-700 bg-gray-100/80 px-2 py-0.5 rounded border border-gray-200/50">
                    {{ p.kode_part }}
                  </span>
                </td>
                <td class="text-sm font-semibold text-gray-900">
                  {{ p.nama_part }}
                </td>
                <td class="text-sm text-gray-600">
                  {{ p.nama_kategori }}
                </td>
                <td class="text-sm text-gray-600">
                  {{ p.nama_brand }}
                </td>
                <td class="text-right">
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border" :class="getStockBadgeClass(p)">
                    {{ p.stok }} {{ p.satuan }}
                  </span>
                </td>
                <td class="text-right text-sm font-bold text-gray-950">
                  {{ formatRupiah(p.harga_jual) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
}
