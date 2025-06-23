const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

// Import models yang diperlukan
const Product = require('../models/Product');
const User = require('../models/User');
const Penjualan = require('../models/Penjualan');
const Pembelian = require('../models/Pembelian');
const PenerimaanBarang = require('../models/PenerimaanBarang');

// Helper function untuk mendapatkan tanggal hari ini
const getTodayRange = () => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  return { startOfDay, endOfDay };
};

// Helper function untuk mendapatkan range bulan ini
const getThisMonthRange = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { startOfMonth, endOfMonth };
};

// Dashboard untuk Admin
router.get('/admin', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    console.log('Dashboard admin requested by:', req.user);
    
    const { startOfDay, endOfDay } = getTodayRange();
    const { startOfMonth, endOfMonth } = getThisMonthRange();
    
    // Total barang tersedia
    const totalBarang = await Product.countDocuments();
    
    // Barang hampir habis (stok < 10)
    const barangHampirHabis = await Product.countDocuments({ jumlah: { $lt: 10 } });
    
    // Penjualan hari ini
    const penjualanHariIni = await Penjualan.aggregate([
      {
        $match: {
          tanggal: {
            $gte: startOfDay,
            $lt: endOfDay
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          jumlahTransaksi: { $sum: 1 }
        }
      }
    ]);
    
    // Pembelian bulan ini
    const pembelianBulanIni = await Pembelian.aggregate([
      {
        $match: {
          tanggal: {
            $gte: startOfMonth,
            $lt: endOfMonth
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          jumlahTransaksi: { $sum: 1 }
        }
      }
    ]);
    
    const dashboardData = {
      totalBarang,
      barangHampirHabis,
      penjualanHariIni: {
        total: penjualanHariIni[0]?.total || 0,
        jumlahTransaksi: penjualanHariIni[0]?.jumlahTransaksi || 0
      },
      pembelianBulanIni: {
        total: pembelianBulanIni[0]?.total || 0,
        jumlahTransaksi: pembelianBulanIni[0]?.jumlahTransaksi || 0
      }
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to load dashboard data'
    });
  }
});

// Dashboard untuk Sales
router.get('/sales', requireAuth, requireRole(['sales', 'admin']), async (req, res) => {
  try {
    console.log('Dashboard sales requested by:', req.user);
    
    const { startOfDay, endOfDay } = getTodayRange();
    const { startOfMonth, endOfMonth } = getThisMonthRange();
    
    // Penjualan hari ini
    const penjualanHariIni = await Penjualan.aggregate([
      {
        $match: {
          tanggal: {
            $gte: startOfDay,
            $lt: endOfDay
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          jumlahTransaksi: { $sum: 1 }
        }
      }
    ]);
    
    // Penjualan bulan ini
    const penjualanBulanIni = await Penjualan.aggregate([
      {
        $match: {
          tanggal: {
            $gte: startOfMonth,
            $lt: endOfMonth
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          jumlahTransaksi: { $sum: 1 }
        }
      }
    ]);
    
    const dashboardData = {
      penjualanHariIni: {
        total: penjualanHariIni[0]?.total || 0,
        jumlahTransaksi: penjualanHariIni[0]?.jumlahTransaksi || 0
      },
      penjualanBulanIni: {
        total: penjualanBulanIni[0]?.total || 0,
        jumlahTransaksi: penjualanBulanIni[0]?.jumlahTransaksi || 0
      }
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error loading sales dashboard:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to load dashboard data'
    });
  }
});

// Dashboard untuk Gudang
router.get('/gudang', requireAuth, requireRole(['gudang', 'admin']), async (req, res) => {
  try {
    console.log('Dashboard gudang requested by:', req.user);
    
    const { startOfMonth, endOfMonth } = getThisMonthRange();
    
    // Total barang tersedia
    const totalBarang = await Product.countDocuments();
    
    // Barang hampir habis (stok < 10)
    const barangHampirHabis = await Product.countDocuments({ jumlah: { $lt: 10 } });
    
    // Pembelian bulan ini
    const pembelianBulanIni = await Pembelian.aggregate([
      {
        $match: {
          tanggal: {
            $gte: startOfMonth,
            $lt: endOfMonth
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          jumlahTransaksi: { $sum: 1 }
        }
      }
    ]);
    
    // Barang dengan stok terbanyak (top 10)
    const barangTerpopuler = await Product.find()
      .sort({ jumlah: -1 })
      .limit(10)
      .select('nama jumlah satuan');
    
    const dashboardData = {
      totalBarang,
      barangHampirHabis,
      pembelianBulanIni: {
        total: pembelianBulanIni[0]?.total || 0,
        jumlahTransaksi: pembelianBulanIni[0]?.jumlahTransaksi || 0
      },
      barangTerpopuler
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error loading gudang dashboard:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to load dashboard data'
    });
  }
});

// Dashboard untuk Penerimaan
router.get('/penerimaan', requireAuth, requireRole(['penerimaan', 'admin']), async (req, res) => {
  try {
    console.log('Dashboard penerimaan requested by:', req.user);
    
    const { startOfMonth, endOfMonth } = getThisMonthRange();
    
    // Pembelian bulan ini
    const pembelianBulanIni = await Pembelian.aggregate([
      {
        $match: {
          tanggal: {
            $gte: startOfMonth,
            $lt: endOfMonth
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          jumlahTransaksi: { $sum: 1 }
        }
      }
    ]);
    
    // Pembelian yang menunggu penerimaan
    const pembelianMenunggu = await Pembelian.aggregate([
      {
        $unwind: '$items'
      },
      {
        $match: {
          'items.status': 'Belum Diterima'
        }
      },
      {
        $count: 'total'
      }
    ]);
    
    const dashboardData = {
      pembelianBulanIni: {
        total: pembelianBulanIni[0]?.total || 0,
        jumlahTransaksi: pembelianBulanIni[0]?.jumlahTransaksi || 0
      },
      pembelianMenunggu: pembelianMenunggu[0]?.total || 0
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error loading penerimaan dashboard:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to load dashboard data'
    });
  }
});

// Route untuk mendapatkan data dashboard berdasarkan role user
router.get('/data', requireAuth, async (req, res) => {
  try {
    const userRole = req.user.role.toLowerCase();
    console.log('Dashboard data requested for role:', userRole);
    
    const { startOfDay, endOfDay } = getTodayRange();
    const { startOfMonth, endOfMonth } = getThisMonthRange();
    
    let dashboardData = {};
    
    switch (userRole) {
      case 'admin':
        // Total barang tersedia
        const totalBarang = await Product.countDocuments();
        
        // Barang hampir habis
        const barangHampirHabis = await Product.countDocuments({ jumlah: { $lt: 10 } });
        
        // Penjualan hari ini
        const penjualanHariIni = await Penjualan.aggregate([
          {
            $match: {
              tanggal: {
                $gte: startOfDay,
                $lt: endOfDay
              }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$total' },
              jumlahTransaksi: { $sum: 1 }
            }
          }
        ]);
        
        // Pembelian bulan ini
        const pembelianBulanIni = await Pembelian.aggregate([
          {
            $match: {
              tanggal: {
                $gte: startOfMonth,
                $lt: endOfMonth
              }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$total' },
              jumlahTransaksi: { $sum: 1 }
            }
          }
        ]);
        
        dashboardData = {
          totalBarang,
          barangHampirHabis,
          penjualanHariIni: {
            total: penjualanHariIni[0]?.total || 0,
            jumlahTransaksi: penjualanHariIni[0]?.jumlahTransaksi || 0
          },
          pembelianBulanIni: {
            total: pembelianBulanIni[0]?.total || 0,
            jumlahTransaksi: pembelianBulanIni[0]?.jumlahTransaksi || 0
          },
          userRole: 'admin'
        };
        break;
        
      case 'sales':
        // Penjualan hari ini
        const salesPenjualanHariIni = await Penjualan.aggregate([
          {
            $match: {
              tanggal: {
                $gte: startOfDay,
                $lt: endOfDay
              }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$total' },
              jumlahTransaksi: { $sum: 1 }
            }
          }
        ]);
        
        // Penjualan bulan ini
        const salesPenjualanBulanIni = await Penjualan.aggregate([
          {
            $match: {
              tanggal: {
                $gte: startOfMonth,
                $lt: endOfMonth
              }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$total' },
              jumlahTransaksi: { $sum: 1 }
            }
          }
        ]);
        
        dashboardData = {
          penjualanHariIni: {
            total: salesPenjualanHariIni[0]?.total || 0,
            jumlahTransaksi: salesPenjualanHariIni[0]?.jumlahTransaksi || 0
          },
          penjualanBulanIni: {
            total: salesPenjualanBulanIni[0]?.total || 0,
            jumlahTransaksi: salesPenjualanBulanIni[0]?.jumlahTransaksi || 0
          },
          userRole: 'sales'
        };
        break;
        
      case 'gudang':
        // Total barang dan barang hampir habis
        const gudangTotalBarang = await Product.countDocuments();
        const gudangBarangHampirHabis = await Product.countDocuments({ jumlah: { $lt: 10 } });
        
        // Pembelian bulan ini
        const gudangPembelianBulanIni = await Pembelian.aggregate([
          {
            $match: {
              tanggal: {
                $gte: startOfMonth,
                $lt: endOfMonth
              }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$total' },
              jumlahTransaksi: { $sum: 1 }
            }
          }
        ]);
        
        // Barang dengan stok terbanyak
        const barangTerpopuler = await Product.find()
          .sort({ jumlah: -1 })
          .limit(10)
          .select('nama jumlah satuan');
        
        dashboardData = {
          totalBarang: gudangTotalBarang,
          barangHampirHabis: gudangBarangHampirHabis,
          pembelianBulanIni: {
            total: gudangPembelianBulanIni[0]?.total || 0,
            jumlahTransaksi: gudangPembelianBulanIni[0]?.jumlahTransaksi || 0
          },
          barangTerpopuler,
          userRole: 'gudang'
        };
        break;
        
      case 'penerimaan':
        // Pembelian bulan ini
        const penerimaanPembelianBulanIni = await Pembelian.aggregate([
          {
            $match: {
              tanggal: {
                $gte: startOfMonth,
                $lt: endOfMonth
              }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$total' },
              jumlahTransaksi: { $sum: 1 }
            }
          }
        ]);
        
        // Pembelian yang menunggu penerimaan
        const pembelianMenunggu = await Pembelian.aggregate([
          {
            $unwind: '$items'
          },
          {
            $match: {
              'items.status': 'Belum Diterima'
            }
          },
          {
            $count: 'total'
          }
        ]);
        
        dashboardData = {
          pembelianBulanIni: {
            total: penerimaanPembelianBulanIni[0]?.total || 0,
            jumlahTransaksi: penerimaanPembelianBulanIni[0]?.jumlahTransaksi || 0
          },
          pembelianMenunggu: pembelianMenunggu[0]?.total || 0,
          userRole: 'penerimaan'
        };
        break;
        
      default:
        return res.status(403).json({ 
          error: 'Invalid role',
          message: 'User role not recognized'
        });
    }
    
    res.json(dashboardData);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to load dashboard data'
    });
  }
});

// Debug route untuk melihat informasi user
router.get('/debug/user', requireAuth, (req, res) => {
  res.json({
    sessionUser: req.user,
    sessionID: req.sessionID,
    cookies: req.headers.cookie
  });
});

module.exports = router;