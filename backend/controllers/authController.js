// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

const SALT_ROUNDS = 10;

/** Generate a signed JWT for a user record */
const signToken = (user) =>
  jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, restaurant_id: user.restaurant_id || null },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ─── POST /api/auth/register ─────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Check duplicate email
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), password_hash, phone || null, 'customer']
    );

    const user = { id: result.insertId, name: name.trim(), email: email.toLowerCase().trim(), role: 'customer' };
    const token = signToken(user);

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user,
    });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ─── POST /api/auth/login ────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = signToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        phone: user.phone,
        role:  user.role,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ─── GET /api/auth/me ────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, user: rows[0] });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
