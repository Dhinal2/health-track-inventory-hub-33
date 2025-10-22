const express = require('express');
const db = require('../db'); // Import the new 'db' object
const router = express.Router();

// POST /api/invoices/user-invoices - Fetch invoices based on user role
router.post('/user-invoices', async (req, res) => {
    const { userId, userRole } = req.body;
    if (!userId || !userRole) {
        return res.status(400).send({ message: 'UserID and Role are required.' });
    }

    try {
        let queryText;
        let queryParams = [];

        // Use lowercase schema, aliases for frontend keys
        const selectFields = `
            i.invoiceid as "InvoiceID",
            i.orderid as "OrderID",
            i.issuedate as "IssueDate",
            i.duedate as "DueDate",
            i.totalamount as "TotalAmount",
            i.paymentstatus as "PaymentStatus"
        `;

        if (userRole === 'Administrator') {
            queryText = `
                SELECT ${selectFields}, u.name as "CustomerName" 
                FROM invoices i
                JOIN orders o ON i.orderid = o.orderid
                JOIN users u ON o.userid = u.userid
                ORDER BY i.issuedate DESC
            `;
        } else {
            queryText = `
                SELECT ${selectFields}, u.name as "CustomerName" 
                FROM invoices i
                JOIN orders o ON i.orderid = o.orderid
                JOIN users u ON o.userid = u.userid
                WHERE o.userid = $1
                ORDER BY i.issuedate DESC
            `;
            queryParams.push(userId);
        }

        const result = await db.query(queryText, queryParams);
        // Aliases ensure Uppercase keys for the frontend
        res.json(result.rows);

    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).send({ message: 'Server error fetching invoices' });
    }
});

// POST /api/invoices/:id/pay - Process a payment for an invoice
router.post('/:id/pay', async (req, res) => {
    const { id } = req.params; // invoiceId
    const { amountPaid } = req.body; // Frontend sends camelCase

    // Use a client for transaction
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Get invoice details and calculate total paid so far
        // Use COALESCE for SUM, lowercase schema
        const detailsQuery = `
            SELECT 
                i.totalamount, 
                i.orderid, 
                i.paymentstatus, 
                COALESCE((SELECT SUM(amount) FROM payments WHERE invoiceid = $1), 0) as totalpaid 
            FROM invoices i 
            WHERE i.invoiceid = $1 FOR UPDATE`; // Lock the invoice row
        const invoiceDetails = await client.query(detailsQuery, [id]);

        if (invoiceDetails.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).send({ message: 'Invoice not found.' });
        }
        
        // Use lowercase properties from the result
        const { totalamount, orderid, totalpaid, paymentstatus } = invoiceDetails.rows[0];
        const amountRemaining = parseFloat(totalamount) - parseFloat(totalpaid);
        const paymentAmount = parseFloat(amountPaid);

        // 2. Validate payment amount based on current status
        if (paymentstatus === 'Unpaid') { // Compare with lowercase
            const halfAmount = parseFloat(totalamount) / 2;
            if (paymentAmount < halfAmount && paymentAmount < parseFloat(totalamount)) {
                await client.query('ROLLBACK');
                return res.status(400).send({ message: `The first payment must be at least 50% of the total, or the full amount. Minimum payment: $${halfAmount.toFixed(2)}` });
            }
        } else if (paymentstatus === 'Partially Paid') { // Compare with lowercase
            // Allow for minor floating point inaccuracies
            if (paymentAmount < (amountRemaining - 0.001)) { 
                await client.query('ROLLBACK');
                return res.status(400).send({ message: `The final payment must cover the full remaining amount of $${amountRemaining.toFixed(2)}.` });
            }
        } else if (paymentstatus === 'Paid') { // Compare with lowercase
             await client.query('ROLLBACK');
             return res.status(400).send({ message: 'This invoice has already been fully paid.' });
        }
        
        // 3. Insert into payments table
        const paymentQuery = 'INSERT INTO payments (invoiceid, amount, paymentmethod) VALUES ($1, $2, $3)';
        await client.query(paymentQuery, [id, paymentAmount, 'Credit Card']); // Hardcoded method
        
        // 4. Determine and update invoice payment status
        const newTotalPaid = parseFloat(totalpaid) + paymentAmount;
        // Check if paid (allowing for floating point inaccuracies)
        const newPaymentStatus = newTotalPaid >= (parseFloat(totalamount) - 0.001) ? 'Paid' : 'Partially Paid'; 
        
        const updateInvoiceQuery = 'UPDATE invoices SET paymentstatus = $1 WHERE invoiceid = $2';
        await client.query(updateInvoiceQuery, [newPaymentStatus, id]);
        
        // 5. Update related order status and potentially inventory/shipments
        const orderResult = await client.query('SELECT status, userid FROM orders WHERE orderid = $1', [orderid]);
        if (orderResult.rows.length === 0) throw new Error('Order not found during payment process');
        const { status: currentOrderStatus, userid } = orderResult.rows[0];

        let finalOrderStatus = currentOrderStatus; // Keep current status unless changed below

        if (currentOrderStatus === 'Awaiting Payment') {
            const orderItemsResult = await client.query('SELECT productid, quantity FROM orderitems WHERE orderid = $1', [orderid]);
            
            // Deduct from Products stock (assuming this is central stock)
            for (const item of orderItemsResult.rows) {
                const updateProductStockQuery = 'UPDATE products SET stockquantity = stockquantity - $1 WHERE productid = $2';
                await client.query(updateProductStockQuery, [item.quantity, item.productid]);
            }

            // Create Shipment and update order status
            await client.query("INSERT INTO shipments (orderid, status, destination, userid) VALUES ($1, 'Pending', 'User Department', $2)", [orderid, userid]);
            finalOrderStatus = 'Dispatched';
        
        } else if (currentOrderStatus === 'Pending Final Payment' && newPaymentStatus === 'Paid') {
            const orderItemsResult = await client.query('SELECT productid, quantity FROM orderitems WHERE orderid = $1', [orderid]);
            
            // Add items to user's personal Inventory
            for (const item of orderItemsResult.rows) {
                // Check if user already has this item in their inventory
                 const inventoryCheckQuery = 'SELECT inventoryid FROM inventory WHERE userid = $1 AND productid = $2';
                 const inventoryCheck = await client.query(inventoryCheckQuery, [userid, item.productid]);

                 if (inventoryCheck.rows.length > 0) {
                     // Update existing inventory entry
                     const updateInventoryQuery = 'UPDATE inventory SET stockquantity = stockquantity + $1 WHERE userid = $2 AND productid = $3';
                     await client.query(updateInventoryQuery, [item.quantity, userid, item.productid]);
                 } else {
                     // Insert new inventory entry (assuming default threshold/autoreorder)
                     const insertInventoryQuery = 'INSERT INTO inventory (userid, productid, stockquantity, reorderthreshold, autoreorder) VALUES ($1, $2, $3, 50, false)';
                     await client.query(insertInventoryQuery, [userid, item.productid, item.quantity]);
                 }
            }
             finalOrderStatus = 'Completed';
        }
        
        // Update order status if it changed
        if (finalOrderStatus !== currentOrderStatus) {
             await client.query("UPDATE orders SET status = $1 WHERE orderid = $2", [finalOrderStatus, orderid]);
        }

        await client.query('COMMIT');
        res.status(200).send({ message: 'Payment successful', newStatus: newPaymentStatus }); // Send back the new status

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error processing payment:', error);
        res.status(500).send({ message: error.message || 'Payment processing failed.' });
    } finally {
        client.release(); // Release client back to the pool
    }
});

// POST /api/invoices/by-order - Get invoice details for a specific order ID
router.post('/by-order', async (req, res) => {
    const { orderId } = req.body;
    if (!orderId) {
        return res.status(400).send({ message: 'OrderID is required.' });
    }

    try {
        const queryText = `
            SELECT 
                i.invoiceid as "InvoiceID",
                i.orderid as "OrderID",
                i.issuedate as "IssueDate",
                i.duedate as "DueDate",
                i.totalamount as "TotalAmount",
                i.paymentstatus as "PaymentStatus",
                u.name as "CustomerName" 
            FROM invoices i
            JOIN orders o ON i.orderid = o.orderid
            JOIN users u ON o.userid = u.userid
            WHERE i.orderid = $1
        `;
        const result = await db.query(queryText, [orderId]);

        if (result.rows.length === 0) {
            return res.status(404).send({ message: 'Invoice not found for this order.' });
        }
        // Use aliases for Uppercase keys
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching invoice by order:', error);
        res.status(500).send({ message: 'Server error while fetching invoice.' });
    }
});

// GET /api/invoices/payment-details/:orderId - Get paid/remaining amounts for an order's invoice
router.get('/payment-details/:orderId', async (req, res) => {
    const { orderId } = req.params;
    if (!orderId) {
        return res.status(400).send({ message: 'OrderID is required.' });
    }

    try {
        // Use COALESCE for SUM, lowercase schema
        const queryText = `
            SELECT 
                i.totalamount,
                COALESCE((SELECT SUM(amount) FROM payments p WHERE p.invoiceid = i.invoiceid), 0) as amountpaid
            FROM invoices i
            WHERE i.orderid = $1
        `;
        const result = await db.query(queryText, [orderId]);

        if (result.rows.length === 0) {
            return res.status(404).send({ message: 'No invoice found for this order to calculate payment details.' });
        }

        const details = result.rows[0];
        const totalAmount = parseFloat(details.totalamount);
        const amountPaid = parseFloat(details.amountpaid);
        
        // Send back camelCase keys as expected by frontend? (Assuming yes)
        res.json({
            totalAmount: totalAmount,
            amountPaid: amountPaid,
            amountRemaining: totalAmount - amountPaid
        });
    } catch (error) {
        console.error('Error fetching payment details:', error);
        res.status(500).send({ message: 'Server error while fetching payment details.' });
    }
});

// GET /api/invoices/:id - Get all details for a single invoice
router.get('/:id', async (req, res) => {
    const { id } = req.params; // invoiceId

    try {
        // Fetch main invoice details + customer info using aliases
        const invoiceQuery = `
            SELECT 
                i.invoiceid as "InvoiceID",
                i.orderid as "OrderID",
                i.issuedate as "IssueDate",
                i.duedate as "DueDate",
                i.totalamount as "TotalAmount",
                i.paymentstatus as "PaymentStatus", 
                u.name as "CustomerName", 
                u.email as "CustomerEmail",
                u.contactnumber as "CustomerContact",
                '' as "CustomerAddress" -- Add address field if needed in users table
            FROM invoices i
            JOIN orders o ON i.orderid = o.orderid
            JOIN users u ON o.userid = u.userid
            WHERE i.invoiceid = $1;
        `;
        const invoiceResult = await db.query(invoiceQuery, [id]);

        if (invoiceResult.rows.length === 0) {
            return res.status(404).send({ message: 'Invoice not found.' });
        }

        const invoiceData = invoiceResult.rows[0];
        const orderId = invoiceData.OrderID; // Use the Uppercase key from the aliased result

        // Fetch order items using aliases
        const itemsQuery = `
            SELECT 
                p.productid as "ProductID", 
                p.name as "ProductName", 
                oi.quantity as "Quantity", 
                oi.unitprice as "UnitPrice"
            FROM orderitems oi
            JOIN products p ON oi.productid = p.productid
            WHERE oi.orderid = $1;
        `;
        const itemsResult = await db.query(itemsQuery, [orderId]);

        // Fetch payment history using aliases
        const paymentsQuery = `
            SELECT 
                paymentid as "PaymentID", 
                amount as "Amount", 
                paymentdate as "PaymentDate", 
                paymentmethod as "PaymentMethod"
            FROM payments
            WHERE invoiceid = $1
            ORDER BY paymentdate DESC;
        `;
        const paymentsResult = await db.query(paymentsQuery, [id]);

        // Combine results using Uppercase keys for the frontend
        const invoiceDetails = {
            ...invoiceData,
            Items: itemsResult.rows,
            PaymentHistory: paymentsResult.rows
        };

        res.json(invoiceDetails);

    } catch (error) {
        console.error(`Error fetching details for invoice #${id}:`, error);
        res.status(500).send({ message: 'Server error while fetching invoice details.' });
    }
});

module.exports = router;