// backend/routes/restaurants.js
const express = require('express');
const router  = express.Router();
const rc      = require('../controllers/restaurantController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Locations
router.get('/locations',                rc.getLocations);
router.post('/locations',               protect, restrictTo('admin'), rc.addLocation);
router.delete('/locations/:id',         protect, restrictTo('admin'), rc.deleteLocation);

// Restaurants
router.get('/restaurants',              rc.getRestaurants);
router.get('/restaurants/:id',          rc.getRestaurantById);
router.post('/restaurants',             protect, restrictTo('admin'), rc.addRestaurant);
router.put('/restaurants/:id',          protect, restrictTo('admin'), rc.updateRestaurant);
router.delete('/restaurants/:id',       protect, restrictTo('admin'), rc.deleteRestaurant);

// Menu
router.get('/restaurants/:id/menu',     rc.getMenu);
router.get('/restaurants/:id/menu/all', protect, restrictTo('admin','staff'), rc.getMenuAll);
router.post('/restaurants/:id/menu',    protect, restrictTo('admin'), rc.addMenuItem);
router.put('/menu/:id',                 protect, restrictTo('admin'), rc.updateMenuItem);
router.delete('/menu/:id',              protect, restrictTo('admin'), rc.deleteMenuItem);

// Staff management
router.get('/staff',                    protect, restrictTo('admin'), rc.getStaff);
router.patch('/staff/:id/restaurant',   protect, restrictTo('admin'), rc.assignStaffRestaurant);

module.exports = router;
