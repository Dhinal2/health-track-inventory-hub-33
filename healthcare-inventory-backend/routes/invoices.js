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
        trustServerCertificate: true
    }
};

// GET /api/invoices/user-invoices - Fetch invoices based on role
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

        // 1. Record the payment
        await new sql.Request(transaction)
            .input('InvoiceID', sql.Int, id)
            .input('Amount', sql.Decimal(10, 2), amountPaid)
            .input('PaymentMethod', sql.NVarChar, 'Credit Card') // Mock payment method
            .query('INSERT INTO Payments (InvoiceID, Amount, PaymentMethod) VALUES (@InvoiceID, @Amount, @PaymentMethod)');

        // 2. Get the invoice total and total paid so far
        const invoiceDetails = await new sql.Request(transaction)
            .input('InvoiceID', sql.Int, id)
            .query(`
                SELECT 
                    i.TotalAmount, 
                    (SELECT SUM(Amount) FROM Payments WHERE InvoiceID = @InvoiceID) as TotalPaid 
                FROM Invoices i WHERE i.InvoiceID = @InvoiceID
            `);
        
        const { TotalAmount, TotalPaid } = invoiceDetails.recordset[0];
        let newStatus = 'Partially Paid';
        if (TotalPaid >= TotalAmount) {
            newStatus = 'Paid';
        }

        // 3. Update the invoice status
        await new sql.Request(transaction)
            .input('InvoiceID', sql.Int, id)
            .input('PaymentStatus', sql.NVarChar, newStatus)
            .query('UPDATE Invoices SET PaymentStatus = @PaymentStatus WHERE InvoiceID = @InvoiceID');

        await transaction.commit();
        res.status(200).send({ message: 'Payment successful', newStatus: newStatus });

    } catch (error) {
        await transaction.rollback();
        console.error('Error processing payment:', error);
        res.status(500).send({ message: 'Payment processing failed' });
    }
});

module.exports = router;