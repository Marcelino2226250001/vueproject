<template>
  <div>
    <h2>Manajemen Pelanggan</h2>

    <v-text-field
      v-model="search"
      label="Cari pelanggan (berdasarkan nama atau email)"
      class="mb-4"
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      dense
      clearable
    />

    <v-btn color="primary" @click="tambahPelangganBaru">+ Tambah Pelanggan</v-btn>

    <v-data-table
      :headers="headers"
      :items="filteredPelanggan"
      :search="search"
      class="elevation-1 mt-4"
    >
      <template v-slot:item.aksi="{ item }">
        <v-btn small icon color="primary" class="mr-2" @click="editPelanggan(item.raw)">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn small icon color="error" @click="hapusPelanggan(item.raw._id)">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <!-- [PERUBAHAN] Menggunakan v-form untuk validasi -->
    <v-dialog v-model="showForm" max-width="500px" persistent>
      <v-card>
        <v-card-title>{{ pelanggan._id ? 'Edit' : 'Tambah' }} Pelanggan</v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-text-field
              v-model="pelanggan.nama"
              label="Nama"
              :rules="rules.nama"
              required
            />
            <v-text-field
              v-model="pelanggan.no_telp"
              label="No. Telepon"
              type="number"
            />
            <v-text-field
              v-model="pelanggan.email"
              label="Email"
              :rules="rules.email"
            />
            <v-select
              v-model="pelanggan.jenis"
              :items="['Tetap']"
              label="Jenis"
              :rules="rules.jenis"
              required
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="tutupForm">Batal</v-btn>
          <v-btn color="primary" @click="simpanPelanggan">Simpan</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      pelangganList: [],
      pelanggan: {
        nama: '',
        no_telp: '',
        email: '',
        jenis: 'Tetap'
      },
      showForm: false,
      search: '',
      loggedInUser: JSON.parse(localStorage.getItem('user')) || null,
      headers: [
        { title: 'Nama', key: 'nama' },
        { title: 'No. Telp', key: 'no_telp' },
        { title: 'Email', key: 'email' },
        { title: 'Aksi', key: 'aksi', sortable: false },
      ],
      // [PERUBAHAN] Menambahkan rules untuk validasi
      rules: {
        nama: [
          v => !!v || 'Nama harus diisi.',
        ],
        email: [
          // Email tidak wajib diisi, tapi jika diisi, formatnya harus benar
          v => !v || /.+@.+\..+/.test(v) || 'Format E-mail tidak valid.',
        ],
        jenis: [
          v => !!v || 'Jenis pelanggan harus dipilih.',
        ],
      },
    };
  },
  computed: {
    filteredPelanggan() {
      // Pencarian sudah ditangani oleh v-data-table, ini untuk data awal
      return this.pelangganList;
    }
  },
  methods: {
    async getPelanggan() {
      try {
        const res = await axios.get('/api/pelanggan');
        this.pelangganList = res.data;
      } catch (err) {
        alert('Gagal memuat data pelanggan.');
      }
    },
    async simpanPelanggan() {
      // [PERUBAHAN] Validasi form sebelum submit
      const { valid } = await this.$refs.form.validate();
      if (!valid) {
        alert('Harap periksa kembali data yang Anda masukkan.');
        return;
      }

      const isEdit = !!this.pelanggan._id;
      const method = isEdit ? 'put' : 'post';
      const url = isEdit
        ? `/api/pelanggan/${this.pelanggan._id}`
        : '/api/pelanggan';

      const data = {
        ...this.pelanggan,
        oleh: this.loggedInUser?.username || 'admin'
      };

      try {
        await axios[method](url, data);
        const pesanAksi = isEdit ? 'diperbarui' : 'ditambahkan';
        alert(`Pelanggan berhasil ${pesanAksi}.`);

        this.getPelanggan();
        this.tutupForm();
      } catch (err) {
        const errorMessage = err.response?.data?.error || err.message;
        alert(`Gagal menyimpan pelanggan: ${errorMessage}`);
      }
    },
    tambahPelangganBaru() {
      this.resetForm();
      this.showForm = true;
    },
    editPelanggan(data) {
      this.pelanggan = { ...data };
      this.showForm = true;
    },
    async hapusPelanggan(id) {
      const pelanggan = this.pelangganList.find(p => p._id === id);
      if (confirm(`Yakin ingin menghapus pelanggan "${pelanggan.nama}"?`)) {
        try {
          await axios.delete(`/api/pelanggan/${id}`, {
            data: { oleh: this.loggedInUser?.username || 'admin' }
          });
          alert('Pelanggan berhasil dihapus.');
          this.getPelanggan();
        } catch (err) {
          alert('Gagal menghapus pelanggan: ' + err.message);
        }
      }
    },
    resetForm() {
      this.pelanggan = {
        nama: '',
        no_telp: '',
        email: '',
        jenis: 'Tetap'
      };
    },
    tutupForm() {
      this.showForm = false;
      this.resetForm();
      // Reset validasi form
      this.$nextTick(() => {
        this.$refs.form.resetValidation();
      });
    }
  },
  mounted() {
    this.getPelanggan();
  }
};
</script>
