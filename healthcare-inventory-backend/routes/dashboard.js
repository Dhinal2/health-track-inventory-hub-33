const express = require('express');
const { sql, poolPromise } = require('../db');
const router = express.Router();

// Helper function to calculate percentage change
const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? "+100.0%" : "0.0%";
    const change = ((current - previous) / previous) * 100;
    return (change >= 0 ? "+" : "") + change.toFixed(1) + "%";
};

/**
 * POST /
 * Fetches all necessary data for the dashboard, tailored to the user's role.
 */
router.post('/', async (req, res) => {
    const { userId, userRole } = req.body;
    if (!userId || !userRole) return res.status(400).send({ message: 'User ID and Role are required.' });

    try {
        const pool = await poolPromise;
        const request = pool.request().input('UserID', sql.Int, userId);
        const today = new Date();
        const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

        let stats = [];
        let recentOrders = [];
        let lowStockAlerts = [];
        let weeklyUsage = []; // New data for the chart

        // --- Period Calculation for Comparison ---
        const currentPeriodRequest = pool.request()
            .input('FromDate', sql.DateTime, oneWeekAgo) // Example: Compare last 7 days
            .input('ToDate', sql.DateTime, today);
        const previousPeriodRequest = pool.request()
            .input('PrevFromDate', sql.DateTime, twoWeeksAgo)
            .input('PrevToDate', sql.DateTime, oneWeekAgo);

        // --- Common Queries (used by both roles for stats comparison) ---
        const ordersResult = await currentPeriodRequest.query('SELECT COUNT(*) as orderCount FROM Orders WHERE OrderDate BETWEEN @FromDate AND @ToDate;');
        const revenueResult = await currentPeriodRequest.query(`SELECT SUM(TotalAmount) as totalRevenue FROM Invoices WHERE PaymentStatus = 'Paid' AND IssueDate BETWEEN @FromDate AND @ToDate;`);
        const prevOrdersResult = await previousPeriodRequest.query('SELECT COUNT(*) as orderCount FROM Orders WHERE OrderDate BETWEEN @PrevFromDate AND @PrevToDate;');
        const prevRevenueResult = await previousPeriodRequest.query(`SELECT SUM(TotalAmount) as totalRevenue FROM Invoices WHERE PaymentStatus = 'Paid' AND IssueDate BETWEEN @PrevFromDate AND @PrevToDate;`);

        const ordersThisPeriod = ordersResult.recordset[0].orderCount || 0;
        const totalRevenue = revenueResult.recordset[0].totalRevenue || 0;
        const ordersLastPeriod = prevOrdersResult.recordset[0].orderCount || 0;
        const revenueLastPeriod = prevRevenueResult.recordset[0].totalRevenue || 0;

        const ordersChange = calculatePercentageChange(ordersThisPeriod, ordersLastPeriod);
        const revenueChange = calculatePercentageChange(totalRevenue, revenueLastPeriod);

        // --- Role-Specific Queries ---
        if (userRole === 'Administrator') {
            const totalValueResult = await pool.request().query('SELECT SUM(i.StockQuantity * p.Price) as totalValue FROM Inventory i JOIN Products p ON i.ProductID = p.ProductID;');
            const lowStockCountResult = await pool.request().query('SELECT COUNT(*) as lowStockCount FROM Inventory WHERE StockQuantity < ReorderThreshold;');

            stats = [
                { title: 'Total Inventory Value', value: `$${(totalValueResult.recordset[0].totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: 'DollarSign', color: 'purple', change: '', changeType: 'neutral' },
                { title: 'Low Stock Items', value: lowStockCountResult.recordset[0].lowStockCount || 0, icon: 'AlertTriangle', color: 'red', change: '', changeType: 'neutral' },
                { title: 'Orders This Week', value: ordersThisPeriod, icon: 'ShoppingCart', color: 'green', change: ordersChange, changeType: ordersChange.startsWith('+') ? 'positive' : 'negative' },
                { title: 'Revenue This Week', value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: 'DollarSign', color: 'blue', change: revenueChange, changeType: revenueChange.startsWith('+') ? 'positive' : 'negative' },
            ];

            const recentOrdersResultAdmin = await pool.request().query(`
                SELECT TOP 5 o.OrderID, u.Name as PlacedBy, o.OrderDate, o.TotalAmount, o.Status 
                FROM Orders o JOIN Users u ON o.UserID = u.UserID ORDER BY o.OrderDate DESC;`);
            recentOrders = recentOrdersResultAdmin.recordset;

        } else { // Healthcare Staff
            const myPendingOrdersResult = await request.query(`SELECT COUNT(*) as pendingOrders FROM Orders WHERE UserID = @UserID AND Status IN ('Pending', 'Approved');`);
            const myLowStockResult = await pool.request().query('SELECT COUNT(*) as lowStockCount FROM Inventory WHERE StockQuantity < ReorderThreshold;'); // Use pool request for system-wide low stock count
            const myOrdersThisWeekResult = await pool.request() // Use pool request if staff needs to see their contribution to total orders this week
                .input('FromDateStaff', sql.DateTime, oneWeekAgo)
                .input('ToDateStaff', sql.DateTime, today)
                .input('UserIDStaff', sql.Int, userId) // Add UserID input
                .query(`SELECT COUNT(*) as ordersThisWeek FROM Orders WHERE UserID = @UserIDStaff AND OrderDate BETWEEN @FromDateStaff AND @ToDateStaff;`);

            const myOrdersThisWeek = myOrdersThisWeekResult.recordset[0].ordersThisWeek || 0;

            stats = [
                 { title: 'My Pending Orders', value: myPendingOrdersResult.recordset[0].pendingOrders || 0, icon: 'ShoppingCart', color: 'blue', change: '', changeType: 'neutral' },
                 { title: 'Low Stock Items', value: myLowStockResult.recordset[0].lowStockCount || 0, icon: 'AlertTriangle', color: 'red', change: '', changeType: 'neutral' },
                 { title: 'My Orders This Week', value: myOrdersThisWeek, icon: 'ShoppingCart', color: 'green', change: '', changeType: 'neutral'}, // Add comparison if needed later
                 { title: 'Items to Reorder', value: myLowStockResult.recordset[0].lowStockCount || 0, icon: 'Package2', color: 'purple', change: '', changeType: 'neutral' }, // Re-using low stock count here, adjust if different logic needed
            ];

            const recentOrdersResultStaff = await request.query(`
                SELECT TOP 5 OrderID, OrderDate, TotalAmount, Status 
                FROM Orders WHERE UserID = @UserID ORDER BY OrderDate DESC;`);
            recentOrders = recentOrdersResultStaff.recordset;
        }

        // --- Low Stock Alerts (Common) ---
        const lowStockAlertsResult = await pool.request().query(`
            SELECT TOP 5 p.Name, i.StockQuantity, i.ReorderThreshold 
            FROM Inventory i JOIN Products p ON i.ProductID = p.ProductID 
            WHERE i.StockQuantity < i.ReorderThreshold 
            ORDER BY (CAST(i.StockQuantity AS FLOAT) / i.ReorderThreshold) ASC;`);
        lowStockAlerts = lowStockAlertsResult.recordset;

        // --- THIS IS THE FIX for Weekly Usage Data ---
        // This query now generates data for all of the last 7 days and formats the date as 'Mon', 'Tue', etc.
        const weeklyUsageResult = await pool.request()
            .input('OneWeekAgo', sql.Date, oneWeekAgo)
            .input('Today', sql.Date, today)
            .query(`
                WITH DateSeries AS (
                    SELECT @OneWeekAgo AS [DateValue]
                    UNION ALL
                    SELECT DATEADD(day, 1, [DateValue]) FROM DateSeries WHERE [DateValue] < @Today
                )
                SELECT
                    FORMAT(ds.[DateValue], 'ddd') AS date,
                    ISNULL(UsageData.itemsUsed, 0) AS ItemsUsed
                FROM DateSeries ds
                LEFT JOIN (
                    SELECT CAST(o.OrderDate AS DATE) AS OrderDate, COUNT(DISTINCT oi.ProductID) AS itemsUsed
                    FROM Orders o JOIN OrderItems oi ON o.OrderID = oi.OrderID
                    WHERE o.OrderDate BETWEEN @OneWeekAgo AND @Today
                    GROUP BY CAST(o.OrderDate AS DATE)
                ) AS UsageData ON ds.[DateValue] = UsageData.OrderDate
                ORDER BY ds.[DateValue] ASC
                OPTION (MAXRECURSION 0);
            `);
        weeklyUsage = weeklyUsageResult.recordset;

        res.json({ stats, recentOrders, lowStockAlerts, weeklyUsage });

    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        res.status(500).send({ message: 'Server error while fetching dashboard data.' });
    }
});

module.exports = router;