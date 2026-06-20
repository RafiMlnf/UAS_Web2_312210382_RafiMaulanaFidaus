import icons from '../icons.js'
import AppModal from '../components/Modal.js'

export default {
  name: 'KategoriPage',
  components: { AppModal },
  data() {
    return {
      icons,
      isMobile: window.__mq ? window.__mq.is : false,
      _mqListener: null,
      loading: true,
      categories: [],
      searchQuery: '',
      
      // Modal control
      showModal: false,
      modalMode: 'create', // 'create' | 'edit'
      submitting: false,
      
      // Form state
      form: {
        id: null,
        nama_kategori: '',
        keterangan: ''
      },
      errors: {}
    }
  },
  computed: {
    filteredCategories() {
      return this.categories.filter(cat => {
        const query = this.searchQuery.toLowerCase()
        return (
          cat.nama_kategori.toLowerCase().includes(query) ||
          (cat.keterangan && cat.keterangan.toLowerCase().includes(query))
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
        const res = await axios.get('/api/kategori')
        this.categories = res.data.data || []
      } catch (err) {
        console.error('Failed to load categories', err)
      } finally {
        this.loading = false
      }
    },
    resetForm() {
      this.form = {
        id: null,
        nama_kategori: '',
        keterangan: ''
      }
      this.errors = {}
    },
    openCreateModal() {
      this.resetForm()
      this.modalMode = 'create'
      this.showModal = true
    },
    openEditModal(cat) {
      this.resetForm()
      this.modalMode = 'edit'
      this.form = { ...cat }
      this.showModal = true
    },
    async handleSubmit() {
      this.errors = {}
      if (!this.form.nama_kategori) {
        this.errors.nama_kategori = 'Nama kategori wajib diisi.'
        return
      }
      
      this.submitting = true
      try {
        const payload = { ...this.form }
        if (this.modalMode === 'create') {
          await axios.post('/api/kategori', payload)
        } else {
          await axios.put(`/api/kategori/${this.form.id}`, payload)
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
    async deleteCategory(id) {
      if (!confirm('Apakah Anda yakin ingin menghapus kategori ini?')) return
      try {
        await axios.delete(`/api/kategori/${id}`)
        await this.loadData()
      } catch (err) {
        alert('Gagal menghapus kategori. Kategori ini mungkin masih terhubung dengan beberapa produk.')
      }
    }
  },
  template: `
    <div>
      <!-- ── Page Header ─────────────────────── -->
      <div class="page-header">
        <div class="page-header-title">
          <h1>Kategori Part</h1>
          <p>Kelola klasifikasi atau pengelompokan komponen hardware komputer.</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary btn-sm flex items-center gap-1.5" @click="openCreateModal">
            <span v-html="icons.plus"></span>
            Tambah Kategori
          </button>
        </div>
      </div>

      <!-- ── Search & Filter Panel ────────────── -->
      <div class="glass-card py-2 px-3 mb-3 flex items-center">
        <div class="relative w-full md:max-w-xs">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400" v-html="icons.search"></span>
          <input
            type="text"
            class="form-control pl-9 !py-1.5 text-xs"
            placeholder="Cari kategori..."
            v-model="searchQuery"
          />
        </div>
      </div>

      <!-- ── Main Grid / Table ───────────────── -->
      <div class="glass-card overflow-hidden">
        <div v-if="loading" class="flex items-center justify-center py-20 text-gray-400">
          <div class="flex flex-col items-center gap-3">
            <div class="spinner" style="border-color:rgba(26,112,245,0.2);border-top-color:#1A70F5;width:28px;height:28px;border-width:2.5px;"></div>
            <span class="text-xs">Memuat kategori...</span>
          </div>
        </div>

        <div v-else-if="filteredCategories.length === 0" class="empty-state py-20">
          <div class="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400" v-html="icons.tag"></div>
          <h3 class="text-sm font-semibold text-gray-800">Tidak ada kategori ditemukan</h3>
          <p class="text-xs text-gray-400 mt-1">Coba masukkan kata kunci pencarian yang lain.</p>
        </div>

        <!-- Desktop Table -->
        <div v-else-if="!isMobile" class="table-wrapper">
          <table class="data-table compact">
            <thead>
              <tr>
                <th class="w-20">ID</th>
                <th>Nama Kategori</th>
                <th>Deskripsi / Keterangan</th>
                <th class="w-24 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cat in filteredCategories" :key="cat.id" class="hover:bg-gray-50/50">
                <td><code class="text-xs font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">#{{ cat.id }}</code></td>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="text-primary-DEFAULT w-5 h-5 flex items-center justify-center bg-primary/10 rounded-lg" v-html="icons.getCategoryIcon(cat.nama_kategori)"></span>
                    <div class="font-semibold text-gray-900 text-sm">{{ cat.nama_kategori }}</div>
                  </div>
                </td>
                <td class="text-sm text-gray-600">{{ cat.keterangan || '-' }}</td>
                <td class="text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <button class="btn-icon !w-8 !h-8" @click="openEditModal(cat)" title="Ubah" v-html="icons.pencil"></button>
                    <button class="btn-icon !w-8 !h-8 hover:!border-red-200 hover:!text-red-500" @click="deleteCategory(cat.id)" title="Hapus" v-html="icons.trash"></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card List -->
        <div v-else class="mobile-card-list p-3">
          <div v-for="cat in filteredCategories" :key="cat.id" class="mc-item">
            <div class="mc-row">
              <div class="flex items-center gap-3">
                <span class="w-9 h-9 flex items-center justify-center rounded-xl" style="background:var(--primary-light);color:var(--primary)" v-html="icons.getCategoryIcon(cat.nama_kategori)"></span>
                <div>
                  <div class="mc-title">{{ cat.nama_kategori }}</div>
                  <div class="mc-subtitle">{{ cat.keterangan || 'Tidak ada keterangan' }}</div>
                </div>
              </div>
              <code class="text-[10px] font-mono text-gray-400">#{{ cat.id }}</code>
            </div>
            <div class="mc-actions">
              <button class="btn-icon" @click="openEditModal(cat)" v-html="icons.pencil" title="Ubah"></button>
              <button class="btn-icon hover:!border-red-200 hover:!text-red-500" @click="deleteCategory(cat.id)" v-html="icons.trash" title="Hapus"></button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Create/Edit Modal ───────────────── -->
      <AppModal :show="showModal" :title="modalMode === 'create' ? 'Tambah Kategori Baru' : 'Ubah Kategori'" size="md" @close="showModal = false">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="form-group">
            <label class="form-label">Nama Kategori</label>
            <input type="text" class="form-control" v-model="form.nama_kategori" :class="{'is-invalid': errors.nama_kategori}" placeholder="Contoh: Processor, Motherboard, RAM" />
            <div v-if="errors.nama_kategori" class="form-error">{{ errors.nama_kategori }}</div>
          </div>

          <div class="form-group">
            <label class="form-label">Deskripsi / Keterangan</label>
            <textarea class="form-control" v-model="form.keterangan" placeholder="Keterangan opsional tentang kategori..."></textarea>
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
