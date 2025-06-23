<template>
  <div>
    <h2>Transaksi Penjualan</h2>



    <!-- FORM PELANGGAN -->
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


    <!-- FORM TAMBAH BARANG -->
    <v-card class="mb-4" flat outlined>
      <v-card-title>Tambah Barang</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="8">
            <v-select
              v-model="barangDipilih"
              :items="barangList"
              item-title="nama"
              return-object
              label="Pilih Barang dari Stok"
              outlined
              dense
            ></v-select>
          </v-col>
          <v-col cols="12" md="4">
            <v-btn color="primary" class="mt-2" @click="tambahBarang" :disabled="!barangDipilih">
              Tambah ke Daftar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- TABEL TRANSAKSI -->
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

    <!-- TOMBOL AKSI -->
    <v-card class="mt-6" flat>
      <v-card-text class="text-center">
        <v-btn
          color="success"
          size="large"
          elevation="3"
          rounded
          class="mx-2"
          @click="simpanPenjualan"
        >
          Simpan Transaksi
        </v-btn>
      </v-card-text>
    </v-card>
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
      barangDipilih: '',
      items: []
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
        jumlah: null,
        stok: barang.jumlah,
        harga_jual: barang.harga_jual,
        subtotal: barang.harga_jual
      });

      this.barangDipilih = '';
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
  // Validasi nama pelanggan jika UMUM
  if (this.pelanggan.status === 'umum' && !this.pelanggan.nama) {
    alert("Nama pelanggan belum diisi!");
    return;
  }

  // Validasi pelanggan tetap
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
}
,
    resetForm() {
      this.pelanggan = { nama: '', status: 'umum' };
      this.items = [];
      this.barangDipilih = '';
       this.pelangganTetapDipilih = '';
    },
    formatRupiah(angka) {
      return angka.toLocaleString('id-ID');
    },
    cetakNota() {
      const notaWindow = window.open('', '_blank');
      const htmlContent = `
        <html>
          <head>
            <title>Nota Penjualan</title>
            <style>
              body { font-family: sans-serif; padding: 20px; }
              h2, h3, h4 { text-align: center; margin: 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 12px; }
              th, td { border: 1px solid #999; padding: 6px; text-align: left; }
              .logo { text-align: center; margin-bottom: 16px; }
            </style>
          </head>
          <body>
            <div class="logo">
              <img src="${window.location.origin}/logo.png" alt="Logo" width="100" />
              <h2>Sukses Jaya Bersama</h2>
              <p>Jl. Letnan Jaimas Lr. Langgar No.749</p>
            </div>

            <h3>Nota Penjualan</h3>
            <p><strong>Tanggal:</strong> ${new Date().toLocaleString('id-ID')}</p>
            <p><strong>Pelanggan:</strong> ${this.pelanggan.nama} (${this.pelanggan.status})</p>

            <table>
              <thead>
                <tr>
                  <th>Barang</th>
                  <th>Jumlah</th>
                  <th>Harga</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${this.items.map(i => `
                  <tr>
                    <td>${i.nama_barang}</td>
                    <td>${i.jumlah}</td>
                    <td>Rp ${i.harga_jual.toLocaleString('id-ID')}</td>
                    <td>Rp ${i.subtotal.toLocaleString('id-ID')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <h3 style="text-align:right;">Total: Rp ${this.total.toLocaleString('id-ID')}</h3>
            <p style="margin-top:40px; text-align:center;">Terima kasih telah berbelanja.</p>

            <script>
              window.onload = function() {
                window.print();
              }
            <\/script>
          </body>
        </html>
      `;
      notaWindow.document.write(htmlContent);
      notaWindow.document.close();
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
