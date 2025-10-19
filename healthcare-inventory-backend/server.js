const express = require('express');
const cors = require('cors');
const sql = require('mssql');

// Import all application routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const shipmentRoutes = require('./routes/shipments');
const inventoryRoutes = require('./routes/inventory');
const dashboardRoutes = require('./routes/dashboard');
const invoiceRoutes = require('./routes/invoices');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Configuration
const dbConfig = {
    user: 'healthcare_app_user',
    password: 'Pass123!',
    server: 'ASUS-TUF-GAMING\\SQLEXPRESS',
    database: 'HealthCareDB',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// Test DB Connection on startup
sql.connect(dbConfig).then(pool => {
    console.log('✅ [DB] Connected to SQL Server');
}).catch(err => {
    console.error('❌ [DB] Database connection failed:', err);
});

// Register API routes
console.log("🔵 [API] Registering routes...");
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/invoices', invoiceRoutes);
console.log("  -> ✨ Registered /api/invoices"); // <-- ADDED LOG

console.log("✅ [API] All routes registered.");

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});