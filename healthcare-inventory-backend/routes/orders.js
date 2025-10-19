const express = require('express');
const { sql, poolPromise } = require('../db'); // Import the shared connection
const router = express.Router();

// This route for fetching user orders is correct and remains unchanged.
router.post('/user-orders', async (req, res) => {
    const { userId, userRole } = req.body;
    if (!userId || !userRole) {
        return res.status(400).send({ message: 'UserID and Role are required.' });
    }
    try {
        const pool = await poolPromise;
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

// POST /api/orders - Create a new order
router.post('/', async (req, res) => {
    const { userId, items, totalAmount } = req.body;
    try {
        const pool = await poolPromise;
        const transaction = pool.transaction();
        await transaction.begin();
        
        try {
            const orderResult = await new sql.Request(transaction)
                .input('UserID', sql.Int, userId)
                .input('TotalAmount', sql.Decimal(10, 2), totalAmount)
                .query('INSERT INTO Orders (UserID, TotalAmount, Status) OUTPUT INSERTED.OrderID VALUES (@UserID, @TotalAmount, \'Pending\')');
            
            const orderId = orderResult.recordset[0].OrderID;

            for (const item of items) {
                // --- THIS IS THE DEFINITIVE FIX ---
                // The frontend's CreateOrderModal.tsx sends 'UnitPrice', so we must use 'item.UnitPrice' here.
                await new sql.Request(transaction)
                    .input('OrderID', sql.Int, orderId)
                    .input('ProductID', sql.Int, item.ProductID)
                    .input('Quantity', sql.Int, item.Quantity)
                    .input('UnitPrice', sql.Decimal(10, 2), item.UnitPrice) // This now correctly matches the frontend
                    .query('INSERT INTO OrderItems (OrderID, ProductID, Quantity, UnitPrice) VALUES (@OrderID, @ProductID, @Quantity, @UnitPrice)');
            }
            
            await new sql.Request(transaction)
                .input('OrderID', sql.Int, orderId)
                .input('TotalAmount', sql.Decimal(10, 2), totalAmount)
                .query('INSERT INTO Invoices (OrderID, TotalAmount, PaymentStatus) VALUES (@OrderID, @TotalAmount, \'Unpaid\')');

            await transaction.commit();
            res.status(201).send({ message: 'Order created successfully', orderId });

        } catch (err) {
            await transaction.rollback();
            console.error('Error in order creation transaction:', err);
            res.status(500).send({ message: 'Failed to create order due to a transaction error.' });
        }
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).send({ message: 'Failed to create order' });
    }
});


// This route for updating status is correct and remains unchanged.
router.put('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    try {
        const pool = await poolPromise;
        const transaction = pool.transaction();
        await transaction.begin();

        try {
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
            
            await new sql.Request(transaction)
                .input('OrderID', sql.Int, id)
                .input('Status', sql.NVarChar, newStatus)
                .query('UPDATE Orders SET Status = @Status WHERE OrderID = @OrderID');

            await transaction.commit();
            res.status(200).send({ message: `Order status updated to ${newStatus}` });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).send({ message: 'Server error' });
    }
});

module.exports = router;