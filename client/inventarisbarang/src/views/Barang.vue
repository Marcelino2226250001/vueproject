<template>
  <v-app>
    <v-main>
      <v-container>

       <v-card class="mb-4" elevation="2">
  <v-card-title>{{ form._id ? 'Edit Barang' : 'Tambah Barang Baru' }}</v-card-title>
  <v-card-text>
    <v-form @submit.prevent="submitForm">
      <v-row dense>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="form.nama"
            label="Nama Barang"
            outlined
            dense
            required
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="form.kategori"
            label="Kategori"
            outlined
            dense
            required
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model.number="form.jumlah"
            label="Jumlah"
            type="number"
            outlined
            dense
            min="1"
            required
          />
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
/>
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model.number="form.harga_beli"
            label="Harga Beli"
            type="number"
            prefix="Rp"
            outlined
            dense
            min="1"
            required
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model.number="form.harga_jual"
            label="Harga Jual"
            type="number"
            prefix="Rp"
            outlined
            dense
            min="1"
            required
          />
        </v-col>
        <v-col cols="12">
          <v-btn
            color="primary"
            type="submit"
            class="me-2"
            :loading="isLoading"
            :disabled="isLoading"
          >
            {{ form._id ? 'Simpan Perubahan' : 'Tambah Barang' }}
          </v-btn>
          <v-btn
            v-if="form._id"
            color="grey"
            @click="resetForm"
            :disabled="isLoading"
          >
            Batal
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
  </v-card-text>
</v-card>

        <v-card>
          <v-card-title>
            <v-row align="center">
              <v-col cols="12" md="6">
                <h3 class="text-h6">Data Barang</h3>
                <p class="text-caption text-grey-600 mb-0">
                  Total: {{ filteredBarang.length }} barang
                </p>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="search"
                  label="Cari barang, kode, kategori..."
                  prepend-inner-icon="mdi-magnify"
                  density="compact"
                  hide-details
                  variant="outlined"
                  clearable
                />
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
              <v-chip color="primary" size="small">
                {{ item.kode }}
              </v-chip>
            </template>
            <template v-slot:item.nama="{ item }">
              <strong>{{ item.nama }}</strong>
            </template>
            <template v-slot:item.kategori="{ item }">
              <v-chip color="secondary" size="small" variant="outlined">
                {{ item.kategori }}
              </v-chip>
            </template>
            <template v-slot:item.jumlah="{ item }">
              <v-chip
                :color="item.jumlah > 10 ? 'success' : item.jumlah > 5 ? 'warning' : 'error'"
                size="small"
              >
                {{ item.jumlah }}
              </v-chip>
            </template>
             <template v-slot:item.satuan="{ item }">
              <v-chip color="secondary" size="small" variant="outlined">
                {{ item.satuan }}
              </v-chip>
            </template>
            <template v-slot:item.harga_beli="{ item }">
              <span class="text-green-600 font-semibold">
                Rp {{ formatRupiah(item.harga_beli) }}
              </span>
            </template>
            <template v-slot:item.harga_jual="{ item }">
              <span class="text-blue-600 font-semibold">
                Rp {{ formatRupiah(item.harga_jual) }}
              </span>
            </template>
            <template v-slot:item.aksi="{ item }">
              <v-btn
                icon
                size="small"
                color="primary"
                @click="isiFormEdit(item)"
                :disabled="isLoading"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                icon
                size="small"
                color="error"
                @click="hapusBarang(item._id)"
                :disabled="isLoading"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card>

      </v-container>
    </v-main>
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
        { title: 'Stok', key: 'jumlah', width: '120px' },
        { title: 'Satuan', key: 'satuan', width: '100px' },
        { title: 'Harga Beli', key: 'harga_beli', width: '130px' },
        { title: 'Harga Jual', key: 'harga_jual', width: '130px' },
        { title: 'Aksi', key: 'aksi', sortable: false, width: '100px' }
      ]
    };
  },
  computed: {
    filteredBarang() {
      const keyword = this.search.trim().toLowerCase();
      return this.barangList.filter(item =>
        item.nama.toLowerCase().includes(keyword) ||
        item.kategori.toLowerCase().includes(keyword) ||
        item.kode.toLowerCase().includes(keyword)
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

    async submitForm() {
  // Validasi form
  if (!this.validateForm()) {
    return;
  }

  this.isLoading = true;

  try {
    if (this.form._id) {
      // Update barang - kirim semua data termasuk kode
      const payload = {
        ...this.form,
        oleh: this.loggedInUser?.username || 'admin'
      };

      console.log('=== UPDATE PAYLOAD ===');
      console.log('Payload untuk update:', payload);

      await axios.put(`/api/products/${this.form._id}`, payload);
      this.showAlert('success', 'Barang berhasil diperbarui');
    } else {
      // Tambah barang baru - JANGAN kirim kode sama sekali
      // Tambah barang baru
const payload = {
  nama: this.form.nama,
  kategori: this.form.kategori,
  jumlah: this.form.jumlah,
  satuan: this.form.satuan,
  harga_beli: this.form.harga_beli,
  harga_jual: this.form.harga_jual,
  oleh: this.loggedInUser?.username || 'admin'
};


      console.log('=== CREATE PAYLOAD ===');
      console.log('Payload untuk create:', payload);
      console.log('Payload tidak mengandung kode:', !payload.hasOwnProperty('kode'));

      const res = await axios.post('/api/products', payload);

      console.log('=== RESPONSE FROM SERVER ===');
      console.log('Response:', res.data);
      console.log('Generated kode:', res.data.kode);

      this.showAlert('success', `Barang berhasil ditambahkan dengan kode: ${res.data.kode}`);
    }

    this.resetForm();
    this.fetchBarang();
  } catch (err) {
    console.error('=== ERROR SUBMIT FORM ===');
    console.error('Error:', err);
    console.error('Response data:', err.response?.data);

    const errorMessage = err.response?.data?.error || 'Terjadi kesalahan saat menyimpan data';
    this.showAlert('error', errorMessage);
  } finally {
    this.isLoading = false;
  }
},

    async hapusBarang(id) {
      // Cari nama barang untuk konfirmasi
      const barang = this.barangList.find(item => item._id === id);
      const namaBarang = barang ? barang.nama : 'barang ini';

      if (!confirm(`Yakin ingin menghapus "${namaBarang}"?`)) {
        return;
      }

      this.isLoading = true;
      try {
        await axios.delete(`/api/products/${id}`, {
          data: {
            oleh: this.loggedInUser?.username || 'admin'
          }
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
    kode: '', // Kosongkan kode di form
    nama: '',
    kategori: '',
    jumlah: 0,
    satuan: '',
    harga_beli: 0,
    harga_jual: 0
  };
  console.log('Form direset:', this.form);
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

      if (!this.form.satuan.trim()) {
        this.showAlert('error', 'Satuan barang harus diisi');
        return false;
      }

      if (this.form.jumlah <= 0) {
        this.showAlert('error', 'Jumlah barang harus lebih dari 0');
        return false;
      }

      if (this.form.harga_beli <= 0) {
        this.showAlert('error', 'Harga beli harus lebih dari 0');
        return false;
      }

      if (this.form.harga_jual <= 0) {
        this.showAlert('error', 'Harga jual harus lebih dari 0');
        return false;
      }

      return true;
    },

    showAlert(type, message) {
      // Gunakan snackbar atau alert sesuai dengan UI library yang Anda gunakan
      alert(message);
    },

    formatRupiah(value) {
      return new Intl.NumberFormat('id-ID').format(value);
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
