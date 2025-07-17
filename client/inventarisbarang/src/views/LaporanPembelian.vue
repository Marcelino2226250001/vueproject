<template>
  <div>
    <h2 class="text-xl font-bold mb-4">Laporan Pembelian</h2>

    <v-card class="mb-6 pa-4" flat>
      <v-row dense>
        <v-col cols="12" md="3">
          <v-text-field v-model="dari" type="date" label="Dari" density="compact" hide-details />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model="sampai" type="date" label="Sampai" density="compact" hide-details />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model="supplier" label="Supplier" density="compact" hide-details />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model="jenis" label="Jenis/Nama Barang" density="compact" hide-details />
        </v-col>
        <v-col cols="12" class="text-right">
          <v-btn color="primary" @click="fetchLaporan(true)" class="mr-2">Tampilkan</v-btn>
          <!-- [PERUBAHAN] Menambahkan tombol ekspor PDF -->
          <v-btn color="green" @click="exportPDF" class="mr-2" :disabled="laporan.length === 0">
            <v-icon left>mdi-file-pdf-box</v-icon>
            Ekspor PDF
          </v-btn>
          <v-btn v-if="role !== 'gudang' && role !== 'penerimaan'" color="error" @click="confirmHapusSemua">
            Bersihkan Riwayat
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-card flat>
      <v-data-table
        :headers="headers"
        :items="laporan"
        :items-per-page="5"
        class="elevation-1"
        item-value="_id"
        density="comfortable"
      >
        <template v-slot:item.tanggal="{ item }">
          {{ formatDate(item.raw.tanggal) }}
        </template>
        <template v-slot:item.barang="{ item }">
          <ul class="pl-4">
            <li v-for="(i, idx) in item.raw.items" :key="idx">
              {{ i.nama_barang }} ({{ i.jumlah }})
            </li>
          </ul>
        </template>
        <template v-slot:item.jumlah="{ item }">
          {{ totalJumlah(item.raw.items || []) }}
        </template>
        <template v-slot:item.total="{ item }">
          Rp {{ (item.raw.total || 0).toLocaleString('id-ID') }}
        </template>
        <template v-slot:no-data>
          <div class="text-center text-grey py-4">Tidak ada data pembelian</div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script>
import axios from 'axios';
// [PERUBAHAN] Impor library PDF
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default {
  data() {
    return {
      role: '',
      dari: '',
      sampai: '',
      supplier: '',
      jenis: '',
      laporan: [],
      loggedInUser: null,
      headers: [
        { title: 'Tanggal', key: 'tanggal' },
        { title: 'Supplier', key: 'supplier' },
        { title: 'Barang', key: 'barang', sortable: false },
        { title: 'Jumlah', key: 'jumlah', sortable: false },
        { title: 'Total', key: 'total' }
      ]
    };
  },
  methods: {
    async fetchLaporan(useFilter = false) {
      // ... (kode fetchLaporan Anda tidak berubah)
    },
    formatDate(dateStr) {
      // ... (kode formatDate Anda tidak berubah)
    },
    totalJumlah(items) {
      // ... (kode totalJumlah Anda tidak berubah)
    },
    confirmHapusSemua() {
      // ... (kode confirmHapusSemua Anda tidak berubah)
    },
    async hapusSemuaPembelian() {
      // ... (kode hapusSemuaPembelian Anda tidak berubah)
    },
    // [PERUBAHAN] Method baru untuk ekspor PDF
    exportPDF() {
      const doc = new jsPDF();

      doc.text("Laporan Pembelian Barang", 14, 15);
      doc.setFontSize(10);
      doc.text(`Periode: ${this.dari || 'Semua'} - ${this.sampai || 'Semua'}`, 14, 22);

      const tableColumn = ["Tanggal", "Supplier", "Barang", "Total Jumlah", "Total Harga"];
      const tableRows = [];

      this.laporan.forEach(item => {
        const barangList = item.items.map(b => `${b.nama_barang} (${b.jumlah})`).join("\n");
        const rowData = [
          this.formatDate(item.tanggal),
          item.supplier,
          barangList,
          this.totalJumlah(item.items),
          `Rp ${item.total.toLocaleString('id-ID')}`
        ];
        tableRows.push(rowData);
      });

      doc.autoTable(tableColumn, tableRows, { startY: 28 });
      doc.save('laporan-pembelian.pdf');
    }
  },
  mounted() {
    this.fetchLaporan();
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    this.role = user?.role?.toLowerCase() || '';
    this.loggedInUser = user;
  }
};
</script>
