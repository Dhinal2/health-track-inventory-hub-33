const express = require('express');
const cors = require('cors');


// Import the new 'db' object which contains the PostgreSQL pool and query method
const db = require('./db'); 

// Import all application routes (these remain the same)
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const shipmentRoutes = require('./routes/shipments');
const inventoryRoutes = require('./routes/inventory');
const dashboardRoutes = require('./routes/dashboard');
const invoiceRoutes = require('./routes/invoices');
const usersRouter = require('./routes/users');
const reportsRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware (remains the same)
app.use(cors());
app.use(express.json());

// Database Configuration - Removed the old SQL Server config
// The connection is now handled entirely within db.js

// Test DB Connection - Removed the old SQL Server test
// db.js already logs connection status

// Register API routes (these remain the same)
console.log("🔵 [API] Registering routes...");
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/users', usersRouter); 
app.use('/api/reports', reportsRoutes);

console.log("✅ [API] All routes registered.");

// Start Server (remains the same)
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});