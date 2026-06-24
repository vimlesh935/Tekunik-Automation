-- ============================================================
-- WEBSITE REVIEWS TABLE
-- Separate from product reviews
-- ============================================================

CREATE TABLE IF NOT EXISTS website_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  customer_name VARCHAR(200) NULL,
  rating TINYINT(1) NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_title VARCHAR(500) NULL,
  review_message TEXT NULL,
  review_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  admin_notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_website_review_per_user (user_id),
  INDEX idx_website_reviews_status (review_status),
  INDEX idx_website_reviews_user (user_id)
);