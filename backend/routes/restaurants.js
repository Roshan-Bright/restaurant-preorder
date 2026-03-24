// backend/routes/restaurants.js
const express           = require('express');
const router            = express.Router();
const restaurantCtrl    = require('../controllers/restaurantController');

// Locations
router.get('/locations',            restaurantCtrl.getLocations);

// Restaurants
router.get('/restaurants',          restaurantCtrl.getRestaurants);
router.get('/restaurants/:id',      restaurantCtrl.getRestaurantById);
router.get('/restaurants/:id/menu', restaurantCtrl.getMenu);

module.exports = router;
