<template>
  <div class="login-container">
    <h2>Login</h2>
    <form @submit.prevent="handleLogin">
      <input v-model="username" placeholder="Username" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button type="submit" :disabled="loading">
        {{ loading ? 'Loading...' : 'Login' }}
      </button>
      <p v-if="error" style="color: red;">{{ error }}</p>
    </form>
  </div>
</template>

<script>
import apiClient, { setAuthToken } from '@/helpers/axios';
import { setUser } from '@/helpers/auth';
import roleAccess from '@/helpers/roleAccess';

export default {
  data() {
    return {
      username: '',
      password: '',
      error: '',
      loading: false
    };
  },
  methods: {
    async handleLogin() {
      this.loading = true;
      this.error = '';

      try {
        console.log('Attempting login with:', { username: this.username });

        // Gunakan apiClient yang sudah dikonfigurasi
        const res = await apiClient.post('/api/users/login', {
          username: this.username,
          password: this.password
        });

        console.log('Login response:', res.data);
        const userData = res.data;

        // Verifikasi data yang diterima
        if (!userData.username || !userData.role) {
          throw new Error('Data user tidak lengkap dari server');
        }

        // Handle JWT token jika ada
        if (userData.token) {
          setAuthToken(userData.token);
          console.log('JWT token saved');
        }

        // Simpan user ke localStorage
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('User data saved to localStorage:', userData);

        // Test session dengan memanggil /me endpoint untuk verifikasi
        try {
          const meResponse = await apiClient.get('/api/users/me');
          console.log('Session verification successful:', meResponse.data);
        } catch (verifyError) {
          console.warn('Session verification failed, but continuing with login:', verifyError);
          // Tidak throw error di sini karena login sudah berhasil
        }

        // Tentukan redirect berdasarkan role
        const role = userData.role?.toLowerCase();
        const akses = roleAccess[role];
        const target = akses === '*' ? '/barang' : akses?.[0] || '/unauthorized';

        console.log('Redirecting to:', target);

        // Redirect dengan delay kecil
        setTimeout(() => {
          this.$router.push(target);
        }, 100);

      } catch (err) {
        console.error('Login error:', err);

        // Clear auth data on error
        setAuthToken(null);
        localStorage.removeItem('user');

        if (err.response) {
          // Server responded with error status
          console.error('Server error response:', err.response.data);
          const serverMessage = err.response.data.message || err.response.data.error;

          if (err.response.status === 401) {
            this.error = 'Username atau password salah';
          } else if (err.response.status === 403) {
            this.error = 'Akun Anda tidak memiliki akses';
          } else {
            this.error = serverMessage || 'Login gagal';
          }
        } else if (err.request) {
          // Request was made but no response received
          console.error('No response received:', err.request);
          this.error = 'Tidak dapat terhubung ke server. Periksa koneksi Anda.';
        } else {
          // Something else happened
          console.error('Error message:', err.message);
          this.error = err.message || 'Terjadi kesalahan pada login';
        }
      } finally {
        this.loading = false;
      }
    }
  },

  // Test koneksi saat component dimuat
  async mounted() {
    try {
      // Cek apakah sudah ada token tersimpan
      const existingToken = localStorage.getItem('authToken');
      const existingUser = localStorage.getItem('user');

      if (existingToken && existingUser) {
        console.log('Found existing auth token, verifying...');
        setAuthToken(existingToken);
      }

      // Test koneksi server
      const response = await apiClient.get('/api/users/me').catch(error => {
        console.log('Server connection test failed or no active session:', error.message);
        return null;
      });

      if (response && response.data) {
        console.log('Server is reachable, current session:', response.data);

        // Jika sudah login, redirect ke halaman yang sesuai
        if (response.data.username) {
          const role = response.data.role?.toLowerCase();
          const akses = roleAccess[role];
          const target = akses === '*' ? '/barang' : akses?.[0] || '/unauthorized';
          console.log('User already logged in, redirecting to:', target);
          this.$router.push(target);
        }
      } else {
        console.log('No active session found');
        // Clear any stale auth data
        setAuthToken(null);
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.log('Connection test error:', error.message);
      // Clear auth data if connection test fails
      setAuthToken(null);
      localStorage.removeItem('user');
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

.login-container p {
  text-align: center;
  margin: 10px 0 0 0;
}
</style>
