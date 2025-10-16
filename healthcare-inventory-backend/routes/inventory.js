const express = require('express');
const sql = require('mssql');
const router = express.Router();

const dbConfig = {
    user: 'healthcare_app_user',
    password: 'your_new_password', // Your actual password
    server: 'ASUS-TUF-GAMING\\SQLEXPRESS',
    database: 'HealthCareDB',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// FIX #1: The SELECT statement now includes p.Price
router.post('/user-inventory', async (req, res) => {
    const { userId, userRole } = req.body;
    // ... (validation is the same)
    try {
        const pool = await sql.connect(dbConfig);
        let query;

        const selectFields = `
            i.InventoryID, p.ProductID, p.Price,
            p.Name, i.StockQuantity, i.ReorderThreshold, i.AutoReorder
        `;

        if (userRole === 'Administrator') {
            query = `SELECT ${selectFields}, u.Name as Owner FROM Inventory i JOIN Products p ON i.ProductID = p.ProductID JOIN Users u ON i.UserID = u.UserID`;
        } else {
            query = `SELECT ${selectFields} FROM Inventory i JOIN Products p ON i.ProductID = p.ProductID WHERE i.UserID = @UserID`;
        }
        // ... (request execution is the same)
    } catch (error) { /* ... */ }
});

// FIX #2: This route now ONLY updates the configuration fields.
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { ReorderThreshold, AutoReorder, UserID } = req.body; // Only expect these fields

    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('InventoryID', sql.Int, id)
            .input('UserID', sql.Int, UserID)
            .input('ReorderThreshold', sql.Int, ReorderThreshold)
            .input('AutoReorder', sql.Bit, AutoReorder)
            .query(`
                UPDATE Inventory 
                SET ReorderThreshold = @ReorderThreshold, AutoReorder = @AutoReorder 
                WHERE InventoryID = @InventoryID AND UserID = @UserID
            `);
        res.status(200).send('Configuration updated successfully');
    } catch (error) {
        console.error('Error updating inventory config:', error);
        res.status(500).send('Server error');
    }
});

module.exports = router;