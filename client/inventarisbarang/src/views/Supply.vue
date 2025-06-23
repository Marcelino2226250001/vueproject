<template>
  <div>
    <h2 class="mb-4">Data Supply Barang</h2>

    <!-- FORM INPUT -->
    <v-form ref="form" @submit.prevent="simpanSupply" class="mb-6">
  <v-row dense>
    <v-col cols="12" md="3">
      <v-text-field
        v-model="form.nama_barang"
        label="Nama Barang"
        :rules="[rules.required]"
        required
      />
    </v-col>
    <v-col cols="12" md="3">
      <v-text-field
        v-model="form.kode_barang"
        label="Kode Barang"
        :rules="[rules.required]"
        required
      />
    </v-col>
    <v-col cols="12" md="3">
      <v-text-field
        v-model="form.supplier"
        label="Supplier"
        :rules="[rules.required]"
        required
      />
    </v-col>
    <v-col cols="12" md="3">
      <v-text-field
        v-model="form.harga"
        label="Harga"
        type="number"
        :rules="[rules.required, rules.number]"
        required
      />
    </v-col>

        <v-col cols="12" md="6">
          <v-btn color="primary" type="submit" class="mr-2" block>
            {{ form._id ? 'Update' : 'Simpan' }}
          </v-btn>
        </v-col>
        <v-col cols="12" md="6" v-if="form._id">
          <v-btn color="grey" @click="resetForm" block>
            Batal
          </v-btn>
        </v-col>
      </v-row>
    </v-form>

    <!-- SEARCH DAN SORT -->
    <v-row dense class="mb-4">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="filter"
          label="Cari barang, kode, atau supplier"
          prepend-icon="mdi-magnify"
          outlined
          dense
        />
        <v-btn class="mt-2" @click="filter = ''; sortByHarga = null">Reset</v-btn>
      </v-col>

      <v-col cols="12" md="6">
        <v-select
          v-model="sortByHarga"
          :items="[
            'Harga Terendah',
            'Harga Tertinggi'
          ]"
          label="Urutkan Harga"
          dense
          outlined
        />

      </v-col>
    </v-row>

    <!-- TABEL -->
    <v-table>
      <thead>
        <tr>
          <th>Nama Barang</th>
          <th>Kode Barang</th>
          <th>Supplier</th>
          <th>Harga</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in filteredList" :key="item._id">
          <td>{{ item.nama_barang }}</td>
          <td>{{ item.kode_barang }}</td>
          <td>{{ item.supplier }}</td>
          <td>{{ formatRupiah(item.harga) }}</td>
          <td>
            <v-btn small color="info" @click="editSupply(item)">Edit</v-btn>
            <v-btn small color="error" @click="hapusSupply(item._id)">Hapus</v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>


<script>
import axios from 'axios';

export default {
  data() {
    return {
      form: {
        nama_barang: '',
        kode_barang: '',
        supplier: '',
        harga: ''
      },
      list: [],
      filter: '',
      sortByHarga: null,
      rules: {
  required: value => !!value || 'Wajib diisi',
  number: value => !isNaN(Number(value)) && Number(value) > 0 || 'Harus berupa angka lebih dari 0',
}
,
    };
  },
  methods: {
    async fetchData() {
      const res = await axios.get('/api/supply');
      this.list = res.data;
    },
  async simpanSupply() {
  const isValid = await this.$refs.form.validate();
  if (!isValid) return;

  if (
    !this.form.nama_barang.trim() ||
    !this.form.kode_barang.trim() ||
    !this.form.supplier.trim()
  ) {
    alert("Semua field wajib diisi dengan benar.");
    return;
  }

  this.form.harga = Number(this.form.harga);

  try {
    if (this.form._id) {
      await axios.put(`/api/supply/${this.form._id}`, this.form);
    } else {
      await axios.post('/api/supply', this.form);
    }

    this.resetForm();
    this.fetchData();


    this.$refs.form.resetValidation();

  } catch (err) {
    alert('Gagal menyimpan data: ' + err.message);
  }
}


,
    editSupply(item) {
      this.form = { ...item }; // pastikan _id ikut terbawa
    },
    async hapusSupply(id) {
      if (confirm('Yakin ingin menghapus data ini?')) {
        try {
          await axios.delete(`/api/supply/${id}`);
          this.fetchData();
        } catch (err) {
          alert('Gagal menghapus data: ' + err.message);
        }
      }
    },
    resetForm() {
  this.form = {
    nama_barang: '',
    kode_barang: '',
    supplier: '',
    harga: ''
  };

  this.$nextTick(() => {
    this.$refs.form.resetValidation();
  });
}
,
    formatRupiah(angka) {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka);
    }
  },
  mounted() {
    this.fetchData();
  },
  watch: {
  supplier(newVal) {
    this.supplyDipilih = '';
    this.jumlah = 1;
    this.harga_beli = null;
  },
  supplyDipilih(newVal) {
    if (newVal) {
      this.harga_beli = newVal.harga;
    }
  }
},
computed: {
  filteredList() {
    const keyword = this.filter.toLowerCase();
    let filtered = this.list.filter(item =>
      item.nama_barang.toLowerCase().includes(keyword) ||
      item.kode_barang.toLowerCase().includes(keyword) ||
      item.supplier.toLowerCase().includes(keyword)
    );

    if (this.sortByHarga === 'Harga Terendah') {
      filtered.sort((a, b) => a.harga - b.harga);
    } else if (this.sortByHarga === 'Harga Tertinggi') {
      filtered.sort((a, b) => b.harga - a.harga);
    }

    return filtered;
  }
}




};
</script>
