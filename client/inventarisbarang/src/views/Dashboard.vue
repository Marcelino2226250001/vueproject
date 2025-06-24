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
    console.log('Dashboard mounted');
    await this.checkAuth();
  },
  methods: {
    // 🔧 FIXED: Gunakan key token yang konsisten dengan axios.js
    getAuthToken() {
      // Coba kedua kemungkinan key untuk backward compatibility
      return localStorage.getItem('authToken') || localStorage.getItem('token');
    },

    setAuthToken(token) {
      if (token) {
        // Set kedua key untuk memastikan kompatibilitas
        localStorage.setItem('authToken', token);
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
      }
    },

    async checkAuth() {
      try {
        this.loading = true;
        console.log('Checking authentication...');

        // 🔧 FIXED: Gunakan method yang konsisten untuk mengambil data
        const savedUser = localStorage.getItem('user');
        const savedToken = this.getAuthToken();

        console.log('Saved user:', savedUser);
        console.log('Saved token exists:', !!savedToken);
        console.log('Token keys check:', {
          authToken: !!localStorage.getItem('authToken'),
          token: !!localStorage.getItem('token')
        });

        if (!savedUser || !savedToken) {
          console.log('No user or token found, redirecting to login');
          this.redirectToLogin();
          return;
        }

        try {
          const user = JSON.parse(savedUser);
          console.log('Parsed user:', user);

          if (!user.role) {
            console.log('User role not found');
            this.redirectToLogin();
            return;
          }

          this.userRole = user.role.toLowerCase();
          this.currentUser = user;

          console.log('User role set to:', this.userRole);

          // Verifikasi token dengan server
          await this.verifyToken();

          // Load dashboard data
          await this.loadDashboardData();

        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
          this.redirectToLogin();
        }

      } catch (error) {
        console.error('Error in checkAuth:', error);
        this.redirectToLogin();
      }
    },

    async verifyToken() {
      try {
        console.log('Verifying token with server...');

        const token = this.getAuthToken();
        if (!token) {
          console.log('No token available for verification');
          this.redirectToLogin();
          return;
        }

        // 🔧 FIXED: Panggil endpoint yang benar untuk verifikasi
        // Coba beberapa endpoint yang mungkin ada
        let response;
        try {
          response = await apiClient.get('/api/auth/verify');
        } catch (error) {
          if (error.response?.status === 404) {
            // Jika endpoint verify tidak ada, coba endpoint lain
            console.log('Verify endpoint not found, trying /api/auth/me');
            response = await apiClient.get('/api/auth/me');
          } else {
            throw error;
          }
        }

        console.log('Token verification response:', response.data);

        if (response.data.valid === false || response.data.error) {
          console.log('Token is invalid');
          this.redirectToLogin();
          return;
        }

        // Update user data jika ada perubahan dari server
        if (response.data.user) {
          this.currentUser = response.data.user;
          this.userRole = response.data.user.role.toLowerCase();
          localStorage.setItem('user', JSON.stringify(response.data.user));
          console.log('User data updated from server');
        }

        // Update token jika server memberikan token baru
        if (response.data.token) {
          this.setAuthToken(response.data.token);
          console.log('Token updated from server');
        }

      } catch (error) {
        console.error('Token verification failed:', error);

        if (error.response?.status === 401) {
          console.log('Token expired or invalid');
          this.redirectToLogin();
        } else if (error.response?.status === 404) {
          console.warn('Verification endpoint not available, continuing with cached data');
          // Lanjutkan dengan data yang ada jika endpoint tidak tersedia
        } else {
          console.warn('Token verification failed, but continuing with cached data');
          // Tetap lanjutkan dengan data yang ada di localStorage
        }
      }
    },

    async loadDashboardData() {
      try {
        this.loading = true;
        this.error = null;

        console.log('Loading dashboard data for role:', this.userRole);

        // Gunakan endpoint yang sesuai dengan role
        let endpoint = '/api/dashboard/data'; // Default endpoint

        // Coba endpoint spesifik role terlebih dahulu
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
        }

        console.log('Calling dashboard endpoint:', endpoint);

        // Tambahkan timeout dan retry logic
        const response = await this.makeApiCall(endpoint);

        console.log('Dashboard data received:', response.data);
        this.dashboardData = response.data;
        this.loading = false;

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        this.handleDashboardError(error);
      }
    },

    async makeApiCall(endpoint, retries = 2) {
      for (let i = 0; i <= retries; i++) {
        try {
          const token = this.getAuthToken();

          const response = await apiClient.get(endpoint, {
            timeout: 10000, // 10 second timeout
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          return response;
        } catch (error) {
          console.log(`API call attempt ${i + 1} failed:`, error.message);

          if (i === retries) {
            throw error;
          }

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    },

    handleDashboardError(error) {
      this.loading = false;

      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);

        if (error.response.status === 401) {
          this.error = 'Session expired. Please login again.';
          setTimeout(() => {
            this.redirectToLogin();
          }, 2000);
        } else if (error.response.status === 403) {
          this.error = 'Access denied. Insufficient permissions.';
        } else if (error.response.status >= 500) {
          this.error = 'Server error. Please try again later.';
        } else {
          this.error = error.response.data?.message || 'Failed to load dashboard data';
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        this.error = 'Cannot connect to server. Please check your connection.';
      } else {
        console.error('Error message:', error.message);
        this.error = error.message || 'An error occurred while loading dashboard data';
      }
    },

    redirectToLogin() {
      console.log('Redirecting to login...');

      // 🔧 FIXED: Clear semua token keys
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');

      // Gunakan nextTick untuk memastikan DOM sudah update
      this.$nextTick(() => {
        this.$router.push('/login').catch(err => {
          console.error('Navigation error:', err);
          // Fallback: redirect menggunakan window.location
          window.location.href = '/login';
        });
      });
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
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 30px;
  text-align: center;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.date {
  color: #7f8c8d;
  font-size: 14px;
}

.loading, .error {
  text-align: center;
  padding: 40px;
}

.error {
  color: #e74c3c;
}

.retry-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 10px;
}

.retry-button:hover {
  background-color: #2980b9;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  border-left: 4px solid #3498db;
}

.stat-card.warning {
  border-left-color: #f39c12;
}

.stat-card.success {
  border-left-color: #27ae60;
}

.stat-card.info {
  border-left-color: #9b59b6;
}

.stat-icon {
  font-size: 2em;
  margin-right: 15px;
}

.stat-info h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 600;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
  margin: 0;
}

.stat-subtitle {
  font-size: 12px;
  color: #7f8c8d;
  margin: 5px 0 0 0;
}

.popular-items {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.popular-items h3 {
  margin-top: 0;
  color: #2c3e50;
}

.items-list {
  max-height: 300px;
  overflow-y: auto;
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
  padding: 40px;
  color: #e74c3c;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    flex-direction: column;
    text-align: center;
  }

  .stat-icon {
    margin-right: 0;
    margin-bottom: 10px;
  }
}
</style>
