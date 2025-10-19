const express = require('express');
const bcrypt = require('bcryptjs');
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
  // --- THIS IS THE FIX ---
  // The password is now handled in a separate route.
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
      // Return the updated user data
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


// --- THIS IS THE FIX ---
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
    const { name, email, role, contactNumber, password } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const pool = await poolPromise;
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('role', sql.NVarChar, role)
            .input('contactNumber', sql.NVarChar, contactNumber)
            .input('password', sql.NVarChar, hashedPassword)
            .query('INSERT INTO Users (Name, Email, Role, ContactNumber, Password, Status) OUTPUT INSERTED.UserID as id, INSERTED.Name as name, INSERTED.Email as email, INSERTED.Role as role, INSERTED.ContactNumber as contactNumber, INSERTED.Status as status VALUES (@name, @email, @role, @contactNumber, @password, \'Active\')');
        
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error("Error creating user:", err);
        res.status(500).send(err.message);
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
      res.status(44).send('User not found');
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;