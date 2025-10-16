const express = require('express');
const sql = require('mssql');
const router = express.Router();

// This should be your actual dbConfig from server.js
// For a cleaner setup, you might pass the dbConfig or the pool connection around
// but for simplicity, we can redefine it here for now.
const dbConfig = {
    server: 'ASUS-TUF-GAMING\\SQLEXPRESS',
    database: 'HealthCareDB',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        integratedSecurity: true
    }
};

// GET all products
router.get('/', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query('SELECT * FROM Products');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// POST a new product (for Admins)
router.post('/', async (req, res) => {
    const { Name, Description, Price, StockQuantity } = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('Name', sql.NVarChar, Name)
            .input('Description', sql.NVarChar, Description)
            .input('Price', sql.Decimal(10, 2), Price)
            .input('StockQuantity', sql.Int, StockQuantity)
            .query('INSERT INTO Products (Name, Description, Price, StockQuantity) OUTPUT INSERTED.* VALUES (@Name, @Description, @Price, @StockQuantity)');
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PUT (update) a product (for Admins)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { Name, Description, Price, StockQuantity } = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('id', sql.Int, id)
            .input('Name', sql.NVarChar, Name)
            .input('Description', sql.NVarChar, Description)
            .input('Price', sql.Decimal(10, 2), Price)
            .input('StockQuantity', sql.Int, StockQuantity)
            .query('UPDATE Products SET Name = @Name, Description = @Description, Price = @Price, StockQuantity = @StockQuantity WHERE ProductID = @id');
        res.status(200).send('Product updated successfully');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE a product (for Admins)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Products WHERE ProductID = @id');
        res.status(200).send('Product deleted successfully');
    } catch (err) {
        res.status(500).send(err.message);
    }
});


module.exports = router;