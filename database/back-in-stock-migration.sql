-- BACK IN STOCK ALERT SYSTEM — Database Migration
-- Adds back_in_stock_alerts: customer "Notify Me" subscriptions.
-- Lifecycle: ACTIVE -> NOTIFIED (on restock) | ACTIVE -> CANCELLED (manual).
-- When a restocked product goes out of stock again, NOTIFIED alerts are
-- reactivated to ACTIVE so customers are alerted on the next restock cycle.

CREATE TABLE IF NOT EXISTS back_in_stock_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  variant_id INT NULL,
  status ENUM('ACTIVE','NOTIFIED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  notified_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_bis_user_product (user_id, product_id),
  INDEX idx_bis_product_status (product_id, status),
  INDEX idx_bis_status (status),
  INDEX idx_bis_notified_at (notified_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;