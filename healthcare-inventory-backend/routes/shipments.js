const express = require('express');
const { sql, poolPromise } = require('../db');
const router = express.Router();

router.post('/user-shipments', async (req, res) => {
    const { userId, userRole } = req.body;
    if (!userId || !userRole) {
        return res.status(400).send({ message: 'UserID and Role are required.' });
    }
    try {
        const pool = await poolPromise;
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
    const { status, Destination, CurrentLocation } = req.body;

    if (!status && !Destination && !CurrentLocation) {
        return res.status(400).send({ message: 'No update information provided.' });
    }

    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction).input('ShipmentID', sql.Int, id);

            let queryParts = [];
            if (status) {
                queryParts.push("Status = @Status");
                request.input('Status', sql.NVarChar, status);
            }
            if (Destination) {
                queryParts.push("Destination = @Destination");
                request.input('Destination', sql.NVarChar, Destination);
            }
            if (CurrentLocation) {
                queryParts.push("CurrentLocation = @CurrentLocation");
                request.input('CurrentLocation', sql.NVarChar, CurrentLocation);
            }

            const updateShipmentQuery = `UPDATE Shipments SET ${queryParts.join(', ')} WHERE ShipmentID = @ShipmentID`;
            await request.query(updateShipmentQuery);

            if (status) {
                const orderResult = await new sql.Request(transaction).input('ShipmentID', sql.Int, id).query('SELECT OrderID FROM Shipments WHERE ShipmentID = @ShipmentID');

                if (orderResult.recordset.length > 0) {
                    const { OrderID } = orderResult.recordset[0];
                    let newOrderStatus = '';

                    // --- THIS IS THE FIX ---
                    // When a shipment is 'in transit', the order is 'Dispatched'.
                    switch (status.toLowerCase()) {
                        case 'pending':
                            newOrderStatus = 'Dispatched';
                            break;
                        case 'in transit':
                            newOrderStatus = 'Dispatched'; // Use the correct status for the order
                            break;
                        case 'delivered':
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

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (error) {
        console.error('Error updating shipment:', error);
        res.status(500).send({ message: 'Server error during shipment update' });
    }
});

module.exports = router;