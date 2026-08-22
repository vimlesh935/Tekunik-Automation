-- PRICE DROP ALERT SYSTEM — Database Migration
-- Adds product price history tracking for the Price Intelligence feature.

CREATE TABLE IF NOT EXISTS product_price_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  old_price DECIMAL(10,2) NULL,
  new_price DECIMAL(10,2) NOT NULL,
  old_sale_price DECIMAL(10,2) NULL,
  new_sale_price DECIMAL(10,2) NULL,
  change_type ENUM('PRICE_INCREASE','PRICE_DECREASE','SALE_PRICE_CREATED','SALE_PRICE_UPDATED','SALE_PRICE_REMOVED','NO_CHANGE') NOT NULL DEFAULT 'NO_CHANGE',
  drop_percentage DECIMAL(5,2) NULL,
  changed_by INT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_price_history_product (product_id),
  INDEX idx_price_history_created (created_at),
  INDEX idx_price_history_type (change_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
</｜DSML｜tool>