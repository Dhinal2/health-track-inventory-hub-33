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

module.exports = router;
