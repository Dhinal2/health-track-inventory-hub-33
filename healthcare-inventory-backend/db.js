const sql = require('mssql');

const config = {
    user: 'healthcare_app_user',
    password: 'Pass123!',
    server: 'ASUS-TUF-GAMING\\SQLEXPRESS', // Your server name
    database: 'HealthCareDB',
    options: {
        encrypt: false, // For local dev
        trustServerCertificate: true // For local dev
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to MSSQL');
        return pool;
    })
    .catch(err => console.error('Database Connection Failed! Bad Config: ', err));

module.exports = {
    sql,
    poolPromise
};