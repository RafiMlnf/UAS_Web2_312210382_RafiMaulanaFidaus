import icons from '../icons.js'
import AppModal from '../components/Modal.js'

export default {
  name: 'SupplierPage',
  components: { AppModal },
  data() {
    return {
      icons,
      isMobile: window.__mq ? window.__mq.is : false,
      _mqListener: null,
      loading: true,
      suppliers: [],
      searchQuery: '',
      
      // Modal control
      showModal: false,
      modalMode: 'create', // 'create' | 'edit'
      submitting: false,
      
      // Form state
      form: {
        id: null,
        nama_supplier: '',
        alamat: '',
        no_telp: '',
        email: ''
      },
      errors: {}
    }
  },
  computed: {
    filteredSuppliers() {
      return this.suppliers.filter(sup => {
        const query = this.searchQuery.toLowerCase()
        return (
          sup.nama_supplier.toLowerCase().includes(query) ||
          (sup.alamat && sup.alamat.toLowerCase().includes(query)) ||
          (sup.no_telp && sup.no_telp.toLowerCase().includes(query)) ||
          (sup.email && sup.email.toLowerCase().includes(query))
        )
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
        const res = await axios.get('/api/supplier')
        this.suppliers = res.data.data || []
      } catch (err) {
        console.error('Failed to load suppliers', err)
      } finally {
        this.loading = false
      }
    },
    resetForm() {
      this.form = {
        id: null,
        nama_supplier: '',
        alamat: '',
        no_telp: '',
        email: ''
      }
      this.errors = {}
    },
    openCreateModal() {
      this.resetForm()
      this.modalMode = 'create'
      this.showModal = true
    },
    openEditModal(sup) {
      this.resetForm()
      this.modalMode = 'edit'
      this.form = { ...sup }
      this.showModal = true
    },
    async handleSubmit() {
      this.errors = {}
      let hasError = false
      
      if (!this.form.nama_supplier) {
        this.errors.nama_supplier = 'Nama supplier wajib diisi.'
        hasError = true
      }
      
      if (hasError) return
      
      this.submitting = true
      try {
        const payload = { ...this.form }
        if (this.modalMode === 'create') {
          await axios.post('/api/supplier', payload)
        } else {
          await axios.put(`/api/supplier/${this.form.id}`, payload)
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
    async deleteSupplier(id) {
      if (!confirm('Apakah Anda yakin ingin menghapus supplier ini?')) return
      try {
        await axios.delete(`/api/supplier/${id}`)
        await this.loadData()
      } catch (err) {
        alert('Gagal menghapus supplier. Supplier ini mungkin masih terikat dengan transaksi masuk.')
      }
    }
  },
  template: `
    <div>
      <!-- ── Page Header ─────────────────────── -->
      <div class="page-header">
        <div class="page-header-title">
          <h1>Supplier / Pemasok</h1>
          <p>Kelola data supplier komputer untuk pasokan transaksi masuk.</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary btn-sm flex items-center gap-1.5" @click="openCreateModal">
            <span v-html="icons.plus"></span>
            Tambah Supplier
          </button>
        </div>
      </div>

      <!-- ── Search Panel ────────────────────── -->
      <div class="glass-card py-2 px-3 mb-3 flex items-center">
        <div class="relative w-full md:max-w-xs">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400" v-html="icons.search"></span>
          <input
            type="text"
            class="form-control pl-9 !py-1.5 text-xs"
            placeholder="Cari nama, alamat, telp, atau email supplier..."
            v-model="searchQuery"
          />
        </div>
      </div>

      <!-- ── Main Grid / Table ───────────────── -->
      <div class="glass-card overflow-hidden">
        <div v-if="loading" class="flex items-center justify-center py-20 text-gray-400">
          <div class="flex flex-col items-center gap-3">
            <div class="spinner" style="border-color:rgba(26,112,245,0.2);border-top-color:#1A70F5;width:28px;height:28px;border-width:2.5px;"></div>
            <span class="text-xs">Memuat data supplier...</span>
          </div>
        </div>

        <div v-else-if="filteredSuppliers.length === 0" class="empty-state py-20">
          <div class="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400" v-html="icons.users"></div>
          <h3 class="text-sm font-semibold text-gray-800">Tidak ada supplier ditemukan</h3>
          <p class="text-xs text-gray-400 mt-1">Coba masukkan kata kunci pencarian yang lain.</p>
        </div>

        <!-- Desktop Table -->
        <div v-else-if="!isMobile" class="table-wrapper">
          <table class="data-table compact">
            <thead><tr>
              <th class="w-20">ID</th>
              <th>Nama Supplier</th>
              <th>Kontak &amp; Email</th>
              <th>Alamat</th>
              <th class="w-24 text-center">Aksi</th>
            </tr></thead>
            <tbody>
              <tr v-for="sup in filteredSuppliers" :key="sup.id" class="hover:bg-gray-50/50">
                <td><code class="text-xs font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">#{{ sup.id }}</code></td>
                <td><div class="font-semibold text-gray-900 text-sm">{{ sup.nama_supplier }}</div></td>
                <td>
                  <div class="text-xs text-gray-800 flex flex-col gap-0.5">
                    <span class="flex items-center gap-1.5 text-gray-600"><span class="w-3 h-3 text-gray-400" v-html="icons.phone"></span>{{ sup.no_telp || '-' }}</span>
                    <span class="flex items-center gap-1.5 text-gray-600"><span class="w-3 h-3 text-gray-400" v-html="icons.mail"></span>{{ sup.email || '-' }}</span>
                  </div>
                </td>
                <td class="text-sm text-gray-600 max-w-xs truncate" :title="sup.alamat">{{ sup.alamat || '-' }}</td>
                <td class="text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <button class="btn-icon !w-8 !h-8" @click="openEditModal(sup)" title="Ubah" v-html="icons.pencil"></button>
                    <button class="btn-icon !w-8 !h-8 hover:!border-red-200 hover:!text-red-500" @click="deleteSupplier(sup.id)" title="Hapus" v-html="icons.trash"></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card List -->
        <div v-else class="mobile-card-list p-3">
          <div v-for="sup in filteredSuppliers" :key="sup.id" class="mc-item">
            <div class="mc-row">
              <div>
                <div class="mc-title">{{ sup.nama_supplier }}</div>
                <div class="mc-subtitle">{{ sup.alamat || 'Tidak ada alamat' }}</div>
              </div>
              <div class="mc-actions" style="border:none;padding:0">
                <button class="btn-icon" @click="openEditModal(sup)" v-html="icons.pencil" title="Ubah"></button>
                <button class="btn-icon hover:!border-red-200 hover:!text-red-500" @click="deleteSupplier(sup.id)" v-html="icons.trash" title="Hapus"></button>
              </div>
            </div>
            <div class="mc-row" style="border-top:1px solid rgba(0,0,0,0.05);padding-top:8px;margin-top:0">
              <span style="font-size:11px;color:var(--text-2)" class="flex items-center gap-1" v-html="'&#9990; ' + (sup.no_telp || '-')"></span>
              <span style="font-size:11px;color:var(--text-2)">{{ sup.email || '-' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Create/Edit Modal ───────────────── -->
      <AppModal :show="showModal" :title="modalMode === 'create' ? 'Tambah Supplier Baru' : 'Ubah Supplier'" size="md" @close="showModal = false">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="form-group">
            <label class="form-label">Nama Supplier</label>
            <input type="text" class="form-control" v-model="form.nama_supplier" :class="{'is-invalid': errors.nama_supplier}" placeholder="Contoh: PT. Sinar Baru Utama" />
            <div v-if="errors.nama_supplier" class="form-error">{{ errors.nama_supplier }}</div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">No. Telepon</label>
              <input type="text" class="form-control" v-model="form.no_telp" placeholder="Contoh: 08123456789" />
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" v-model="form.email" placeholder="Contoh: sales@supplier.com" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Alamat Lengkap</label>
            <textarea class="form-control" v-model="form.alamat" rows="3" placeholder="Jl. Raya Utama No. 45, Jakarta Barat"></textarea>
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
