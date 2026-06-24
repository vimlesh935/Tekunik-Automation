-- ============================================================
-- PRODUCT REVIEWS MIGRATION
-- ============================================================

CREATE TABLE IF NOT EXISTS product_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  order_id INT NOT NULL,
  user_id INT NOT NULL,
  customer_name VARCHAR(200) NULL,
  rating TINYINT(1) NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_title VARCHAR(500) NULL,
  review_message TEXT NULL,
  review_images JSON NULL,
  review_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  admin_notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_review_per_order_product (order_id, product_id),
  INDEX idx_reviews_product (product_id),
  INDEX idx_reviews_status (review_status),
  INDEX idx_reviews_user (user_id),
  INDEX idx_reviews_order (order_id)
);