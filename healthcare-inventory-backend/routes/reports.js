const express = require('express');
const { sql, poolPromise } = require('../db');
const router = express.Router();

/**
 * Calculates the percentage change between two numbers.
 * @param {number} current - The current period's value.
 * @param {number} previous - The previous period's value.
 * @returns {string} A string representing the percentage change (e.g., "+10.5%").
 */
const calculatePercentageChange = (current, previous) => {
    if (previous === 0) {
        return current > 0 ? "+100.0%" : "0.0%"; // Handle division by zero
    }
    const change = ((current - previous) / previous) * 100;
    return (change >= 0 ? "+" : "") + change.toFixed(1) + "%";
};

/**
 * POST /summary
 * Fetches summary data for the top cards on the reports page.
 * Compares the selected date range to the equivalent previous period.
 */
router.post('/summary', async (req, res) => {
    const { from, to } = req.body;
    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Calculate the previous period for dynamic comparison
    const diff = toDate.getTime() - fromDate.getTime();
    const prevFromDate = new Date(fromDate.getTime() - diff);
    const prevToDate = new Date(toDate.getTime() - diff);

    try {
        const pool = await poolPromise;
        
        // --- Current Period Queries ---
        const currentRequest = pool.request().input('FromDate', sql.DateTime, fromDate).input('ToDate', sql.DateTime, toDate);
        const stockResult = await pool.request().query('SELECT SUM(StockQuantity) as totalStock FROM Inventory;');
        const ordersResult = await currentRequest.query('SELECT COUNT(*) as orderCount FROM Orders WHERE OrderDate BETWEEN @FromDate AND @ToDate;');
        const revenueResult = await currentRequest.query(`SELECT SUM(TotalAmount) as totalRevenue FROM Invoices WHERE PaymentStatus = 'Paid' AND IssueDate BETWEEN @FromDate AND @ToDate;`);
        const lowStockResult = await pool.request().query('SELECT COUNT(*) as lowStockCount FROM Inventory WHERE StockQuantity < ReorderThreshold;');
        
        // --- Previous Period Queries for Comparison ---
        const previousRequest = pool.request().input('PrevFromDate', sql.DateTime, prevFromDate).input('PrevToDate', sql.DateTime, prevToDate);
        const prevOrdersResult = await previousRequest.query('SELECT COUNT(*) as orderCount FROM Orders WHERE OrderDate BETWEEN @PrevFromDate AND @PrevToDate;');
        const prevRevenueResult = await previousRequest.query(`SELECT SUM(TotalAmount) as totalRevenue FROM Invoices WHERE PaymentStatus = 'Paid' AND IssueDate BETWEEN @PrevFromDate AND @PrevToDate;`);

        // --- Data Consolidation & Calculation ---
        const ordersThisPeriod = ordersResult.recordset[0].orderCount || 0;
        const totalRevenue = revenueResult.recordset[0].totalRevenue || 0;
        const ordersLastPeriod = prevOrdersResult.recordset[0].orderCount || 0;
        const revenueLastPeriod = prevRevenueResult.recordset[0].totalRevenue || 0;

        res.json({
            totalItemsInStock: stockResult.recordset[0].totalStock || 0,
            ordersThisMonth: ordersThisPeriod,
            ordersChange: calculatePercentageChange(ordersThisPeriod, ordersLastPeriod),
            totalRevenue: totalRevenue,
            revenueChange: calculatePercentageChange(totalRevenue, revenueLastPeriod),
            lowStockItems: lowStockResult.recordset[0].lowStockCount || 0
        });
    } catch (err) {
        console.error('Error fetching summary report:', err);
        res.status(500).send(err.message);
    }
});

/**
 * POST /detailed
 * Fetches detailed data for the report charts and tables based on the selected report type.
 */
router.post('/detailed', async (req, res) => {
    const { reportType, from, to } = req.body;
    let query = '';
    let title = '';
    let columns = [];
    let dataKey = ''; // Key for X-axis
    let chartKeys = []; // Key(s) for Y-axis
    let chartType = 'bar';

    try {
        const pool = await poolPromise;
        const request = pool.request()
            .input('from', sql.DateTime, new Date(from))
            .input('to', sql.DateTime, new Date(to));

        switch (reportType) {
            case 'inventory-summary':
                title = 'Current Inventory Levels';
                columns = ['Item Name', 'Current Stock', 'Reorder Threshold', 'Status'];
                chartType = 'bar';
                dataKey = 'itemName';
                chartKeys = ['currentStock']; // Restored this key
                query = `
                    SELECT 
                        p.Name as itemName, 
                        i.StockQuantity as currentStock, 
                        i.ReorderThreshold as reorderThreshold
                    FROM Inventory i 
                    JOIN Products p ON i.ProductID = p.ProductID 
                    ORDER BY i.StockQuantity ASC;
                `;
                break;
                
            case 'low-stock':
                title = 'Low Stock Items';
                columns = ['Item Name', 'Current Stock', 'Reorder Threshold'];
                chartType = 'pie';
                dataKey = 'itemName';
                chartKeys = ['currentStock']; // Restored this key
                query = `
                    SELECT 
                        p.Name as itemName, 
                        i.StockQuantity as currentStock, 
                        i.ReorderThreshold as reorderThreshold
                    FROM Inventory i 
                    JOIN Products p ON i.ProductID = p.ProductID 
                    WHERE i.StockQuantity < i.ReorderThreshold;
                `;
                break;

            case 'order-history':
                title = 'Order History';
                columns = ['Order ID', 'Date', 'Placed By', 'Status', 'Total'];
                chartType = 'line';
                dataKey = 'date';
                chartKeys = ['total'];
                query = `
                    SELECT 
                        o.OrderID as orderID, 
                        o.OrderDate as date, 
                        u.Name as placedBy, 
                        o.Status as status, 
                        o.TotalAmount as total
                    FROM Orders o 
                    JOIN Users u ON o.UserID = u.UserID
                    WHERE o.OrderDate BETWEEN @from AND @to 
                    ORDER BY o.OrderDate DESC;
                `;
                break;
            
            case 'financial-summary':
                title = 'Financial Summary';
                // Updated columns to reflect "Orders"
                columns = ['Date', 'Total Revenue', 'Number of Orders', 'Average Order Value'];
                chartType = 'line';
                dataKey = 'date';
                chartKeys = ['totalRevenue', 'averageOrderValue'];
                // Updated query to pull from Orders table
                query = `
                    SELECT 
                        CAST(OrderDate AS DATE) as date, 
                        SUM(TotalAmount) as totalRevenue,
                        COUNT(OrderID) as numberOfOrders,
                        AVG(TotalAmount) as averageOrderValue
                    FROM Orders 
                    WHERE OrderDate BETWEEN @from AND @to
                    GROUP BY CAST(OrderDate AS DATE) 
                    ORDER BY date;
                `;
                break;

            default:
                return res.status(400).send({ message: 'Invalid report type' });
        }
        
        const result = await request.query(query);
        
        res.json({ title, columns, chartType, dataKey, chartKeys, data: result.recordset });

    } catch (err) {
        console.error(`Error fetching detailed report for ${reportType}:`, err);
        res.status(500).send(err.message);
    }
});

module.exports = router;
