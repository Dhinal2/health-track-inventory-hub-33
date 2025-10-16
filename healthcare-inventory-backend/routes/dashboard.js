const express = require('express');
const sql = require('mssql');
const router = express.Router();

const dbConfig = {
    user: 'healthcare_app_user',
    password: 'Pass123!', // Make sure this is your correct password
    server: 'ASUS-TUF-GAMING\\SQLEXPRESS',
    database: 'HealthCareDB',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);

        // 1. Get Total Products
        const totalProductsResult = await pool.request().query('SELECT COUNT(*) as totalProducts FROM Products');
        const totalProducts = totalProductsResult.recordset[0].totalProducts;

        // 2. Get Low Stock Items
        const lowStockResult = await pool.request().query('SELECT COUNT(*) as lowStockCount FROM Inventory WHERE StockQuantity < ReorderThreshold');
        const lowStockCount = lowStockResult.recordset[0].lowStockCount;

        // 3. Get Orders Today
        const ordersTodayResult = await pool.request().query("SELECT COUNT(*) as ordersToday FROM Orders WHERE CONVERT(date, OrderDate) = CONVERT(date, GETDATE())");
        const ordersToday = ordersTodayResult.recordset[0].ordersToday;

        // 4. Get Total Revenue (from paid invoices)
        const revenueResult = await pool.request().query("SELECT SUM(TotalAmount) as totalRevenue FROM Invoices WHERE PaymentStatus = 'Paid'");
        const totalRevenue = revenueResult.recordset[0].totalRevenue || 0;

        res.json({
            totalProducts,
            lowStockCount,
            ordersToday,
            totalRevenue
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

module.exports = router;