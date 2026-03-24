// backend/routes/orders.js
const express      = require('express');
const router       = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const orderCtrl    = require('../controllers/orderController');

// Customer routes
router.post('/',    protect, orderCtrl.placeOrder);
router.get('/my',   protect, orderCtrl.getMyOrders);

// Staff / Admin routes
router.get('/',              protect, restrictTo('staff', 'admin'), orderCtrl.getAllOrders);
router.patch('/:id/status',  protect, restrictTo('staff', 'admin'), orderCtrl.updateOrderStatus);

module.exports = router;
