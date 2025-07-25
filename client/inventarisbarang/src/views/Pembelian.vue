<template>
  <div>
    <h2>Transaksi Pembelian</h2>

    <v-card class="mb-4" flat outlined>
      <v-card-title>Informasi Supplier</v-card-title>
      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="6">
            <v-select
              v-model="supplier"
              :items="supplierList"
              label="Pilih Nama Supplier"
              outlined
              dense
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card class="mb-4" flat outlined>
      <v-card-title>Tambah Barang dari Supply</v-card-title>
      <v-card-text>
        <v-row>
          <!-- [PERUBAHAN] Mengganti v-select menjadi v-autocomplete -->
          <v-col cols="12" md="6">
            <v-autocomplete
              v-model="supplyDipilih"
              :items="filteredSupplyList"
              :item-title="item => `${item.kode_barang} - ${item.nama_barang}`"
              return-object
              label="Cari Barang dari Supply (Kode atau Nama)"
              placeholder="Ketik untuk mencari..."
              outlined
              dense
              no-data-text="Barang tidak ditemukan untuk supplier ini"
              :disabled="!supplier"
            >
              <!-- [TAMBAHAN] Tampilan daftar yang lebih informatif -->
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props" :title="null">
                  <v-list-item-title>{{ item.raw.nama_barang }} ({{ item.raw.kode_barang }})</v-list-item-title>
                  <v-list-item-subtitle>
                    Harga Beli: Rp {{ formatRupiah(item.raw.harga) }}
                  </v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-autocomplete>
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field
              v-model="harga_beli"
              label="Harga Beli"
              prefix="Rp"
              type="number"
              outlined
              dense
            ></v-text-field>
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field
              v-model.number="jumlah"
              type="number"
              label="Jumlah"
              min="1"
              outlined
              dense
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-btn class="mt-2" color="primary" @click="tambahBarang">Tambah</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card flat outlined>
      <v-card-title>Daftar Barang Dibeli</v-card-title>
      <v-card-text>
        <v-table dense>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Jumlah</th>
              <th>Harga Beli</th>
              <th>Subtotal</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in items" :key="i">
              <td>{{ item.nama_barang }}</td>
              <td>{{ item.jumlah }}</td>
              <td>Rp {{ formatRupiah(item.harga_beli) }}</td>
              <td>Rp {{ formatRupiah(item.subtotal) }}</td>
              <td>
                <v-btn color="red" size="small" @click="hapusItem(i)">Hapus</v-btn>
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

    <v-card class="mt-6" flat>
      <v-card-text class="text-center">
        <v-btn color="success" size="large" elevation="3" rounded @click="simpanPembelian">
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
      supplier: '',
      supplierList: [],
      supplyList: [],
      supplyDipilih: null, // [PERUBAHAN] Diubah ke null
      harga_beli: null,
      jumlah: 1,
      items: []
    };
  },
  computed: {
    total() {
      return this.items.reduce((acc, item) => acc + item.subtotal, 0);
    },
    filteredSupplyList() {
      if (!this.supplier) return [];
      return this.supplyList.filter(item => item.supplier === this.supplier);
    }
  },
  methods: {
    async fetchSupply() {
      try {
        const res = await axios.get('/api/supply');
        this.supplyList = res.data;
        // Ambil daftar supplier unik dari data supply
        this.supplierList = [...new Set(res.data.map(item => item.supplier))].filter(Boolean);
      } catch (err) {
        console.error('Gagal fetch supply:', err);
      }
    },
    tambahBarang() {
      if (!this.supplyDipilih || !this.jumlah || !this.harga_beli) {
        alert('Pilih barang dan isi jumlah serta harga beli');
        return;
      }
      this.items.push({
        kode: this.supplyDipilih.kode_barang,
        nama_barang: this.supplyDipilih.nama_barang,
        jumlah: this.jumlah,
        harga_beli: this.harga_beli,
        subtotal: this.jumlah * this.harga_beli
      });
      // Reset form input
      this.supplyDipilih = null;
      this.jumlah = 1;
      this.harga_beli = null;
    },
    hapusItem(index) {
      this.items.splice(index, 1);
    },
    async simpanPembelian() {
      if (!this.supplier || this.items.length === 0) {
        alert('Isi data supplier dan barang terlebih dahulu!');
        return;
      }
      const user = JSON.parse(localStorage.getItem('user'));
      const payload = {
        tanggal: new Date(),
        supplier: this.supplier,
        items: this.items,
        total: this.total,
        oleh: user?.username || 'Tidak Diketahui'
      };
      try {
        await axios.post('/api/pembelian', payload);
        alert('Pembelian berhasil disimpan');
        this.resetForm();
      } catch (err) {
        console.error('Gagal simpan pembelian:', err);
        alert('Gagal menyimpan pembelian');
      }
    },
    resetForm() {
      this.supplier = '';
      this.items = [];
      this.supplyDipilih = null;
      this.jumlah = 1;
      this.harga_beli = null;
    },
    formatRupiah(angka) {
      if (typeof angka !== 'number' || isNaN(angka)) {
        return '0';
      }
      return angka.toLocaleString('id-ID');
    }
  },
  mounted() {
    this.fetchSupply();
  },
  watch: {
    supplyDipilih(newVal) {
      if (newVal && newVal.harga) {
        this.harga_beli = newVal.harga;
      }
    },
    // [TAMBAHAN] Jika supplier diganti, reset pilihan barang
    supplier() {
        this.supplyDipilih = null;
        this.harga_beli = null;
    }
  },
};
</script>

<style scoped>
.text-right {
  text-align: right;
}
</style>
