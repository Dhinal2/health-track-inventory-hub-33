const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { sql, poolPromise } = require('../db'); // <-- IMPORT the connection from db.js

// POST /api/auth/signup - Register a new user
router.post('/signup', async (req, res) => {
    const { Name, Email, Password, Role, ContactNumber } = req.body;

    try {
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(Password, salt);

        const pool = await poolPromise; // <-- USE the connection pool
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
    const { email, password, role } = req.body;

    try {
        const pool = await poolPromise; // <-- USE the connection pool
        const result = await pool.request()
            .input('Email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @Email');

        const user = result.recordset[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.Password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        if (user.Role !== role) {
            return res.status(401).json({ message: 'Role does not match' });
        }

        // The critical fix: We send the UserID back to the frontend
        res.status(200).json({
            UserID: user.UserID, // This is essential for the frontend to work
            Email: user.Email,
            Name: user.Name,
            Role: user.Role
        });

    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error during login' });
    }
});


module.exports = router;