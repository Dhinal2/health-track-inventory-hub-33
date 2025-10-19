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

// GET /api/shipments/user-shipments - Fetch shipments based on user role
router.post('/user-shipments', async (req, res) => {
    // ... (This route is correct and remains unchanged)
    const { userId, userRole } = req.body;
    if (!userId || !userRole) {
        return res.status(400).send({ message: 'UserID and Role are required.' });
    }
    try {
        const pool = await sql.connect(dbConfig);
        let query;
        if (userRole === 'Administrator') {
            query = `
                SELECT s.*, o.OrderID, u.Name as DestinationUser FROM Shipments s
                JOIN Orders o ON s.OrderID = o.OrderID
                JOIN Users u ON o.UserID = u.UserID
                ORDER BY s.ShipmentID DESC
            `;
        } else {
            query = `
                SELECT s.*, o.OrderID, u.Name as DestinationUser FROM Shipments s
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

// NEW: PUT /api/shipments/:id - A general-purpose update route for shipments
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    // We can accept multiple fields to update, not just status
    const { status, destination, estimatedDelivery } = req.body;

    // Basic validation
    if (!status && !destination && !estimatedDelivery) {
        return res.status(400).send({ message: 'No update information provided.' });
    }

    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request().input('ShipmentID', sql.Int, id);

        // Dynamically build the query based on what fields are provided
        let queryParts = [];
        if (status) {
            queryParts.push("Status = @Status");
            request.input('Status', sql.NVarChar, status);
        }
        if (destination) {
            queryParts.push("Destination = @Destination");
            request.input('Destination', sql.NVarChar, destination);
        }
        if (estimatedDelivery) {
            queryParts.push("EstimatedDelivery = @EstimatedDelivery");
            request.input('EstimatedDelivery', sql.Date, estimatedDelivery);
        }
        
        const query = `UPDATE Shipments SET ${queryParts.join(', ')} WHERE ShipmentID = @ShipmentID`;

        await request.query(query);
        
        // Handle the special logic for 'Delivered' status
        if (status === 'Delivered') {
            const transaction = new sql.Transaction(pool);
            await transaction.begin();
            try {
                const orderResult = await new sql.Request(transaction)
                    .input('ShipmentID', sql.Int, id)
                    .query('SELECT OrderID FROM Shipments WHERE ShipmentID = @ShipmentID');
                const { OrderID } = orderResult.recordset[0];

                await new sql.Request(transaction)
                    .input('OrderID', sql.Int, OrderID)
                    .query("UPDATE Orders SET Status = 'Delivered' WHERE OrderID = @OrderID");
                
                await transaction.commit();
            } catch (err) {
                await transaction.rollback();
                throw err; // Propagate error to the outer catch block
            }
        }

        res.status(200).send({ message: `Shipment updated successfully.` });

    } catch (error) {
        console.error('Error updating shipment:', error);
        res.status(500).send({ message: 'Server error during shipment update' });
    }
});

module.exports = router;