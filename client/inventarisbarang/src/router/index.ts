import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import Barang from '@/views/Barang.vue'
import Laporan from '@/views/Laporan.vue'
import Penjualan from '@/views/Penjualan.vue'
import RiwayatPenjualan from '@/views/RiwayatPenjualan.vue'
import LogAktivitas from '@/views/LogAktivitas.vue'
import Pembelian from '@/views/Pembelian.vue'
import LaporanPembelian from '@/views/LaporanPembelian.vue'
import AntarBarang from '@/views/AntarBarang.vue'
import roleAccess from '@/helpers/roleAccess'
import PenerimaanBarang from '@/views/PenerimaanBarang.vue'
import Unauthorized from '@/views/Unauthorized.vue'
import Supply from '@/views/Supply.vue'
import Pelanggan from '@/views/Pelanggan.vue'
import Dashboard  from '@/views/Dashboard.vue'
import RiwayatHarga from '../views/RiwayatHarga.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/barang', component: Barang },
  { path: '/laporan', component: Laporan },
  { path: '/laporan/pembelian', component: LaporanPembelian },
  { path: '/penjualan', component: Penjualan },
  { path: '/penjualan/riwayat', component: RiwayatPenjualan },
  { path: '/log', component: LogAktivitas },
  { path: '/pembelian', component: Pembelian },
  { path: '/antar-barang', name: 'AntarBarang', component: AntarBarang },
  { path: '/penerimaan', component: PenerimaanBarang },
  { path: '/unauthorized', component: Unauthorized },
  { path: '/supply', component: Supply },
  { path: '/pelanggan', component: Pelanggan },
  { path: '/dashboard', component: Dashboard },
  { path: '/riwayat-harga', component: RiwayatHarga },
]



const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation Guard
router.beforeEach((to, from, next) => {
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  // Jika belum login dan ingin ke login, lanjutkan
  if (!user && to.path === '/login') return next();

  // Jika belum login dan bukan ke login, arahkan ke login
  if (!user && to.path !== '/login') return next('/login');

  // Jika sudah login dan ke /login, redirect ke halaman default (opsional)
  // if (user && to.path === '/login') return next('/barang'); // atau sesuai role

  const role = user?.role?.toLowerCase();
  const allowed = roleAccess[role];

  if (!allowed) return next('/unauthorized'); // cegah error jika role undefined

  if (allowed === '*') return next();
  if (allowed.includes(to.path)) return next();

  return next('/unauthorized');
});



export default router
