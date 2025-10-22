const { Pool } = require('pg');

// Create a new connection pool
const pool = new Pool({
  user: 'healthtrack_user',       
  host: 'localhost',
  database: 'HealthCareDB',
  password: 'Pass123!', 
  port: 5432, // Default PostgreSQL port
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Successfully connected to PostgreSQL database!');
  client.release(); // Release the client back to the pool
});

// Export a query function that the rest of our app can use
module.exports = {
  // query function will be used like: db.query('SELECT * FROM users WHERE id = $1', [1])
  query: (text, params) => pool.query(text, params),

  // We also export the pool directly for more complex transactions
  pool: pool,
};