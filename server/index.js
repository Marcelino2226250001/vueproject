const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const session = require('express-session');

const app = express();

// CORS configuration - hanya satu kali
app.use(cors({
  origin: [
    'http://localhost:5173', // Vite default port
    'http://localhost:8080', // Vue CLI default port  
    'http://localhost:3000', // alternative port
    'http://localhost:5183'  // jika ada port lain
  ],
  credentials: true, // penting untuk session cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Session configuration - harus sebelum routes
app.use(session({
  secret: process.env.SESSION_SECRET || 'inventaris-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // true di production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
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

// Import routes
const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const penjualanRoutes = require('./routes/penjualanRoutes');
app.use('/api/penjualan', penjualanRoutes);

const logRoutes = require('./routes/logRoutes');
app.use('/api/log', logRoutes);

const pembelianRoutes = require('./routes/pembelianRoutes');
app.use('/api/pembelian', pembelianRoutes);

const penerimaanRoutes = require('./routes/penerimaanRoutes');
app.use('/api/penerimaan', penerimaanRoutes);

const supplyRoutes = require('./routes/supplyRoutes');
app.use('/api/supply', supplyRoutes);

const pelangganRoutes = require('./routes/pelangganRoutes');
app.use('/api/pelanggan', pelangganRoutes);

const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/api/dashboard', dashboardRoutes);

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI, {
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));