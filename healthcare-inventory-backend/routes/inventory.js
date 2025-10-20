const express = require('express');
const { sql, poolPromise } = require('../db');
const router = express.Router();

router.post('/user-inventory', async (req, res) => {
    const { userId, userRole } = req.body;
    if (!userId || !userRole) {
        return res.status(400).send('UserID and Role are required.');
    }

    try {
        const pool = await poolPromise;
        let query;
        const selectFields = `i.InventoryID, p.ProductID, p.Price, p.Name, i.StockQuantity, i.ReorderThreshold, i.AutoReorder`;

        if (userRole === 'Administrator') {
            query = `SELECT ${selectFields}, u.Name as Owner FROM Inventory i JOIN Products p ON i.ProductID = p.ProductID JOIN Users u ON i.UserID = u.UserID`;
        } else {
            query = `SELECT ${selectFields} FROM Inventory i JOIN Products p ON i.ProductID = p.ProductID WHERE i.UserID = @UserID`;
        }
        
        const request = pool.request();
        if (userRole !== 'Administrator') {
            request.input('UserID', sql.Int, userId);
        }

        const result = await request.query(query);
        res.json(result.recordset);

    } catch (error) {
        console.error('[ERROR] An error occurred in /user-inventory route:', error);
        res.status(500).send({ message: 'Server error while fetching inventory.' });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { ReorderThreshold, AutoReorder, UserID } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('InventoryID', sql.Int, id)
            .input('UserID', sql.Int, UserID)
            .input('ReorderThreshold', sql.Int, ReorderThreshold)
            .input('AutoReorder', sql.Bit, AutoReorder)
            .query('UPDATE Inventory SET ReorderThreshold = @ReorderThreshold, AutoReorder = @AutoReorder WHERE InventoryID = @InventoryID AND UserID = @UserID');
        res.status(200).send('Configuration updated successfully');
    } catch (error) {
        console.error('Error updating inventory config:', error);
        res.status(500).send('Server error');
    }
});

// POST /api/inventory/use - Reduce stock for a specific inventory item
router.post('/use', async (req, res) => {
    const { inventoryId, quantityUsed, userId } = req.body;

    if (!inventoryId || !quantityUsed || !userId || quantityUsed <= 0) {
        return res.status(400).json({ message: 'Valid Inventory ID, User ID, and a positive quantity are required.' });
    }

    try {
        const pool = await poolPromise;
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // First, get the current stock to ensure we don't go below zero
            const inventoryResult = await new sql.Request(transaction)
                .input('InventoryID', sql.Int, inventoryId)
                .input('UserID', sql.Int, userId)
                .query('SELECT StockQuantity FROM Inventory WHERE InventoryID = @InventoryID AND UserID = @UserID');

            if (inventoryResult.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({ message: 'Inventory item not found for this user.' });
            }

            const currentStock = inventoryResult.recordset[0].StockQuantity;

            if (currentStock < quantityUsed) {
                await transaction.rollback();
                return res.status(400).json({ message: `Cannot use ${quantityUsed} items. Only ${currentStock} available.` });
            }

            // If stock is sufficient, update the quantity
            await new sql.Request(transaction)
                .input('InventoryID', sql.Int, inventoryId)
                .input('QuantityUsed', sql.Int, quantityUsed)
                .query('UPDATE Inventory SET StockQuantity = StockQuantity - @QuantityUsed WHERE InventoryID = @InventoryID');

            await transaction.commit();
            res.status(200).json({ message: 'Inventory updated successfully.' });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('Error using inventory item:', err);
        res.status(500).send({ message: 'Server error while updating inventory.' });
    }
});

module.exports = router;
