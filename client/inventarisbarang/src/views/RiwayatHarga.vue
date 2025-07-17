<template>
  <v-container>
    <v-card>
      <v-card-title>
        Riwayat Perubahan Harga
        <v-spacer></v-spacer>
        <span class="ml-2 text-caption text-grey">
          Total: {{ historyList.length }} catatan
        </span>
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="historyList"
        :items-per-page="10"
        class="elevation-1"
        :loading="isLoading"
      >
        <template v-slot:item.createdAt="{ item }">
          {{ new Date(item.createdAt).toLocaleString('id-ID') }}
        </template>
        <template v-slot:item.harga_beli_lama="{ item }">
          <span class="text-grey">Rp {{ formatRupiah(item.harga_beli_lama) }}</span>
        </template>
        <template v-slot:item.harga_beli_baru="{ item }">
          <strong class="text-success">Rp {{ formatRupiah(item.harga_beli_baru) }}</strong>
        </template>
        <template v-slot:item.harga_jual_lama="{ item }">
          <span class="text-grey">Rp {{ formatRupiah(item.harga_jual_lama) }}</span>
        </template>
        <template v-slot:item.harga_jual_baru="{ item }">
          <strong class="text-primary">Rp {{ formatRupiah(item.harga_jual_baru) }}</strong>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      historyList: [],
      isLoading: false,
      headers: [
        { title: 'Tanggal Perubahan', key: 'createdAt' },
        { title: 'Kode Barang', key: 'kode_barang' },
        { title: 'Harga Beli Lama', key: 'harga_beli_lama', align: 'end' },
        { title: 'Harga Beli Baru', key: 'harga_beli_baru', align: 'end' },
        { title: 'Harga Jual Lama', key: 'harga_jual_lama', align: 'end' },
        { title: 'Harga Jual Baru', key: 'harga_jual_baru', align: 'end' },
        { title: 'Diubah Oleh', key: 'oleh' },
      ],
    };
  },
  methods: {
    async fetchPriceHistory() {
      this.isLoading = true;
      try {
        const res = await axios.get('/api/riwayatharga');
        this.historyList = res.data;
      } catch (err) {
        console.error('Gagal mengambil riwayat harga:', err);
        alert('Gagal mengambil data riwayat harga');
      } finally {
        this.isLoading = false;
      }
    },
    formatRupiah(value) {
      return new Intl.NumberFormat('id-ID').format(value);
    }
  },
  mounted() {
    this.fetchPriceHistory();
  },
};
</script>
