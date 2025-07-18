<template>
  <v-app>
    <v-main>
      <v-container>
        <!-- Form Tambah/Edit Barang -->
        <v-card class="mb-4" elevation="2">
          <v-card-title>{{ form._id ? 'Edit Barang' : 'Tambah Barang Baru' }}</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="submitForm">
              <v-row dense>
                <v-col cols="12" md="3">
                  <v-text-field v-model="form.nama" label="Nama Barang" outlined dense required />
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field v-model="form.kategori" label="Kategori" outlined dense required />
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field v-model.number="form.jumlah" label="Jumlah" type="number" outlined dense min="1" required />
                </v-col>
                <v-col cols="12" md="3">
                  <v-autocomplete
                    v-model="form.satuan"
                    :items="satuanList"
                    item-title="nama"
                    item-value="nama"
                    label="Pilih Satuan"
                    outlined
                    dense
                    required
                  >
                    <template v-slot:append>
                      <v-btn icon size="small" variant="text" @click.stop="dialogSatuan = true">
                        <v-icon>mdi-plus-box</v-icon>
                      </v-btn>
                    </template>
                  </v-autocomplete>
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field v-model.number="form.harga_beli" label="Harga Beli" type="number" prefix="Rp" outlined dense min="1" required />
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field v-model.number="form.harga_jual" label="Harga Jual" type="number" prefix="Rp" outlined dense min="1" required />
                </v-col>
                <v-col cols="12">
                  <v-btn color="primary" type="submit" class="me-2" :loading="isLoading" :disabled="isLoading">
                    {{ form._id ? 'Simpan Perubahan' : 'Tambah Barang' }}
                  </v-btn>
                  <v-btn v-if="form._id" color="grey" @click="resetForm" :disabled="isLoading">
                    Batal
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- Tabel Data dengan Fitur Pencarian -->
        <v-card>
          <v-card-title>
            <v-row align="center">
              <v-col cols="12" md="4">
                <h3 class="text-h6">Data Barang</h3>
                <p class="text-caption text-grey-600 mb-0">
                  Total: {{ filteredBarang.length }} barang
                </p>
              </v-col>
              <v-col cols="12" md="5">
                <v-text-field
                  v-model="search"
                  label="Cari barang (kode, nama, kategori...)"
                  prepend-inner-icon="mdi-magnify"
                  density="compact"
                  hide-details
                  variant="outlined"
                  clearable
                />
              </v-col>
              <!-- [PERUBAHAN] Tombol untuk membuka dialog manajemen satuan -->
              <v-col cols="12" md="3" class="text-right">
                 <v-btn color="secondary" @click="bukaDialogKelolaSatuan">
                    <v-icon left>mdi-ruler-square</v-icon>
                    Kelola Satuan
                  </v-btn>
              </v-col>
            </v-row>
          </v-card-title>
          <v-data-table
            :headers="headers"
            :items="filteredBarang"
            :items-per-page="10"
            class="elevation-1"
            :loading="isLoadingTable"
          >
            <template v-slot:item.kode="{ item }">
              <v-chip color="primary" size="small">{{ item.kode }}</v-chip>
            </template>
            <template v-slot:item.nama="{ item }">
              <strong>{{ item.nama }}</strong>
            </template>
            <template v-slot:item.kategori="{ item }">
              <v-chip color="secondary" size="small" variant="outlined">{{ item.kategori }}</v-chip>
            </template>
            <template v-slot:item.jumlah="{ item }">
              <v-chip :color="item.jumlah > 10 ? 'success' : item.jumlah > 5 ? 'warning' : 'error'" size="small">{{ item.jumlah }}</v-chip>
            </template>
            <template v-slot:item.satuan="{ item }">
              <v-chip color="info" size="small" variant="outlined">{{ item.satuan }}</v-chip>
            </template>
            <template v-slot:item.harga_beli="{ item }">
              <span class="text-green-600 font-semibold">Rp {{ formatRupiah(item.harga_beli) }}</span>
            </template>
            <template v-slot:item.harga_jual="{ item }">
              <span class="text-blue-600 font-semibold">Rp {{ formatRupiah(item.harga_jual) }}</span>
            </template>
            <template v-slot:item.aksi="{ item }">
              <v-btn icon size="small" color="primary" class="mr-1" @click="isiFormEdit(item)" :disabled="isLoading"><v-icon>mdi-pencil</v-icon></v-btn>
              <v-btn icon size="small" color="error" @click="hapusBarang(item._id)" :disabled="isLoading"><v-icon>mdi-delete</v-icon></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-container>
    </v-main>

    <!-- Dialog untuk Quick Add Satuan -->
    <v-dialog v-model="dialogSatuan" max-width="400px" persistent>
      <v-card>
        <v-card-title>Tambah Satuan Baru</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="satuanBaru"
            label="Nama Satuan"
            autofocus
            @keyup.enter="simpanSatuanBaru"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="dialogSatuan = false">Batal</v-btn>
          <v-btn color="primary" @click="simpanSatuanBaru">Simpan</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- [TAMBAHAN] Dialog untuk Manajemen Satuan (CRUD) -->
    <v-dialog v-model="dialogKelolaSatuan" max-width="600px">
        <v-card>
            <v-card-title>
                <span class="text-h5">Kelola Satuan</span>
            </v-card-title>
            <v-card-text>
                <v-form @submit.prevent="simpanFormSatuan">
                    <v-row align="center">
                        <v-col cols="8">
                            <v-text-field
                                v-model="formSatuan.nama"
                                label="Nama Satuan"
                                dense
                                hide-details
                            ></v-text-field>
                        </v-col>
                        <v-col cols="4">
                            <v-btn type="submit" color="primary">{{ isEditModeSatuan ? 'Update' : 'Tambah' }}</v-btn>
                        </v-col>
                    </v-row>
                </v-form>
                <v-divider class="my-4"></v-divider>
                <v-data-table
                    :headers="headersSatuan"
                    :items="satuanList"
                    density="compact"
                >
                    <template v-slot:item.aksi="{ item }">
                        <v-btn icon size="x-small" variant="text" @click="pilihSatuanUntukEdit(item)">
                            <v-icon color="primary">mdi-pencil</v-icon>
                        </v-btn>
                        <v-btn icon size="x-small" variant="text" @click="hapusSatuanCrud(item)">
                            <v-icon color="error">mdi-delete</v-icon>
                        </v-btn>
                    </template>
                </v-data-table>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue-darken-1" variant="text" @click="tutupDialogKelolaSatuan">Tutup</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

  </v-app>
</template>

<script>
import axios from 'axios';
import roleAccess from '@/helpers/roleAccess';

export default {
  data() {
    return {
      form: {
        _id: null,
        kode: '',
        nama: '',
        kategori: '',
        jumlah: 0,
        satuan: '',
        harga_beli: 0,
        harga_jual: 0
      },
      satuanList: [],
      barangList: [],
      search: '',
      isLoading: false,
      isLoadingTable: false,
      headers: [
        { title: 'Kode', key: 'kode', width: '120px' },
        { title: 'Nama Barang', key: 'nama', width: '200px' },
        { title: 'Kategori', key: 'kategori', width: '150px' },
        { title: 'Stok', key: 'jumlah', width: '100px' },
        { title: 'Satuan', key: 'satuan', width: '100px' },
        { title: 'Harga Beli', key: 'harga_beli', width: '130px' },
        { title: 'Harga Jual', key: 'harga_jual', width: '130px' },
        { title: 'Aksi', key: 'aksi', sortable: false, width: '120px' }
      ],
      // State untuk Quick Add Satuan
      dialogSatuan: false,
      satuanBaru: '',
      // [TAMBAHAN] State untuk Dialog Manajemen Satuan
      dialogKelolaSatuan: false,
      isEditModeSatuan: false,
      formSatuan: {
          _id: null,
          nama: ''
      },
      headersSatuan: [
          { title: 'Nama Satuan', key: 'nama' },
          { title: 'Aksi', key: 'aksi', sortable: false, align: 'end' }
      ]
    };
  },
  computed: {
    filteredBarang() {
      if (!this.search) {
        return this.barangList;
      }
      const keyword = this.search.trim().toLowerCase();
      return this.barangList.filter(item =>
        (item.nama && item.nama.toLowerCase().includes(keyword)) ||
        (item.kategori && item.kategori.toLowerCase().includes(keyword)) ||
        (item.kode && item.kode.toLowerCase().includes(keyword))
      );
    },
    loggedInUser() {
      return JSON.parse(localStorage.getItem('user'));
    }
  },
  methods: {
    async fetchBarang() {
      this.isLoadingTable = true;
      try {
        const res = await axios.get('/api/products');
        this.barangList = res.data;
      } catch (err) {
        console.error('Gagal mengambil data:', err);
        this.showAlert('error', 'Gagal mengambil data barang');
      } finally {
        this.isLoadingTable = false;
      }
    },
    async fetchSatuan() {
      try {
        const res = await axios.get('/api/satuan');
        this.satuanList = res.data;
      } catch (err) {
        console.error('Gagal mengambil data satuan:', err);
        this.showAlert('error', 'Gagal memuat daftar satuan');
      }
    },
    async simpanSatuanBaru() {
      if (!this.satuanBaru.trim()) {
        this.showAlert('error', 'Nama satuan tidak boleh kosong.');
        return;
      }
      try {
        const res = await axios.post('/api/satuan', { nama: this.satuanBaru });
        this.showAlert('success', `Satuan "${this.satuanBaru}" berhasil ditambahkan.`);
        this.dialogSatuan = false;
        this.satuanBaru = '';
        await this.fetchSatuan();
        this.form.satuan = res.data.nama;
      } catch (error) {
        const errorMessage = error.response?.data?.error || 'Gagal menyimpan satuan.';
        this.showAlert('error', errorMessage);
      }
    },
    async submitForm() {
      if (!this.validateForm()) {
        return;
      }
      this.isLoading = true;
      try {
        if (this.form._id) {
          const payload = { ...this.form, oleh: this.loggedInUser?.username || 'admin' };
          await axios.put(`/api/products/${this.form._id}`, payload);
          this.showAlert('success', 'Barang berhasil diperbarui');
        } else {
          const { _id, kode, ...payload } = { ...this.form, oleh: this.loggedInUser?.username || 'admin' };
          const res = await axios.post('/api/products', payload);
          this.showAlert('success', `Barang berhasil ditambahkan dengan kode: ${res.data.kode}`);
        }
        this.resetForm();
        this.fetchBarang();
      } catch (err) {
        const errorMessage = err.response?.data?.error || 'Terjadi kesalahan saat menyimpan data';
        this.showAlert('error', errorMessage);
      } finally {
        this.isLoading = false;
      }
    },
    async hapusBarang(id) {
      const barang = this.barangList.find(item => item._id === id);
      const namaBarang = barang ? barang.nama : 'barang ini';
      if (!confirm(`Yakin ingin menghapus "${namaBarang}"?`)) {
        return;
      }
      this.isLoading = true;
      try {
        await axios.delete(`/api/products/${id}`, {
          data: { oleh: this.loggedInUser?.username || 'admin' }
        });
        this.showAlert('success', `"${namaBarang}" berhasil dihapus`);
        this.fetchBarang();
      } catch (err) {
        console.error('Gagal menghapus barang:', err);
        this.showAlert('error', 'Gagal menghapus barang');
      } finally {
        this.isLoading = false;
      }
    },
    isiFormEdit(barang) {
      this.form = { ...barang };
    },
    resetForm() {
      this.form = {
        _id: null,
        kode: '',
        nama: '',
        kategori: '',
        jumlah: 0,
        satuan: '',
        harga_beli: 0,
        harga_jual: 0
      };
    },
    validateForm() {
      if (!this.form.nama.trim()) {
        this.showAlert('error', 'Nama barang harus diisi');
        return false;
      }
      if (!this.form.kategori.trim()) {
        this.showAlert('error', 'Kategori barang harus diisi');
        return false;
      }
      if (!this.form.satuan) {
        this.showAlert('error', 'Satuan barang harus dipilih');
        return false;
      }
      if (!this.form.jumlah || this.form.jumlah <= 0) {
        this.showAlert('error', 'Jumlah barang harus lebih dari 0');
        return false;
      }
      if (!this.form.harga_beli || this.form.harga_beli <= 0) {
        this.showAlert('error', 'Harga beli harus lebih dari 0');
        return false;
      }
      if (!this.form.harga_jual || this.form.harga_jual <= 0) {
        this.showAlert('error', 'Harga jual harus lebih dari 0');
        return false;
      }
      return true;
    },
    showAlert(type, message) {
      alert(message);
    },
    formatRupiah(value) {
      if (typeof value !== 'number' || isNaN(value)) return '0';
      return new Intl.NumberFormat('id-ID').format(value);
    },
    // [TAMBAHAN] Methods untuk Manajemen Satuan
    bukaDialogKelolaSatuan() {
        this.dialogKelolaSatuan = true;
    },
    tutupDialogKelolaSatuan() {
        this.dialogKelolaSatuan = false;
        this.isEditModeSatuan = false;
        this.formSatuan = { _id: null, nama: '' };
    },
    pilihSatuanUntukEdit(satuan) {
        this.isEditModeSatuan = true;
        this.formSatuan = { ...satuan };
    },
    async simpanFormSatuan() {
        if (!this.formSatuan.nama || !this.formSatuan.nama.trim()) {
            this.showAlert('error', 'Nama satuan tidak boleh kosong.');
            return;
        }
        try {
            if (this.isEditModeSatuan) {
                await axios.put(`/api/satuan/${this.formSatuan._id}`, { nama: this.formSatuan.nama });
                this.showAlert('success', 'Satuan berhasil diperbarui.');
            } else {
                await axios.post('/api/satuan', { nama: this.formSatuan.nama });
                this.showAlert('success', 'Satuan berhasil ditambahkan.');
            }
            this.fetchSatuan();
            this.isEditModeSatuan = false;
            this.formSatuan = { _id: null, nama: '' };
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Gagal menyimpan satuan.';
            this.showAlert('error', errorMessage);
        }
    },
    async hapusSatuanCrud(satuan) {
        if (confirm(`Yakin ingin menghapus satuan "${satuan.nama}"?`)) {
            try {
                await axios.delete(`/api/satuan/${satuan._id}`);
                this.showAlert('success', 'Satuan berhasil dihapus.');
                this.fetchSatuan();
            } catch (error) {
                this.showAlert('error', 'Gagal menghapus satuan.');
            }
        }
    }
  },
  mounted() {
    const user = JSON.parse(localStorage.getItem('user'));
    const role = user?.role?.toLowerCase();
    const akses = roleAccess[role];
    const currentPath = this.$route.path;
    if (!user || (akses !== '*' && !akses?.includes(currentPath))) {
      this.$router.push('/unauthorized');
    } else {
      this.fetchBarang();
      this.fetchSatuan();
    }
  }
};
</script>

<style scoped>
.v-data-table table,
.v-data-table th,
.v-data-table td {
  border: 1px solid #e0e0e0 !important;
}
.v-data-table th {
  font-weight: bold;
  background-color: #f5f5f5;
}
.v-data-table tbody tr:hover {
  background-color: #f0f0f0;
}
</style>
