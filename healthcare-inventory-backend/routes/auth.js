const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../db');

// POST /api/auth/signup - Register a new user
router.post('/signup', async (req, res) => {
    // We use lowercase to match the new schema
    const { name, email, password, role, contactNumber } = req.body;

    try {
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, 10); // Use 10 rounds

        // PostgreSQL query syntax
        const queryText = 'INSERT INTO users (name, email, password, role, contactnumber, status) VALUES ($1, $2, $3, $4, $5, $6)';
        const values = [name, email, hashedPassword, role, contactNumber, 'Active'];
        
        // Execute the query
        await db.query(queryText, values);

        res.status(201).send({ message: 'User created successfully' });
    } catch (error) {
        console.error(error);
        // Handle PostgreSQL unique email violation
        if (error.code === '23505') { 
            return res.status(409).send({ message: 'An account with this email already exists.' });
        }
        res.status(500).send({ message: 'Server error during signup' });
    }
});

// POST /api/auth/login - Log a user in
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).send({ message: 'Email and password are required.' });
    }

    try {
        // PostgreSQL query syntax
        const queryText = 'SELECT userid, name, email, role, password FROM users WHERE email = $1';
        
        // Execute the query
        const userResult = await db.query(queryText, [email]);

        // Use .rows instead of .recordset
        if (userResult.rows.length === 0) {
            // User not found
            return res.status(401).send({ message: 'Invalid credentials. Please check your email and password.' });
        }

        const user = userResult.rows[0];
        const storedHash = user.password; // lowercase 'password' from schema

        // Now, securely compare the provided password with the stored hash
        const passwordsMatch = await bcrypt.compare(password, storedHash);

        if (passwordsMatch) {
            // Send back the user info. 
            // IMPORTANT: The keys (UserID, Name, Role) are case-sensitive 
            // and must match what the frontend expects in localStorage.
            res.json({
                UserID: user.userid, // Key: UserID, Value: user.userid
                Name: user.name,
                Email: user.email,
                Role: user.role
            });
        } else {
            // Passwords do not match.
            res.status(401).send({ message: 'Invalid credentials. Please check your email and password.' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send({ message: 'Server error during login.' });
    }
});

// POST /api/auth/verify-password - Verify a user's current password
router.post('/verify-password', async (req, res) => {
    const { userId, password } = req.body;
  
    if (!userId || !password) {
      return res.status(400).json({ message: 'User ID and password are required' });
    }
  
    try {
        const queryText = 'SELECT password FROM users WHERE userid = $1';
        const result = await db.query(queryText, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
  
        const user = result.rows[0];
        // We can await bcrypt.compare
        const isMatch = await bcrypt.compare(password, user.password);
  
        if (isMatch) {
            return res.status(200).json({ message: 'Password verified successfully' });
        } else {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }
    } catch (error) {
        console.error('Verify password error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 