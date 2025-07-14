<template>
  <v-app>

    <v-navigation-drawer app permanent>
      <v-list dense nav>

        <v-list-item class="d-flex flex-column align-center py-4">
          <v-avatar size="48" class="mb-2">
            <v-img src="/logo.png" />
          </v-avatar>
          <span class="text-subtitle-1 font-weight-medium text-center">
            Sukses Jaya Bersama
          </span>
        </v-list-item>

        <v-divider class="my-2" />



        <v-list-item to="/dashboard" link v-if="canAccess('/dashboard')" prepend-icon="mdi-view-dashboard">
          <v-list-item-title>Dashboard</v-list-item-title>
        </v-list-item>

        <v-list-item to="/barang" link v-if="canAccess('/barang')" prepend-icon="mdi-package-variant">
          <v-list-item-title>Barang</v-list-item-title>
        </v-list-item>

        <v-list-item to="/supply" link v-if="canAccess('/supply')" prepend-icon="mdi-file-document-outline">
          <v-list-item-title>Supplier</v-list-item-title>
        </v-list-item>

        <v-list-item to="/penjualan" link v-if="canAccess('/penjualan')" prepend-icon="mdi-cart">
          <v-list-item-title>Penjualan</v-list-item-title>
        </v-list-item>

        <v-list-item to="/pembelian" link v-if="canAccess('/pembelian')" prepend-icon="mdi-cart">
          <v-list-item-title>Pembelian</v-list-item-title>
        </v-list-item>

        <v-list-item to="/pelanggan" link v-if="canAccess('/pelanggan')" prepend-icon="mdi-account">
  <v-list-item-title>Pelanggan</v-list-item-title>
</v-list-item>
        <v-list-item
  to="/penerimaan"
  link
  v-if="canAccess('/penerimaan')"
  prepend-icon="mdi-truck-check"
>
  <v-list-item-title>Penerimaan Barang</v-list-item-title>
</v-list-item>


        <v-list-item to="/penjualan/riwayat" link v-if="canAccess('/penjualan/riwayat')" prepend-icon="mdi-history">
          <v-list-item-title>Riwayat Penjualan</v-list-item-title>
        </v-list-item>

        <v-list-item to="/log" link v-if="canAccess('/log')" prepend-icon="mdi-history">
          <v-list-item-title>Log Aktivitas</v-list-item-title>
        </v-list-item>

          <v-list-item to="/laporan" link v-if="canAccess('/laporan')" prepend-icon="mdi-package-variant">
          <v-list-item-title>Laporan</v-list-item-title>
        </v-list-item>

        <v-list-item to="/laporan/pembelian" link v-if="canAccess('/laporan/pembelian')" prepend-icon="mdi-file-document-outline">
          <v-list-item-title>Laporan Pembelian</v-list-item-title>
        </v-list-item>



        <v-list-item @click="logout" prepend-icon="mdi-logout">
          <v-list-item-title>Logout</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>


    <v-app-bar app color="blue-darken-3" dark>
      <v-toolbar-title>Dashboard Inventaris</v-toolbar-title>
      <v-spacer />
      <v-menu v-if="user" offset-y>
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="text" class="text-white" prepend-icon="mdi-account">
            {{ user.username || 'User' }}
          </v-btn>
        </template>
        <v-list>
          <v-list-item>
            <v-list-item-title>Profil</v-list-item-title>
          </v-list-item>
          <v-list-item @click="logout">
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>


    <v-main>
      <v-container fluid>
        <router-view :key="$route.fullPath" />
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import roleAccess from '@/helpers/roleAccess'

export default {
  data() {
    return {
      user: null
    }
  },
  methods: {
    getUser() {
      const userData = localStorage.getItem('user');
      try {
        this.user = userData ? JSON.parse(userData) : null;
      } catch (e) {
        console.error('Format user login invalid:', e);
        this.user = null;
      }
    },
    logout() {
      localStorage.removeItem('user');
      this.user = null;
      this.$router.push('/login');
    },
    canAccess(path) {
      if (!this.user) return false;
      const role = this.user.role.toLowerCase();
      const allowed = roleAccess[role];
      if (!allowed) return false;
      if (allowed === '*') return true;
      return allowed.includes(path);
    }
  },
  mounted() {
    this.getUser();
  },
  watch: {
    '$route.fullPath'() {
      this.getUser();
    }
  }
}
</script>
