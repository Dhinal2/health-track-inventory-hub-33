const express = require('express');
const { sql, poolPromise } = require('../db');
const router = express.Router();

// Helper function to calculate percentage change
const calculatePercentageChange = (current, previous) => {
    // If previous is 0 or null, handle division by zero
    if (!previous || previous === 0) {
        // If current is also 0, change is 0%
        // If current is positive, it's a 100% increase from zero (or infinite, but 100% is more practical)
        // If current is negative (not applicable for usage), handle accordingly
        return current > 0 ? "+100.0%" : "0.0%";
    }
    const change = ((current - previous) / previous) * 100;
    // Format the percentage with a sign and one decimal place
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
        const request = pool.request().input('UserID', sql.Int, userId); // Main request with UserID
        const today = new Date();
        // Adjust dates slightly to ensure correct BETWEEN behavior if times are involved
        const todayEndOfDay = new Date(today);
        todayEndOfDay.setHours(23, 59, 59, 999);
        const oneWeekAgoStartOfDay = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        oneWeekAgoStartOfDay.setHours(0, 0, 0, 0);
        const twoWeeksAgoStartOfDay = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
        twoWeeksAgoStartOfDay.setHours(0, 0, 0, 0);


        let stats = [];
        let recentOrders = [];
        let lowStockAlerts = [];
        let weeklyUsage = [];
        let usageChange = "0.0%"; // Default usage change
        let usageChangeType = 'neutral';

        // --- Period Calculation for Comparison (Orders/Revenue) ---
        const currentPeriodRequest = pool.request()
            .input('FromDate', sql.DateTime, oneWeekAgoStartOfDay)
            .input('ToDate', sql.DateTime, todayEndOfDay)
            .input('CurrentUserID', sql.Int, userId);

        const previousPeriodRequest = pool.request()
            .input('PrevFromDate', sql.DateTime, twoWeeksAgoStartOfDay)
            .input('PrevToDate', sql.DateTime, oneWeekAgoStartOfDay) // End date is start of current period
            .input('PreviousUserID', sql.Int, userId);

        // --- Common Queries (Orders/Revenue Comparison) ---
        const ordersResult = await currentPeriodRequest.query('SELECT COUNT(*) as orderCount FROM Orders WHERE OrderDate BETWEEN @FromDate AND @ToDate;');
        const revenueResult = await currentPeriodRequest.query(`SELECT SUM(inv.TotalAmount) as totalRevenue FROM Invoices inv JOIN Orders o ON inv.OrderID = o.OrderID WHERE inv.PaymentStatus = 'Paid' AND inv.IssueDate BETWEEN @FromDate AND @ToDate;`);
        const prevOrdersResult = await previousPeriodRequest.query('SELECT COUNT(*) as orderCount FROM Orders WHERE OrderDate BETWEEN @PrevFromDate AND @PrevToDate;');
        const prevRevenueResult = await previousPeriodRequest.query(`SELECT SUM(inv.TotalAmount) as totalRevenue FROM Invoices inv JOIN Orders o ON inv.OrderID = o.OrderID WHERE inv.PaymentStatus = 'Paid' AND inv.IssueDate BETWEEN @PrevFromDate AND @PrevToDate;`);

        const ordersThisPeriod = ordersResult.recordset[0].orderCount || 0;
        const totalRevenue = revenueResult.recordset[0].totalRevenue || 0;
        const ordersLastPeriod = prevOrdersResult.recordset[0].orderCount || 0;
        const revenueLastPeriod = prevRevenueResult.recordset[0].totalRevenue || 0;

        const ordersChange = calculatePercentageChange(ordersThisPeriod, ordersLastPeriod);
        const revenueChange = calculatePercentageChange(totalRevenue, revenueLastPeriod);

        // --- Role-Specific Queries ---
        if (userRole === 'Administrator') {
            const totalValueResult = await pool.request().query('SELECT SUM(i.StockQuantity * p.Price) as totalValue FROM Inventory i JOIN Products p ON i.ProductID = p.ProductID;');
            const lowStockCountResult = await pool.request().query('SELECT COUNT(DISTINCT ProductID) as lowStockCount FROM Inventory WHERE StockQuantity < ReorderThreshold;');

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

            const lowStockAlertsResultAdmin = await pool.request().query(`
                SELECT TOP 5 p.Name, i.StockQuantity, i.ReorderThreshold, u.Name as UserName
                FROM Inventory i
                JOIN Products p ON i.ProductID = p.ProductID
                JOIN Users u ON i.UserID = u.UserID
                WHERE i.StockQuantity < i.ReorderThreshold
                ORDER BY (CAST(i.StockQuantity AS FLOAT) / i.ReorderThreshold) ASC;`);
            lowStockAlerts = lowStockAlertsResultAdmin.recordset;

        } else { // Healthcare Staff
            const myPendingOrdersResult = await request.query(`SELECT COUNT(*) as pendingOrders FROM Orders WHERE UserID = @UserID AND Status IN ('Pending', 'Approved', 'Awaiting Payment', 'Pending Final Payment');`);
            const myLowStockResult = await request.query('SELECT COUNT(*) as lowStockCount FROM Inventory WHERE UserID = @UserID AND StockQuantity < ReorderThreshold;');
            const myOrdersThisWeekResult = await request
                .input('FromDateStaff', sql.DateTime, oneWeekAgoStartOfDay)
                .input('ToDateStaff', sql.DateTime, todayEndOfDay)
                .query(`SELECT COUNT(*) as ordersThisWeek FROM Orders WHERE UserID = @UserID AND OrderDate BETWEEN @FromDateStaff AND @ToDateStaff;`);

            const myOrdersThisWeek = myOrdersThisWeekResult.recordset[0].ordersThisWeek || 0;

            stats = [
                { title: 'My Pending Orders', value: myPendingOrdersResult.recordset[0].pendingOrders || 0, icon: 'ShoppingCart', color: 'blue', change: '', changeType: 'neutral' },
                { title: 'My Low Stock Items', value: myLowStockResult.recordset[0].lowStockCount || 0, icon: 'AlertTriangle', color: 'red', change: '', changeType: 'neutral' },
                { title: 'My Orders This Week', value: myOrdersThisWeek, icon: 'ShoppingCart', color: 'green', change: '', changeType: 'neutral'}, // Add comparison if needed later
                { title: 'Items to Reorder', value: myLowStockResult.recordset[0].lowStockCount || 0, icon: 'Package2', color: 'purple', change: '', changeType: 'neutral' },
            ];

            const recentOrdersResultStaff = await request.query(`
                SELECT TOP 5 o.OrderID, u.Name as CustomerName, o.OrderDate, o.TotalAmount, o.Status
                FROM Orders o
                JOIN Users u ON o.UserID = u.UserID
                WHERE o.UserID = @UserID ORDER BY o.OrderDate DESC;`);
            recentOrders = recentOrdersResultStaff.recordset;

            const lowStockAlertsResultStaff = await request.query(`
                SELECT TOP 5 p.Name, i.StockQuantity, i.ReorderThreshold
                FROM Inventory i JOIN Products p ON i.ProductID = p.ProductID
                WHERE i.UserID = @UserID AND i.StockQuantity < i.ReorderThreshold
                ORDER BY (CAST(i.StockQuantity AS FLOAT) / i.ReorderThreshold) ASC;`);
            lowStockAlerts = lowStockAlertsResultStaff.recordset;
        }

        // --- Weekly Usage Calculation ---
        // Query for current week's usage
        const currentWeekUsageResult = await pool.request()
            .input('CurrentWeekStart', sql.DateTime, oneWeekAgoStartOfDay)
            .input('CurrentWeekEnd', sql.DateTime, todayEndOfDay)
            .input('UsageUserID_CW', sql.Int, userRole === 'Administrator' ? null : userId) // Filter by user for staff
            .query(`
                SELECT SUM(oi.Quantity) as totalUsage
                FROM Orders o JOIN OrderItems oi ON o.OrderID = oi.OrderID
                WHERE o.OrderDate BETWEEN @CurrentWeekStart AND @CurrentWeekEnd
                ${userRole === 'Administrator' ? '' : 'AND o.UserID = @UsageUserID_CW'}
            `);
        const currentWeekTotalUsage = currentWeekUsageResult.recordset[0].totalUsage || 0;

        // Query for previous week's usage
        const previousWeekUsageResult = await pool.request()
            .input('PreviousWeekStart', sql.DateTime, twoWeeksAgoStartOfDay)
            .input('PreviousWeekEnd', sql.DateTime, oneWeekAgoStartOfDay) // End date is start of current week
            .input('UsageUserID_PW', sql.Int, userRole === 'Administrator' ? null : userId) // Filter by user for staff
            .query(`
                SELECT SUM(oi.Quantity) as totalUsage
                FROM Orders o JOIN OrderItems oi ON o.OrderID = oi.OrderID
                WHERE o.OrderDate BETWEEN @PreviousWeekStart AND @PreviousWeekEnd
                ${userRole === 'Administrator' ? '' : 'AND o.UserID = @UsageUserID_PW'}
            `);
        const previousWeekTotalUsage = previousWeekUsageResult.recordset[0].totalUsage || 0;

        // Calculate usage change
        usageChange = calculatePercentageChange(currentWeekTotalUsage, previousWeekTotalUsage);
        usageChangeType = usageChange.startsWith('+') ? 'positive' : (usageChange === '0.0%' ? 'neutral' : 'negative');


        // --- Weekly Usage Data (for Chart) ---
        const weeklyUsageResult = await pool.request()
            .input('ChartWeekStart', sql.Date, oneWeekAgoStartOfDay) // Use Date type for simplified grouping
            .input('ChartWeekEnd', sql.Date, today)                 // Use Date type
            .input('ChartUserID', sql.Int, userRole === 'Administrator' ? null : userId) // Filter by user for staff
            .query(`
                WITH DateSeries AS (
                    SELECT CAST(@ChartWeekStart AS DATE) AS [DateValue] -- Start with DATE type
                    UNION ALL
                    SELECT DATEADD(day, 1, [DateValue]) FROM DateSeries WHERE [DateValue] < @ChartWeekEnd -- Use DATE type comparison
                )
                SELECT
                    FORMAT(ds.[DateValue], 'ddd') AS date,
                    ISNULL(UsageData.itemsUsed, 0) AS ItemsUsed
                FROM DateSeries ds
                LEFT JOIN (
                    SELECT CAST(o.OrderDate AS DATE) AS OrderDate, SUM(oi.Quantity) AS itemsUsed
                    FROM Orders o JOIN OrderItems oi ON o.OrderID = oi.OrderID
                    WHERE o.OrderDate BETWEEN @ChartWeekStart AND @ChartWeekEnd -- Use original DateTime boundaries here if needed for accuracy
                    ${userRole === 'Administrator' ? '' : 'AND o.UserID = @ChartUserID'}
                    GROUP BY CAST(o.OrderDate AS DATE)
                ) AS UsageData ON ds.[DateValue] = UsageData.OrderDate
                ORDER BY ds.[DateValue] ASC
                OPTION (MAXRECURSION 0);
            `);
        weeklyUsage = weeklyUsageResult.recordset.map(row => ({ day: row.date, usage: row.ItemsUsed }));

        // Send combined response
        res.json({ stats, recentOrders, lowStockAlerts, weeklyUsage, usageChange, usageChangeType });

    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        res.status(500).send({ message: 'Server error while fetching dashboard data.' });
    }
});

module.exports = router;