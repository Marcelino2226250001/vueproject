<template>
  <div>
    <h2>Manajemen Pelanggan</h2>

    <v-text-field
      v-model="search"
      label="Cari pelanggan"
      class="mb-4"
    />

    <v-btn color="primary" @click="showForm = true">+ Tambah Pelanggan</v-btn>

    <v-table>
      <thead>
        <tr>
          <th>Nama</th>
          <th>No. Telp</th>
          <th>Email</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in filteredPelanggan" :key="p._id">
          <td>{{ p.nama }}</td>
          <td>{{ p.no_telp }}</td>
          <td>{{ p.email }}</td>
          <td>
            <v-btn small @click="editPelanggan(p)">Edit</v-btn>
            <v-btn small color="error" @click="hapusPelanggan(p._id)">Hapus</v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- Form Tambah/Edit -->
    <v-dialog v-model="showForm" max-width="500px">
      <v-card>
        <v-card-title>{{ pelanggan._id ? 'Edit' : 'Tambah' }} Pelanggan</v-card-title>
        <v-card-text>
          <v-text-field v-model="pelanggan.nama" label="Nama" />
          <v-text-field v-model="pelanggan.no_telp" label="No. Telepon" />
          <v-text-field v-model="pelanggan.email" label="Email" />
          <v-select v-model="pelanggan.jenis" :items="['Tetap']" label="Jenis" />
        </v-card-text>
        <v-card-actions>
          <v-btn color="success" @click="simpanPelanggan">Simpan</v-btn>
          <v-btn text @click="showForm = false">Batal</v-btn>
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
      loggedInUser: JSON.parse(localStorage.getItem('user')) || null // untuk log pengguna
    };
  },
  computed: {
    filteredPelanggan() {
      return this.pelangganList.filter(p =>
        p.nama.toLowerCase().includes(this.search.toLowerCase()) ||
        p.email.toLowerCase().includes(this.search.toLowerCase())
      );
    }
  },
  methods: {
    async getPelanggan() {
      const res = await axios.get('/api/pelanggan');
      this.pelangganList = res.data;
    },
    simpanPelanggan() {
  const isEdit = !!this.pelanggan._id;
  const method = isEdit ? 'put' : 'post';
  const url = isEdit
    ? `/api/pelanggan/${this.pelanggan._id}`
    : '/api/pelanggan';

  const data = {
    ...this.pelanggan,
    oleh: this.loggedInUser?.username || 'admin' // kirim "oleh" ke backend
  };

  axios[method](url, data)
    .then(() => {
      const tipeLog = isEdit ? 'edit' : 'tambah';
      const keterangan = isEdit
        ? `Mengedit data pelanggan: ${this.pelanggan.nama}`
        : `Menambahkan pelanggan baru: ${this.pelanggan.nama}`;

      // Kirim log ke log aktivitas (optional, jika masih ingin tetap pakai frontend log juga)
      axios.post('/api/log/aktivitas', {
        tanggal: new Date(),
        tipe: tipeLog,
        pengguna: this.loggedInUser?.username || 'admin',
        target: 'pelanggan',
        nama_item: this.pelanggan.nama,
        keterangan
      });

      this.getPelanggan();
      this.showForm = false;
      this.resetForm();
    })
    .catch(err => {
      alert('Gagal menyimpan pelanggan: ' + err.message);
    });
},


    editPelanggan(data) {
      this.pelanggan = { ...data };
      this.showForm = true;
    },
   hapusPelanggan(id) {
  const pelanggan = this.pelangganList.find(p => p._id === id);
  if (confirm('Yakin ingin menghapus pelanggan ini?')) {
    axios.delete(`/api/pelanggan/${id}`, {
      data: {
        oleh: this.loggedInUser?.username || 'admin' // kirim ke backend
      }
    })
    .then(() => {
      // Kirim log frontend (optional)
      axios.post('/api/log/aktivitas', {
        tanggal: new Date(),
        tipe: 'hapus',
        pengguna: this.loggedInUser?.username || 'admin',
        target: 'pelanggan',
        nama_item: pelanggan?.nama || 'Tidak diketahui',
        keterangan: `Menghapus pelanggan: ${pelanggan?.nama || id}`
      });

      this.getPelanggan();
    })
    .catch(err => {
      alert('Gagal menghapus pelanggan: ' + err.message);
    });
  }
}

,
    resetForm() {
      this.pelanggan = {
        nama: '',
        no_telp: '',
        email: '',
        jenis: 'Tetap'
      };
    }
  },
  mounted() {
    this.getPelanggan();
  }
};
</script>
