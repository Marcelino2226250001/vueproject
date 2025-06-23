<template>
  <div>
    <h2>Log Aktivitas Barang</h2>

    <!-- Filter dan Tombol Aksi -->
    <v-row class="my-4">
      <v-col cols="12" sm="6" md="4">
        <v-select
          v-model="tipeFilter"
          :items="tipeOptions"
          label="Filter berdasarkan Tipe"
          dense
          clearable
        ></v-select>
      </v-col>
      <v-col cols="12" sm="6" md="4" class="d-flex align-center">
        <v-btn
          color="error"
          variant="outlined"
          @click="mulaiProsesHapusSemuaLog"
          :disabled="logList.length === 0"
        >
          <v-icon left>mdi-delete-sweep</v-icon>
          Hapus Seluruh Riwayat
        </v-btn>
        <span class="ml-2 text-caption text-grey">
          Total: {{ logList.length }} log
        </span>
      </v-col>
    </v-row>

    <!-- Tabel log -->
    <v-data-table
      :headers="headers"
      :items="filteredLogs"
      :items-per-page="10"
      class="elevation-1"
    >
      <template v-slot:item.tanggal="{ item }">
        {{ new Date(item.tanggal).toLocaleString('id-ID') }}
      </template>
    </v-data-table>

    <!-- Dialog Konfirmasi Hapus Seluruh Log -->
    <v-dialog v-model="dialogHapusSemuaLog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="text-h5 text-error">
          <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
          Peringatan Kritikal
        </v-card-title>

        <v-card-text>
          <div class="mb-4">
            <p class="text-body-1 font-weight-bold mb-2">
              Anda akan menghapus <span class="text-error">{{ logList.length }} log aktivitas</span> secara permanen!
            </p>
            <p class="text-body-2 mb-3">
              ⚠️ Data yang dihapus <strong>TIDAK DAPAT DIKEMBALIKAN</strong>
            </p>
            <p class="text-body-2 mb-3">
              Ini akan menghilangkan seluruh riwayat:
            </p>
            <ul class="text-body-2">
              <li>Penerimaan barang</li>
              <li>Penjualan barang</li>
              <li>Penambahan/pengurangan stok</li>
              <li>Pembatalan transaksi</li>
              <li>Semua aktivitas lainnya</li>
            </ul>
          </div>

          <!-- Langkah 1: Konfirmasi pertama -->
          <div v-if="stepKonfirmasi === 1">
            <v-alert type="warning" class="mb-3">
              <strong>Langkah 1/2:</strong> Apakah Anda yakin ingin melanjutkan?
            </v-alert>
            <p class="text-body-2">
              Pikirkan baik-baik sebelum melanjutkan. Apakah Anda benar-benar perlu menghapus seluruh riwayat?
            </p>
          </div>

          <!-- Langkah 2: Konfirmasi final -->
          <div v-if="stepKonfirmasi === 2">
            <v-alert type="error" class="mb-3">
              <strong>Langkah 2/2:</strong> Konfirmasi terakhir
            </v-alert>
            <p class="text-body-1 font-weight-bold text-error">
              APAKAH ANDA BENAR-BENAR YAKIN?
            </p>
            <p class="text-body-2">
              Setelah mengklik "HAPUS SEKARANG", seluruh {{ logList.length }} log akan dihapus permanen dari database.
            </p>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <!-- Tombol Batal (selalu ada) -->
          <v-btn
            color="grey"
            variant="text"
            @click="batalkanHapusSemuaLog"
          >
            Batal
          </v-btn>

          <!-- Tombol Lanjut untuk step 1 -->
          <v-btn
            v-if="stepKonfirmasi === 1"
            color="warning"
            variant="text"
            @click="stepKonfirmasi = 2"
          >
            Ya, Lanjutkan
          </v-btn>

          <!-- Tombol Final Hapus untuk step 2 -->
          <v-btn
            v-if="stepKonfirmasi === 2"
            color="error"
            variant="flat"
            @click="eksekusiHapusSemuaLog"
            :loading="sedangHapus"
          >
            <v-icon left>mdi-delete-forever</v-icon>
            HAPUS SEKARANG
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Loading overlay saat menghapus -->
    <v-overlay v-model="sedangHapus" class="align-center justify-center">
      <v-progress-circular
        indeterminate
        size="64"
        color="error"
      ></v-progress-circular>
      <p class="mt-4 text-h6">Menghapus {{ logList.length }} log...</p>
    </v-overlay>

  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      logList: [],
      tipeFilter: '',
      tipeOptions: ['penambahan', 'pengurangan', 'penjualan', 'penerimaan', 'pembatalan'], // tambahkan 'pembatalan'
      headers: [
        { title: 'Tanggal', key: 'tanggal' },
        { title: 'Tipe', key: 'tipe' },
        { title: 'Kode Barang', key: 'kode' },
        { title: 'Nama Barang', key: 'nama_barang' },
        { title: 'Aksi', key: 'aksi' },
        { title: 'Oleh', key: 'oleh' }
      ],

      // State untuk dialog hapus semua log
      dialogHapusSemuaLog: false,
      stepKonfirmasi: 1, // 1 atau 2 (tidak perlu 3 lagi)
      sedangHapus: false,

      // User yang login (untuk log aktivitas)
      loggedInUser: JSON.parse(localStorage.getItem('user')) || null
    };
  },
  computed: {
    filteredLogs() {
      if (!this.tipeFilter) return this.logList;
      return this.logList.filter(log => log.tipe === this.tipeFilter);
    }
  },
  methods: {
    async fetchLogAktivitas() {
      try {
        const res = await axios.get('/api/log');
        this.logList = res.data;
      } catch (err) {
        console.error('Gagal mengambil log aktivitas:', err);
        alert('Gagal mengambil data log aktivitas');
      }
    },

    mulaiProsesHapusSemuaLog() {
      if (this.logList.length === 0) {
        alert('Tidak ada log untuk dihapus');
        return;
      }

      // Reset state dialog
      this.stepKonfirmasi = 1;
      this.dialogHapusSemuaLog = true;
    },

    batalkanHapusSemuaLog() {
      this.dialogHapusSemuaLog = false;
      this.stepKonfirmasi = 1;
    },

    async eksekusiHapusSemuaLog() {
      this.sedangHapus = true;

      try {
        const jumlahLogSebelum = this.logList.length;

        // Panggil API untuk hapus semua log
        const response = await axios.delete('/api/log/hapus-semua');

        console.log('✅ Response hapus semua log:', response.data);

        // Catat aktivitas penghapusan log (ironis tapi penting untuk audit)
        try {
          await axios.post('/api/log/aktivitas', {
            tanggal: new Date(),
            tipe: 'sistem',
            kode: 'SYSTEM',
            nama_barang: 'Log Database',
            aksi: `hapus ${jumlahLogSebelum} log aktivitas`,
            oleh: this.loggedInUser?.username || 'admin'
          });
        } catch (logError) {
          console.warn('Gagal mencatat log penghapusan:', logError);
        }

        // Refresh data
        await this.fetchLogAktivitas();

        // Tutup dialog
        this.dialogHapusSemuaLog = false;
        this.stepKonfirmasi = 1;

        alert(`Berhasil menghapus ${jumlahLogSebelum} log aktivitas dari database.`);

      } catch (error) {
        console.error('❌ Error saat menghapus semua log:', error);

        let errorMessage = 'Terjadi kesalahan saat menghapus log';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }

        alert(`Gagal menghapus log: ${errorMessage}`);
      } finally {
        this.sedangHapus = false;
      }
    }
  },

  async mounted() {
    await this.fetchLogAktivitas();
  }
};
</script>

<style scoped>
.text-caption {
  font-size: 0.75rem;
}
</style>
