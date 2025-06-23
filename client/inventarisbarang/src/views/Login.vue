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
import axios from 'axios';
import { setUser } from '@/helpers/auth';
import roleAccess from '@/helpers/roleAccess';

// Configure axios default settings
axios.defaults.withCredentials = true;


// Add axios interceptors for better error handling
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('Axios error:', error);
    return Promise.reject(error);
  }
);

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

        // Test connection first
        const testResponse = await axios.get('/api/users/me').catch(() => null);
        console.log('Server connection test:', testResponse ? 'OK' : 'Failed');

        const res = await axios.post('/api/users/login', {
          username: this.username,
          password: this.password
        });

        console.log('Login response:', res.data);
        const userData = res.data;

        // Verifikasi data yang diterima
        if (!userData.username || !userData.role) {
          throw new Error('Data user tidak lengkap dari server');
        }

        // Simpan user ke localStorage
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));

        console.log('User data saved to localStorage:', userData);

        // Test session dengan memanggil /me endpoint
        const meResponse = await axios.get('/api/users/me');
        console.log('Session verification:', meResponse.data);

        const role = userData.role?.toLowerCase();
        const akses = roleAccess[role];
        const target = akses === '*' ? '/barang' : akses?.[0] || '/unauthorized';

        console.log('Redirecting to:', target);

        // Delay sebentar untuk memastikan session tersimpan
        setTimeout(() => {
          this.$router.push(target);
        }, 100);

      } catch (err) {
        console.error('Login error:', err);

        if (err.response) {
          // Server responded with error status
          console.error('Server error response:', err.response.data);
          this.error = err.response.data.message || 'Login gagal';
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
      const response = await axios.get('/api/users/me').catch(() => null);
      if (response) {
        console.log('Server is reachable, current session:', response.data);
        // Jika sudah login, redirect
        if (response.data.username) {
          const role = response.data.role?.toLowerCase();
          const akses = roleAccess[role];
          const target = akses === '*' ? '/barang' : akses?.[0] || '/unauthorized';
          this.$router.push(target);
        }
      } else {
        console.log('Server connection test failed or no active session');
      }
    } catch (error) {
      console.log('Connection test error:', error.message);
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
