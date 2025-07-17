const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();

// CORS configuration - PERBAIKAN: hapus trailing slash dan tambah log
// CORS configuration - UPDATED
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:8080', 
      'http://localhost:3000',
      'http://localhost:5183',
      'https://vueproject-murex.vercel.app',
      'https://vueproject-production.up.railway.app',
      // Tambahan untuk semua subdomain vercel
      /https:\/\/.*\.vercel\.app$/,
      /https:\/\/vueproject.*\.vercel\.app$/
    ];
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  optionsSuccessStatus: 200 // For legacy browser support
}));

// Add preflight handling
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});
app.set('trust proxy', 1);
// Session configuration dengan MongoDB store
// Session configuration - FIXED
app.use(session({
  secret: process.env.SESSION_SECRET || 'inventaris-app-super-secret-key-2024-jakarta-indonesia-secure',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60,
    autoRemove: 'native',
    touchAfter: 24 * 3600
  }),
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Only secure in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Different for dev/prod
    domain: process.env.NODE_ENV === 'production' ? undefined : undefined // Let browser handle domain
  },
  // Additional options for cross-origin
  name: 'inventaris.sid'
}));

// Body parser
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.get('Origin')}`);
  console.log('Session ID:', req.sessionID);
  console.log('Session user:', req.session?.user);
  next();
});

// TAMBAHAN: Root route untuk handle GET /
app.get('/', (req, res) => {
  res.json({ 
    message: 'Inventaris API Server is running!', 
    timestamp: new Date(),
    status: 'OK',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Import routes with error handling
try {
  const productRoutes = require('./routes/productRoutes');
  app.use('/api/products', productRoutes);
  console.log('✓ Product routes loaded');
} catch (err) {
  console.error('✗ Error loading product routes:', err.message);
}

try {
  const userRoutes = require('./routes/userRoutes');
  app.use('/api/users', userRoutes);
  console.log('✓ User routes loaded');
} catch (err) {
  console.error('✗ Error loading user routes:', err.message);
}

try {
  const penjualanRoutes = require('./routes/penjualanRoutes');
  app.use('/api/penjualan', penjualanRoutes);
  console.log('✓ Penjualan routes loaded');
} catch (err) {
  console.error('✗ Error loading penjualan routes:', err.message);
}

try {
  const logRoutes = require('./routes/logRoutes');
  app.use('/api/log', logRoutes);
  console.log('✓ Log routes loaded');
} catch (err) {
  console.error('✗ Error loading log routes:', err.message);
}

try {
  const pembelianRoutes = require('./routes/pembelianRoutes');
  app.use('/api/pembelian', pembelianRoutes);
  console.log('✓ Pembelian routes loaded');
} catch (err) {
  console.error('✗ Error loading pembelian routes:', err.message);
}

try {
  const penerimaanRoutes = require('./routes/penerimaanRoutes');
  app.use('/api/penerimaan', penerimaanRoutes);
  console.log('✓ Penerimaan routes loaded');
} catch (err) {
  console.error('✗ Error loading penerimaan routes:', err.message);
}

try {
  const supplyRoutes = require('./routes/supplyRoutes');
  app.use('/api/supply', supplyRoutes);
  console.log('✓ Supply routes loaded');
} catch (err) {
  console.error('✗ Error loading supply routes:', err.message);
}

try {
  const pelangganRoutes = require('./routes/pelangganRoutes');
  app.use('/api/pelanggan', pelangganRoutes);
  console.log('✓ Pelanggan routes loaded');
} catch (err) {
  console.error('✗ Error loading pelanggan routes:', err.message);
}

try {
  const dashboardRoutes = require('./routes/dashboardRoutes');
  app.use('/api/dashboard', dashboardRoutes);
  console.log('✓ Dashboard routes loaded');
} catch (err) {
  console.error('✗ Error loading dashboard routes:', err.message);
}
try {
  const authRoutes = require('./routes/authRoutes');
  app.use('/api/auth', authRoutes);
  console.log('✓ Auth routes loaded');
} catch (err) {
  console.error('✗ Error loading auth routes:', err.message);
}
try {
  const satuanRoutes = require('./routes/satuanRoutes');
  app.use('/api/satuan', satuanRoutes);
  console.log('✓ Satuan routes loaded');
} catch (err) {
  console.error('✗ Error loading Satuan routes:', err.message);
}
try {
  const riwayathargaRoutes = require('./routes/riwayathargaRoutes');
  app.use('/api/riwayat-harga', riwayathargaRoutes);
  console.log('✓ Riwayat Harga routes loaded');
} catch (err) {
  console.error('✗ Error loading Riwayat Harga routes:', err.message);
}

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI, {
}).then(() => {
  console.log('MongoDB connected successfully');
  console.log('Database:', process.env.MONGO_URI ? 'Connected to remote DB' : 'No DB URI provided');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler - PERBAIKAN: gunakan middleware function yang benar
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS Origins configured for production: https://vueproject-murex.vercel.app`);
});