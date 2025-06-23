<template>
  <div class="dashboard">
    <div class="header">
      <h1>Dashboard - {{ roleLabel }}</h1>
      <p class="date">{{ currentDate }}</p>
    </div>

    <div v-if="loading" class="loading">
      <p>Memuat data...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadDashboardData" class="retry-button">Coba Lagi</button>
    </div>

    <div v-else class="dashboard-content">
      <!-- Dashboard untuk Admin -->
      <div v-if="userRole === 'admin'" class="admin-dashboard">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-info">
              <h3>Total Barang</h3>
              <p class="stat-number">{{ dashboardData.totalBarang || 0 }}</p>
            </div>
          </div>

          <div class="stat-card warning">
            <div class="stat-icon">⚠️</div>
            <div class="stat-info">
              <h3>Barang Hampir Habis</h3>
              <p class="stat-number">{{ dashboardData.barangHampirHabis || 0 }}</p>
            </div>
          </div>

          <div class="stat-card success">
            <div class="stat-icon">💰</div>
            <div class="stat-info">
              <h3>Penjualan Hari Ini</h3>
              <p class="stat-number">Rp {{ formatCurrency(dashboardData.penjualanHariIni?.total || 0) }}</p>
              <p class="stat-subtitle">{{ dashboardData.penjualanHariIni?.jumlahTransaksi || 0 }} transaksi</p>
            </div>
          </div>

          <div class="stat-card info">
            <div class="stat-icon">🛒</div>
            <div class="stat-info">
              <h3>Pembelian Bulan Ini</h3>
              <p class="stat-number">Rp {{ formatCurrency(dashboardData.pembelianBulanIni?.total || 0) }}</p>
              <p class="stat-subtitle">{{ dashboardData.pembelianBulanIni?.jumlahTransaksi || 0 }} transaksi</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Dashboard untuk Sales -->
      <div v-if="userRole === 'sales'" class="sales-dashboard">
        <div class="stats-grid">
          <div class="stat-card success">
            <div class="stat-icon">💰</div>
            <div class="stat-info">
              <h3>Penjualan Hari Ini</h3>
              <p class="stat-number">Rp {{ formatCurrency(dashboardData.penjualanHariIni?.total || 0) }}</p>
              <p class="stat-subtitle">{{ dashboardData.penjualanHariIni?.jumlahTransaksi || 0 }} transaksi</p>
            </div>
          </div>

          <div class="stat-card info">
            <div class="stat-icon">📊</div>
            <div class="stat-info">
              <h3>Penjualan Bulan Ini</h3>
              <p class="stat-number">Rp {{ formatCurrency(dashboardData.penjualanBulanIni?.total || 0) }}</p>
              <p class="stat-subtitle">{{ dashboardData.penjualanBulanIni?.jumlahTransaksi || 0 }} transaksi</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Dashboard untuk Gudang -->
      <div v-if="userRole === 'gudang'" class="gudang-dashboard">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-info">
              <h3>Total Barang</h3>
              <p class="stat-number">{{ dashboardData.totalBarang || 0 }}</p>
            </div>
          </div>

          <div class="stat-card warning">
            <div class="stat-icon">⚠️</div>
            <div class="stat-info">
              <h3>Barang Hampir Habis</h3>
              <p class="stat-number">{{ dashboardData.barangHampirHabis || 0 }}</p>
            </div>
          </div>

          <div class="stat-card info">
            <div class="stat-icon">🛒</div>
            <div class="stat-info">
              <h3>Pembelian Bulan Ini</h3>
              <p class="stat-number">Rp {{ formatCurrency(dashboardData.pembelianBulanIni?.total || 0) }}</p>
              <p class="stat-subtitle">{{ dashboardData.pembelianBulanIni?.jumlahTransaksi || 0 }} transaksi</p>
            </div>
          </div>
        </div>

        <div v-if="dashboardData.barangTerpopuler && dashboardData.barangTerpopuler.length > 0" class="popular-items">
          <h3>Barang dengan Stok Terbanyak</h3>
          <div class="items-list">
            <div v-for="item in dashboardData.barangTerpopuler" :key="item._id" class="item-row">
              <span class="item-name">{{ item.nama }}</span>
              <span class="item-stock">{{ item.jumlah }} {{ item.satuan }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Dashboard untuk Penerimaan -->
      <div v-if="userRole === 'penerimaan'" class="penerimaan-dashboard">
        <div class="stats-grid">
          <div class="stat-card info">
            <div class="stat-icon">🛒</div>
            <div class="stat-info">
              <h3>Pembelian Bulan Ini</h3>
              <p class="stat-number">Rp {{ formatCurrency(dashboardData.pembelianBulanIni?.total || 0) }}</p>
              <p class="stat-subtitle">{{ dashboardData.pembelianBulanIni?.jumlahTransaksi || 0 }} transaksi</p>
            </div>
          </div>

          <div class="stat-card warning">
            <div class="stat-icon">⏳</div>
            <div class="stat-info">
              <h3>Menunggu Penerimaan</h3>
              <p class="stat-number">{{ dashboardData.pembelianMenunggu || 0 }}</p>
              <p class="stat-subtitle">item pembelian</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pesan jika role tidak dikenali -->
      <div v-if="!['admin', 'sales', 'gudang', 'penerimaan'].includes(userRole)" class="unauthorized">
        <p>Dashboard tidak tersedia untuk role: {{ userRole }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import apiClient from '@/helpers/axios';

export default {
  name: 'Dashboard',
  data() {
    return {
      dashboardData: {},
      loading: true,
      error: null,
      userRole: null,
      currentUser: null,
      currentDate: new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  },
  computed: {
    roleLabel() {
      const roleLabels = {
        admin: 'Administrator',
        sales: 'Sales',
        gudang: 'Gudang',
        penerimaan: 'Penerimaan'
      };
      return roleLabels[this.userRole] || 'Unknown';
    }
  },
  async mounted() {
    await this.checkAuth();
    if (this.userRole) {
      await this.loadDashboardData();
    }
  },
  methods: {
    async checkAuth() {
      try {
        // Cek dari localStorage terlebih dahulu
        const savedUser = localStorage.getItem('user');
        console.log('Saved user from localStorage:', savedUser);

        if (savedUser) {
          const user = JSON.parse(savedUser);
          this.userRole = user.role?.toLowerCase();
          this.currentUser = user;
          console.log('User role set to:', this.userRole);
          return;
        }

        // Jika tidak ada di localStorage, redirect ke login
        console.log('No user found in localStorage, redirecting to login');
        this.$router.push('/login');

      } catch (error) {
        console.error('Error checking auth:', error);
        this.$router.push('/login');
      }
    },

    async loadDashboardData() {
      try {
        this.loading = true;
        this.error = null;

        console.log('Loading dashboard data for role:', this.userRole);

        // Gunakan endpoint yang sesuai dengan role
        let endpoint;
        switch (this.userRole) {
          case 'admin':
            endpoint = '/api/dashboard/admin';
            break;
          case 'sales':
            endpoint = '/api/dashboard/sales';
            break;
          case 'gudang':
            endpoint = '/api/dashboard/gudang';
            break;
          case 'penerimaan':
            endpoint = '/api/dashboard/penerimaan';
            break;
          default:
            endpoint = '/api/dashboard/data';
        }

        console.log('Calling dashboard endpoint:', endpoint);
        const response = await apiClient.get(endpoint);

        console.log('Dashboard data received:', response.data);
        this.dashboardData = response.data;

        this.loading = false;

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        this.loading = false;

        if (error.response) {
          console.error('Error response:', error.response.data);
          console.error('Error status:', error.response.status);

          if (error.response.status === 401) {
            this.error = 'Session expired. Please login again.';
            localStorage.removeItem('user');
            this.$router.push('/login');
          } else if (error.response.status === 403) {
            this.error = 'Access denied. Insufficient permissions.';
          } else {
            this.error = error.response.data.message || 'Failed to load dashboard data';
          }
        } else if (error.request) {
          console.error('No response received:', error.request);
          this.error = 'Cannot connect to server. Please check your connection.';
        } else {
          console.error('Error message:', error.message);
          this.error = error.message || 'An error occurred while loading dashboard data';
        }
      }
    },

    formatCurrency(amount) {
      if (!amount || amount === 0) return '0';
      return new Intl.NumberFormat('id-ID').format(amount);
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.header {
  margin-bottom: 30px;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 5px;
}

.date {
  color: #7f8c8d;
  font-size: 14px;
}

.loading {
  text-align: center;
  padding: 50px;
  font-size: 16px;
  color: #7f8c8d;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  border-left: 4px solid #3498db;
}

.stat-card.success {
  border-left-color: #27ae60;
}

.stat-card.warning {
  border-left-color: #f39c12;
}

.stat-card.info {
  border-left-color: #3498db;
}

.stat-icon {
  font-size: 2rem;
  margin-right: 15px;
}

.stat-info h3 {
  margin: 0 0 5px 0;
  font-size: 14px;
  color: #7f8c8d;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
  margin: 0;
}

.stat-subtitle {
  font-size: 12px;
  color: #95a5a6;
  margin: 2px 0 0 0;
}

.popular-items {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.popular-items h3 {
  margin-top: 0;
  color: #2c3e50;
}

.items-list {
  margin-top: 15px;
}

.item-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #ecf0f1;
}

.item-row:last-child {
  border-bottom: none;
}

.item-name {
  font-weight: 500;
}

.item-stock {
  color: #27ae60;
  font-weight: bold;
}

.unauthorized {
  text-align: center;
  padding: 50px;
  background: #fff3cd;
  border-radius: 8px;
  color: #856404;
}
</style>
