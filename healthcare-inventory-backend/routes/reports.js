const express = require('express');
const { sql, poolPromise } = require('../db');
const router = express.Router();

// A helper function to get the start of the previous month
const getPreviousMonthStartDate = (date) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() - 1);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
};

// A helper function to get the end of the previous month
const getPreviousMonthEndDate = (date) => {
    const d = new Date(date);
    d.setDate(0); // This sets the date to the last day of the previous month
    d.setHours(23, 59, 59, 999);
    return d;
};

// GET /api/reports/summary - Fetch summary data for the cards
router.post('/summary', async (req, res) => {
    const { from, to } = req.body;
    try {
        const pool = await poolPromise;

        // --- Current Period Calculations ---
        const totalItemsResult = await pool.request().query('SELECT SUM(StockQuantity) as totalItems FROM Inventory');
        const ordersResult = await pool.request()
            .input('from', sql.DateTime, new Date(from))
            .input('to', sql.DateTime, new Date(to))
            .query('SELECT COUNT(*) as ordersCount, SUM(TotalAmount) as totalRevenue FROM Orders WHERE OrderDate BETWEEN @from AND @to');
        const lowStockResult = await pool.request().query('SELECT COUNT(*) as lowStockCount FROM Inventory WHERE StockQuantity < ReorderThreshold');

        // --- Previous Period Calculations for Comparison ---
        const prevMonthStart = getPreviousMonthStartDate(from);
        const prevMonthEnd = getPreviousMonthEndDate(from);
        
        const prevOrdersResult = await pool.request()
            .input('from', sql.DateTime, prevMonthStart)
            .input('to', sql.DateTime, prevMonthEnd)
            .query('SELECT COUNT(*) as ordersCount, SUM(TotalAmount) as totalRevenue FROM Orders WHERE OrderDate BETWEEN @from AND @to');

        // Extract values
        const currentOrders = ordersResult.recordset[0] || { ordersCount: 0, totalRevenue: 0 };
        const prevOrders = prevOrdersResult.recordset[0] || { ordersCount: 0, totalRevenue: 0 };

        // Calculate percentage changes
        const ordersChange = prevOrders.ordersCount > 0 ? ((currentOrders.ordersCount - prevOrders.ordersCount) / prevOrders.ordersCount) * 100 : currentOrders.ordersCount > 0 ? 100 : 0;
        const revenueChange = prevOrders.totalRevenue > 0 ? ((currentOrders.totalRevenue - prevOrders.totalRevenue) / prevOrders.totalRevenue) * 100 : currentOrders.totalRevenue > 0 ? 100 : 0;

        res.json({
            totalItemsInStock: totalItemsResult.recordset[0].totalItems || 0,
            ordersThisMonth: currentOrders.ordersCount,
            ordersChange: ordersChange.toFixed(0),
            totalRevenue: currentOrders.totalRevenue || 0,
            revenueChange: revenueChange.toFixed(0),
            lowStockItems: lowStockResult.recordset[0].lowStockCount || 0,
        });
    } catch (err) {
        console.error('Error fetching summary report:', err);
        res.status(500).send(err.message);
    }
});

module.exports = router;