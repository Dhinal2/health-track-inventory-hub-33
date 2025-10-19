const express = require('express');
const sql = require('mssql');
const router = express.Router();

console.log("  -> 🧾 Loading invoices.js routes..."); // Diagnostic log

const dbConfig = {
    user: 'healthcare_app_user',
    password: 'Pass123!', // Your actual password
    server: 'ASUS-TUF-GAMING\\SQLEXPRESS',
    database: 'HealthCareDB',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// GET /api/invoices/user-invoices - Fetch invoices based on user role
router.post('/user-invoices', async (req, res) => {
    const { userId, userRole } = req.body;
    if (!userId || !userRole) {
        return res.status(400).send({ message: 'UserID and Role are required.' });
    }

    try {
        const pool = await sql.connect(dbConfig);
        let query;

        if (userRole === 'Administrator') {
            query = `
                SELECT i.*, u.Name as CustomerName FROM Invoices i
                JOIN Orders o ON i.OrderID = o.OrderID
                JOIN Users u ON o.UserID = u.UserID
                ORDER BY i.IssueDate DESC
            `;
        } else {
            query = `
                SELECT i.*, u.Name as CustomerName FROM Invoices i
                JOIN Orders o ON i.OrderID = o.OrderID
                JOIN Users u ON o.UserID = u.UserID
                WHERE o.UserID = @UserID
                ORDER BY i.IssueDate DESC
            `;
        }
        
        const request = pool.request();
        if (userRole !== 'Administrator') {
            request.input('UserID', sql.Int, userId);
        }

        const result = await request.query(query);
        res.json(result.recordset);

    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).send({ message: 'Server error' });
    }
});

// POST /api/invoices/:id/pay - Process a payment for an invoice
router.post('/:id/pay', async (req, res) => {
    const { id } = req.params;
    const { amountPaid } = req.body;
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const invoiceDetails = await new sql.Request(transaction).input('InvoiceID', sql.Int, id).query(`SELECT i.TotalAmount, i.OrderID, ISNULL((SELECT SUM(Amount) FROM Payments WHERE InvoiceID = @InvoiceID), 0) as TotalPaid FROM Invoices i WHERE i.InvoiceID = @InvoiceID`);
        if (invoiceDetails.recordset.length === 0) {
            await transaction.rollback();
            return res.status(404).send({ message: 'Invoice not found.' });
        }
        
        const { TotalAmount, OrderID, TotalPaid } = invoiceDetails.recordset[0];
        const halfAmount = TotalAmount / 2;

        if (parseFloat(amountPaid) < TotalAmount && TotalPaid == 0 && parseFloat(amountPaid) < halfAmount) {
            await transaction.rollback();
            return res.status(400).send({ message: `The first partial payment must be at least 50% of the total. Minimum payment: $${halfAmount.toFixed(2)}` });
        }

        await new sql.Request(transaction).input('InvoiceID', sql.Int, id).input('Amount', sql.Decimal(10, 2), amountPaid).input('PaymentMethod', sql.NVarChar, 'Credit Card').query('INSERT INTO Payments (InvoiceID, Amount, PaymentMethod) VALUES (@InvoiceID, @Amount, @PaymentMethod)');
        const newTotalPaid = TotalPaid + parseFloat(amountPaid);
        const newPaymentStatus = newTotalPaid >= TotalAmount ? 'Paid' : 'Partially Paid';
        
        await new sql.Request(transaction).input('InvoiceID', sql.Int, id).input('PaymentStatus', sql.NVarChar, newPaymentStatus).query('UPDATE Invoices SET PaymentStatus = @PaymentStatus WHERE InvoiceID = @InvoiceID');
        
        const orderResult = await new sql.Request(transaction).input('OrderID', sql.Int, OrderID).query('SELECT Status, UserID FROM Orders WHERE OrderID = @OrderID');
        const { Status: currentOrderStatus, UserID } = orderResult.recordset[0];

        if (currentOrderStatus === 'Awaiting Payment') {
            // --- NEW LOGIC: Reduce Main Product Stock ---
            // 1. Get all items from the order
            const orderItemsResult = await new sql.Request(transaction)
                .input('OrderID', sql.Int, OrderID)
                .query('SELECT ProductID, Quantity FROM OrderItems WHERE OrderID = @OrderID');
            
            // 2. Loop through each item and decrement the stock in the main Products table
            for (const item of orderItemsResult.recordset) {
                await new sql.Request(transaction)
                    .input('Quantity', sql.Int, item.Quantity)
                    .input('ProductID', sql.Int, item.ProductID)
                    .query('UPDATE Products SET StockQuantity = StockQuantity - @Quantity WHERE ProductID = @ProductID');
            }
            // --- END NEW LOGIC ---

            await new sql.Request(transaction).input('OrderID', sql.Int, OrderID).query("INSERT INTO Shipments (OrderID, Status, Destination) VALUES (@OrderID, 'Pending', 'User Department')");
            await new sql.Request(transaction).input('OrderID', sql.Int, OrderID).query("UPDATE Orders SET Status = 'Dispatched' WHERE OrderID = @OrderID");
        
        } else if (currentOrderStatus === 'Pending Final Payment' && newPaymentStatus === 'Paid') {
            // This logic correctly adds items to the staff's inventory
            const orderItemsResult = await new sql.Request(transaction).input('OrderID', sql.Int, OrderID).query('SELECT * FROM OrderItems WHERE OrderID = @OrderID');
            for (const item of orderItemsResult.recordset) {
                const inventoryCheck = await new sql.Request(transaction).input('UserID', sql.Int, UserID).input('ProductID', sql.Int, item.ProductID).query('SELECT * FROM Inventory WHERE UserID = @UserID AND ProductID = @ProductID');
                if (inventoryCheck.recordset.length > 0) {
                    await new sql.Request(transaction).input('UserID', sql.Int, UserID).input('ProductID', sql.Int, item.ProductID).input('Quantity', sql.Int, item.Quantity).query('UPDATE Inventory SET StockQuantity = StockQuantity + @Quantity WHERE UserID = @UserID AND ProductID = @ProductID');
                } else {
                    await new sql.Request(transaction).input('UserID', sql.Int, UserID).input('ProductID', sql.Int, item.ProductID).input('Quantity', sql.Int, item.Quantity).query('INSERT INTO Inventory (UserID, ProductID, StockQuantity, ReorderThreshold, AutoReorder) VALUES (@UserID, @ProductID, @Quantity, 50, 0)');
                }
            }
            await new sql.Request(transaction).input('OrderID', sql.Int, OrderID).query("UPDATE Orders SET Status = 'Completed' WHERE OrderID = @OrderID");
        }

        await transaction.commit();
        res.status(200).send({ message: 'Payment successful', newStatus: newPaymentStatus });

    } catch (error) {
        await transaction.rollback();
        console.error("CRITICAL ERROR processing payment:", error);
        let errorMessage = 'Payment processing failed due to a critical server error.';
        if (error.originalError && error.originalError.info) {
            errorMessage = `Database Error: ${error.originalError.info.message}`;
        }
        res.status(500).send({ message: errorMessage });
    }
});

router.post('/by-order', async (req, res) => {
    console.log("  -> 🎯 [POST /api/invoices/by-order] Route hit!");
    const { orderId } = req.body;

    if (!orderId) {
        return res.status(400).send({ message: 'OrderID is required.' });
    }

    try {
        console.log("  -> Connecting to database...");
        const pool = await sql.connect(dbConfig);
        console.log("  -> Database connection successful.");

        const result = await pool.request()
            .input('OrderID', sql.Int, orderId)
            .query(`
                SELECT i.*, u.Name as CustomerName 
                FROM Invoices i
                JOIN Orders o ON i.OrderID = o.OrderID
                JOIN Users u ON o.UserID = u.UserID
                WHERE i.OrderID = @OrderID
            `);

        if (result.recordset.length === 0) {
            console.log(`  -> ⚠️ Invoice not found for OrderID: ${orderId}`);
            return res.status(404).send({ message: 'Invoice not found for this order.' });
        }

        console.log(`  -> ✅ Found invoice ${result.recordset[0].InvoiceID} for OrderID: ${orderId}`);
        res.json(result.recordset[0]);

    } catch (error) {
        // --- FIX: This will now catch connection timeout errors ---
        console.error("  -> ❌ CRITICAL ERROR in /by-order route:", JSON.stringify(error, null, 2));
        
        let errorMessage = 'Server error while fetching invoice.';
        if (error.code === 'ETIMEOUT') {
            errorMessage = 'Database connection timed out. Please check the database server and credentials.';
        } else if (error.originalError && error.originalError.info) {
            errorMessage = `Database Error: ${error.originalError.info.message}`;
        }
        
        res.status(500).send({ message: errorMessage });
    }
});

// GET /api/invoices/payment-details/:orderId - Fetch payment summary for an order
router.get('/payment-details/:orderId', async (req, res) => {
    const { orderId } = req.params;

    if (!orderId) {
        return res.status(400).send({ message: 'OrderID is required.' });
    }

    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('OrderID', sql.Int, orderId)
            .query(`
                SELECT 
                    i.TotalAmount,
                    ISNULL((SELECT SUM(Amount) FROM Payments p WHERE p.InvoiceID = i.InvoiceID), 0) as AmountPaid
                FROM Invoices i
                WHERE i.OrderID = @OrderID
            `);

        if (result.recordset.length === 0) {
            return res.status(404).send({ message: 'No invoice found for this order to calculate payment details.' });
        }

        const details = result.recordset[0];
        res.json({
            totalAmount: details.TotalAmount,
            amountPaid: details.AmountPaid,
            amountRemaining: details.TotalAmount - details.AmountPaid
        });

    } catch (error) {
        console.error('Error fetching payment details:', error);
        res.status(500).send({ message: 'Server error while fetching payment details.' });
    }
});

module.exports = router;
console.log("  -> ✅ invoices.js routes loaded."); // Diagnostic log