const express = require('express');
const db = require('../db'); // Import the new 'db' object
const router = express.Router();

// Helper function to calculate percentage change (no changes needed)
const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) {
        return current > 0 ? "+100.0%" : "0.0%";
    }
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
        const today = new Date();
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
        let usageChange = "0.0%";
        let usageChangeType = 'neutral';

        // --- Common Queries (Orders/Revenue Comparison) ---
        // (Using PostgreSQL $1, $2 placeholders and lowercase schema)
        const ordersResult = await db.query(
            'SELECT COUNT(*) as ordercount FROM orders WHERE orderdate BETWEEN $1 AND $2;',
            [oneWeekAgoStartOfDay, todayEndOfDay]
        );
        const revenueResult = await db.query(
            `SELECT SUM(inv.totalamount) as totalrevenue FROM invoices inv 
             JOIN orders o ON inv.orderid = o.orderid 
             WHERE inv.paymentstatus = 'Paid' AND inv.issuedate BETWEEN $1 AND $2;`,
            [oneWeekAgoStartOfDay, todayEndOfDay]
        );
        const prevOrdersResult = await db.query(
            'SELECT COUNT(*) as ordercount FROM orders WHERE orderdate BETWEEN $1 AND $2;',
            [twoWeeksAgoStartOfDay, oneWeekAgoStartOfDay]
        );
        const prevRevenueResult = await db.query(
            `SELECT SUM(inv.totalamount) as totalrevenue FROM invoices inv 
             JOIN orders o ON inv.orderid = o.orderid 
             WHERE inv.paymentstatus = 'Paid' AND inv.issuedate BETWEEN $1 AND $2;`,
            [twoWeeksAgoStartOfDay, oneWeekAgoStartOfDay]
        );

        // Accessing .rows[0] and lowercase properties
        const ordersThisPeriod = parseInt(ordersResult.rows[0].ordercount) || 0;
        const totalRevenue = parseFloat(revenueResult.rows[0].totalrevenue) || 0;
        const ordersLastPeriod = parseInt(prevOrdersResult.rows[0].ordercount) || 0;
        const revenueLastPeriod = parseFloat(prevRevenueResult.rows[0].totalrevenue) || 0;

        const ordersChange = calculatePercentageChange(ordersThisPeriod, ordersLastPeriod);
        const revenueChange = calculatePercentageChange(totalRevenue, revenueLastPeriod);

        // --- Role-Specific Queries ---
        if (userRole === 'Administrator') {
            const totalValueResult = await db.query('SELECT SUM(i.stockquantity * p.price) as totalvalue FROM inventory i JOIN products p ON i.productid = p.productid;');
            const lowStockCountResult = await db.query('SELECT COUNT(DISTINCT productid) as lowstockcount FROM inventory WHERE stockquantity < reorderthreshold;');

            stats = [
                { title: 'Total Inventory Value', value: `$${(parseFloat(totalValueResult.rows[0].totalvalue) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: 'DollarSign', color: 'purple', change: '', changeType: 'neutral' },
                { title: 'Low Stock Items', value: parseInt(lowStockCountResult.rows[0].lowstockcount) || 0, icon: 'AlertTriangle', color: 'red', change: '', changeType: 'neutral' },
                { title: 'Orders This Week', value: ordersThisPeriod, icon: 'ShoppingCart', color: 'green', change: ordersChange, changeType: ordersChange.startsWith('+') ? 'positive' : 'negative' },
                { title: 'Revenue This Week', value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: 'DollarSign', color: 'blue', change: revenueChange, changeType: revenueChange.startsWith('+') ? 'positive' : 'negative' },
            ];

            // Converted TOP 5 to LIMIT 5
            const recentOrdersResultAdmin = await db.query(`
                SELECT o.orderid, u.name as "PlacedBy", o.orderdate, o.totalamount, o.status
                FROM orders o JOIN users u ON o.userid = u.userid 
                ORDER BY o.orderdate DESC LIMIT 5;`);
            recentOrders = recentOrdersResultAdmin.rows;

            // Converted TOP 5 to LIMIT 5 and CAST to ::float
            const lowStockAlertsResultAdmin = await db.query(`
                SELECT p.name, i.stockquantity, i.reorderthreshold, u.name as "UserName"
                FROM inventory i
                JOIN products p ON i.productid = p.productid
                JOIN users u ON i.userid = u.userid
                WHERE i.stockquantity < i.reorderthreshold
                ORDER BY (i.stockquantity::float / i.reorderthreshold) ASC LIMIT 5;`);
            lowStockAlerts = lowStockAlertsResultAdmin.rows;

        } else { // Healthcare Staff
            const myPendingOrdersResult = await db.query(`SELECT COUNT(*) as pendingorders FROM orders WHERE userid = $1 AND status IN ('Pending', 'Approved', 'Awaiting Payment', 'Pending Final Payment');`, [userId]);
            const myLowStockResult = await db.query('SELECT COUNT(*) as lowstockcount FROM inventory WHERE userid = $1 AND stockquantity < reorderthreshold;', [userId]);
            const myOrdersThisWeekResult = await db.query(`SELECT COUNT(*) as ordersthisweek FROM orders WHERE userid = $1 AND orderdate BETWEEN $2 AND $3;`, [userId, oneWeekAgoStartOfDay, todayEndOfDay]);

            const myOrdersThisWeek = parseInt(myOrdersThisWeekResult.rows[0].ordersthisweek) || 0;
            const myLowStockCount = parseInt(myLowStockResult.rows[0].lowstockcount) || 0;

            stats = [
                { title: 'My Pending Orders', value: parseInt(myPendingOrdersResult.rows[0].pendingorders) || 0, icon: 'ShoppingCart', color: 'blue', change: '', changeType: 'neutral' },
                { title: 'My Low Stock Items', value: myLowStockCount, icon: 'AlertTriangle', color: 'red', change: '', changeType: 'neutral' },
                { title: 'My Orders This Week', value: myOrdersThisWeek, icon: 'ShoppingCart', color: 'green', change: '', changeType: 'neutral'},
                { title: 'Items to Reorder', value: myLowStockCount, icon: 'Package2', color: 'purple', change: '', changeType: 'neutral' },
            ];

            const recentOrdersResultStaff = await db.query(`
                SELECT o.orderid, u.name as "CustomerName", o.orderdate, o.totalamount, o.status
                FROM orders o
                JOIN users u ON o.userid = u.userid
                WHERE o.userid = $1 ORDER BY o.orderdate DESC LIMIT 5;`, [userId]);
            recentOrders = recentOrdersResultStaff.rows;

            const lowStockAlertsResultStaff = await db.query(`
                SELECT p.name, i.stockquantity, i.reorderthreshold
                FROM inventory i JOIN products p ON i.productid = p.productid
                WHERE i.userid = $1 AND i.stockquantity < i.reorderthreshold
                ORDER BY (i.stockquantity::float / i.reorderthreshold) ASC LIMIT 5;`, [userId]);
            lowStockAlerts = lowStockAlertsResultStaff.rows;
        }

        // --- Weekly Usage Calculation (Dynamic Query) ---
        let usageQueryText = `
            SELECT SUM(oi.quantity) as totalusage
            FROM orders o JOIN orderitems oi ON o.orderid = oi.orderid
            WHERE o.orderdate BETWEEN $1 AND $2`;
        
        const currentWeekValues = [oneWeekAgoStartOfDay, todayEndOfDay];
        const previousWeekValues = [twoWeeksAgoStartOfDay, oneWeekAgoStartOfDay];

        if (userRole !== 'Administrator') {
            usageQueryText += ' AND o.userid = $3';
            currentWeekValues.push(userId);
            previousWeekValues.push(userId);
        }

        const currentWeekUsageResult = await db.query(usageQueryText, currentWeekValues);
        const previousWeekUsageResult = await db.query(usageQueryText, previousWeekValues);

        const currentWeekTotalUsage = parseInt(currentWeekUsageResult.rows[0].totalusage) || 0;
        const previousWeekTotalUsage = parseInt(previousWeekUsageResult.rows[0].totalusage) || 0;

        usageChange = calculatePercentageChange(currentWeekTotalUsage, previousWeekTotalUsage);
        usageChangeType = usageChange.startsWith('+') ? 'positive' : (usageChange === '0.0%' ? 'neutral' : 'negative');

        // --- Weekly Usage Data (for Chart) ---
        
        let usageSubQuery = `
            SELECT 
                o.orderdate::date AS OrderDate, 
                SUM(oi.quantity) AS itemsUsed
            FROM orders o JOIN orderitems oi ON o.orderid = oi.orderid
            WHERE o.orderdate BETWEEN $1 AND $3 -- $1: oneWeekAgoStart, $3: todayEndOfDay
        `;
        const chartValues = [oneWeekAgoStartOfDay, today, todayEndOfDay];

        if (userRole !== 'Administrator') {
            usageSubQuery += ' AND o.userid = $4'; // $4: userId
            chartValues.push(userId);
        }
        usageSubQuery += ' GROUP BY o.orderdate::date';

        const chartQueryText = `
            WITH RECURSIVE DateSeries AS (
                SELECT $1::date AS DateValue
                UNION ALL
                SELECT (DateValue + INTERVAL '1 day')::date FROM DateSeries WHERE DateValue < $2::date
            )
            SELECT
                to_char(ds.DateValue, 'Dy') AS day,
                COALESCE(UsageData.itemsUsed, 0)::int AS usage
            FROM DateSeries ds
            LEFT JOIN (
                ${usageSubQuery}
            ) AS UsageData ON ds.DateValue = UsageData.OrderDate
            ORDER BY ds.DateValue ASC;
        `;

        const weeklyUsageResult = await db.query(chartQueryText, chartValues);
        weeklyUsage = weeklyUsageResult.rows;

        // Send combined response
        res.json({ stats, recentOrders, lowStockAlerts, weeklyUsage, usageChange, usageChangeType });

    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        res.status(500).send({ message: 'Server error while fetching dashboard data.' });
    }
});

module.exports = router;