const express = require('express');
const bcrypt = require('bcrypt'); // <-- THE FIX
const { sql, poolPromise } = require('../db');
const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT UserID as id, Name as name, Email as email, Role as role, Status as status FROM Users');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Get a single user by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT UserID as id, Name as name, Email as email, Role as role, ContactNumber as contactNumber FROM Users WHERE UserID = @id');
    
    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Update user profile (non-password fields)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, contactNumber, role } = req.body; 
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('contactNumber', sql.NVarChar, contactNumber)
      .input('role', sql.NVarChar, role)
      .query('UPDATE Users SET Name = @name, Email = @email, ContactNumber = @contactNumber, Role = @role WHERE UserID = @id');
      
    if (result.rowsAffected[0] > 0) {
      const updatedUserResult = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT UserID as id, Name as name, Email as email, Role as role FROM Users WHERE UserID = @id');
      res.status(200).json(updatedUserResult.recordset[0]);
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).send(err.message);
  }
});

// A new, separate route for an admin to update a user's password
router.put('/:id/password', async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).send('Password is required.');
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, id)
      .input('hashedPassword', sql.NVarChar, hashedPassword)
      .query('UPDATE Users SET Password = @hashedPassword WHERE UserID = @id');
    
    res.status(200).send('Password updated successfully');
  } catch (err) {
    console.error("Error updating password:", err);
    res.status(500).send(err.message);
  }
});

// Add a new user with a hashed password
router.post('/', async (req, res) => {
  const { name, email, password, role, contactNumber } = req.body;

  if (!name || !email || !password || !role || !contactNumber) {
      return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
      const pool = await poolPromise;

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const result = await pool.request()
          .input('Name', sql.NVarChar, name)
          .input('Email', sql.NVarChar, email)
          .input('Password', sql.NVarChar, hashedPassword)
          .input('Role', sql.NVarChar, role)
          .input('ContactNumber', sql.NVarChar, contactNumber)
          .query('INSERT INTO Users (Name, Email, Password, Role, ContactNumber) OUTPUT INSERTED.UserID, INSERTED.Name, INSERTED.Email, INSERTED.Role VALUES (@Name, @Email, @Password, @Role, @ContactNumber)');
      
      const newUser = result.recordset[0];
      res.status(201).json(newUser);

  } catch (error) {
      console.error('Error creating user:', error);
      if (error.number === 2627 || error.number === 2601) {
          return res.status(409).json({ message: 'An account with this email already exists.' });
      }
      res.status(500).json({ message: 'Server error while creating user.' });
  }
});

// Delete a user
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Users WHERE UserID = @id');
    if (result.rowsAffected[0] > 0) {
      res.send('User deleted successfully');
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;