import icons from '../icons.js'
import AppModal from '../components/Modal.js'

export default {
  name: 'TransaksiKeluarPage',
  components: { AppModal },
  data() {
    return {
      icons,
      isMobile: window.__mq ? window.__mq.is : false,
      _mqListener: null,
      loading: true,
      transactions: [],
      parts: [],
      searchQuery: '',
      
      // Modal control
      showModal: false,
      submitting: false,
      
      // Form state
      form: {
        no_transaksi: '',
        tgl_keluar: new Date().toISOString().split('T')[0],
        part_id: '',
        jumlah: 1,
        harga_satuan: 0,
        nama_pembeli: '',
        keterangan: ''
      },
      errors: {}
    }
  },
  computed: {
    selectedPart() {
      if (!this.form.part_id) return null
      return this.parts.find(p => Number(p.id) === Number(this.form.part_id))
    },
    filteredTransactions() {
      return this.transactions.filter(tx => {
        const query = this.searchQuery.toLowerCase()
        return (
          tx.no_transaksi.toLowerCase().includes(query) ||
          tx.nama_part.toLowerCase().includes(query) ||
          tx.kode_part.toLowerCase().includes(query) ||
          tx.nama_pembeli.toLowerCase().includes(query) ||
          (tx.keterangan && tx.keterangan.toLowerCase().includes(query))
        )
      })
    }
  },
  async created() {
    await Promise.all([
      this.loadTransactions(),
      this.loadParts()
    ])
  },
  mounted() {
    this._mqListener = () => { this.isMobile = window.__mq ? window.__mq.is : false }
    window.addEventListener('resize', this._mqListener)
  },
  beforeUnmount() {
    if (this._mqListener) window.removeEventListener('resize', this._mqListener)
  },
  methods: {
    async loadTransactions() {
      this.loading = true
      try {
        const res = await axios.get('/api/transaksi-keluar')
        this.transactions = res.data.data || []
      } catch (err) {
        console.error('Failed to load transaksi keluar', err)
      } finally {
        this.loading = false
      }
    },
    async loadParts() {
      try {
        const res = await axios.get('/api/part')
        this.parts = res.data.data || []
      } catch (err) {
        console.error('Failed to load parts', err)
      }
    },
    formatRupiah(value) {
      if (!value) return 'Rp 0'
      return 'Rp ' + parseFloat(value).toLocaleString('id-ID', { minimumFractionDigits: 0 })
    },
    resetForm() {
      this.form = {
        no_transaksi: '',
        tgl_keluar: new Date().toISOString().split('T')[0],
        part_id: '',
        jumlah: 1,
        harga_satuan: 0,
        nama_pembeli: '',
        keterangan: ''
      }
      this.errors = {}
    },
    openCreateModal() {
      this.resetForm()
      // Generate simple auto-transaction code: OUT-YYYYMMDD-XXXX
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const randNum = Math.floor(100 + Math.random() * 900)
      this.form.no_transaksi = `OUT-${dateStr}-${randNum}`
      
      this.showModal = true
    },
    onPartChange() {
      if (this.selectedPart) {
        // Auto pre-fill default price
        this.form.harga_satuan = this.selectedPart.harga
      }
    },
    async handleSubmit() {
      this.errors = {}
      let hasError = false
      
      if (!this.form.no_transaksi) {
        this.errors.no_transaksi = 'No. Transaksi wajib diisi.'
        hasError = true
      }
      if (!this.form.tgl_keluar) {
        this.errors.tgl_keluar = 'Tanggal keluar wajib diisi.'
        hasError = true
      }
      if (!this.form.nama_pembeli) {
        this.errors.nama_pembeli = 'Nama pembeli / keperluan wajib diisi.'
        hasError = true
      }
      if (!this.form.part_id) {
        this.errors.part_id = 'Pilih part / komponen.'
        hasError = true
      }
      if (this.form.jumlah <= 0) {
        this.errors.jumlah = 'Jumlah harus lebih besar dari 0.'
        hasError = true
      }
      if (this.form.harga_satuan < 0) {
        this.errors.harga_satuan = 'Harga tidak boleh negatif.'
        hasError = true
      }
      
      // Frontend stock protection check
      if (this.selectedPart && this.form.jumlah > this.selectedPart.stok) {
        this.errors.jumlah = `Stok tidak mencukupi. Stok tersedia saat ini hanya ${this.selectedPart.stok} unit.`
        hasError = true
      }
      
      if (hasError) return
      
      this.submitting = true
      try {
        await axios.post('/api/transaksi-keluar', this.form)
        this.showModal = false
        await Promise.all([
          this.loadTransactions(),
          this.loadParts() // reload parts to update the stock count in form dropdown
        ])
      } catch (err) {
        if (err.response?.data?.errors) {
          this.errors = err.response.data.errors
        } else if (err.response?.data?.message) {
          // 422 Unprocessable entity or 404
          this.errors.jumlah = err.response.data.message
        } else {
          alert('Terjadi kesalahan saat menyimpan transaksi.')
        }
      } finally {
        this.submitting = false
      }
    },
    async deleteTransaction(id) {
      if (!confirm('Apakah Anda yakin ingin menghapus transaksi keluar ini? Stok part akan dikembalikan.')) return
      try {
        await axios.delete(`/api/transaksi-keluar/${id}`)
        await Promise.all([
          this.loadTransactions(),
          this.loadParts()
        ])
      } catch (err) {
        alert('Gagal menghapus transaksi keluar.')
      }
    }
  },
  template: `
    <div>
      <!-- ── Page Header ─────────────────────── -->
      <div class="page-header">
        <div class="page-header-title">
          <h1>Transaksi Keluar (Stok Keluar)</h1>
          <p>Catat pengeluaran stok komponen PC untuk penjualan, perakitan, atau keperluan lainnya.</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary btn-sm flex items-center gap-1.5" @click="openCreateModal">
            <span v-html="icons.minus"></span>
            Catat Stok Keluar
          </button>
        </div>
      </div>

      <!-- ── Search & Filter ─────────────────── -->
      <div class="glass-card py-2 px-3 mb-3 flex items-center">
        <div class="relative w-full md:max-w-xs">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400" v-html="icons.search"></span>
          <input
            type="text"
            class="form-control pl-9 !py-1.5 text-xs"
            placeholder="Cari transaksi, part, kode, atau pembeli..."
            v-model="searchQuery"
          />
        </div>
      </div>

      <!-- ── Main Grid / Table ───────────────── -->
      <div class="glass-card overflow-hidden">
        <div v-if="loading" class="flex items-center justify-center py-20 text-gray-400">
          <div class="flex flex-col items-center gap-3">
            <div class="spinner" style="border-color:rgba(26,112,245,0.2);border-top-color:#1A70F5;width:28px;height:28px;border-width:2.5px;"></div>
            <span class="text-xs">Memuat riwayat transaksi...</span>
          </div>
        </div>

        <div v-else-if="filteredTransactions.length === 0" class="empty-state py-20">
          <div class="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400" v-html="icons.trendingDown"></div>
          <h3 class="text-sm font-semibold text-gray-800">Tidak ada riwayat transaksi keluar</h3>
          <p class="text-xs text-gray-400 mt-1">Belum ada barang keluar yang dicatat.</p>
        </div>

        <!-- Desktop Table -->
        <div v-else-if="!isMobile" class="table-wrapper">
          <table class="data-table compact">
            <thead><tr>
              <th>No. Transaksi</th>
              <th>Tanggal</th>
              <th>Pembeli / Keperluan</th>
              <th>Part / Komponen</th>
              <th class="text-right">Jumlah</th>
              <th class="text-right">Harga Satuan</th>
              <th class="text-right">Total Harga</th>
              <th class="w-16 text-center">Aksi</th>
            </tr></thead>
            <tbody>
              <tr v-for="tx in filteredTransactions" :key="tx.id" class="hover:bg-gray-50/50">
                <td><span class="text-[11px] font-mono font-medium text-red-600 bg-red-50/70 px-1.5 py-0.5 rounded border border-red-100/80 whitespace-nowrap">{{ tx.no_transaksi }}</span></td>
                <td class="text-sm text-gray-600">{{ tx.tgl_keluar || tx.tanggal }}</td>
                <td class="text-sm font-medium text-gray-800">{{ tx.nama_pembeli }}</td>
                <td>
                  <div class="flex flex-col">
                    <span class="font-semibold text-gray-900 text-sm">{{ tx.nama_part }}</span>
                    <span class="text-xs font-mono text-gray-400">{{ tx.kode_part }}</span>
                  </div>
                </td>
                <td class="text-right font-semibold text-red-600 text-sm">-{{ tx.jumlah }}</td>
                <td class="text-right text-sm text-gray-600">{{ formatRupiah(tx.harga_satuan) }}</td>
                <td class="text-right font-semibold text-sm text-gray-950">{{ formatRupiah(tx.total_harga || (tx.jumlah * tx.harga_satuan)) }}</td>
                <td class="text-center">
                  <button class="btn-icon !w-8 !h-8 hover:!border-red-200 hover:!text-red-500" @click="deleteTransaction(tx.id)" title="Hapus Transaksi" v-html="icons.trash"></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card List -->
        <div v-else class="mobile-card-list p-3">
          <div v-for="tx in filteredTransactions" :key="tx.id" class="mc-item">
            <div class="mc-row">
              <div>
                <div class="mc-title">{{ tx.nama_part }}</div>
                <div class="mc-subtitle">{{ tx.kode_part }} · {{ tx.nama_pembeli }}</div>
              </div>
              <span class="mc-badge" style="background:#FEF2F2;color:#DC2626">-{{ tx.jumlah }} pcs</span>
            </div>
            <div class="mc-row">
              <span style="font-size:11px;color:var(--text-3)" class="font-mono">{{ tx.no_transaksi }}</span>
              <span style="font-size:11px;color:var(--text-2)">{{ tx.tgl_keluar || tx.tanggal }}</span>
            </div>
            <div class="mc-row" style="border-top:1px solid rgba(0,0,0,0.05);padding-top:8px">
              <div>
                <div class="mc-label">Total</div>
                <div style="font-size:15px;font-weight:700;color:var(--text-1)">{{ formatRupiah(tx.total_harga || (tx.jumlah * tx.harga_satuan)) }}</div>
              </div>
              <button class="btn-icon hover:!border-red-200 hover:!text-red-500" @click="deleteTransaction(tx.id)" v-html="icons.trash" title="Hapus"></button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Create Modal ────────────────────── -->
      <AppModal :show="showModal" title="Catat Transaksi Stok Keluar" size="md" @close="showModal = false">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">No. Transaksi</label>
              <input type="text" class="form-control" v-model="form.no_transaksi" :class="{'is-invalid': errors.no_transaksi}" placeholder="OUT-YYYYMMDD-XXX" />
              <div v-if="errors.no_transaksi" class="form-error">{{ errors.no_transaksi }}</div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Tanggal Keluar</label>
              <input type="date" class="form-control" v-model="form.tgl_keluar" :class="{'is-invalid': errors.tgl_keluar}" />
              <div v-if="errors.tgl_keluar" class="form-error">{{ errors.tgl_keluar }}</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Pembeli / Keperluan Pengeluaran</label>
            <input type="text" class="form-control" v-model="form.nama_pembeli" :class="{'is-invalid': errors.nama_pembeli}" placeholder="Contoh: Budi Santoso / Perakitan PC Gaming" />
            <div v-if="errors.nama_pembeli" class="form-error">{{ errors.nama_pembeli }}</div>
          </div>

          <div class="form-group">
            <label class="form-label">Part / Komponen PC</label>
            <select class="form-control" v-model="form.part_id" :class="{'is-invalid': errors.part_id}" @change="onPartChange">
              <option value="">-- Pilih Part --</option>
              <option v-for="p in parts" :key="p.id" :value="p.id">
                [{{ p.kode_part }}] {{ p.nama_part }} (Tersedia: {{ p.stok }})
              </option>
            </select>
            <div v-if="errors.part_id" class="form-error">{{ errors.part_id }}</div>
          </div>

          <!-- Real-time stock alerts -->
          <div v-if="selectedPart" class="p-3.5 rounded-lg border flex items-center justify-between text-xs transition-colors"
               :class="selectedPart.stok > 0 ? 'bg-blue-50/50 border-blue-100 text-blue-800' : 'bg-red-50/50 border-red-100 text-red-800'">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full" :class="selectedPart.stok > 0 ? 'bg-blue-500' : 'bg-red-500'"></span>
              <span>Stok PC Part terpilih: <strong>{{ selectedPart.stok }} unit</strong></span>
            </div>
            <span v-if="selectedPart.stok === 0" class="font-semibold">STOK HABIS</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Jumlah Keluar</label>
              <input type="number" min="1" class="form-control" v-model.number="form.jumlah" :class="{'is-invalid': errors.jumlah}" />
              <div v-if="errors.jumlah" class="form-error">{{ errors.jumlah }}</div>
            </div>

            <div class="form-group">
              <label class="form-label">Harga Satuan (IDR)</label>
              <input type="number" min="0" step="500" class="form-control" v-model.number="form.harga_satuan" :class="{'is-invalid': errors.harga_satuan}" />
              <div v-if="errors.harga_satuan" class="form-error">{{ errors.harga_satuan }}</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Keterangan / Catatan</label>
            <textarea class="form-control" v-model="form.keterangan" rows="2" placeholder="Catatan tambahan mengenai transaksi keluar..."></textarea>
          </div>

          <!-- Total Estimasi -->
          <div class="p-3.5 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
            <span class="text-gray-500 font-medium">Total Harga</span>
            <span class="font-bold text-sm text-gray-900">{{ formatRupiah(form.jumlah * form.harga_satuan) }}</span>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button type="button" class="btn btn-outline btn-sm" @click="showModal = false">Batal</button>
            <button type="submit" class="btn btn-primary btn-sm flex items-center gap-1.5" :disabled="submitting || (selectedPart && selectedPart.stok === 0)">
              <span v-if="submitting" class="spinner"></span>
              <span>Simpan Transaksi</span>
            </button>
          </div>
        </form>
      </AppModal>
    </div>
  `
}
