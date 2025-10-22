const express = require('express');
const db = require('../db'); // Import the new 'db' object
const router = express.Router();

// POST /api/inventory/user-inventory - Fetch inventory for a user or all users
router.post('/user-inventory', async (req, res) => {
    const { userId, userRole } = req.body;
    if (!userId || !userRole) {
        return res.status(400).send({ message: 'UserID and Role are required.' });
    }

    try {
        let queryText;
        let queryParams = [];
        // Use lowercase schema, aliases for frontend keys
        const selectFields = `
            i.inventoryid as "InventoryID", 
            p.productid as "ProductID", 
            p.price as "Price", 
            p.name as "Name", 
            i.stockquantity as "StockQuantity", 
            i.reorderthreshold as "ReorderThreshold", 
            i.autoreorder as "AutoReorder"
        `;

        if (userRole === 'Administrator') {
            queryText = `
                SELECT ${selectFields}, u.name as "Owner" 
                FROM inventory i 
                JOIN products p ON i.productid = p.productid 
                JOIN users u ON i.userid = u.userid
            `;
        } else {
            queryText = `
                SELECT ${selectFields} 
                FROM inventory i 
                JOIN products p ON i.productid = p.productid 
                WHERE i.userid = $1
            `;
            queryParams.push(userId);
        }

        const result = await db.query(queryText, queryParams);
        // The aliases in the query ensure the keys are Uppercase for the frontend
        res.json(result.rows);

    } catch (error) {
        console.error('[ERROR] An error occurred in /user-inventory route:', error);
        res.status(500).send({ message: 'Server error while fetching inventory.' });
    }
});

// PUT /api/inventory/:id - Update inventory configuration (threshold, auto-reorder)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    // Frontend sends Uppercase keys
    const { ReorderThreshold, AutoReorder, UserID } = req.body; 

    // Convert AutoReorder (bit in SQL Server) to boolean for PostgreSQL
    const autoReorderBool = Boolean(AutoReorder);

    try {
        const queryText = `
            UPDATE inventory 
            SET reorderthreshold = $1, autoreorder = $2 
            WHERE inventoryid = $3 AND userid = $4
        `;
        const values = [ReorderThreshold, autoReorderBool, id, UserID];
        await db.query(queryText, values);
        
        res.status(200).send('Configuration updated successfully');
    } catch (error) {
        console.error('Error updating inventory config:', error);
        res.status(500).send({ message: 'Server error updating configuration.'});
    }
});

// POST /api/inventory/use - Reduce stock for a specific inventory item
router.post('/use', async (req, res) => {
    // Frontend sends camelCase/lowercase keys
    const { inventoryId, quantityUsed, userId } = req.body;

    if (!inventoryId || !quantityUsed || !userId || quantityUsed <= 0) {
        return res.status(400).json({ message: 'Valid Inventory ID, User ID, and a positive quantity are required.' });
    }

    // Use a client for transaction
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Get current stock and lock the row to prevent race conditions
        const selectQuery = 'SELECT stockquantity FROM inventory WHERE inventoryid = $1 AND userid = $2 FOR UPDATE';
        const inventoryResult = await client.query(selectQuery, [inventoryId, userId]);

        if (inventoryResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Inventory item not found for this user.' });
        }

        const currentStock = inventoryResult.rows[0].stockquantity;

        if (currentStock < quantityUsed) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: `Cannot use ${quantityUsed} items. Only ${currentStock} available.` });
        }

        // 2. Update the quantity
        const updateQuery = 'UPDATE inventory SET stockquantity = stockquantity - $1 WHERE inventoryid = $2';
        await client.query(updateQuery, [quantityUsed, inventoryId]);
        
        // --- ADDED: Log the usage ---
        const logQuery = 'INSERT INTO usagelog (inventoryid, userid, quantityused) VALUES ($1, $2, $3)';
        await client.query(logQuery, [inventoryId, userId, quantityUsed]);
        // --- End of addition ---

        await client.query('COMMIT');
        res.status(200).json({ message: 'Inventory updated successfully.' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error using inventory item:', err);
        res.status(500).send({ message: 'Server error while updating inventory.' });
    } finally {
        client.release(); // Release client back to the pool
    }
});

module.exports = router;