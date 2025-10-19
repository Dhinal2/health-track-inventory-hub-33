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

        const invoiceDetails = await new sql.Request(transaction)
            .input('InvoiceID', sql.Int, id)
            .query(`
                SELECT 
                    i.TotalAmount, i.OrderID,
                    ISNULL((SELECT SUM(Amount) FROM Payments WHERE InvoiceID = @InvoiceID), 0) as TotalPaid 
                FROM Invoices i WHERE i.InvoiceID = @InvoiceID
            `);

        if (invoiceDetails.recordset.length === 0) {
            await transaction.rollback();
            return res.status(404).send({ message: 'Invoice not found.' });
        }
        
        const { TotalAmount, OrderID, TotalPaid } = invoiceDetails.recordset[0];
        const halfAmount = TotalAmount / 2;

        if (parseFloat(amountPaid) < TotalAmount && TotalPaid == 0 && parseFloat(amountPaid) < halfAmount) {
            await transaction.rollback();
            return res.status(400).send({ 
                message: `Partial payments must be at least 50% of the total amount. Minimum payment: $${halfAmount.toFixed(2)}` 
            });
        }

        await new sql.Request(transaction)
            .input('InvoiceID', sql.Int, id)
            .input('Amount', sql.Decimal(10, 2), amountPaid)
            .input('PaymentMethod', sql.NVarChar, 'Credit Card')
            .query('INSERT INTO Payments (InvoiceID, Amount, PaymentMethod) VALUES (@InvoiceID, @Amount, @PaymentMethod)');

        const newTotalPaid = TotalPaid + parseFloat(amountPaid);
        const newPaymentStatus = newTotalPaid >= TotalAmount ? 'Paid' : 'Partially Paid';
        
        await new sql.Request(transaction)
            .input('InvoiceID', sql.Int, id)
            .input('PaymentStatus', sql.NVarChar, newPaymentStatus)
            .query('UPDATE Invoices SET PaymentStatus = @PaymentStatus WHERE InvoiceID = @InvoiceID');
        
        const orderResult = await new sql.Request(transaction)
            .input('OrderID', sql.Int, OrderID)
            .query('SELECT Status, UserID FROM Orders WHERE OrderID = @OrderID');
        const { Status: currentOrderStatus, UserID } = orderResult.recordset[0];

        if (currentOrderStatus === 'Awaiting Payment') {
            await new sql.Request(transaction).input('OrderID', sql.Int, OrderID).query("INSERT INTO Shipments (OrderID, Status, Destination) VALUES (@OrderID, 'Pending', 'User Department')");
            await new sql.Request(transaction).input('OrderID', sql.Int, OrderID).query("UPDATE Orders SET Status = 'Dispatched' WHERE OrderID = @OrderID");
        } else if (currentOrderStatus === 'Pending Final Payment' && newPaymentStatus === 'Paid') {
            // ... (inventory logic remains the same)
        }

        await transaction.commit();
        res.status(200).send({ message: 'Payment successful', newStatus: newPaymentStatus });
    
    } catch (error) {
        // --- THIS IS THE UPDATED PART ---
        await transaction.rollback();
        // Log the full error to the server's console for debugging
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.error("!!!     CRITICAL ERROR During Payment    !!!");
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.error("Timestamp:", new Date().toISOString());
        console.error("Route: POST /api/invoices/:id/pay");
        console.error("Full Error Object:", JSON.stringify(error, null, 2)); // This will give us the exact details

        // Send a more specific error message back to the frontend
        let errorMessage = 'Payment processing failed due to a critical server error.';
        if (error.originalError && error.originalError.info) {
            errorMessage = `Database Error: ${error.originalError.info.message}`;
        }
        
        res.status(500).send({ message: errorMessage });
    }
});

// GET /api/invoices/by-order - Fetch an invoice by its OrderID
router.post('/by-order', async (req, res) => {
    console.log("  -> 🎯 [POST /api/invoices/by-order] Route hit!"); // Diagnostic log
    const { orderId } = req.body;

    if (!orderId) {
        console.log("  -> ❗ Error: OrderID missing from request.");
        return res.status(400).send({ message: 'OrderID is required.' });
    }

    try {
        const pool = await sql.connect(dbConfig);
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
        console.error('  -> ❌ Error fetching invoice by order:', error);
        res.status(500).send({ message: 'Server error' });
    }
});


module.exports = router;
console.log("  -> ✅ invoices.js routes loaded."); // Diagnostic log