const express = require('express');
const bcrypt = require('bcrypt'); // <-- THE FIX
const router = express.Router();
const { sql, poolPromise } = require('../db');

// POST /api/auth/signup - Register a new user
router.post('/signup', async (req, res) => {
    const { Name, Email, Password, Role, ContactNumber } = req.body;

    try {
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(Password, salt);

        const pool = await poolPromise;
        await pool.request()
            .input('Name', sql.NVarChar, Name)
            .input('Email', sql.NVarChar, Email)
            .input('Password', sql.NVarChar, hashedPassword)
            .input('Role', sql.NVarChar, Role)
            .input('ContactNumber', sql.NVarChar, ContactNumber)
            .query('INSERT INTO Users (Name, Email, Password, Role, ContactNumber, Status) VALUES (@Name, @Email, @Password, @Role, @ContactNumber, \'Active\')');

        res.status(201).send({ message: 'User created successfully' });
    } catch (error) {
        console.error(error);
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
        const pool = await poolPromise;
        // First, find the user by email only
        const userResult = await pool.request()
            .input('Email', sql.NVarChar, email)
            .query('SELECT UserID, Name, Email, Role, Password FROM Users WHERE Email = @Email');

        if (userResult.recordset.length === 0) {
            // User not found
            return res.status(401).send({ message: 'Invalid credentials. Please check your email and password.' });
        }

        const user = userResult.recordset[0];
        const storedHash = user.Password;

        // Now, securely compare the provided password with the stored hash
        const passwordsMatch = await bcrypt.compare(password, storedHash);

        if (passwordsMatch) {
            res.json({
                UserID: user.UserID,
                Name: user.Name,
                Email: user.Email,
                Role: user.Role
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
router.post('/verify-password', (req, res) => {
    const { userId, password } = req.body;
  
    if (!userId || !password) {
      return res.status(400).json({ message: 'User ID and password are required' });
    }
  
    const sql = 'SELECT Password FROM Users WHERE UserID = ?';
    db.query(sql, [userId], (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const user = rows[0];
      bcrypt.compare(password, user.Password, (err, isMatch) => {
        if (err) {
          console.error('Bcrypt error:', err);
          return res.status(500).json({ message: 'Error verifying password' });
        }
        if (isMatch) {
          return res.status(200).json({ message: 'Password verified successfully' });
        } else {
          return res.status(401).json({ message: 'Current password is incorrect' });
        }
      });
    });
  });

module.exports = router;