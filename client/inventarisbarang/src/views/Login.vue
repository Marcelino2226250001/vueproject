<template>
  <div class="login-container">
    <h2>Login</h2>
    <div v-if="connectionStatus" class="connection-status" :class="connectionStatus.type">
      {{ connectionStatus.message }}
    </div>
    <form @submit.prevent="handleLogin">
      <input v-model="username" placeholder="Username" required :disabled="loading" />
      <input v-model="password" type="password" placeholder="Password" required :disabled="loading" />
      <button type="submit" :disabled="loading">
        {{ loading ? 'Loading...' : 'Login' }}
      </button>
      <p v-if="error" class="error-message">{{ error }}</p>
    </form>
  </div>
</template>

<script>
import apiClient, { setAuthToken } from '@/helpers/axios';
import { setUser } from '@/helpers/auth';
import roleAccess from '@/helpers/roleAccess';

export default {
  name: 'Login',
  data() {
    return {
      username: '',
      password: '',
      error: '',
      loading: false,
      connectionStatus: null
    };
  },
  methods: {
    async testConnection() {
      try {
        console.log('Testing server connection...');
        const response = await apiClient.get('/health');
        console.log(' Server reachable:', response.data);
        this.connectionStatus = {
          type: 'success',
          message: 'Server terhubung'
        };
        return true;
      } catch (error) {
        console.error(' Server unreachable:', error.message);
        this.connectionStatus = {
          type: 'error',
          message: 'Server tidak dapat dijangkau'
        };
        return false;
      }
    },

    async handleLogin() {
      this.loading = true;
      this.error = '';
      this.connectionStatus = null;

      try {

        console.log('Testing connection before login...');
        const isConnected = await this.testConnection();

        if (!isConnected) {
          throw new Error('Server tidak dapat dijangkau. Periksa koneksi internet Anda.');
        }

        console.log('Attempting login with:', { username: this.username });

        const res = await apiClient.post('/api/users/login', {
          username: this.username,
          password: this.password
        });

        console.log('Login response received:', res.data);


        let userData, userInfo;

        if (res.data.user) {

          userData = res.data;
          userInfo = res.data.user;
        } else if (res.data.username) {

          userData = res.data;
          userInfo = res.data;
        } else {
          throw new Error('Format response tidak dikenali dari server');
        }


        if (!userInfo.username || !userInfo.role) {
          console.error('Incomplete user data:', userInfo);
          throw new Error('Data user tidak lengkap dari server');
        }

        console.log('User data verified:', userInfo);


        if (userData.token) {
          setAuthToken(userData.token);
          console.log('JWT token saved');
        }


        setUser(userInfo);
        localStorage.setItem('user', JSON.stringify(userInfo));
        console.log('User data saved to localStorage:', userInfo);


        try {
          const meResponse = await apiClient.get('/api/users/me');
          console.log('✅ Session verification successful:', meResponse.data);
        } catch (verifyError) {
          console.warn('⚠️ Session verification failed, but continuing with login:', verifyError.message);

        }


        const role = userInfo.role?.toLowerCase();
        const akses = roleAccess[role];
        const target = akses === '*' ? '/barang' : akses?.[0] || '/unauthorized';

        console.log('Redirecting to:', target);

        this.connectionStatus = {
          type: 'success',
          message: 'Login berhasil! Mengalihkan...'
        };


        setTimeout(() => {
          this.$router.push(target);
        }, 500);

      } catch (err) {
        console.error('❌ Login error:', err);


        setAuthToken(null);
        localStorage.removeItem('user');


        if (err.response) {

          const status = err.response.status;
          const serverMessage = err.response.data?.message || err.response.data?.error;

          console.error('Server error response:', {
            status,
            data: err.response.data
          });

          if (status === 401) {
            this.error = 'Username atau password salah';
          } else if (status === 403) {
            this.error = 'Akun Anda tidak memiliki akses';
          } else if (status >= 500) {
            this.error = 'Server sedang bermasalah, coba lagi nanti';
          } else if (status === 0 || status === 404) {
            this.error = 'Server tidak dapat dijangkau';
          } else {
            this.error = serverMessage || `Error ${status}: Login gagal`;
          }
        } else if (err.request) {

          console.error('No response received:', err.request);
          this.error = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
        } else {

          console.error('Request setup error:', err.message);
          this.error = err.message || 'Terjadi kesalahan pada login';
        }

        this.connectionStatus = {
          type: 'error',
          message: this.error
        };
      } finally {
        this.loading = false;
      }
    }
  },

  async mounted() {
    console.log('Login component mounted');
    this.loading = true;

    try {

      console.log('Initial connection test...');
      const isConnected = await this.testConnection();

      if (!isConnected) {
        this.error = 'Server tidak dapat dijangkau. Mohon coba lagi nanti.';
        return;
      }


      const existingToken = localStorage.getItem('authToken');
      const existingUser = localStorage.getItem('user');

      if (existingToken && existingUser) {
        console.log('Found existing auth data, verifying session...');
        setAuthToken(existingToken);

        try {
          const response = await apiClient.get('/api/users/me');

          if (response?.data?.username) {
            console.log(' Valid existing session found, redirecting...');
            const role = response.data.role?.toLowerCase();
            const akses = roleAccess[role];
            const target = akses === '*' ? '/barang' : akses?.[0] || '/unauthorized';

            this.connectionStatus = {
              type: 'success',
              message: 'Sesi aktif ditemukan, mengalihkan...'
            };

            setTimeout(() => {
              this.$router.push(target);
            }, 1000);
            return;
          }
        } catch (error) {
          console.log(' Session verification failed:', error.message);

          setAuthToken(null);
          localStorage.removeItem('user');
          localStorage.removeItem('authToken');
        }
      }

      console.log('No valid session found, staying on login page');
      this.connectionStatus = {
        type: 'info',
        message: 'Silakan login untuk melanjutkan'
      };

    } catch (error) {
      console.error('Login page initialization error:', error);
      this.error = 'Terjadi kesalahan saat memuat halaman';
      this.connectionStatus = {
        type: 'error',
        message: 'Gagal memuat halaman login'
      };
    } finally {
      this.loading = false;
    }
  }
};
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 100px auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.login-container h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #2c3e50;
}

.connection-status {
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
}

.connection-status.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.connection-status.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.connection-status.info {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.login-container form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.login-container input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.login-container input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.login-container input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 5px rgba(52, 152, 219, 0.3);
}

.login-container button {
  padding: 12px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.login-container button:hover:not(:disabled) {
  background: #2980b9;
}

.login-container button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  text-align: center;
  margin: 10px 0 0 0;
  font-size: 14px;
}
</style>
