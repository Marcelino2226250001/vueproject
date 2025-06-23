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
          <v-text-field v-model="form.kode" label="Kode Barang" outlined dense />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model="form.nama" label="Nama Barang" outlined dense />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model="form.kategori" label="Kategori" outlined dense />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model.number="form.jumlah" label="Jumlah" type="number" outlined dense />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model="form.satuan" label="Satuan" outlined dense />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model.number="form.harga_beli" label="Harga Beli" type="number" prefix="Rp" outlined dense />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model.number="form.harga_jual" label="Harga Jual" type="number" prefix="Rp" outlined dense />
        </v-col>
        <v-col cols="12">
          <v-btn color="primary" type="submit" class="me-2">
            {{ form._id ? 'Simpan Perubahan' : 'Tambah Barang' }}
          </v-btn>
          <v-btn v-if="form._id" color="grey" @click="resetForm">
            Batal
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
  </v-card-text>
</v-card>


        <v-card>
          <v-card-title>
            Data Barang
            <v-spacer />
            <v-text-field
              v-model="search"
              label="Cari barang..."
              class="w-50"
              density="compact"
              hide-details
              variant="outlined"
            />
          </v-card-title>

          <v-data-table
            :headers="headers"
            :items="filteredBarang"
            :items-per-page="5"
            class="elevation-1"
          >
            <template v-slot:item.aksi="{ item }">
              <v-btn icon @click="isiFormEdit(item)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon color="red" @click="hapusBarang(item._id)">
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
      barangList: [],
      search: '',
      headers: [
        { title: 'Kode', key: 'kode' },
        { title: 'Nama', key: 'nama' },
        { title: 'Kategori', key: 'kategori' },
        { title: 'Jumlah', key: 'jumlah' },
        { title: 'Satuan', key: 'satuan' },
        { title: 'Harga Beli', key: 'harga_beli' },
        { title: 'Harga Jual', key: 'harga_jual' },
        { title: 'Aksi', key: 'aksi', sortable: false }
      ]
    };
  },
  computed: {
    filteredBarang() {
      const keyword = this.search.trim().toLowerCase();
      return this.barangList.filter(item =>
        item.nama.toLowerCase().includes(keyword) ||
        item.kategori.toLowerCase().includes(keyword)
      );
    },
    loggedInUser() {
      return JSON.parse(localStorage.getItem('user'));
    }
  },
  methods: {
    async fetchBarang() {
      try {
        const res = await axios.get('/api/products');
        this.barangList = res.data;
      } catch (err) {
        console.error('Gagal mengambil data:', err);
      }
    },
    async submitForm() {
      if (
        !this.form.kode.trim() ||
        !this.form.nama.trim() ||
        !this.form.kategori.trim() ||
        this.form.jumlah <= 0 ||
        this.form.harga_beli <= 0 ||
        this.form.harga_jual <= 0
      ) {
        alert('Harap isi semua data barang dengan benar!');
        return;
      }

      const payload = { ...this.form, oleh: this.loggedInUser?.username || 'admin' };

      try {
        if (this.form._id) {
          await axios.put(`/api/products/${this.form._id}`, payload);
        } else {
          await axios.post('/api/products', payload);
        }

        this.resetForm();
        this.fetchBarang();
      } catch (err) {
        console.error('Gagal menyimpan barang:', err);
        alert('Terjadi kesalahan saat menyimpan data');
      }
    },
    async hapusBarang(id) {
      if (confirm('Yakin ingin menghapus barang ini?')) {
        try {
          await axios.delete(`/api/products/${id}`, {
            data: {
              oleh: this.loggedInUser?.username || 'admin'
            }
          });
          this.fetchBarang();
        } catch (err) {
          console.error('Gagal menghapus barang:', err);
        }
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
    }
  }
};
</script>

<style scoped>
.v-data-table table,
.v-data-table th,
.v-data-table td {
  border: 10px solid #000 !important; /* ⬅️ buat garis lebih tebal */
}

.v-data-table th {
  font-weight: bold;
}
</style>
