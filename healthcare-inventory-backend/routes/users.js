const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db'); // Import the new 'db' object
const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    // PostgreSQL query, using lowercase schema
    const queryText = 'SELECT userid as id, name, email, role, status FROM users';
    const result = await db.query(queryText);
    
    // Use .rows instead of .recordset
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching all users:', err);
    res.status(500).send(err.message);
  }
});

// Get a single user by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // PostgreSQL query with $1 placeholder
    const queryText = 'SELECT userid as id, name, email, role, contactnumber FROM users WHERE userid = $1';
    const result = await db.query(queryText, [id]);
    
    // Use .rows instead of .recordset
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
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
  const { name, email, password, contactNumber } = req.body;

  if (!name && !email && !password && !contactNumber) {
    return res.status(400).json({ message: 'No valid fields provided for update' });
  }

  try {
    const updateFields = [];
    const values = [];
    let queryIndex = 1;

    // Dynamically build the query
    if (name) {
      updateFields.push(`name = $${queryIndex++}`);
      values.push(name);
    }
    if (email) {
      updateFields.push(`email = $${queryIndex++}`);
      values.push(email);
    }
    if (contactNumber) {
      updateFields.push(`contactnumber = $${queryIndex++}`);
      values.push(contactNumber);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push(`password = $${queryIndex++}`);
      values.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update.' });
    }

    // Add the user ID for the WHERE clause
    values.push(id);
    const idIndex = queryIndex;

    // PostgreSQL UPDATE query with RETURNING clause (more efficient)
    const queryText = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE userid = $${idIndex}
      RETURNING userid, name, email, role, contactnumber
    `;
    
    const result = await db.query(queryText, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Updated user not found' });
    }

    const updatedUser = result.rows[0];

    // Send back the user object with Uppercase keys, as the frontend localStorage expects this
    res.json({ 
      message: 'Profile updated successfully', 
      user: {
        UserID: updatedUser.userid,
        Name: updatedUser.name,
        Email: updatedUser.email,
        Role: updatedUser.role,
        ContactNumber: updatedUser.contactnumber
      } 
    });

  } catch (err) {
    console.error(`Error updating user ${id}:`, err);
    // Handle PostgreSQL unique violation code
    if (err.code === '23505') { 
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
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // PostgreSQL INSERT with RETURNING clause
      const queryText = `
        INSERT INTO users (name, email, password, role, contactnumber) 
        VALUES ($1, $2, $3, $4, $5)
        RETURNING userid as id, name, email, role
      `;
      const values = [name, email, hashedPassword, role, contactNumber];

      const result = await db.query(queryText, values);
      
      // The frontend user management table expects lowercase keys, so this is fine
      const newUser = result.rows[0];
      res.status(201).json(newUser);

  } catch (error) {
      console.error('Error creating user:', error);
      // Handle PostgreSQL unique violation code
      if (error.code === '23505') {
          return res.status(409).json({ message: 'An account with this email already exists.' });
      }
      res.status(500).json({ message: 'Server error while creating user.' });
  }
});

// Delete a user
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const queryText = 'DELETE FROM users WHERE userid = $1';
    const result = await db.query(queryText, [id]);

    // In 'pg', rowCount is used instead of rowsAffected
    if (result.rowCount > 0) {
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