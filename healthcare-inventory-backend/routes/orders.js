const express = require('express');
const sql = require('mssql');
const router = express.Router();

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

// This route remains the same
router.post('/user-orders', async (req, res) => {
    const { userId, userRole } = req.body;
    if (!userId || !userRole) {
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
        res.json(ordersWithItems);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send({ message: 'Server error' });
    }
});

// This route remains the same
router.post('/', async (req, res) => {
    const { userId, items, totalAmount } = req.body;
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const orderResult = await new sql.Request(transaction).input('UserID', sql.Int, userId).input('TotalAmount', sql.Decimal(10, 2), totalAmount).query('INSERT INTO Orders (UserID, TotalAmount) OUTPUT INSERTED.OrderID VALUES (@UserID, @TotalAmount)');
        const orderId = orderResult.recordset[0].OrderID;

        for (const item of items) {
            // --- THIS IS THE FIX ---
            // The frontend sends 'UnitPrice', so we use 'item.UnitPrice' here instead of 'item.Price'
            await new sql.Request(transaction)
                .input('OrderID', sql.Int, orderId)
                .input('ProductID', sql.Int, item.ProductID)
                .input('Quantity', sql.Int, item.Quantity)
                .input('UnitPrice', sql.Decimal(10, 2), item.UnitPrice) // Corrected from item.Price
                .query('INSERT INTO OrderItems (OrderID, ProductID, Quantity, UnitPrice) VALUES (@OrderID, @ProductID, @Quantity, @UnitPrice)');
        }
        
        await new sql.Request(transaction).input('OrderID', sql.Int, orderId).input('TotalAmount', sql.Decimal(10, 2), totalAmount).query('INSERT INTO Invoices (OrderID, TotalAmount, PaymentStatus) VALUES (@OrderID, @TotalAmount, \'Unpaid\')');
        await transaction.commit();
        res.status(201).send({ message: 'Order created successfully', orderId });

    } catch (error) {
        await transaction.rollback();
        console.error('Error creating order:', error);
        res.status(500).send({ message: 'Failed to create order' });
    }
});

router.put('/:id/status', async (req, res) => {
    // This route is correct and remains unchanged
    const { id } = req.params;
    const { status } = req.body;
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        let newStatus = status;
        if (status === 'Approved') {
            newStatus = 'Awaiting Payment';
        } else if (status === 'Received') {
            const invoiceResult = await new sql.Request(transaction).input('OrderID', sql.Int, id).query('SELECT PaymentStatus FROM Invoices WHERE OrderID = @OrderID');
            const invoice = invoiceResult.recordset[0];
            if (invoice.PaymentStatus === 'Paid') {
                newStatus = 'Completed';
            } else if (invoice.PaymentStatus === 'Partially Paid') {
                newStatus = 'Pending Final Payment';
            }
        }
        await new sql.Request(transaction).input('OrderID', sql.Int, id).input('Status', sql.NVarChar, newStatus).query('UPDATE Orders SET Status = @Status WHERE OrderID = @OrderID');
        await transaction.commit();
        res.status(200).send({ message: `Order status updated to ${newStatus}` });
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating order status:', error);
        res.status(500).send({ message: 'Server error' });
    }
});
// CORRECTED: This route is now simplified. It no longer handles shipment creation or 'Delivered' status.
router.put('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        let newStatus = status;

        if (status === 'Approved') {
            newStatus = 'Awaiting Payment';
        } else if (status === 'Received') {
            // When an order is received, check its payment status to decide the next step.
            const invoiceResult = await new sql.Request(transaction).input('OrderID', sql.Int, id).query('SELECT PaymentStatus FROM Invoices WHERE OrderID = @OrderID');
            const invoice = invoiceResult.recordset[0];

            if (invoice.PaymentStatus === 'Paid') {
                // This case should be rare, but if paid in full before delivery, just complete it.
                newStatus = 'Completed';
            } else if (invoice.PaymentStatus === 'Partially Paid') {
                // If partially paid, set status to require final payment.
                newStatus = 'Pending Final Payment';
            }
        }
        
        await new sql.Request(transaction).input('OrderID', sql.Int, id).input('Status', sql.NVarChar, newStatus).query('UPDATE Orders SET Status = @Status WHERE OrderID = @OrderID');

        await transaction.commit();
        res.status(200).send({ message: `Order status updated to ${newStatus}` });

    } catch (error) {
        await transaction.rollback();
        console.error('Error updating order status:', error);
        res.status(500).send({ message: 'Server error' });
    }
});

module.exports = router;