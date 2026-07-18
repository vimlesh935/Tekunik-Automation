-- ============================================================
-- PRODUCT REVIEWS MIGRATION
-- ============================================================

CREATE TABLE IF NOT EXISTS product_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  order_id INT NULL,
  user_id INT NULL,
  customer_name VARCHAR(200) NULL,
  customer_email VARCHAR(200) NOT NULL,
  rating TINYINT(1) NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_title VARCHAR(500) NULL,
  review_message TEXT NULL,
  review_images JSON NULL,
  review_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  show_on_website BOOLEAN NOT NULL DEFAULT FALSE,
  admin_notes TEXT NULL,
  approved_by INT NULL,
  approved_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  website_visibility ENUM('visible','hidden') NOT NULL DEFAULT 'hidden',
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES admins(id) ON DELETE SET NULL,
  INDEX idx_reviews_product (product_id),
  INDEX idx_reviews_status (review_status),
  INDEX idx_reviews_public (is_approved, show_on_website),
  INDEX idx_reviews_user (user_id),
  INDEX idx_reviews_order (order_id),
  INDEX idx_reviews_customer_email (customer_email)
);
