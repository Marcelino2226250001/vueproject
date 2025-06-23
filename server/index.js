const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();

// CORS configuration - tambahkan domain Railway untuk production
app.use(cors({
  origin: [
    'http://localhost:5173', // Vite default port
    'http://localhost:8080', // Vue CLI default port  
    'http://localhost:3000', // alternative port
    'http://localhost:5183', // jika ada port lain
    // Tambahkan URL production Railway nanti setelah deploy
    process.env.FRONTEND_URL // untuk production URL
  ].filter(Boolean), // filter undefined values
  credentials: true, // penting untuk session cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Session configuration dengan MongoStore untuk production
app.use(session({
  secret: process.env.SESSION_SECRET || 'inventaris-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    touchAfter: 24 * 3600 // lazy session update
  }),
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // true di production (HTTPS)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // untuk cross-origin di production
  }
}));

// Body parser
app.use(express.json());

// Logging middleware - kurangi logging di production
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - Origin: ${req.get('Origin')}`);
    console.log('Session ID:', req.sessionID);
    console.log('Session user:', req.session?.user);
    next();
  });
}

// Health check endpoint untuk Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Import routes - COMMENT SATU PER SATU UNTUK DEBUG
try {
  const productRoutes = require('./routes/productRoutes');
  app.use('/api/products', productRoutes);
  console.log('✅ productRoutes loaded');
} catch (err) {
  console.error('❌ Error loading productRoutes:', err.message);
}

try {
  const userRoutes = require('./routes/userRoutes');
  app.use('/api/users', userRoutes);
  console.log('✅ userRoutes loaded');
} catch (err) {
  console.error('❌ Error loading userRoutes:', err.message);
}

try {
  const penjualanRoutes = require('./routes/penjualanRoutes');
  app.use('/api/penjualan', penjualanRoutes);
  console.log('✅ penjualanRoutes loaded');
} catch (err) {
  console.error('❌ Error loading penjualanRoutes:', err.message);
}

try {
  const logRoutes = require('./routes/logRoutes');
  app.use('/api/log', logRoutes);
  console.log('✅ logRoutes loaded');
} catch (err) {
  console.error('❌ Error loading logRoutes:', err.message);
}

try {
  const pembelianRoutes = require('./routes/pembelianRoutes');
  app.use('/api/pembelian', pembelianRoutes);
  console.log('✅ pembelianRoutes loaded');
} catch (err) {
  console.error('❌ Error loading pembelianRoutes:', err.message);
}

try {
  const penerimaanRoutes = require('./routes/penerimaanRoutes');
  app.use('/api/penerimaan', penerimaanRoutes);
  console.log('✅ penerimaanRoutes loaded');
} catch (err) {
  console.error('❌ Error loading penerimaanRoutes:', err.message);
}

try {
  const supplyRoutes = require('./routes/supplyRoutes');
  app.use('/api/supply', supplyRoutes);
  console.log('✅ supplyRoutes loaded');
} catch (err) {
  console.error('❌ Error loading supplyRoutes:', err.message);
}

try {
  const pelangganRoutes = require('./routes/pelangganRoutes');
  app.use('/api/pelanggan', pelangganRoutes);
  console.log('✅ pelangganRoutes loaded');
} catch (err) {
  console.error('❌ Error loading pelangganRoutes:', err.message);
}

try {
  const dashboardRoutes = require('./routes/dashboardRoutes');
  app.use('/api/dashboard', dashboardRoutes);
  console.log('✅ dashboardRoutes loaded');
} catch (err) {
  console.error('❌ Error loading dashboardRoutes:', err.message);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Connect MongoDB - hapus deprecated options
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});