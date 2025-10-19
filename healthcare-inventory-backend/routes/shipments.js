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

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { status, destination, estimatedDelivery } = req.body;

    if (!status && !destination && !estimatedDelivery) {
        return res.status(400).send({ message: 'No update information provided.' });
    }

    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        const request = new sql.Request(transaction).input('ShipmentID', sql.Int, id);

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
        
        const updateShipmentQuery = `UPDATE Shipments SET ${queryParts.join(', ')} WHERE ShipmentID = @ShipmentID`;
        await request.query(updateShipmentQuery);
        
        if (status) {
            const orderResult = await new sql.Request(transaction).input('ShipmentID', sql.Int, id).query('SELECT OrderID FROM Shipments WHERE ShipmentID = @ShipmentID');
            
            if (orderResult.recordset.length > 0) {
                const { OrderID } = orderResult.recordset[0];
                let newOrderStatus = '';

                // --- LOGIC FIX: Correctly map all shipment statuses to order statuses ---
                switch (status) {
                    case 'Pending':
                        newOrderStatus = 'Dispatched';
                        break;
                    case 'In Transit':
                        newOrderStatus = 'Dispatched'; // Order is still considered 'Dispatched' while in transit
                        break;
                    case 'Delivered':
                        newOrderStatus = 'Delivered';
                        break;
                }

                if (newOrderStatus) {
                    await new sql.Request(transaction)
                        .input('OrderID', sql.Int, OrderID)
                        .input('Status', sql.NVarChar, newOrderStatus)
                        .query("UPDATE Orders SET Status = @Status WHERE OrderID = @OrderID");
                }
            }
        }

        await transaction.commit();
        res.status(200).send({ message: `Shipment updated successfully.` });

    } catch (error) {
        await transaction.rollback();
        console.error('Error updating shipment:', error);
        res.status(500).send({ message: 'Server error during shipment update' });
    }
});

module.exports = router;