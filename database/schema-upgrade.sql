-- ============================================================
-- ADD APPLICATIONS COLUMN TO PRODUCTS
-- ============================================================
-- Stores a JSON array of application tags e.g. ["Smart Home","Office Automation"]
ALTER TABLE products
ADD COLUMN IF NOT EXISTS applications JSON NULL
COMMENT 'JSON array of application tags: Smart Home, Office Automation, Hotel Solutions, Hospital Automation, School & College Solutions, Industrial Automation';

-- Index for searching within JSON array (MySQL 8+)
ALTER TABLE products
ADD INDEX IF NOT EXISTS idx_products_applications ((CAST(applications AS CHAR(255) ARRAY)));

-- ============================================================
-- NEW TABLE: product_applications (for better performance)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  application VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_pa_product (product_id),
  INDEX idx_pa_application (application)
);