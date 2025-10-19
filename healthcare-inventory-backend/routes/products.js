const express = require('express');
const { sql, poolPromise } = require('../db');
const router = express.Router();

// GET all products
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Products');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).send(err.message);
    }
});

// POST a new product (for Admins)
router.post('/', async (req, res) => {
    const { Name, Description, Price, StockQuantity } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Name', sql.NVarChar, Name)
            .input('Description', sql.NVarChar, Description)
            .input('Price', sql.Decimal(10, 2), Price)
            .input('StockQuantity', sql.Int, StockQuantity)
            .query('INSERT INTO Products (Name, Description, Price, StockQuantity) OUTPUT INSERTED.* VALUES (@Name, @Description, @Price, @StockQuantity)');
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error('Error creating product:', err);
        res.status(500).send(err.message);
    }
});

// PUT (update) a product (for Admins)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { Name, Description, Price, StockQuantity } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('Name', sql.NVarChar, Name)
            .input('Description', sql.NVarChar, Description)
            .input('Price', sql.Decimal(10, 2), Price)
            .input('StockQuantity', sql.Int, StockQuantity)
            .query('UPDATE Products SET Name = @Name, Description = @Description, Price = @Price, StockQuantity = @StockQuantity WHERE ProductID = @id');
        res.status(200).send('Product updated successfully');
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).send(err.message);
    }
});

// --- THIS IS THE CORRECTED DELETE ROUTE ---
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Important: First, delete references from child tables.
            // Note: This will permanently remove the item from all past orders.
            await new sql.Request(transaction)
                .input('ProductID', sql.Int, id)
                .query('DELETE FROM OrderItems WHERE ProductID = @ProductID');

            await new sql.Request(transaction)
                .input('ProductID', sql.Int, id)
                .query('DELETE FROM Inventory WHERE ProductID = @ProductID');

            // Finally, delete the product from the parent table.
            const result = await new sql.Request(transaction)
                .input('ProductID', sql.Int, id)
                .query('DELETE FROM Products WHERE ProductID = @ProductID');

            await transaction.commit();

            if (result.rowsAffected[0] > 0) {
                res.status(200).send('Product and all associated data deleted successfully');
            } else {
                res.status(404).send('Product not found');
            }

        } catch (err) {
            await transaction.rollback();
            // Re-throw the error to be caught by the outer catch block
            throw err;
        }
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).send({ message: 'Failed to delete product.', error: err.message });
    }
});

module.exports = router;