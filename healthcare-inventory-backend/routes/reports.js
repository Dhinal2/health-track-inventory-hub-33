const express = require('express');
const db = require('../db'); // Import the new 'db' object
const { parseISO, isValid } = require('date-fns'); // Import date-fns helpers

const router = express.Router();

/**
 * Calculates the percentage change between two numbers.
 * Ensures inputs are treated as numbers.
 */
const calculatePercentageChange = (current, previous) => {
    const currentNum = Number(current);
    const previousNum = Number(previous);

    // Validate inputs
    if (isNaN(currentNum) || isNaN(previousNum)) {
        console.warn("Invalid input for percentage change calculation:", current, previous);
        return "N/A"; // Or some other indicator of invalid data
    }

    if (previousNum === 0) {
        return currentNum > 0 ? "+100.0%" : "0.0%"; // Handle division by zero
    }
    const change = ((currentNum - previousNum) / previousNum) * 100;
    return (change >= 0 ? "+" : "") + change.toFixed(1) + "%";
};

/**
 * POST /api/reports/summary
 * Fetches summary data for the top cards on the reports page.
 */
router.post('/summary', async (req, res) => {
    let { from, to } = req.body;
    let fromDate, toDate, prevFromDate, prevToDate;

    try {
        fromDate = parseISO(from);
        toDate = parseISO(to);
        if (!isValid(fromDate) || !isValid(toDate)) {
            throw new Error('Invalid date format received.');
        }
        toDate.setHours(23, 59, 59, 999);

        const diff = toDate.getTime() - fromDate.getTime();
        prevFromDate = new Date(fromDate.getTime() - diff);
        prevToDate = new Date(fromDate.getTime() - 1);

    } catch (dateError) {
        console.error("Date processing error in /summary:", dateError);
        return res.status(400).send({ message: dateError.message || 'Invalid date range provided.' });
    }


    try {
        const stockResult = await db.query('SELECT SUM(stockquantity)::numeric AS totalstock FROM inventory;');
        const ordersResult = await db.query(
            'SELECT COUNT(*) AS ordercount FROM orders WHERE orderdate BETWEEN $1 AND $2;',
            [fromDate, toDate]
        );
        const revenueResult = await db.query(
            `SELECT SUM(totalamount)::numeric AS totalrevenue FROM invoices WHERE paymentstatus = 'Paid' AND issuedate BETWEEN $1 AND $2;`,
            [fromDate, toDate]
        );
        const lowStockResult = await db.query('SELECT COUNT(*) AS lowstockcount FROM inventory WHERE stockquantity < reorderthreshold;');

        const prevOrdersResult = await db.query(
            'SELECT COUNT(*) AS ordercount FROM orders WHERE orderdate BETWEEN $1 AND $2;',
            [prevFromDate, prevToDate]
        );
        const prevRevenueResult = await db.query(
            `SELECT SUM(totalamount)::numeric AS totalrevenue FROM invoices WHERE paymentstatus = 'Paid' AND issuedate BETWEEN $1 AND $2;`,
            [prevFromDate, prevToDate]
        );

        const ordersThisPeriod = parseInt(ordersResult.rows[0]?.ordercount || '0', 10);
        const totalRevenue = parseFloat(revenueResult.rows[0]?.totalrevenue || '0');
        const ordersLastPeriod = parseInt(prevOrdersResult.rows[0]?.ordercount || '0', 10);
        const revenueLastPeriod = parseFloat(prevRevenueResult.rows[0]?.totalrevenue || '0');
        const totalStock = parseInt(stockResult.rows[0]?.totalstock || '0', 10);
        const lowStockCount = parseInt(lowStockResult.rows[0]?.lowstockcount || '0', 10);


        res.json({
            totalItemsInStock: totalStock,
            ordersThisMonth: ordersThisPeriod,
            ordersChange: calculatePercentageChange(ordersThisPeriod, ordersLastPeriod),
            totalRevenue: totalRevenue,
            revenueChange: calculatePercentageChange(totalRevenue, revenueLastPeriod),
            lowStockItems: lowStockCount
        });
    } catch (err) {
        console.error('Error fetching summary report:', err);
        res.status(500).send({ message: 'Error fetching summary data from server.' });
    }
});

/**
 * POST /api/reports/detailed
 * Fetches detailed data for the report charts and tables.
 */
router.post('/detailed', async (req, res) => {
    let { reportType, from, to } = req.body;
    let fromDate, toDate;
     try {
        fromDate = parseISO(from);
        toDate = parseISO(to);
         if (!isValid(fromDate) || !isValid(toDate)) {
            throw new Error('Invalid date format received.');
        }
        toDate.setHours(23, 59, 59, 999);
     } catch (dateError) {
        console.error("Date processing error in /detailed:", dateError);
        return res.status(400).send({ message: dateError.message || 'Invalid date range provided.' });
    }

    let queryText = '';
    let queryParams = [fromDate, toDate];
    let title = '';
    // --- FIX: Removed TypeScript type annotation ---
    let columns = []; 
    let dataKey = ''; 
    // --- FIX: Removed TypeScript type annotation ---
    let chartKeys = []; 
    let chartType = 'bar';

    try {
        switch (reportType) {
            case 'inventory-summary':
                title = 'Current Inventory Levels';
                columns = ['Item Name', 'Current Stock', 'Reorder Threshold', 'Status'];
                chartType = 'bar';
                dataKey = 'itemName'; 
                chartKeys = ['currentStock']; 
                queryText = `
                    SELECT 
                        p.name as "itemName", 
                        i.stockquantity as "currentStock", 
                        i.reorderthreshold as "reorderThreshold"
                    FROM inventory i 
                    JOIN products p ON i.productid = p.productid 
                    ORDER BY i.stockquantity ASC;
                `;
                queryParams = []; 
                break;
                
            case 'low-stock':
                title = 'Low Stock Items';
                columns = ['Item Name', 'Current Stock', 'Reorder Threshold'];
                chartType = 'pie'; 
                dataKey = 'itemName';
                chartKeys = ['currentStock'];
                queryText = `
                    SELECT 
                        p.name as "itemName", 
                        i.stockquantity as "currentStock", 
                        i.reorderthreshold as "reorderThreshold"
                    FROM inventory i 
                    JOIN products p ON i.productid = p.productid 
                    WHERE i.stockquantity < i.reorderthreshold;
                `;
                queryParams = [];
                break;

            case 'order-history':
                title = 'Order History';
                columns = ['Order ID', 'Date', 'Placed By', 'Status', 'Total'];
                chartType = 'line';
                dataKey = 'date'; 
                chartKeys = ['total']; 
                queryText = `
                    SELECT 
                        o.orderid as "orderID", 
                        to_char(o.orderdate, 'YYYY-MM-DD') as date, 
                        u.name as "placedBy", 
                        o.status as status, 
                        o.totalamount::numeric as total 
                    FROM orders o 
                    JOIN users u ON o.userid = u.userid
                    WHERE o.orderdate BETWEEN $1 AND $2 
                    ORDER BY o.orderdate DESC;
                `;
                break;
            
            case 'financial-summary':
                title = 'Financial Summary';
                columns = ['Date', 'Total Revenue', 'Number of Orders', 'Average Order Value'];
                chartType = 'line';
                dataKey = 'date'; 
                chartKeys = ['totalRevenue', 'averageOrderValue']; 
                queryText = `
                    SELECT 
                        to_char(DATE_TRUNC('day', orderdate), 'YYYY-MM-DD') as date, 
                        SUM(totalamount)::numeric as "totalRevenue",
                        COUNT(orderid)::int as "numberOfOrders", 
                        AVG(totalamount)::numeric as "averageOrderValue" 
                    FROM orders 
                    WHERE orderdate BETWEEN $1 AND $2
                    GROUP BY DATE_TRUNC('day', orderdate) 
                    ORDER BY date;
                `;
                break;

            default:
                return res.status(400).send({ message: 'Invalid report type specified' });
        }
        
        const result = await db.query(queryText, queryParams);
        
        let reportData = result.rows;
        if(reportType === 'inventory-summary'){
            reportData = result.rows.map(row => ({
                ...row,
                status: Number(row.currentStock) < Number(row.reorderThreshold) ? 'Low' : 'OK'
            }));
        }
        reportData = reportData.map(row => {
             const newRow = {...row};
             chartKeys.forEach(key => {
                 if (newRow[key] !== undefined && newRow[key] !== null) {
                    const numVal = parseFloat(newRow[key]);
                     newRow[key] = isNaN(numVal) ? 0 : numVal; 
                 }
             });
              if (reportType === 'order-history' && newRow['total'] !== undefined) {
                 newRow['total'] = parseFloat(newRow['total'] || '0');
              }
               if (reportType === 'inventory-summary' || reportType === 'low-stock') {
                   newRow['currentStock'] = parseInt(newRow['currentStock'] || '0', 10);
                   newRow['reorderThreshold'] = parseInt(newRow['reorderThreshold'] || '0', 10);
               }
             return newRow;
        });


        res.json({ 
            title, 
            columns, 
            chartType, 
            dataKey, 
            chartKeys, 
            data: reportData 
        });

    } catch (err) {
        console.error(`Error fetching detailed report for ${reportType}:`, err);
        res.status(500).send({ message: 'Error fetching detailed report data from server.' });
    }
});

module.exports = router;