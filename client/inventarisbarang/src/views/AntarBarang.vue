<template>
  <div class="pa-4">
    <h2 class="mb-4">Daftar Penjualan Siap Kirim</h2>

    <v-table v-if="penjualan.length">
      <thead>
        <tr>
          <th>No</th>
          <th>Tanggal</th>
          <th>Pelanggan</th>
          <th>Total</th>
          <th>Status Pengiriman</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(pj, index) in penjualan" :key="pj._id">
          <td>{{ index + 1 }}</td>
          <td>{{ formatTanggal(pj.tanggal) }}</td>
          <td>{{ pj.pelanggan.nama }}</td>
          <td>Rp {{ pj.total.toLocaleString() }}</td>
          <td>{{ pj.status_pengiriman }}</td>
          <td class="d-flex align-center">
            <v-select
              v-model="pj.newStatus"
              :items="['Dalam Perjalanan', 'Terkirim']"
              dense
              label="Pilih Status"
              hide-details
              style="max-width: 180px"
            />
            <v-btn
              class="ml-2"
              color="primary"
              @click="updateStatus(pj)"
              size="small"
            >
              Ubah
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-alert v-else type="info" border="start" prominent>
      Tidak ada penjualan yang siap kirim.
    </v-alert>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      penjualan: []
    };
  },
  methods: {
    async fetchPenjualanSiapKirim() {
      try {
        const res = await axios.get('http://localhost:3000/api/penjualan/siap-kirim');
        this.penjualan = res.data.map(pj => ({
          ...pj,
          newStatus: ''
        }));
      } catch (err) {
        console.error('Gagal mengambil data penjualan:', err);
      }
    },
    async updateStatus(pj) {
      if (!pj.newStatus) {
        alert('Silakan pilih status baru terlebih dahulu.');
        return;
      }
      try {
        await axios.put(`http://localhost:3000/api/penjualan/${pj._id}/status`, {
          status_pengiriman: pj.newStatus
        });
        alert('Status pengiriman diperbarui!');
        this.fetchPenjualanSiapKirim();
      } catch (err) {
        console.error('Gagal memperbarui status:', err);
        alert('Gagal memperbarui status pengiriman');
      }
    },
    formatTanggal(date) {
      return new Date(date).toLocaleDateString('id-ID');
    }
  },
  mounted() {
    this.fetchPenjualanSiapKirim();
  }
};
</script>

<style scoped>
.v-table th,
.v-table td {
  text-align: left;
  padding: 8px;
}
</style>
