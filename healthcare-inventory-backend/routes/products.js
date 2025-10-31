const express = require('express');
const db = require('../db'); // Import the new 'db' object
const router = express.Router();

// GET all products
router.get('/', async (req, res) => {
    try {
        // Use lowercase 'products'
        const queryText = 'SELECT * FROM products';
        const result = await db.query(queryText);
        // Use .rows
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).send(err.message);
    }
});

// POST a new product (for Admins)
router.post('/', async (req, res) => {
    // Use lowercase keys
    const { name, description, price, stockquantity } = req.body;
    if (price <0 || stockquantity <0){
        return res.status(400).send({message: 'Price and Stock Quantity cannot be negative.'});
    }
    try {
        // Use PostgreSQL INSERT with $1 placeholders and RETURNING *
        const queryText = `
            INSERT INTO products (name, description, price, stockquantity) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *
        `;
        const values = [name, description, price, stockquantity];
        const result = await db.query(queryText, values);
        
        // Use .rows[0]
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating product:', err);
        res.status(500).send(err.message);
    }
});

// PUT (update) a product (for Admins)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    // Use lowercase keys
    const { name, description, price, stockquantity } = req.body;
    try {
        const queryText = `
            UPDATE products 
            SET name = $1, description = $2, price = $3, stockquantity = $4 
            WHERE productid = $5
        `;
        const values = [name, description, price, stockquantity, id];
        await db.query(queryText, values);
        
        res.status(200).send('Product updated successfully');
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).send(err.message);
    }
});

// DELETE a product (for Admins)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    // We must use a client from the pool for transactions
    const client = await db.pool.connect();

    try {
        // Start the transaction
        await client.query('BEGIN');

        // 1. Delete references from orderitems
        await client.query('DELETE FROM orderitems WHERE productid = $1', [id]);

        // 2. Delete references from inventory
        await client.query('DELETE FROM inventory WHERE productid = $1', [id]);

        // 3. Finally, delete the product itself
        const result = await client.query('DELETE FROM products WHERE productid = $1', [id]);

        // Commit the transaction
        await client.query('COMMIT');

        // Use .rowCount
        if (result.rowCount > 0) {
            res.status(200).send('Product and all associated data deleted successfully');
        } else {
            res.status(404).send('Product not found');
        }

    } catch (err) {
        // If an error occurs, roll back the transaction
        await client.query('ROLLBACK');
        console.error('Error deleting product:', err);
        res.status(500).send({ message: 'Failed to delete product.', error: err.message });
    } finally {
        // IMPORTANT: Release the client back to the pool
        client.release();
    }
});

module.exports = router;