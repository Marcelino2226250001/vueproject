<template>
  <div>
    <h2>Riwayat Penjualan</h2>

    <!--  Filter Tanggal -->
    <v-row dense class="mb-4">
      <v-col cols="12" md="4">
        <v-text-field
          type="date"
          v-model="filter.tanggalAwal"
          label="Dari Tanggal"
          outlined
          dense
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          type="date"
          v-model="filter.tanggalAkhir"
          label="Sampai Tanggal"
          outlined
          dense
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="4" class="d-flex justify-end align-end">
        <v-btn color="primary" @click="resetFilter" elevation="2" rounded>
          Reset Filter
        </v-btn>
      </v-col>
    </v-row>

    <!-- Tabel Riwayat -->
    <v-table class="mb-4">
      <thead>
        <tr>
          <th>Tanggal</th>
          <th>Pelanggan</th>
          <th>Total</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in riwayatTersaring" :key="item._id">
          <td>{{ formatTanggalLengkap(item.tanggal) }}</td>
          <td>{{ tampilkanNama(item) }}</td>
          <td>Rp {{ formatRupiah(item.total) }}</td>
          <td>
            <v-btn size="small" color="info" class="me-2" @click="lihatDetail(item)">Detail</v-btn>
            <v-btn size="small" color="success" class="me-2" @click="cetakNota(item)">Cetak</v-btn>
            <v-btn v-if="role !== 'sales'" size="small" color="error" @click="hapusRiwayat(item._id)">Hapus</v-btn>
          </td>
        </tr>
        <tr v-if="riwayatTersaring.length === 0">
          <td colspan="4">Tidak ada data penjualan</td>
        </tr>
      </tbody>
    </v-table>

    <!--  Modal Detail Transaksi  -->
    <v-dialog v-model="showModal" max-width="600">
      <v-card>
        <v-card-title class="text-h6">Detail Transaksi</v-card-title>
        <v-card-text v-if="selected">
          <p><strong>Tanggal:</strong> {{ formatTanggalLengkap(selected.tanggal) }}</p>
          <p><strong>Pelanggan:</strong> {{ tampilkanNama(selected) }}</p>

          <v-divider class="my-2" />
          <v-table density="compact">
            <thead>
              <tr>
                <th>Barang</th>
                <th>Jumlah</th>
                <th>Harga</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in selected.items" :key="i">
                <td>{{ item.nama_barang }}</td>
                <td>{{ item.jumlah }}</td>
                <td>Rp {{ formatRupiah(item.harga_jual) }}</td>
                <td>Rp {{ formatRupiah(item.subtotal) }}</td>
              </tr>
            </tbody>
          </v-table>
          <div class="text-right mt-4">
            <strong>Total: Rp {{ formatRupiah(selected.total) }}</strong>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="showModal = false">Tutup</v-btn>
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
      riwayat: [],
      showModal: false,
      selected: null,
      filter: {
        tanggalAwal: '',
        tanggalAkhir: ''
      },
      role: '',
      loggedInUser: null
    };
  },
  computed: {
    riwayatTersaring() {
      if (!this.filter.tanggalAwal && !this.filter.tanggalAkhir) {
        return this.riwayat;
      }

      const awal = this.filter.tanggalAwal ? new Date(this.filter.tanggalAwal + 'T00:00:00') : null;
      const akhir = this.filter.tanggalAkhir ? new Date(this.filter.tanggalAkhir + 'T23:59:59') : null;

      return this.riwayat.filter(item => {
        const tgl = new Date(item.tanggal);
        return (!awal || tgl >= awal) && (!akhir || tgl <= akhir);
      });
    }
  },
  methods: {
    async fetchRiwayat() {
      try {
        const res = await axios.get('http://localhost:3000/api/penjualan');
        this.riwayat = res.data;
      } catch (err) {
        console.error('Gagal fetch riwayat:', err);
      }
    },
    formatRupiah(val) {
      return val.toLocaleString('id-ID');
    },
    formatTanggalLengkap(tgl) {
      return new Date(tgl).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    lihatDetail(item) {
      this.selected = item;
      this.showModal = true;
    },
    resetFilter() {
      this.filter.tanggalAwal = '';
      this.filter.tanggalAkhir = '';
    },
    tampilkanNama(item) {
      if (item.pelanggan && item.pelanggan.nama) {
        return `${item.pelanggan.nama} (umum)`;
      } else if (item.pelanggan_id && item.pelanggan_id.nama) {
        return `${item.pelanggan_id.nama} (member)`;
      } else {
        return '(tidak diketahui)';
      }
    },
    getNama(item) {
      if (item.pelanggan && item.pelanggan.nama) {
        return `${item.pelanggan.nama} (umum)`;
      } else if (item.pelanggan_id && item.pelanggan_id.nama) {
        return `${item.pelanggan_id.nama} (member)`;
      } else {
        return '(tidak diketahui)';
      }
    },
    async cetakNota(item) {
      // Cetak nota terlebih dahulu
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
            <p><strong>Tanggal:</strong> ${this.formatTanggalLengkap(item.tanggal)}</p>
            <p><strong>Pelanggan:</strong> ${this.tampilkanNama(item)}</p>

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
                ${item.items.map(i => `
                  <tr>
                    <td>${i.nama_barang}</td>
                    <td>${i.jumlah}</td>
                    <td>Rp ${i.harga_jual.toLocaleString('id-ID')}</td>
                    <td>Rp ${i.subtotal.toLocaleString('id-ID')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <h3 style="text-align:right;">Total: Rp ${item.total.toLocaleString('id-ID')}</h3>

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

      // Catat aktivitas cetak untuk setiap item
      try {
        for (const itemBarang of item.items) {
          await axios.post('http://localhost:3000/api/log/aktivitas', {
            tanggal: new Date(),
            tipe: 'penjualan',
            kode: itemBarang.kode || '',
            nama_barang: itemBarang.nama_barang,
            aksi: 'cetak nota',
            oleh: this.loggedInUser?.username || 'user'
          });
        }
      } catch (err) {
        console.error('Gagal mencatat aktivitas cetak:', err);
      }
    },
    async hapusRiwayat(id) {
      if (confirm('Yakin ingin menghapus transaksi ini?')) {
        try {
          // Cari data transaksi sebelum dihapus untuk logging
          const transaksi = this.riwayat.find(item => item._id === id);

          // Hapus transaksi dari database
          await axios.delete(`http://localhost:3000/api/penjualan/${id}`);

          // Catat aktivitas hapus untuk setiap item dalam transaksi
          if (transaksi && transaksi.items) {
            for (const item of transaksi.items) {
              await axios.post('http://localhost:3000/api/log/aktivitas', {
                tanggal: new Date(),
                tipe: 'penjualan',
                kode: item.kode || '',
                nama_barang: item.nama_barang,
                aksi: 'hapus transaksi',
                oleh: this.loggedInUser?.username || 'user'
              });
            }
          }

          // Refresh data riwayat
          this.fetchRiwayat();
          alert('Transaksi berhasil dihapus');
        } catch (err) {
          console.error('Gagal menghapus riwayat:', err);
          alert('Gagal menghapus data');
        }
      }
    }
  },
  mounted() {
    this.fetchRiwayat();
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    this.role = user?.role?.toLowerCase() || '';
    this.loggedInUser = user; // Simpan data user untuk logging
  }
};
</script>

<style scoped>
.text-right {
  text-align: right;
}
</style>
