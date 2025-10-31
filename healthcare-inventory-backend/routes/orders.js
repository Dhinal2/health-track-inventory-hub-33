const express = require('express');
const db = require('../db'); // Import the new 'db' object
const router = express.Router();

// POST /api/orders/user-orders - Fetch orders for a user or all users
router.post('/user-orders', async (req, res) => {
    const { userId, userRole } = req.body;
    if (!userId || !userRole) {
        return res.status(400).send({ message: 'UserID and Role are required.' });
    }

    try {
        let queryText;
        let queryParams = [];

        // Base query with lowercase schema and aliases
        if (userRole === 'Administrator') {
            queryText = `
                SELECT o.*, u.name as "PlacedBy" 
                FROM orders o
                JOIN users u ON o.userid = u.userid
                ORDER BY o.orderdate DESC
            `;
        } else {
            queryText = `
                SELECT o.*, u.name as "PlacedBy" 
                FROM orders o
                JOIN users u ON o.userid = u.userid
                WHERE o.userid = $1
                ORDER BY o.orderdate DESC
            `;
            queryParams.push(userId);
        }

        const result = await db.query(queryText, queryParams);
        
        // Fetch items for each order
        const ordersWithItems = await Promise.all(result.rows.map(async (order) => {
            const itemsQueryText = `
                SELECT oi.*, p.name as "ProductName"
                FROM orderitems oi
                JOIN products p ON oi.productid = p.productid
                WHERE oi.orderid = $1
            `;
            const itemsResult = await db.query(itemsQueryText, [order.orderid]);
            // Return with Uppercase Keys as the frontend expects
            return { 
                OrderID: order.orderid,
                UserID: order.userid,
                OrderDate: order.orderdate,
                TotalAmount: order.totalamount,
                Status: order.status,
                PlacedBy: order.PlacedBy, // Alias is already uppercase
                Items: itemsResult.rows.map(item => ({ // Map items keys too
                    OrderItemID: item.orderitemid,
                    OrderID: item.orderid,
                    ProductID: item.productid,
                    ProductName: item.ProductName, // Alias is already uppercase
                    Quantity: item.quantity,
                    UnitPrice: item.unitprice
                })) 
            };
        }));

        res.json(ordersWithItems);

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send({ message: 'Server error while fetching orders' });
    }
});

// POST /api/orders - Create a new order
router.post('/', async (req, res) => {
    // Expect lowercase keys from the frontend (Products.tsx fix)
    const { userId, items, totalAmount } = req.body;

    // Use a client for transaction
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // Insert into orders table, RETURNING the new orderid
        const orderQueryText = 'INSERT INTO orders (userid, totalamount, status) VALUES ($1, $2, $3) RETURNING orderid';
        const orderResult = await client.query(orderQueryText, [userId, totalAmount, 'Pending']);
        const orderId = orderResult.rows[0].orderid;

        // Insert each item into orderitems
        for (const item of items) {
            // Expecting lowercase keys: productid, quantity, unitprice
            const itemQueryText = 'INSERT INTO orderitems (orderid, productid, quantity, unitprice) VALUES ($1, $2, $3, $4)';
            await client.query(itemQueryText, [orderId, item.productid, item.quantity, item.unitprice]);
        }
        
        // Insert into invoices
        const invoiceQueryText = 'INSERT INTO invoices (orderid, totalamount, paymentstatus) VALUES ($1, $2, $3)';
        await client.query(invoiceQueryText, [orderId, totalAmount, 'Unpaid']);

        await client.query('COMMIT');
        res.status(201).send({ message: 'Order created successfully', orderId });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', error);
        res.status(500).send({ message: 'Failed to create order due to a transaction error.' });
    } finally {
        client.release(); // Release the client back to the pool
    }
});


// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // Frontend sends Uppercase status like 'Approved'

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // --- START OF FIX: Get the UserID from the order first ---
        // We need the UserID to know which inventory to update
        const orderQuery = 'SELECT userid FROM orders WHERE orderid = $1';
        const orderResult = await client.query(orderQuery, [id]);
        
        if (orderResult.rows.length === 0) {
            throw new Error('Order not found');
        }
        const userId = orderResult.rows[0].userid;
        // --- END OF FIX ---


        let newStatus = status; // Start with the status sent from frontend

        // Determine the actual status to set based on logic
        if (status === 'Approved') {
            newStatus = 'Awaiting Payment';
        } else if (status === 'Received') {
            const invoiceQuery = 'SELECT paymentstatus FROM invoices WHERE orderid = $1';
            const invoiceResult = await client.query(invoiceQuery, [id]);
            
            if (invoiceResult.rows.length === 0) {
                 throw new Error('Invoice not found for order'); // Should not happen
            }
            const invoice = invoiceResult.rows[0];

            if (invoice.paymentstatus === 'Paid') { // Compare with lowercase
                newStatus = 'Completed';
            } else if (invoice.paymentstatus === 'Partially Paid') { // Compare with lowercase
                newStatus = 'Pending Final Payment';
            }
            // If invoice is Unpaid, newStatus remains 'Received' initially
        }
        
        // Update the orders table
        const updateQuery = 'UPDATE orders SET status = $1 WHERE orderid = $2';
        await client.query(updateQuery, [newStatus, id]);

        // --- START OF FIX: Update inventory if order is 'Completed' ---
        // This is the logic that was missing for your "Full Payment" flow
        if (newStatus === 'Completed') {
            // 1. Get all items from the order
            const itemsQuery = 'SELECT productid, quantity FROM orderitems WHERE orderid = $1';
            const itemsResult = await client.query(itemsQuery, [id]);
            const orderItems = itemsResult.rows;

            // 2. Loop through each item and update inventory stock
            for (const item of orderItems) {
                const updateInventoryQuery = `
                    UPDATE inventory 
                    SET stockquantity = stockquantity + $1 
                    WHERE productid = $2 AND userid = $3
                `;
                // Use Number() to ensure the quantity is treated as a number
                await client.query(updateInventoryQuery, [Number(item.quantity), item.productid, userId]);
            }
        }
        // --- END OF FIX ---

        await client.query('COMMIT');
        res.status(200).send({ message: `Order status updated to ${newStatus}` });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating order status:', error);
        res.status(500).send({ message: 'Server error updating order status' });
    } finally {
        client.release();
    }
});

// POST /api/orders/reorder-all-low-stock - Create bulk reorder
router.post('/reorder-all-low-stock', async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).send({ message: 'User ID is required.' });
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Find low-stock items for the specific user
        const lowStockQuery = `
            SELECT 
                i.productid,
                p.price,
                (i.reorderthreshold - i.stockquantity) as quantitytoorder
            FROM inventory i
            JOIN products p ON i.productid = p.productid
            WHERE 
                i.stockquantity < i.reorderthreshold 
                AND (i.reorderthreshold - i.stockquantity) > 0
                AND i.userid = $1; 
        `;
        const lowStockItems = await client.query(lowStockQuery, [userId]);

        if (lowStockItems.rows.length === 0) {
            await client.query('ROLLBACK'); // Rollback before sending response
            return res.status(200).send({ message: 'You have no items that require reordering.' });
        }

        // 2. Calculate total amount
        const totalAmount = lowStockItems.rows.reduce((sum, item) => {
            // Ensure values are numbers
            const quantity = Number(item.quantitytoorder);
            const price = Number(item.price);
            return sum + (quantity * price);
        }, 0);

        // 3. Create a new order
        const orderQuery = 'INSERT INTO orders (userid, totalamount, status) VALUES ($1, $2, $3) RETURNING orderid';
        const orderResult = await client.query(orderQuery, [userId, totalAmount, 'Pending']);
        const newOrderId = orderResult.rows[0].orderid;

        // 4. Add items to the new order
        for (const item of lowStockItems.rows) {
            const itemQuery = 'INSERT INTO orderitems (orderid, productid, quantity, unitprice) VALUES ($1, $2, $3, $4)';
            await client.query(itemQuery, [newOrderId, item.productid, item.quantitytoorder, item.price]);
        }

        await client.query('COMMIT');
        res.status(201).json({ message: `Successfully created reorder #${newOrderId} for ${lowStockItems.rows.length} items.`, orderId: newOrderId });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error creating bulk reorder:", error);
        res.status(500).send({ message: 'Server error during bulk reorder.' });
    } finally {
        client.release();
    }
});

module.exports = router;