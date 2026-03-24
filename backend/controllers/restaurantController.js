// backend/controllers/restaurantController.js
const db = require('../config/db');

// ─── GET /api/locations ──────────────────────────────────────
exports.getLocations = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM locations ORDER BY name');
    res.json({ success: true, locations: rows });
  } catch (err) {
    console.error('getLocations error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/restaurants?location_id=X ─────────────────────
exports.getRestaurants = async (req, res) => {
  try {
    const { location_id } = req.query;
    let sql    = 'SELECT r.*, l.name AS location_name FROM restaurants r JOIN locations l ON l.id = r.location_id';
    let params = [];

    if (location_id) {
      sql += ' WHERE r.location_id = ?';
      params.push(location_id);
    }

    sql += ' ORDER BY r.rating DESC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, restaurants: rows });
  } catch (err) {
    console.error('getRestaurants error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/restaurants/:id ────────────────────────────────
exports.getRestaurantById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, l.name AS location_name
       FROM restaurants r
       JOIN locations l ON l.id = r.location_id
       WHERE r.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Restaurant not found.' });
    }
    res.json({ success: true, restaurant: rows[0] });
  } catch (err) {
    console.error('getRestaurantById error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/restaurants/:id/menu ───────────────────────────
exports.getMenu = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM menu_items
       WHERE restaurant_id = ? AND is_available = 1
       ORDER BY category, name`,
      [req.params.id]
    );

    // Group by category for convenience
    const grouped = {};
    rows.forEach((item) => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });

    res.json({ success: true, menu: rows, grouped });
  } catch (err) {
    console.error('getMenu error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
