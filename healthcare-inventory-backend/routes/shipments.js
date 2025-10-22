const express = require('express');
const db = require('../db'); // Import the new 'db' object
const router = express.Router();

// POST /api/shipments/user-shipments - Fetch shipments based on user role
router.post('/user-shipments', async (req, res) => {
    const { userId, userRole } = req.body;
    if (!userId || !userRole) {
        return res.status(400).send({ message: 'UserID and Role are required.' });
    }
    try {
        let queryText;
        let queryParams = [];

        // Use lowercase schema, aliases for frontend keys
        const selectFields = `
            s.shipmentid as "ShipmentID", 
            s.orderid as "OrderID", 
            s.destination as "Destination", 
            s.status as "Status", 
            s.estimateddelivery as "EstimatedDelivery", 
            s.origin as "Origin", 
            s.currentlocation as "CurrentLocation"
        `;

        if (userRole === 'Administrator') {
            queryText = `
                SELECT ${selectFields}, u.name as "DestinationUser" 
                FROM shipments s
                JOIN orders o ON s.orderid = o.orderid
                JOIN users u ON o.userid = u.userid
                ORDER BY s.shipmentid DESC
            `;
        } else {
            queryText = `
                SELECT ${selectFields}, u.name as "DestinationUser" 
                FROM shipments s
                JOIN orders o ON s.orderid = o.orderid
                JOIN users u ON o.userid = u.userid
                WHERE o.userid = $1
                ORDER BY s.shipmentid DESC
            `;
            queryParams.push(userId);
        }
        
        const result = await db.query(queryText, queryParams);
        // Aliases ensure Uppercase keys for the frontend
        res.json(result.rows);

    } catch (error) {
        console.error('Error fetching shipments:', error);
        res.status(500).send({ message: 'Server error fetching shipments' });
    }
});

// PUT /api/shipments/:id - Update shipment status, location, etc.
router.put('/:id', async (req, res) => {
    const { id } = req.params; // shipmentId
    // Frontend sends Uppercase/camelCase keys
    const { status, Destination, CurrentLocation } = req.body; 

    if (!status && !Destination && !CurrentLocation) {
        return res.status(400).send({ message: 'No update information provided.' });
    }

    // Use a client for transaction
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        const updateFields = [];
        const values = [];
        let queryIndex = 1;

        // Dynamically build the UPDATE query for shipments
        if (status) {
            updateFields.push(`status = $${queryIndex++}`);
            values.push(status); // Use status directly (e.g., 'In Transit', 'Delivered')
        }
        if (Destination) {
            updateFields.push(`destination = $${queryIndex++}`);
            values.push(Destination);
        }
        if (CurrentLocation) {
            updateFields.push(`currentlocation = $${queryIndex++}`);
            values.push(CurrentLocation);
        }

        // Add shipment ID for WHERE clause
        values.push(id);
        const idIndex = queryIndex;

        const updateShipmentQuery = `
            UPDATE shipments 
            SET ${updateFields.join(', ')} 
            WHERE shipmentid = $${idIndex}
        `;
        await client.query(updateShipmentQuery, values);

        // If status was updated, update the corresponding order status
        if (status) {
            // Get the order ID associated with this shipment
            const orderResult = await client.query('SELECT orderid FROM shipments WHERE shipmentid = $1', [id]);

            if (orderResult.rows.length > 0) {
                const { orderid } = orderResult.rows[0];
                let newOrderStatus = '';

                // Map shipment status to order status (using lowercase for comparison)
                switch (status.toLowerCase()) {
                    case 'pending':
                    case 'in transit': // Both pending and in transit map to Dispatched order status
                        newOrderStatus = 'Dispatched'; 
                        break;
                    case 'delivered':
                        newOrderStatus = 'Delivered';
                        break;
                }

                // If a valid mapping exists, update the order
                if (newOrderStatus) {
                    const updateOrderQuery = "UPDATE orders SET status = $1 WHERE orderid = $2";
                    await client.query(updateOrderQuery, [newOrderStatus, orderid]);
                }
            }
        }
        
        await client.query('COMMIT');
        res.status(200).send({ message: `Shipment updated successfully.` });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating shipment:', error);
        res.status(500).send({ message: 'Server error during shipment update' });
    } finally {
        client.release(); // Release client back to the pool
    }
});

module.exports = router;