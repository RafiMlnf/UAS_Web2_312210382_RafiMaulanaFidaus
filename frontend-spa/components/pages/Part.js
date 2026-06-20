import icons from '../icons.js'
import AppModal from '../components/Modal.js'

export default {
  name: 'PartPage',
  components: { AppModal },
  data() {
    return {
      icons,
      isMobile: window.__mq ? window.__mq.is : false,
      _mqListener: null,
      loading: true,
      parts: [],
      categories: [],
      brands: [],
      suppliers: [],
      
      // Search & Filters
      searchQuery: '',
      filterCategory: '',
      filterBrand: '',
      filterStatus: '',
      
      // Modal control
      showModal: false,
      modalMode: 'create', // 'create' | 'edit'
      submitting: false,
      
      // Form state
      form: {
        id: null,
        kode_part: '',
        nama_part: '',
        kategori_id: '',
        brand_id: '',
        supplier_id: '',
        spesifikasi: '',
        harga_beli: '',
        harga_jual: '',
        stok: 0,
        stok_minimum: 0,
        satuan: 'pcs',
        status: 'aktif',
        gambar_url: ''
      },
      errors: {}
    }
  },
  computed: {
    filteredParts() {
      return this.parts.filter(part => {
        const matchesSearch = 
          part.nama_part.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          part.kode_part.toLowerCase().includes(this.searchQuery.toLowerCase())
          
        const matchesCategory = !this.filterCategory || Number(part.kategori_id) === Number(this.filterCategory)
        const matchesBrand = !this.filterBrand || Number(part.brand_id) === Number(this.filterBrand)
        const matchesStatus = !this.filterStatus || part.status === this.filterStatus
        
        return matchesSearch && matchesCategory && matchesBrand && matchesStatus
      })
    }
  },
  async created() {
    await this.loadData()
  },
  mounted() {
    this._mqListener = () => { this.isMobile = window.__mq ? window.__mq.is : false }
    window.addEventListener('resize', this._mqListener)
  },
  beforeUnmount() {
    if (this._mqListener) window.removeEventListener('resize', this._mqListener)
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const [partsRes, catsRes, brandsRes, suppliersRes] = await Promise.all([
          axios.get('/api/part'),
          axios.get('/api/kategori'),
          axios.get('/api/brand'),
          axios.get('/api/supplier')
        ])
        this.parts = partsRes.data.data || []
        this.categories = catsRes.data.data || []
        this.brands = brandsRes.data.data || []
        this.suppliers = suppliersRes.data.data || []
      } catch (err) {
        console.error('Failed to load data', err)
      } finally {
        this.loading = false
      }
    },
    resetForm() {
      this.form = {
        id: null,
        kode_part: '',
        nama_part: '',
        kategori_id: '',
        brand_id: '',
        supplier_id: '',
        spesifikasi: '',
        harga_beli: '',
        harga_jual: '',
        stok: 0,
        stok_minimum: 0,
        satuan: 'pcs',
        status: 'aktif',
        gambar_url: ''
      }
      this.errors = {}
    },
    openCreateModal() {
      this.resetForm()
      this.modalMode = 'create'
      this.showModal = true
    },
    openEditModal(part) {
      this.resetForm()
      this.modalMode = 'edit'
      this.form = { ...part }
      this.showModal = true
    },
    async handleSubmit() {
      this.errors = {}
      
      // Simple validation
      if (!this.form.kode_part) this.errors.kode_part = 'Kode part wajib diisi.'
      if (!this.form.nama_part) this.errors.nama_part = 'Nama part wajib diisi.'
      if (!this.form.kategori_id) this.errors.kategori_id = 'Kategori wajib dipilih.'
      if (!this.form.brand_id) this.errors.brand_id = 'Brand wajib dipilih.'
      if (!this.form.supplier_id) this.errors.supplier_id = 'Supplier wajib dipilih.'
      if (!this.form.harga_beli) this.errors.harga_beli = 'Harga beli wajib diisi.'
      if (!this.form.harga_jual) this.errors.harga_jual = 'Harga jual wajib diisi.'
      
      if (Object.keys(this.errors).length > 0) return
      
      this.submitting = true
      try {
        const payload = { ...this.form }
        if (this.modalMode === 'create') {
          await axios.post('/api/part', payload)
        } else {
          await axios.put(`/api/part/${this.form.id}`, payload)
        }
        this.showModal = false
        await this.loadData()
      } catch (err) {
        if (err.response?.data?.messages) {
          this.errors = err.response.data.messages
        } else {
          alert('Terjadi kesalahan saat menyimpan data.')
        }
      } finally {
        this.submitting = false
      }
    },
    async deletePart(id) {
      if (!confirm('Apakah Anda yakin ingin menghapus komponen ini?')) return
      try {
        await axios.delete(`/api/part/${id}`)
        await this.loadData()
      } catch (err) {
        alert('Gagal menghapus komponen. Komponen mungkin sedang digunakan dalam transaksi.')
      }
    },
    formatRupiah(amount) {
      if (!amount) return 'Rp 0'
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
    }
  },
  template: `
    <div>
      <!-- ── Page Header ─────────────────────── -->
      <div class="page-header">
        <div class="page-header-title">
          <h1>Manajemen Part Komponen</h1>
          <p>Kelola daftar komponen hardware, kategori, brand, dan status stok minimum.</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary btn-sm flex items-center gap-1.5" @click="openCreateModal">
            <span v-html="icons.plus"></span>
            Tambah Part Baru
          </button>
        </div>
      </div>

      <!-- ── Search & Filter Panel ────────────── -->
      <div class="glass-card p-3 mb-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div class="relative w-full md:max-w-md">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400" v-html="icons.search"></span>
          <input
            type="text"
            class="form-control pl-9 !py-1.5 text-xs"
            placeholder="Cari berdasarkan nama atau kode komponen..."
            v-model="searchQuery"
          />
        </div>
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select class="form-control !py-1.5 !px-2.5 w-full md:w-36 text-xs" v-model="filterCategory">
            <option value="">Semua Kategori</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.nama_kategori }}</option>
          </select>
          
          <select class="form-control !py-1.5 !px-2.5 w-full md:w-36 text-xs" v-model="filterBrand">
            <option value="">Semua Brand</option>
            <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.nama_brand }}</option>
          </select>

          <select class="form-control !py-1.5 !px-2.5 w-full md:w-32 text-xs" v-model="filterStatus">
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
        </div>
      </div>

      <!-- ── Main Table ──────────────────────── -->
      <div class="glass-card overflow-hidden">
        <div v-if="loading" class="flex items-center justify-center py-20 text-gray-400">
          <div class="flex flex-col items-center gap-3">
            <div class="spinner" style="border-color:rgba(26,112,245,0.2);border-top-color:#1A70F5;width:28px;height:28px;border-width:2.5px;"></div>
            <span class="text-xs">Memuat data komponen...</span>
          </div>
        </div>

        <div v-else-if="filteredParts.length === 0" class="empty-state py-20">
          <div class="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400" v-html="icons.box"></div>
          <h3 class="text-sm font-semibold text-gray-800">Tidak ada komponen ditemukan</h3>
          <p class="text-xs text-gray-400 mt-1">Coba ubah kata kunci pencarian atau filter Anda.</p>
        </div>

        <!-- Desktop Table -->
        <div v-else-if="!isMobile" class="table-wrapper">
          <table class="data-table compact">
            <thead>
              <tr>
                <th class="w-28">Kode</th>
                <th>Nama Komponen</th>
                <th>Kategori &amp; Brand</th>
                <th class="text-right">Harga Beli</th>
                <th class="text-right">Harga Jual</th>
                <th class="text-center w-32">Stok &amp; Status</th>
                <th class="w-24 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="part in filteredParts" :key="part.id" class="hover:bg-gray-50/50">
                <td class="whitespace-nowrap">
                  <code class="text-xs font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{{ part.kode_part }}</code>
                </td>
                <td>
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-white border border-gray-150 flex items-center justify-center p-1 overflow-hidden flex-shrink-0 shadow-xs">
                      <img v-if="part.gambar_url" :src="part.gambar_url" :alt="part.nama_part" class="max-w-full max-h-full object-contain" referrerpolicy="no-referrer" @error="part.gambar_url = null" />
                      <span v-else class="text-gray-300" v-html="icons.box"></span>
                    </div>
                    <div>
                      <div class="font-semibold text-gray-900 text-xs">{{ part.nama_part }}</div>
                      <div class="text-[10px] text-gray-400 mt-0.5">Supplier: {{ part.nama_supplier }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="flex items-center gap-1 text-xs font-semibold text-gray-800">
                    <span class="text-primary-DEFAULT/70" v-html="icons.getCategoryIcon(part.nama_kategori)"></span>
                    <span>{{ part.nama_kategori }}</span>
                  </div>
                  <div class="flex items-center gap-1 mt-0.5">
                    <div class="w-3.5 h-3.5 rounded bg-white border border-gray-200 flex items-center justify-center p-0.5 overflow-hidden flex-shrink-0">
                      <img v-if="part.brand_logo_url" :src="part.brand_logo_url" :alt="part.nama_brand" class="max-w-full max-h-full object-contain" referrerpolicy="no-referrer" @error="part.brand_logo_url = null" />
                      <span v-else class="text-[7px] font-bold text-gray-400">{{ part.nama_brand.substring(0, 1).toUpperCase() }}</span>
                    </div>
                    <span class="text-[11px] text-gray-500 font-medium">{{ part.nama_brand }}</span>
                  </div>
                </td>
                <td class="text-right font-medium text-xs text-gray-700">{{ formatRupiah(part.harga_beli) }}</td>
                <td class="text-right font-semibold text-xs text-primary-DEFAULT">{{ formatRupiah(part.harga_jual) }}</td>
                <td>
                  <div class="flex items-center justify-between gap-3 px-2">
                    <span class="font-mono text-xs font-semibold whitespace-nowrap" :class="Number(part.stok) <= Number(part.stok_minimum) ? 'text-red-500' : 'text-gray-700'">
                      {{ part.stok }}<span class="text-gray-400 font-normal"> / {{ part.stok_minimum }}</span>
                    </span>
                    <span
                      :title="part.status === 'aktif' ? 'Aktif' : 'Discontinue'"
                      class="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2"
                      :class="part.status === 'aktif'
                        ? 'bg-emerald-400 ring-emerald-100'
                        : 'bg-gray-300 ring-gray-100'"
                    ></span>
                  </div>
                </td>
                <td class="text-center">
                  <div class="flex items-center justify-center gap-1">
                    <button class="btn-icon !w-7 !h-7" @click="openEditModal(part)" title="Ubah" v-html="icons.pencil"></button>
                    <button class="btn-icon !w-7 !h-7 hover:!border-red-200 hover:!text-red-500" @click="deletePart(part.id)" title="Hapus" v-html="icons.trash"></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card List -->
        <div v-else class="mobile-card-list">
          <div v-for="part in filteredParts" :key="part.id" class="mc-item">
            <div class="mc-row">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center p-1 overflow-hidden flex-shrink-0">
                  <img v-if="part.gambar_url" :src="part.gambar_url" :alt="part.nama_part" class="max-w-full max-h-full object-contain" referrerpolicy="no-referrer" @error="part.gambar_url = null" />
                  <span v-else class="text-gray-300" v-html="icons.box"></span>
                </div>
                <div>
                  <div class="mc-title">{{ part.nama_part }}</div>
                  <div class="mc-subtitle">{{ part.kode_part }} · {{ part.nama_kategori }}</div>
                </div>
              </div>
              <span
                class="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 mt-1"
                :class="part.status === 'aktif' ? 'bg-emerald-400 ring-emerald-100' : 'bg-gray-300 ring-gray-100'"
                :title="part.status"
              ></span>
            </div>
            <div class="mc-row">
              <div>
                <div class="mc-label">Harga Jual</div>
                <div style="font-size:15px;font-weight:700;color:var(--primary)">{{ formatRupiah(part.harga_jual) }}</div>
              </div>
              <div style="text-align:right">
                <div class="mc-label">Stok</div>
                <div class="font-mono text-sm font-bold" :class="Number(part.stok) <= Number(part.stok_minimum) ? 'text-red-500' : 'text-gray-800'">
                  {{ part.stok }} <span class="text-gray-400 font-normal text-xs">/ {{ part.stok_minimum }}</span>
                </div>
              </div>
            </div>
            <div class="mc-actions">
              <button class="btn-icon" @click="openEditModal(part)" v-html="icons.pencil" title="Ubah"></button>
              <button class="btn-icon hover:!border-red-200 hover:!text-red-500" @click="deletePart(part.id)" v-html="icons.trash" title="Hapus"></button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Create/Edit Modal ───────────────── -->
      <AppModal :show="showModal" :title="modalMode === 'create' ? 'Tambah Komponen Baru' : 'Ubah Data Komponen'" size="lg" @close="showModal = false">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Kode Part</label>
              <input type="text" class="form-control" v-model="form.kode_part" :class="{'is-invalid': errors.kode_part}" placeholder="Contoh: CPU-INT-001" />
              <div v-if="errors.kode_part" class="form-error">{{ errors.kode_part }}</div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Nama Komponen</label>
              <input type="text" class="form-control" v-model="form.nama_part" :class="{'is-invalid': errors.nama_part}" placeholder="Contoh: Intel Core i5-12400F" />
              <div v-if="errors.nama_part" class="form-error">{{ errors.nama_part }}</div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div class="form-group">
              <label class="form-label">Kategori</label>
              <select class="form-control" v-model="form.kategori_id" :class="{'is-invalid': errors.kategori_id}">
                <option value="">Pilih Kategori</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.nama_kategori }}</option>
              </select>
              <div v-if="errors.kategori_id" class="form-error">{{ errors.kategori_id }}</div>
            </div>

            <div class="form-group">
              <label class="form-label">Brand</label>
              <select class="form-control" v-model="form.brand_id" :class="{'is-invalid': errors.brand_id}">
                <option value="">Pilih Brand</option>
                <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.nama_brand }}</option>
              </select>
              <div v-if="errors.brand_id" class="form-error">{{ errors.brand_id }}</div>
            </div>

            <div class="form-group">
              <label class="form-label">Supplier Utama</label>
              <select class="form-control" v-model="form.supplier_id" :class="{'is-invalid': errors.supplier_id}">
                <option value="">Pilih Supplier</option>
                <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.nama_supplier }}</option>
              </select>
              <div v-if="errors.supplier_id" class="form-error">{{ errors.supplier_id }}</div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Harga Beli (Rp)</label>
              <input type="number" class="form-control" v-model="form.harga_beli" :class="{'is-invalid': errors.harga_beli}" placeholder="Harga perolehan" />
              <div v-if="errors.harga_beli" class="form-error">{{ errors.harga_beli }}</div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Harga Jual (Rp)</label>
              <input type="number" class="form-control" v-model="form.harga_jual" :class="{'is-invalid': errors.harga_jual}" placeholder="Harga eceran" />
              <div v-if="errors.harga_jual" class="form-error">{{ errors.harga_jual }}</div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div class="form-group">
              <label class="form-label">Stok Awal</label>
              <input type="number" class="form-control" v-model="form.stok" :disabled="modalMode === 'edit'" />
            </div>

            <div class="form-group">
              <label class="form-label">Stok Minimum</label>
              <input type="number" class="form-control" v-model="form.stok_minimum" />
            </div>

            <div class="form-group">
              <label class="form-label">Satuan</label>
              <input type="text" class="form-control" v-model="form.satuan" placeholder="Contoh: pcs, unit, box" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Spesifikasi Detail (Opsional)</label>
            <textarea class="form-control" v-model="form.spesifikasi" placeholder="Masukkan spesifikasi produk, garansi, dll..."></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Gambar URL (Opsional)</label>
              <input type="text" class="form-control" v-model="form.gambar_url" placeholder="http://..." />
            </div>

            <div class="form-group">
              <label class="form-label">Status Produk</label>
              <select class="form-control" v-model="form.status">
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button type="button" class="btn btn-outline btn-sm" @click="showModal = false">Batal</button>
            <button type="submit" class="btn btn-primary btn-sm flex items-center gap-1.5" :disabled="submitting">
              <span v-if="submitting" class="spinner"></span>
              <span>Simpan</span>
            </button>
          </div>
        </form>
      </AppModal>
    </div>
  `
}
