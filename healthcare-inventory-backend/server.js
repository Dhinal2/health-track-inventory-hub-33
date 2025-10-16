const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Database configuration
const dbConfig = {
    user: 'healthcare_app_user',         
    password: 'Pass123!',      
    server: 'ASUS-TUF-GAMING\\SQLEXPRESS',
    database: 'HealthCareDB',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// Test database connection
sql.connect(dbConfig).then(pool => {
    console.log('Connected to SQL Server');
    // You can now use the 'pool' object to execute queries
}).catch(err => {
    console.error('Database connection failed:', err);
});

// Basic route
app.get('/', (req, res) => {
    res.send('Healthcare Inventory Backend is running!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

//Login Routes
const authRouter = require('./routes/auth'); 
const dashboardRouter = require('./routes/dashboard');
const productsRouter = require('./routes/products');
const inventoryRouter = require('./routes/inventory');
const ordersRouter = require('./routes/orders');
const shipmentsRouter = require('./routes/shipments');
const invoicesRouter = require('./routes/invoices');

app.use('/api/auth', authRouter); 
app.use('/api/dashboard', dashboardRouter);
app.use('/api/products', productsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/shipments', shipmentsRouter);
app.use('/api/invoices', invoicesRouter);