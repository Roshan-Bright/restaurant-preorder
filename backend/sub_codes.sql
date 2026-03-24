use restaurant_preorder
SELECT id, name, email, role FROM users;

UPDATE users SET password_hash = '$2b$10$g/E3s65ZQ6CSj3kzEpPkvOBuRIrJ7xqmXyPOVGF3vzuI.pHZWRs.C' WHERE id = 1;

UPDATE users SET password_hash = '$2b$10$g/E3s65ZQ6CSj3kzEpPkvOBuRIrJ7xqmXyPOVGF3vzuI.pHZWRs.C' WHERE id = 2;

SELECT id, name, email, role, LEFT(password_hash, 20) AS hash_preview FROM users;

USE restaurant_preorder;

'for new admin account '

INSERT INTO users (name, email, password_hash, phone, role)
VALUES (
  'Your Name',
  'youremail@example.com',
  '$2b$10$K7L1OJ45g54trakHSYnINuYps4PMWtRxFzGR0r7fZA3UWa5OyRuuG',
  '9876543210',
  'admin'
);