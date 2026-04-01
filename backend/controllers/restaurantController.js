// backend/controllers/restaurantController.js
const db = require('../config/db');

// ─── GET /api/locations ──────────────────────────────────────
exports.getLocations = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM locations ORDER BY name');
    res.json({ success: true, locations: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── POST /api/locations (admin) ─────────────────────────────
exports.addLocation = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required.' });
    const [result] = await db.query('INSERT INTO locations (name) VALUES (?)', [name.trim()]);
    res.status(201).json({ success: true, message: 'Location added.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── DELETE /api/locations/:id (admin) ───────────────────────
exports.deleteLocation = async (req, res) => {
  try {
    await db.query('DELETE FROM locations WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Location deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/restaurants ────────────────────────────────────
exports.getRestaurants = async (req, res) => {
  try {
    const { location_id } = req.query;
    let sql = 'SELECT r.*, l.name AS location_name FROM restaurants r JOIN locations l ON l.id = r.location_id';
    let params = [];
    if (location_id) { sql += ' WHERE r.location_id = ?'; params.push(location_id); }
    sql += ' ORDER BY r.rating DESC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, restaurants: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/restaurants/:id ────────────────────────────────
exports.getRestaurantById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, l.name AS location_name FROM restaurants r
       JOIN locations l ON l.id = r.location_id WHERE r.id = ?`, [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    res.json({ success: true, restaurant: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── POST /api/restaurants (admin) ───────────────────────────
exports.addRestaurant = async (req, res) => {
  try {
    const { name, location_id, image_url, description, rating } = req.body;
    if (!name || !location_id) return res.status(400).json({ success: false, message: 'Name and location are required.' });
    const [result] = await db.query(
      'INSERT INTO restaurants (name, location_id, image_url, description, rating) VALUES (?,?,?,?,?)',
      [name.trim(), location_id, image_url || null, description || null, rating || 4.0]
    );
    res.status(201).json({ success: true, message: 'Restaurant added.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── PUT /api/restaurants/:id (admin) ────────────────────────
exports.updateRestaurant = async (req, res) => {
  try {
    const { name, location_id, image_url, description, rating } = req.body;
    await db.query(
      'UPDATE restaurants SET name=?, location_id=?, image_url=?, description=?, rating=? WHERE id=?',
      [name, location_id, image_url, description, rating, req.params.id]
    );
    res.json({ success: true, message: 'Restaurant updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── DELETE /api/restaurants/:id (admin) ─────────────────────
exports.deleteRestaurant = async (req, res) => {
  try {
    await db.query('DELETE FROM restaurants WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Restaurant deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/restaurants/:id/menu ───────────────────────────
exports.getMenu = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM menu_items WHERE restaurant_id = ? AND is_available = 1 ORDER BY category, name`,
      [req.params.id]
    );
    const grouped = {};
    rows.forEach((item) => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });
    res.json({ success: true, menu: rows, grouped });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/restaurants/:id/menu/all (admin — includes unavailable) ─
exports.getMenuAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category, name`,
      [req.params.id]
    );
    res.json({ success: true, menu: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── POST /api/restaurants/:id/menu (admin) ──────────────────
exports.addMenuItem = async (req, res) => {
  try {
    const { name, description, price, image_url, category } = req.body;
    if (!name || !price) return res.status(400).json({ success: false, message: 'Name and price are required.' });
    const [result] = await db.query(
      'INSERT INTO menu_items (restaurant_id, name, description, price, image_url, category) VALUES (?,?,?,?,?,?)',
      [req.params.id, name.trim(), description || null, price, image_url || null, category || 'Main Course']
    );
    res.status(201).json({ success: true, message: 'Menu item added.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── PUT /api/menu/:id (admin) ────────────────────────────────
exports.updateMenuItem = async (req, res) => {
  try {
    const { name, description, price, image_url, category, is_available } = req.body;
    await db.query(
      'UPDATE menu_items SET name=?, description=?, price=?, image_url=?, category=?, is_available=? WHERE id=?',
      [name, description, price, image_url, category, is_available !== undefined ? is_available : 1, req.params.id]
    );
    res.json({ success: true, message: 'Menu item updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── DELETE /api/menu/:id (admin) ────────────────────────────
exports.deleteMenuItem = async (req, res) => {
  try {
    await db.query('DELETE FROM menu_items WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Menu item deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/staff (admin) ───────────────────────────────────
exports.getStaff = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.restaurant_id, r.name AS restaurant_name
       FROM users u LEFT JOIN restaurants r ON r.id = u.restaurant_id
       WHERE u.role IN ('staff','admin') ORDER BY u.role, u.name`
    );
    res.json({ success: true, staff: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── PATCH /api/staff/:id/restaurant (admin) ─────────────────
exports.assignStaffRestaurant = async (req, res) => {
  try {
    const { restaurant_id } = req.body;
    await db.query('UPDATE users SET restaurant_id = ? WHERE id = ?', [restaurant_id || null, req.params.id]);
    res.json({ success: true, message: 'Staff restaurant updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
