const express = require('express');
const sql = require('mssql');
const router = express.Router();

const dbConfig = {
    user: 'healthcare_app_user',
    password: 'Pass123!', // Your actual password
    server: 'ASUS-TUF-GAMING\\SQLEXPRESS',
    database: 'HealthCareDB',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        // Adding a connection timeout to prevent hangs
        connectionTimeout: 15000 
    }
};

router.post('/user-inventory', async (req, res) => {
    const { userId, userRole } = req.body;
    console.log(`[LOG] Received /user-inventory request. User: ${userId}, Role: ${userRole}`);

    if (!userId || !userRole) {
        return res.status(400).send('UserID and Role are required.');
    }

    try {
        console.log('[LOG] Step 1: Attempting to connect to DB...');
        const pool = await sql.connect(dbConfig);
        console.log('[LOG] Step 2: DB Connection successful.');

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

        console.log('[LOG] Step 3: Executing inventory query...');
        const result = await request.query(query);
        console.log(`[LOG] Step 4: Query successful. Found ${result.recordset.length} items.`);

        res.json(result.recordset);

    } catch (error) {
        console.error('[ERROR] An error occurred in /user-inventory route:', error);
        res.status(500).send({ message: 'Server error while fetching inventory.' });
    }
});

// The PUT route for configuration is likely correct, but ensure it matches this
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { ReorderThreshold, AutoReorder, UserID } = req.body;
    try {
        const pool = await sql.connect(dbConfig);
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