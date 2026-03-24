// backend/controllers/orderController.js
const db = require('../config/db');

// ─── POST /api/orders ────────────────────────────────────────
// Body: { restaurant_id, scheduled_date, scheduled_time, notes, items: [{menu_item_id, quantity}] }
exports.placeOrder = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { restaurant_id, scheduled_date, scheduled_time, notes, items } = req.body;

    if (!restaurant_id || !scheduled_date || !scheduled_time || !items || items.length === 0) {
      conn.release();
      return res.status(400).json({ success: false, message: 'Missing required order fields.' });
    }

    // Fetch menu item prices (security: never trust client-side prices)
    const itemIds = items.map((i) => i.menu_item_id);
    const [menuRows] = await conn.query(
      `SELECT id, name, price FROM menu_items WHERE id IN (?) AND is_available = 1`,
      [itemIds]
    );

    if (menuRows.length !== itemIds.length) {
      conn.release();
      return res.status(400).json({ success: false, message: 'One or more menu items are unavailable.' });
    }

    const priceMap = {};
    menuRows.forEach((m) => { priceMap[m.id] = m.price; });

    const total_price = items.reduce((sum, i) => sum + priceMap[i.menu_item_id] * i.quantity, 0);

    await conn.beginTransaction();

    // Insert order
    const [orderResult] = await conn.query(
      `INSERT INTO orders (user_id, restaurant_id, scheduled_date, scheduled_time, total_price, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, restaurant_id, scheduled_date, scheduled_time, total_price, notes || null]
    );
    const order_id = orderResult.insertId;

    // Insert order items
    const orderItemValues = items.map((i) => [order_id, i.menu_item_id, i.quantity, priceMap[i.menu_item_id]]);
    await conn.query(
      'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES ?',
      [orderItemValues]
    );

    await conn.commit();
    conn.release();

    // Fetch full order for Socket.IO broadcast
    const fullOrder = await getOrderById(order_id);

    // Emit real-time notification via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to('staff').emit('new_order', fullOrder);
    }

    return res.status(201).json({ success: true, message: 'Order placed successfully!', order: fullOrder });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('placeOrder error:', err);
    return res.status(500).json({ success: false, message: 'Failed to place order. Please try again.' });
  }
};

// ─── GET /api/orders/my ──────────────────────────────────────
exports.getMyOrders = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT o.id, o.scheduled_date, o.scheduled_time, o.status, o.total_price, o.created_at,
              r.name AS restaurant_name, r.image_url AS restaurant_image
       FROM orders o
       JOIN restaurants r ON r.id = o.restaurant_id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    // Attach items to each order
    for (const order of rows) {
      const [items] = await db.query(
        `SELECT oi.quantity, oi.price, m.name, m.category
         FROM order_items oi
         JOIN menu_items m ON m.id = oi.menu_item_id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json({ success: true, orders: rows });
  } catch (err) {
    console.error('getMyOrders error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/orders (staff/admin — all orders) ──────────────
exports.getAllOrders = async (req, res) => {
  try {
    const { status, date } = req.query;
    let sql = `
      SELECT o.id, o.scheduled_date, o.scheduled_time, o.status, o.total_price, o.created_at, o.notes,
             u.name AS customer_name, u.phone AS customer_phone,
             r.name AS restaurant_name
      FROM orders o
      JOIN users u ON u.id = o.user_id
      JOIN restaurants r ON r.id = o.restaurant_id
      WHERE 1=1`;
    const params = [];

    if (status) { sql += ' AND o.status = ?'; params.push(status); }
    if (date)   { sql += ' AND o.scheduled_date = ?'; params.push(date); }

    sql += ' ORDER BY o.created_at DESC';

    const [rows] = await db.query(sql, params);

    for (const order of rows) {
      const [items] = await db.query(
        `SELECT oi.quantity, oi.price, m.name FROM order_items oi
         JOIN menu_items m ON m.id = oi.menu_item_id WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json({ success: true, orders: rows });
  } catch (err) {
    console.error('getAllOrders error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── PATCH /api/orders/:id/status (staff/admin) ──────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const [result] = await db.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Notify staff room of status change
    const io = req.app.get('io');
    if (io) {
      io.to('staff').emit('order_status_update', { order_id: req.params.id, status });
    }

    res.json({ success: true, message: `Order status updated to "${status}".` });
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Helper ──────────────────────────────────────────────────
async function getOrderById(order_id) {
  const [orders] = await db.query(
    `SELECT o.id, o.scheduled_date, o.scheduled_time, o.status, o.total_price, o.created_at, o.notes,
            u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
            r.name AS restaurant_name, r.image_url AS restaurant_image
     FROM orders o
     JOIN users u ON u.id = o.user_id
     JOIN restaurants r ON r.id = o.restaurant_id
     WHERE o.id = ?`,
    [order_id]
  );

  const order = orders[0];
  const [items] = await db.query(
    `SELECT oi.quantity, oi.price, m.name, m.category, m.image_url
     FROM order_items oi
     JOIN menu_items m ON m.id = oi.menu_item_id
     WHERE oi.order_id = ?`,
    [order_id]
  );
  order.items = items;
  return order;
}
