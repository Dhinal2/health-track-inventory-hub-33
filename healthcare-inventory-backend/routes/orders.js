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

// GET /api/orders - Fetch orders based on user role
router.post('/user-orders', async (req, res) => {
    const { userId, userRole } = req.body;

    if (!userId || !userRole) {
        return res.status(400).send({ message: 'UserID and Role are required.' });
    }

    try {
        const pool = await sql.connect(dbConfig);
        let query;

        if (userRole === 'Administrator') {
            // Admin sees all orders and who placed them
            query = `
                SELECT o.*, u.Name as PlacedBy FROM Orders o
                JOIN Users u ON o.UserID = u.UserID
                ORDER BY o.OrderDate DESC
            `;
        } else {
            // Staff only sees their own orders
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

        res.json(ordersWithItems);

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send({ message: 'Server error' });
    }
});


// POST /api/orders - Create a new order
router.post('/', async (req, res) => {
    const { userId, items, totalAmount } = req.body;

    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Insert into Orders table
        const orderResult = await new sql.Request(transaction)
            .input('UserID', sql.Int, userId)
            .input('TotalAmount', sql.Decimal(10, 2), totalAmount)
            .query('INSERT INTO Orders (UserID, TotalAmount) OUTPUT INSERTED.OrderID VALUES (@UserID, @TotalAmount)');
        
        const orderId = orderResult.recordset[0].OrderID;

        // 2. Insert each item into OrderItems table
        for (const item of items) {
            await new sql.Request(transaction)
                .input('OrderID', sql.Int, orderId)
                .input('ProductID', sql.Int, item.ProductID)
                .input('Quantity', sql.Int, item.Quantity)
                .input('UnitPrice', sql.Decimal(10, 2), item.Price)
                .query('INSERT INTO OrderItems (OrderID, ProductID, Quantity, UnitPrice) VALUES (@OrderID, @ProductID, @Quantity, @UnitPrice)');
        }

        await transaction.commit();
        res.status(201).send({ message: 'Order created successfully', orderId });

    } catch (error) {
        await transaction.rollback();
        console.error('Error creating order:', error);
        res.status(500).send({ message: 'Failed to create order' });
    }
});


// PUT /api/orders/:id/status - Update order status (Admin only)
router.put('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Update the order status
        await new sql.Request(transaction)
            .input('OrderID', sql.Int, id)
            .input('Status', sql.NVarChar, status)
            .query('UPDATE Orders SET Status = @Status WHERE OrderID = @OrderID');

        if (status === 'Approved') {
            // 2. Create the shipment
            await new sql.Request(transaction)
                .input('OrderID', sql.Int, id)
                .query("INSERT INTO Shipments (OrderID, Status, Destination) VALUES (@OrderID, 'Pending', 'User Department')");

            // 3. THE FIX: Get all items from the order
            const orderItemsResult = await new sql.Request(transaction)
                .input('OrderID', sql.Int, id)
                .query('SELECT ProductID, Quantity FROM OrderItems WHERE OrderID = @OrderID');
            
            // 4. Loop through each item and decrement the stock in the Products table
            for (const item of orderItemsResult.recordset) {
                await new sql.Request(transaction)
                    .input('Quantity', sql.Int, item.Quantity)
                    .input('ProductID', sql.Int, item.ProductID)
                    .query('UPDATE Products SET StockQuantity = StockQuantity - @Quantity WHERE ProductID = @ProductID');
            }
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