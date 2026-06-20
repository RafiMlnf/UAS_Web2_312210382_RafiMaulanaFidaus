import icons from '../icons.js'
import AppModal from '../components/Modal.js'

export default {
  name: 'BrandPage',
  components: { AppModal },
  data() {
    return {
      icons,
      isMobile: window.__mq ? window.__mq.is : false,
      _mqListener: null,
      loading: true,
      brands: [],
      searchQuery: '',
      
      // Modal control
      showModal: false,
      modalMode: 'create', // 'create' | 'edit'
      submitting: false,
      
      // Form state
      form: {
        id: null,
        nama_brand: '',
        logo_url: ''
      },
      errors: {}
    }
  },
  computed: {
    filteredBrands() {
      return this.brands.filter(b => {
        const query = this.searchQuery.toLowerCase()
        return (
          b.nama_brand.toLowerCase().includes(query) ||
          (b.logo_url && b.logo_url.toLowerCase().includes(query))
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
        const res = await axios.get('/api/brand')
        this.brands = res.data.data || []
      } catch (err) {
        console.error('Failed to load brands', err)
      } finally {
        this.loading = false
      }
    },
    resetForm() {
      this.form = {
        id: null,
        nama_brand: '',
        logo_url: ''
      }
      this.errors = {}
    },
    openCreateModal() {
      this.resetForm()
      this.modalMode = 'create'
      this.showModal = true
    },
    openEditModal(brand) {
      this.resetForm()
      this.modalMode = 'edit'
      this.form = {
        id: brand.id,
        nama_brand: brand.nama_brand,
        logo_url: brand.logo_url || ''
      }
      this.showModal = true
    },
    async handleSubmit() {
      this.errors = {}
      if (!this.form.nama_brand) {
        this.errors.nama_brand = 'Nama brand wajib diisi.'
        return
      }
      
      this.submitting = true
      try {
        const payload = { ...this.form }
        if (this.modalMode === 'create') {
          await axios.post('/api/brand', payload)
        } else {
          await axios.put(`/api/brand/${this.form.id}`, payload)
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
    async deleteBrand(id) {
      if (!confirm('Apakah Anda yakin ingin menghapus brand ini?')) return
      try {
        await axios.delete(`/api/brand/${id}`)
        await this.loadData()
      } catch (err) {
        alert('Gagal menghapus brand. Brand ini mungkin masih digunakan oleh beberapa komponen.')
      }
    }
  },
  template: `
    <div>
      <!-- ── Page Header ─────────────────────── -->
      <div class="page-header">
        <div class="page-header-title">
          <h1>Brand / Merk</h1>
          <p>Kelola merk komponen PC (contoh: ASUS, MSI, Intel, AMD, NVIDIA).</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary btn-sm flex items-center gap-1.5" @click="openCreateModal">
            <span v-html="icons.plus"></span>
            Tambah Brand
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
            placeholder="Cari merk / brand..."
            v-model="searchQuery"
          />
        </div>
      </div>

      <!-- ── Main Grid / Table ───────────────── -->
      <div class="glass-card overflow-hidden">
        <div v-if="loading" class="flex items-center justify-center py-20 text-gray-400">
          <div class="flex flex-col items-center gap-3">
            <div class="spinner" style="border-color:rgba(26,112,245,0.2);border-top-color:#1A70F5;width:28px;height:28px;border-width:2.5px;"></div>
            <span class="text-xs">Memuat brand...</span>
          </div>
        </div>

        <div v-else-if="filteredBrands.length === 0" class="empty-state py-20">
          <div class="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400" v-html="icons.tag"></div>
          <h3 class="text-sm font-semibold text-gray-800">Tidak ada brand ditemukan</h3>
          <p class="text-xs text-gray-400 mt-1">Coba masukkan kata kunci pencarian yang lain.</p>
        </div>

        <!-- Desktop Table -->
        <div v-else-if="!isMobile" class="table-wrapper">
          <table class="data-table compact">
            <thead><tr>
              <th class="w-16 text-center">Logo</th>
              <th>Nama Brand</th>
              <th class="w-24 text-center">Aksi</th>
            </tr></thead>
            <tbody>
              <tr v-for="b in filteredBrands" :key="b.id" class="hover:bg-gray-50/50">
                <td class="text-center">
                  <div class="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center p-0.5 overflow-hidden shadow-xs mx-auto">
                    <img v-if="b.logo_url" :src="b.logo_url" :alt="b.nama_brand" class="max-w-full max-h-full object-contain" referrerpolicy="no-referrer" @error="b.logo_url = null" />
                    <span v-else class="text-[10px] text-gray-400 font-bold">{{ b.nama_brand.substring(0, 2).toUpperCase() }}</span>
                  </div>
                </td>
                <td><div class="font-semibold text-gray-900 text-sm">{{ b.nama_brand }}</div></td>
                <td class="text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <button class="btn-icon !w-8 !h-8" @click="openEditModal(b)" title="Ubah" v-html="icons.pencil"></button>
                    <button class="btn-icon !w-8 !h-8 hover:!border-red-200 hover:!text-red-500" @click="deleteBrand(b.id)" title="Hapus" v-html="icons.trash"></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card List -->
        <div v-else class="mobile-card-list p-3">
          <div v-for="b in filteredBrands" :key="b.id" class="mc-item">
            <div class="mc-row">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center p-1 overflow-hidden">
                  <img v-if="b.logo_url" :src="b.logo_url" :alt="b.nama_brand" class="max-w-full max-h-full object-contain" referrerpolicy="no-referrer" @error="b.logo_url = null" />
                  <span v-else class="text-xs font-bold text-gray-400">{{ b.nama_brand.substring(0,2).toUpperCase() }}</span>
                </div>
                <div class="mc-title">{{ b.nama_brand }}</div>
              </div>
              <div class="mc-actions" style="border:none;padding:0">
                <button class="btn-icon" @click="openEditModal(b)" v-html="icons.pencil" title="Ubah"></button>
                <button class="btn-icon hover:!border-red-200 hover:!text-red-500" @click="deleteBrand(b.id)" v-html="icons.trash" title="Hapus"></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Create/Edit Modal ───────────────── -->
      <AppModal :show="showModal" :title="modalMode === 'create' ? 'Tambah Brand Baru' : 'Ubah Brand'" size="md" @close="showModal = false">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="form-group">
            <label class="form-label">Nama Brand / Merk</label>
            <input type="text" class="form-control" v-model="form.nama_brand" :class="{'is-invalid': errors.nama_brand}" placeholder="Contoh: ASUS, MSI, Gigabyte" />
            <div v-if="errors.nama_brand" class="form-error">{{ errors.nama_brand }}</div>
          </div>

          <div class="form-group">
            <label class="form-label">URL Logo Brand</label>
            <input type="text" class="form-control" v-model="form.logo_url" placeholder="Contoh: https://logo.clearbit.com/asus.com" />
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
