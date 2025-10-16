const express = require('express');
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const router = express.Router();

const dbConfig = {
    user: 'healthcare_app_user',
    password: 'your_new_password',
    server: 'ASUS-TUF-GAMING\\SQLEXPRESS',
    database: 'HealthCareDB',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// POST /api/auth/signup - Register a new user
router.post('/signup', async (req, res) => {
    const { Name, Email, Password, Role, ContactNumber } = req.body;

    try {
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(Password, salt);

        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('Name', sql.NVarChar, Name)
            .input('Email', sql.NVarChar, Email)
            .input('Password', sql.NVarChar, hashedPassword)
            .input('Role', sql.NVarChar, Role)
            .input('ContactNumber', sql.NVarChar, ContactNumber)
            .query('INSERT INTO Users (Name, Email, Password, Role, ContactNumber) VALUES (@Name, @Email, @Password, @Role, @ContactNumber)');

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
        const pool = await sql.connect(dbConfig);
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

        // THE FIX IS HERE: We now include the UserID in the response
        res.status(200).json({
            UserID: user.UserID, // <-- ADD THIS LINE
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