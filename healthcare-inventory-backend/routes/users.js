const express = require('express');
const bcrypt = require('bcrypt');
const { sql, poolPromise } = require('../db'); // Correctly using your db import
const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT UserID as id, Name as name, Email as email, Role as role, Status as status FROM Users');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching all users:', err);
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
      // --- FIX: Alias all fields to lowercase and add ContactNumber ---
      .query('SELECT UserID as id, Name as name, Email as email, Role as role, ContactNumber as contactNumber FROM Users WHERE UserID = @id');
    
    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    console.error(`Error fetching user ${id}:`, err);
    res.status(500).send(err.message);
  }
});

// Update user profile (name, email, contactNumber, or password)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  // --- FIX: Add contactNumber to destructuring ---
  const { name, email, password, contactNumber } = req.body;

  if (!name && !email && !password && !contactNumber) {
    return res.status(400).json({ message: 'No valid fields provided for update' });
  }

  try {
    const pool = await poolPromise;
    const request = pool.request(); 
    
    const updateFields = [];

    if (name) {
      updateFields.push('Name = @name');
      request.input('name', sql.NVarChar, name);
    }
    if (email) {
      updateFields.push('Email = @email');
      request.input('email', sql.NVarChar, email);
    }
    
    // --- FIX: Add logic to update contactNumber ---
    if (contactNumber) {
      updateFields.push('ContactNumber = @contactNumber');
      request.input('contactNumber', sql.NVarChar, contactNumber);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('Password = @password');
      request.input('password', sql.NVarChar, hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update.' });
    }

    const queryString = `UPDATE Users SET ${updateFields.join(', ')} WHERE UserID = @id`;
    request.input('id', sql.Int, id);

    await request.query(queryString);

    // After updating, fetch the latest user data to send back
    const result = await pool.request()
        .input('id', sql.Int, id)
        // --- FIX: Ensure we fetch the updated ContactNumber here too ---
        .query('SELECT UserID, Name, Email, Role, ContactNumber FROM Users WHERE UserID = @id');

    if (result.recordset.length === 0) {
        return res.status(404).json({ message: 'Updated user not found' });
    }

    res.json({ message: 'Profile updated successfully', user: result.recordset[0] });

  } catch (err) {
    console.error(`Error updating user ${id}:`, err);
    if (err.number === 2627 || err.number === 2601) { 
        return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    res.status(500).send(err.message);
  }
});

// --- THIS IS THE CORRECTED UPDATE ROUTE ---
// Update user profile (name, email, or password)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  if (!name && !email && !password) {
    return res.status(400).json({ message: 'No valid fields provided for update' });
  }

  try {
    const pool = await poolPromise;
    const request = pool.request(); // Create a request object
    
    const updateFields = [];

    // Dynamically add fields to the update query and the request inputs
    if (name) {
      updateFields.push('Name = @name');
      request.input('name', sql.NVarChar, name);
    }
    if (email) {
      updateFields.push('Email = @email');
      request.input('email', sql.NVarChar, email);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('Password = @password');
      request.input('password', sql.NVarChar, hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update.' });
    }

    const queryString = `UPDATE Users SET ${updateFields.join(', ')} WHERE UserID = @id`;
    request.input('id', sql.Int, id);

    await request.query(queryString);

    // After updating, fetch the latest user data to send back
    const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT UserID, Name, Email, Role FROM Users WHERE UserID = @id');

    if (result.recordset.length === 0) {
        return res.status(404).json({ message: 'Updated user not found' });
    }

    res.json({ message: 'Profile updated successfully', user: result.recordset[0] });

  } catch (err) {
    console.error(`Error updating user ${id}:`, err);
    if (err.number === 2627 || err.number === 2601) { // Unique constraint violation (email)
        return res.status(409).json({ message: 'An account with this email already exists.' });
    }
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
    console.error(`Error deleting user ${id}:`, err);
    res.status(500).send(err.message);
  }
});

module.exports = router;