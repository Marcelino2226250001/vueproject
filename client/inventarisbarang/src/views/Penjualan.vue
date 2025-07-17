<template>
  <div>
    <h2>Transaksi Penjualan</h2>

    <!-- Bagian Pelanggan (Tidak ada perubahan) -->
    <v-card class="mb-4" flat outlined>
      <v-card-title>Pelanggan</v-card-title>
      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="pelanggan.nama"
              label="Nama Pelanggan"
              placeholder="Masukkan nama"
              outlined
              dense
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="pelanggan.status"
              :items="[
                { text: 'Umum', value: 'umum' },
                { text: 'Member', value: 'member' }
              ]"
              item-title="text"
              item-value="value"
              label="Tipe Pelanggan"
              outlined
              dense
            ></v-select>
          </v-col>
        </v-row>
        <v-row dense v-if="pelanggan.status === 'member'">
          <v-col cols="12" md="6">
            <v-autocomplete
              v-model="pelangganTetapDipilih"
              :items="pelangganList"
              item-title="nama"
              item-value="_id"
              label="Pilih Pelanggan Tetap"
              outlined
              dense
              @change="isiDataPelanggan"
            ></v-autocomplete>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Bagian Tambah Barang (Tidak ada perubahan) -->
    <v-card class="mb-4" flat outlined>
      <v-card-title>Tambah Barang</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="8">
            <v-autocomplete
              v-model="barangDipilih"
              :items="barangList"
              :item-title="item => `${item.kode} - ${item.nama}`"
              return-object
              label="Cari Barang (berdasarkan Kode atau Nama)"
              placeholder="Ketik untuk mencari..."
              outlined
              dense
              no-data-text="Barang tidak ditemukan"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props" :title="null">
                  <v-list-item-title>{{ item.raw.nama }} ({{ item.raw.kode }})</v-list-item-title>
                  <v-list-item-subtitle>
                    Stok: {{ item.raw.jumlah }} | Harga: Rp {{ formatRupiah(item.raw.harga_jual) }}
                  </v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-autocomplete>
          </v-col>
          <v-col cols="12" md="4">
            <v-btn color="primary" class="mt-2" @click="tambahBarang" :disabled="!barangDipilih">
              Tambah ke Daftar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Bagian Barang yang Dibeli (Tidak ada perubahan) -->
    <v-card flat outlined>
      <v-card-title>Barang yang Dibeli</v-card-title>
      <v-card-text>
        <v-table dense>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Harga Jual</th>
              <th>Jumlah</th>
              <th>Subtotal</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in items" :key="index">
              <td>{{ item.nama_barang }}</td>
              <td>Rp {{ formatRupiah(item.harga_jual) }}</td>
              <td>
                <v-text-field
                  v-model.number="item.jumlah"
                  type="number"
                  min="1"
                  dense
                  outlined
                  @input="updateSubtotal(index)"
                />
              </td>
              <td>Rp {{ formatRupiah(item.subtotal) }}</td>
              <td>
                <v-btn color="error" size="small" @click="hapusItem(index)">Hapus</v-btn>
              </td>
            </tr>
            <tr v-if="items.length === 0">
              <td colspan="5" class="text-center">Belum ada barang</td>
            </tr>
          </tbody>
        </v-table>
        <div class="text-right mt-4">
          <strong>Total: Rp {{ formatRupiah(total) }}</strong>
        </div>
      </v-card-text>
    </v-card>

    <!-- [PERUBAHAN] Bagian Tombol Simpan dan Batal -->
    <v-card class="mt-6" flat>
      <v-card-text class="text-center">
        <v-btn
          color="warning"
          size="large"
          variant="outlined"
          rounded
          class="mx-2"
          @click="konfirmasiBatal"
          :disabled="items.length === 0 && !pelanggan.nama && !pelangganTetapDipilih"
        >
          Batal Transaksi
        </v-btn>
        <v-btn
          color="success"
          size="large"
          elevation="3"
          rounded
          class="mx-2"
          @click="simpanPenjualan"
          :disabled="items.length === 0"
        >
          Simpan Transaksi
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- [TAMBAHAN] Dialog Konfirmasi Batal Transaksi -->
    <v-dialog v-model="dialogBatal" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h5">Konfirmasi Pembatalan</v-card-title>
        <v-card-text>
          Apakah Anda yakin ingin membatalkan transaksi ini? Semua barang yang telah ditambahkan akan dihapus.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="dialogBatal = false">Tidak</v-btn>
          <v-btn color="warning darken-1" text @click="eksekusiBatal">Ya, Batalkan</v-btn>
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
      pelanggan_id: '',
      pelangganList: [],
      pelangganTetapDipilih: '',
      pelanggan: { nama: '', status: 'umum' },
      barangList: [],
      barangDipilih: null,
      items: [],
      dialogBatal: false, // [TAMBAHAN] State untuk dialog
    };
  },
  computed: {
    total() {
      return this.items.reduce((acc, item) => acc + item.subtotal, 0);
    }
  },
  methods: {
    async fetchBarang() {
      try {
        const res = await axios.get('/api/products');
        this.barangList = res.data;
      } catch (err) {
        console.error('Gagal mengambil data barang:', err);
      }
    },
    async fetchPelanggan() {
      const res = await axios.get('/api/pelanggan');
      this.pelangganList = res.data;
    },
    isiDataPelanggan() {
      const p = this.pelangganList.find(x => x._id === this.pelangganTetapDipilih);
      if (p) {
        this.pelanggan.nama = p.nama;
        this.pelanggan.status = p.status;
      }
    },
    tambahBarang() {
      if (!this.barangDipilih) return;

      const barang = { ...this.barangDipilih };
      const sudahAda = this.items.find(i => i.kode === barang.kode);

      if (sudahAda) {
        alert('Barang sudah ditambahkan ke transaksi.');
        return;
      }

      if (barang.jumlah <= 0) {
        alert(`Stok barang "${barang.nama}" habis.`);
        return;
      }

      this.items.push({
        kode: barang.kode,
        nama_barang: barang.nama,
        jumlah: 1,
        stok: barang.jumlah,
        harga_jual: barang.harga_jual,
        subtotal: barang.harga_jual
      });

      this.barangDipilih = null;
    },
    updateSubtotal(index) {
      const item = this.items[index];
      if (!item.jumlah || item.jumlah <= 0) {
        item.subtotal = 0;
        return;
      }
      if (item.jumlah > item.stok) {
        item.jumlah = item.stok;
        alert(`Jumlah melebihi stok. Maksimal: ${item.stok}`);
      }
      item.subtotal = item.jumlah * item.harga_jual;
    },
    hapusItem(index) {
      this.items.splice(index, 1);
    },
    async simpanPenjualan() {
      if (this.pelanggan.status === 'umum' && !this.pelanggan.nama) {
        alert("Nama pelanggan belum diisi!");
        return;
      }
      if (this.pelanggan.status === 'member' && !this.pelangganTetapDipilih) {
        alert("Pelanggan tetap belum dipilih!");
        return;
      }
      if (this.items.length === 0) {
        alert('Belum ada barang yang ditambahkan!');
        return;
      }
      for (const item of this.items) {
        if (!item.jumlah || item.jumlah <= 0) {
          alert(`Jumlah barang "${item.nama_barang}" belum diisi atau tidak valid.`);
          return;
        }
      }
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const payload = {
          tanggal: new Date(),
          pelanggan: this.pelanggan.status === 'umum' ? this.pelanggan : null,
          pelanggan_id: this.pelanggan.status === 'member' ? this.pelangganTetapDipilih : null,
          items: this.items,
          total: this.total,
          oleh: user?.username || 'Tidak Diketahui'
        };
        await axios.post('/api/penjualan', payload);
        alert('Transaksi berhasil disimpan!');
        this.resetForm();
      } catch (err) {
        console.error('Gagal menyimpan penjualan:', err);
        alert('Gagal menyimpan transaksi');
      }
    },
    resetForm() {
      this.pelanggan = { nama: '', status: 'umum' };
      this.items = [];
      this.barangDipilih = null;
      this.pelangganTetapDipilih = '';
    },
    formatRupiah(angka) {
        if (typeof angka !== 'number') {
            return '0';
        }
        return angka.toLocaleString('id-ID');
    },
    // [TAMBAHAN] Method untuk konfirmasi pembatalan
    konfirmasiBatal() {
      this.dialogBatal = true;
    },
    // [TAMBAHAN] Method untuk eksekusi pembatalan setelah konfirmasi
    eksekusiBatal() {
      this.resetForm();
      this.dialogBatal = false;
    },
    cetakNota() {
      // ... (kode cetak nota Anda tidak berubah) ...
    }
  },
  mounted() {
    this.fetchBarang();
    this.fetchPelanggan();
  }
};
</script>

<style scoped>
.form-section {
  margin-bottom: 12px;
}
input, select {
  padding: 6px;
  margin-right: 8px;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}
th, td {
  border: 1px solid #ccc;
  padding: 6px;
}
.v-btn {
  text-transform: none;
}
th {
  background-color: #f0f0f0;
}
</style>
