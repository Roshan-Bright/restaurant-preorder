-- ============================================================
-- RESTAURANT PRE-ORDER SYSTEM — Complete MySQL Schema + Seed
-- ============================================================
-- Run this entire file in MySQL Workbench:
--   1. Open MySQL Workbench
--   2. Connect to your local MySQL server
--   3. File → Open SQL Script → select this file
--   4. Execute All (Ctrl+Shift+Enter)
-- ============================================================

-- Create & select database
CREATE DATABASE IF NOT EXISTS restaurant_preorder
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE restaurant_preorder;

-- ─────────────────────────────────────────────────────────────
-- TABLE: users
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name         VARCHAR(120)    NOT NULL,
  email        VARCHAR(180)    NOT NULL UNIQUE,
  password_hash VARCHAR(255)   NOT NULL,
  phone        VARCHAR(20)     DEFAULT NULL,
  role         ENUM('customer','staff','admin') NOT NULL DEFAULT 'customer',
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_users_email (email),
  INDEX idx_users_role  (role)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────
-- TABLE: locations
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
  id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name  VARCHAR(120) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────
-- TABLE: restaurants
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS restaurants (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name         VARCHAR(180)  NOT NULL,
  location_id  INT UNSIGNED  NOT NULL,
  image_url    VARCHAR(500)  DEFAULT NULL,
  description  TEXT          DEFAULT NULL,
  rating       DECIMAL(2,1)  NOT NULL DEFAULT 4.0,
  PRIMARY KEY (id),
  INDEX idx_restaurants_location (location_id),
  CONSTRAINT fk_restaurants_location
    FOREIGN KEY (location_id) REFERENCES locations(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────
-- TABLE: menu_items
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  restaurant_id INT UNSIGNED    NOT NULL,
  name          VARCHAR(200)    NOT NULL,
  description   TEXT            DEFAULT NULL,
  price         DECIMAL(8,2)    NOT NULL,
  image_url     VARCHAR(500)    DEFAULT NULL,
  category      VARCHAR(80)     NOT NULL DEFAULT 'Main Course',
  is_available  TINYINT(1)      NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  INDEX idx_menu_restaurant (restaurant_id),
  INDEX idx_menu_category   (category),
  CONSTRAINT fk_menu_restaurant
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────
-- TABLE: orders
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id         INT UNSIGNED    NOT NULL,
  restaurant_id   INT UNSIGNED    NOT NULL,
  scheduled_date  DATE            NOT NULL,
  scheduled_time  TIME            NOT NULL,
  status          ENUM('Pending','Confirmed','Preparing','Ready','Completed','Cancelled')
                                  NOT NULL DEFAULT 'Pending',
  total_price     DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  notes           TEXT            DEFAULT NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_orders_user       (user_id),
  INDEX idx_orders_restaurant (restaurant_id),
  INDEX idx_orders_status     (status),
  INDEX idx_orders_date       (scheduled_date),
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_orders_restaurant
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────
-- TABLE: order_items
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id           INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  order_id     INT UNSIGNED   NOT NULL,
  menu_item_id INT UNSIGNED   NOT NULL,
  quantity     TINYINT UNSIGNED NOT NULL DEFAULT 1,
  price        DECIMAL(8,2)   NOT NULL,   -- snapshot of price at order time
  PRIMARY KEY (id),
  INDEX idx_order_items_order    (order_id),
  INDEX idx_order_items_menuitem (menu_item_id),
  CONSTRAINT fk_oi_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_oi_menu
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ============================================================
-- SEED DATA
-- ============================================================

-- ─── Locations ───────────────────────────────────────────────
INSERT INTO locations (name) VALUES
  ('Chennai'),
  ('Coimbatore'),
  ('Madurai'),
  ('Bangalore'),
  ('Mumbai');

-- ─── Staff / Admin Users (passwords are bcrypt of 'password123') ──
-- You can register customer accounts via the app UI.
-- Pre-seeded staff accounts for the Staff Dashboard:
INSERT INTO users (name, email, password_hash, phone, role) VALUES
  ('Admin User',  'admin@bistro.com',  '$2b$10$K7L1OJ45g54trakHSYnINuYps4PMWtRxFzGR0r7fZA3UWa5OyRuuG', '9876543210', 'admin'),
  ('Staff One',   'staff@bistro.com',  '$2b$10$K7L1OJ45g54trakHSYnINuYps4PMWtRxFzGR0r7fZA3UWa5OyRuuG', '9876543211', 'staff');
-- NOTE: The hash above corresponds to 'password123'
-- Change passwords immediately in production!

-- ─── Restaurants ─────────────────────────────────────────────
INSERT INTO restaurants (name, location_id, image_url, description, rating) VALUES
-- Chennai (1)
('The Marina Grill',      1, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', 'Coastal seafood & grill by the bay with panoramic Marina views.', 4.7),
('Spice Garden',          1, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', 'Authentic Chettinad cuisine in a heritage courtyard setting.', 4.5),
-- Coimbatore (2)
('The Nilgiri Bistro',    2, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', 'Mountain-inspired continental dishes with Nilgiri herbs and spices.', 4.6),
('Kovai Kitchen',         2, 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800', 'Traditional Kongunadu fare — fresh, local, and soulful.', 4.3),
-- Madurai (3)
('Meenakshi Heritage',    3, 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800', 'Royal Pandya-era recipes reimagined for the modern palate.', 4.8),
('Temple Street Cafe',    3, 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800', 'Street-food-inspired small plates and craft chai.', 4.4),
-- Bangalore (4)
('Garden City Brasserie', 4, 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800', 'Contemporary Indian-fusion in a lush garden setting.', 4.6),
('The Cubbon Plate',      4, 'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800', 'Farm-to-table South Indian meals celebrating local produce.', 4.5),
-- Mumbai (5)
('Sea View Supper Club',  5, 'https://images.unsplash.com/photo-1506354666786-959d6d497f1a?w=800', 'Upscale dining with Arabian Sea sunsets and live jazz.', 4.9),
('Dharavi Diner',         5, 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800', 'Iconic Mumbai street flavors plated with finesse.', 4.4);

-- ─── Menu Items ──────────────────────────────────────────────
-- The Marina Grill (restaurant_id = 1)
INSERT INTO menu_items (restaurant_id, name, description, price, image_url, category) VALUES
(1, 'Grilled King Prawns',   'Tiger prawns in garlic-butter glaze, served with saffron rice.',          550.00, 'https://images.unsplash.com/photo-1625943553852-781c6dd46faa?w=400', 'Seafood'),
(1, 'Lobster Thermidor',     'Half lobster baked with rich cream sauce and Gruyère crust.',             950.00, 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=400', 'Seafood'),
(1, 'Fish & Chips Marina',   'Batter-fried snapper, hand-cut fries and tartare sauce.',                 380.00, 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400', 'Seafood'),
(1, 'Caesar Salad',          'Romaine, house-made Caesar dressing, parmesan shards, croutons.',         280.00, 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400', 'Salads'),
(1, 'Chocolate Lava Cake',   'Warm dark-chocolate fondant, vanilla bean ice cream.',                    220.00, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400', 'Desserts'),
(1, 'Mango Lassi',           'House-blended Alphonso mango, yogurt and a touch of cardamom.',          120.00, 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400', 'Beverages');

-- Spice Garden (restaurant_id = 2)
INSERT INTO menu_items (restaurant_id, name, description, price, image_url, category) VALUES
(2, 'Chettinad Chicken Curry','Fiery whole-spice curry cooked over wood fire.',                         420.00, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400', 'Main Course'),
(2, 'Kothu Parotta',          'Shredded layered flatbread stir-fried with egg and kari.',               260.00, 'https://images.unsplash.com/photo-1630383249896-483b1da9debb?w=400', 'Main Course'),
(2, 'Mutton Kola Urundai',    'Spiced minced mutton fritters — the legendary Chettinad starter.',      320.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400', 'Starters'),
(2, 'Kavuni Arisi Halwa',     'Black rice pudding with coconut milk and palm sugar.',                   180.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400', 'Desserts'),
(2, 'Filter Coffee',          'Traditional South Indian drip coffee with frothy milk.',                  80.00, 'https://images.unsplash.com/photo-1512568400610-62da28bc8a13?w=400', 'Beverages');

-- The Nilgiri Bistro (restaurant_id = 3)
INSERT INTO menu_items (restaurant_id, name, description, price, image_url, category) VALUES
(3, 'Nilgiri Lamb Chops',    'Marinated with blue mountain herbs, grilled over charcoal.',             680.00, 'https://images.unsplash.com/photo-1544025162-d76538516d95?w=400', 'Main Course'),
(3, 'Mushroom Risotto',      'Arborio rice, Nilgiri wild mushrooms, aged Parmesan.',                   420.00, 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400', 'Main Course'),
(3, 'Avocado Toast',         'Sourdough, smashed avocado, microgreens and a poached egg.',             310.00, 'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=400', 'Breakfast'),
(3, 'Berry Smoothie Bowl',   'Frozen berries, banana, granola, chia seeds and honey drizzle.',        290.00, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400', 'Breakfast'),
(3, 'Eucalyptus Lemonade',   'Fresh lemons, eucalyptus syrup and sparkling water.',                    140.00, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400', 'Beverages');

-- Kovai Kitchen (restaurant_id = 4)
INSERT INTO menu_items (restaurant_id, name, description, price, image_url, category) VALUES
(4, 'Kongu Chicken Biriyani','Seeraga samba rice, farm chicken, local spice blend.',                   360.00, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400', 'Main Course'),
(4, 'Kambu Koozh',           'Pearl millet porridge with raw onion, curry and pickle.',                120.00, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400', 'Starters'),
(4, 'Aatu Kaal Soup',        'Slow-cooked goat trotter soup with turmeric and pepper.',                180.00, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400', 'Starters'),
(4, 'Nei Appam',             'Ghee-fried rice-jaggery dumplings, best with filter coffee.',            100.00, 'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=400', 'Desserts');

-- Meenakshi Heritage (restaurant_id = 5)
INSERT INTO menu_items (restaurant_id, name, description, price, image_url, category) VALUES
(5, 'Pandya Royal Biryani',  'Dum-cooked seeraga samba rice with succulent mutton pieces.',            480.00, 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400', 'Main Course'),
(5, 'Jigarthanda',           'Madurai\'s legendary cold dessert drink — almond resin, milk, ice cream.', 120.00,'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400', 'Beverages'),
(5, 'Mutton Rogan Josh',     'Slow-braised mutton shanks in Kashmiri spice gravy.',                    560.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400', 'Main Course'),
(5, 'Paal Payasam',          'Sacred vermicelli pudding in thickened milk and saffron.',               160.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400', 'Desserts'),
(5, 'Naan Basket',           'Assorted butter naan, garlic naan and kulcha (3 pieces).',              180.00, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', 'Breads');

-- Temple Street Cafe (restaurant_id = 6)
INSERT INTO menu_items (restaurant_id, name, description, price, image_url, category) VALUES
(6, 'Masala Vada Platter',   'Crispy chana dal fritters with coconut chutney and sambar.',            160.00, 'https://images.unsplash.com/photo-1606491956391-9a537558f9f5?w=400', 'Starters'),
(6, 'Tawa Parotta Curry',    'Flaky layered parotta paired with spicy salna (vegetable curry).',      220.00, 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400', 'Main Course'),
(6, 'Elaneer Payasam',       'Tender coconut pudding with cardamom and rose water.',                   140.00, 'https://images.unsplash.com/photo-1488477181228-c84def54d1b9?w=400', 'Desserts'),
(6, 'Craft Ginger Chai',     'Hand-pulled premium ginger tea, brewed to order.',                        60.00, 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400', 'Beverages');

-- Garden City Brasserie (restaurant_id = 7)
INSERT INTO menu_items (restaurant_id, name, description, price, image_url, category) VALUES
(7, 'Truffle Dosa',          'Paper-thin rice crepe with truffle butter and mushroom filling.',        480.00, 'https://images.unsplash.com/photo-1630383249896-483b1da9debb?w=400', 'Main Course'),
(7, 'Malai Broccoli Tikka',  'Tender broccoli florets marinated in cream and grilled in tandoor.',    340.00, 'https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?w=400', 'Starters'),
(7, 'Mango Burrata',         'Fresh burrata, Alphonso mango compote, basil oil.',                     420.00, 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400', 'Starters'),
(7, 'Cold Brew Tonic',       'House cold brew coffee over tonic water and citrus.',                   180.00, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', 'Beverages');

-- The Cubbon Plate (restaurant_id = 8)
INSERT INTO menu_items (restaurant_id, name, description, price, image_url, category) VALUES
(8, 'Ragi Mudde & Saaru',    'Finger millet balls with tomato-lentil rasam — classic Karnataka.',     220.00, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400', 'Main Course'),
(8, 'Bisi Bele Bath',        'Hot lentil-rice one-pot dish with ghee and crunchy pappadums.',         260.00, 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400', 'Main Course'),
(8, 'Akki Roti',             'Rice flour flatbread with dill, onion and green chilli.',               160.00, 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400', 'Breads'),
(8, 'Mysore Pak',            'Legendary gram flour and ghee fudge from the royal kitchens.',          120.00, 'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=400', 'Desserts');

-- Sea View Supper Club (restaurant_id = 9)
INSERT INTO menu_items (restaurant_id, name, description, price, image_url, category) VALUES
(9, 'Bombay Duck Fry',       'Dried Bombay duck crispy fried with chilli-lime aioli.',                380.00, 'https://images.unsplash.com/photo-1625943553852-781c6dd46faa?w=400', 'Seafood'),
(9, 'Prawn Koliwada',        'Mumbai fisherman-style spiced prawn fritters.',                         420.00, 'https://images.unsplash.com/photo-1627308595229-7830a5c18037?w=400', 'Seafood'),
(9, 'Lamb Seekh Kebab',      'Minced lamb on skewers with coriander chutney and onion rings.',        480.00, 'https://images.unsplash.com/photo-1544025162-d76538516d95?w=400', 'Main Course'),
(9, 'Kesar Phirni',          'Rice flour custard with saffron, pistachio and rose petals.',           220.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400', 'Desserts'),
(9, 'Mumbai Masala Soda',    'Spiced jaljeera soda with black salt and fresh lime.',                  100.00, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400', 'Beverages');

-- Dharavi Diner (restaurant_id = 10)
INSERT INTO menu_items (restaurant_id, name, description, price, image_url, category) VALUES
(10,'Vada Pav',              'Mumbai\'s iconic spiced potato patty in a soft bun with chutneys.',      80.00, 'https://images.unsplash.com/photo-1606491956391-9a537558f9f5?w=400', 'Starters'),
(10,'Pav Bhaji',             'Spiced mixed-vegetable mash with buttered pav rolls.',                  200.00, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400', 'Main Course'),
(10,'Sev Puri Platter',      'Crispy puri shells with potato, tamarind, green chutney and sev.',     180.00, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 'Starters'),
(10,'Cutting Chai',          'Half-cup strong Mumbai masala tea — the original street fuel.',          40.00, 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400', 'Beverages');


-- ============================================================
-- VERIFICATION QUERIES (optional — run to confirm seed)
-- ============================================================
-- SELECT COUNT(*) AS location_count  FROM locations;
-- SELECT COUNT(*) AS restaurant_count FROM restaurants;
-- SELECT COUNT(*) AS menu_count       FROM menu_items;
-- SELECT r.name, l.name AS location, COUNT(m.id) AS items
--   FROM restaurants r
--   JOIN locations l ON l.id = r.location_id
--   LEFT JOIN menu_items m ON m.restaurant_id = r.id
--   GROUP BY r.id;