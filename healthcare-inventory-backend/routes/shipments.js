const express = require('express');
const sql = require('mssql');
const router = express.Router();

const dbConfig = {
    user: 'healthcare_app_user',
    password: 'Pass123!', // Use your actual password
    server: 'ASUS-TUF-GAMING\\SQLEXPRESS',
    database: 'HealthCareDB',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// GET /api/shipments - Fetch shipments based on user role
router.post('/user-shipments', async (req, res) => {
    const { userId, userRole } = req.body;

    if (!userId || !userRole) {
        return res.status(400).send({ message: 'UserID and Role are required.' });
    }

    try {
        const pool = await sql.connect(dbConfig);
        let query;

        if (userRole === 'Administrator') {
            query = `
                SELECT s.*, u.Name as DestinationUser FROM Shipments s
                JOIN Orders o ON s.OrderID = o.OrderID
                JOIN Users u ON o.UserID = u.UserID
                ORDER BY s.ShipmentID DESC
            `;
        } else {
            query = `
                SELECT s.*, u.Name as DestinationUser FROM Shipments s
                JOIN Orders o ON s.OrderID = o.OrderID
                JOIN Users u ON o.UserID = u.UserID
                WHERE o.UserID = @UserID
                ORDER BY s.ShipmentID DESC
            `;
        }
        
        const request = pool.request();
        if (userRole !== 'Administrator') {
            request.input('UserID', sql.Int, userId);
        }

        const result = await request.query(query);
        res.json(result.recordset);

    } catch (error) {
        console.error('Error fetching shipments:', error);
        res.status(500).send({ message: 'Server error' });
    }
});


// PUT /api/shipments/:id/status - Update shipment status (Admin only)
router.put('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Update the Shipment status
        await new sql.Request(transaction)
            .input('ShipmentID', sql.Int, id)
            .input('Status', sql.NVarChar, status)
            .query('UPDATE Shipments SET Status = @Status WHERE ShipmentID = @ShipmentID');

        // 2. If the new status is 'Delivered', trigger the next steps
        if (status === 'Delivered') {
            // Get Order details from the ShipmentID
            const orderResult = await new sql.Request(transaction)
                .input('ShipmentID', sql.Int, id)
                .query('SELECT * FROM Orders WHERE OrderID = (SELECT OrderID FROM Shipments WHERE ShipmentID = @ShipmentID)');
            
            const order = orderResult.recordset[0];

            // 3. Create a new Invoice
            await new sql.Request(transaction)
                .input('OrderID', sql.Int, order.OrderID)
                .input('TotalAmount', sql.Decimal(10, 2), order.TotalAmount)
                .query('INSERT INTO Invoices (OrderID, TotalAmount, PaymentStatus) VALUES (@OrderID, @TotalAmount, \'Unpaid\')');

            // 4. Update the User's Inventory for each item in the order
            const orderItemsResult = await new sql.Request(transaction)
                .input('OrderID', sql.Int, order.OrderID)
                .query('SELECT * FROM OrderItems WHERE OrderID = @OrderID');

            for (const item of orderItemsResult.recordset) {
                // Check if the user already has an inventory record for this product
                const inventoryCheck = await new sql.Request(transaction)
                    .input('UserID', sql.Int, order.UserID)
                    .input('ProductID', sql.Int, item.ProductID)
                    .query('SELECT * FROM Inventory WHERE UserID = @UserID AND ProductID = @ProductID');

                if (inventoryCheck.recordset.length > 0) {
                    // If it exists, update the quantity
                    await new sql.Request(transaction)
                        .input('UserID', sql.Int, order.UserID)
                        .input('ProductID', sql.Int, item.ProductID)
                        .input('Quantity', sql.Int, item.Quantity)
                        .query('UPDATE Inventory SET StockQuantity = StockQuantity + @Quantity WHERE UserID = @UserID AND ProductID = @ProductID');
                } else {
                    // If not, create a new inventory record
                    await new sql.Request(transaction)
                        .input('UserID', sql.Int, order.UserID)
                        .input('ProductID', sql.Int, item.ProductID)
                        .input('Quantity', sql.Int, item.Quantity)
                        .query('INSERT INTO Inventory (UserID, ProductID, StockQuantity, ReorderThreshold, AutoReorder) VALUES (@UserID, @ProductID, @Quantity, 50, 0)');
                }
            }
             // 5. Finally, update the original Order's status to 'Delivered'
            await new sql.Request(transaction)
                .input('OrderID', sql.Int, order.OrderID)
                .query("UPDATE Orders SET Status = 'Delivered' WHERE OrderID = @OrderID");
        }

        await transaction.commit();
        res.status(200).send({ message: `Shipment status updated to ${status}` });

    } catch (error) {
        await transaction.rollback();
        console.error('Error updating shipment status:', error);
        res.status(500).send({ message: 'Server error during shipment update' });
    }
});


module.exports = router;