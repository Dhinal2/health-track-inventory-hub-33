const express = require('express');
const sql = require('mssql');
const router = express.Router();

console.log("  -> 📦 Loading orders.js routes..."); // <-- ADDED LOG

const dbConfig = {
    user: 'healthcare_app_user',
    password: 'Pass123!', // Make sure to use your actual password
    server: 'ASUS-TUF-GAMING\\SQLEXPRESS',
    database: 'HealthCareDB',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// GET /api/orders/user-orders - Fetch orders based on user role
router.post('/user-orders', async (req, res) => {
    console.log("  -> 🎯 [POST /api/orders/user-orders] Route hit!"); // <-- ADDED LOG
    const { userId, userRole } = req.body;

    if (!userId || !userRole) {
        console.log("  -> ❗ Error: UserID or Role missing.");
        return res.status(400).send({ message: 'UserID and Role are required.' });
    }

    try {
        const pool = await sql.connect(dbConfig);
        let query;

        if (userRole === 'Administrator') {
            query = `
                SELECT o.*, u.Name as PlacedBy FROM Orders o
                JOIN Users u ON o.UserID = u.UserID
                ORDER BY o.OrderDate DESC
            `;
        } else {
            query = `
                SELECT o.*, u.Name as PlacedBy FROM Orders o
                JOIN Users u ON o.UserID = u.UserID
                WHERE o.UserID = @UserID
                ORDER BY o.OrderDate DESC
            `;
        }
        
        const request = pool.request();
        if (userRole !== 'Administrator') {
            request.input('UserID', sql.Int, userId);
        }

        const result = await request.query(query);

        // For each order, get its items
        const ordersWithItems = await Promise.all(result.recordset.map(async (order) => {
            const itemsResult = await pool.request()
                .input('OrderID', sql.Int, order.OrderID)
                .query(`
                    SELECT oi.*, p.Name as ProductName 
                    FROM OrderItems oi
                    JOIN Products p ON oi.ProductID = p.ProductID
                    WHERE oi.OrderID = @OrderID
                `);
            return { ...order, Items: itemsResult.recordset };
        }));

        console.log(`  -> ✅ Found ${ordersWithItems.length} orders.`);
        res.json(ordersWithItems);

    } catch (error) {
        console.error('  -> ❌ Error fetching orders:', error);
        res.status(500).send({ message: 'Server error' });
    }
});

// POST /api/orders - Create a new order
router.post('/', async (req, res) => {
    // ... (rest of the file remains the same)
    const { userId, items, totalAmount } = req.body;
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const orderResult = await new sql.Request(transaction)
            .input('UserID', sql.Int, userId)
            .input('TotalAmount', sql.Decimal(10, 2), totalAmount)
            .query('INSERT INTO Orders (UserID, TotalAmount) OUTPUT INSERTED.OrderID VALUES (@UserID, @TotalAmount)');
        const orderId = orderResult.recordset[0].OrderID;
        for (const item of items) {
            await new sql.Request(transaction)
                .input('OrderID', sql.Int, orderId)
                .input('ProductID', sql.Int, item.ProductID)
                .input('Quantity', sql.Int, item.Quantity)
                .input('UnitPrice', sql.Decimal(10, 2), item.Price)
                .query('INSERT INTO OrderItems (OrderID, ProductID, Quantity, UnitPrice) VALUES (@OrderID, @ProductID, @Quantity, @UnitPrice)');
        }
        await new sql.Request(transaction)
            .input('OrderID', sql.Int, orderId)
            .input('TotalAmount', sql.Decimal(10, 2), totalAmount)
            .query('INSERT INTO Invoices (OrderID, TotalAmount, PaymentStatus) VALUES (@OrderID, @TotalAmount, \'Unpaid\')');
        await transaction.commit();
        res.status(201).send({ message: 'Order created successfully', orderId });
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating order:', error);
        res.status(500).send({ message: 'Failed to create order' });
    }
});


// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', async (req, res) => {
    // ... (rest of the file remains the same)
    const { id } = req.params;
    const { status } = req.body;
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const updateStatus = async (newStatus) => {
             await new sql.Request(transaction)
                .input('OrderID', sql.Int, id)
                .input('Status', sql.NVarChar, newStatus)
                .query('UPDATE Orders SET Status = @Status WHERE OrderID = @OrderID');
        };
        if (status === 'Approved') {
            await updateStatus('Awaiting Payment');
        } else if (status === 'Received') {
            const orderResult = await new sql.Request(transaction).input('OrderID', sql.Int, id).query('SELECT * FROM Orders WHERE OrderID = @OrderID');
            const order = orderResult.recordset[0];
            const invoiceResult = await new sql.Request(transaction).input('OrderID', sql.Int, id).query('SELECT PaymentStatus FROM Invoices WHERE OrderID = @OrderID');
            const invoice = invoiceResult.recordset[0];
            if (invoice.PaymentStatus === 'Paid') {
                const orderItemsResult = await new sql.Request(transaction).input('OrderID', sql.Int, id).query('SELECT * FROM OrderItems WHERE OrderID = @OrderID');
                for (const item of orderItemsResult.recordset) {
                    const inventoryCheck = await new sql.Request(transaction).input('UserID', sql.Int, order.UserID).input('ProductID', sql.Int, item.ProductID).query('SELECT * FROM Inventory WHERE UserID = @UserID AND ProductID = @ProductID');
                    if (inventoryCheck.recordset.length > 0) {
                        await new sql.Request(transaction).input('UserID', sql.Int, order.UserID).input('ProductID', sql.Int, item.ProductID).input('Quantity', sql.Int, item.Quantity).query('UPDATE Inventory SET StockQuantity = StockQuantity + @Quantity WHERE UserID = @UserID AND ProductID = @ProductID');
                    } else {
                        await new sql.Request(transaction).input('UserID', sql.Int, order.UserID).input('ProductID', sql.Int, item.ProductID).input('Quantity', sql.Int, item.Quantity).query('INSERT INTO Inventory (UserID, ProductID, StockQuantity, ReorderThreshold, AutoReorder) VALUES (@UserID, @ProductID, @Quantity, 50, 0)');
                    }
                }
                await updateStatus('Completed');
            } else if (invoice.PaymentStatus === 'Partially Paid') {
                await updateStatus('Pending Final Payment');
            }
        } else {
            await updateStatus(status);
        }
        await transaction.commit();
        res.status(200).send({ message: `Order status updated to ${status}` });
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating order status:', error);
        res.status(500).send({ message: 'Server error' });
    }
});

module.exports = router;
console.log("  -> ✅ orders.js routes loaded."); // <-- ADDED LOG