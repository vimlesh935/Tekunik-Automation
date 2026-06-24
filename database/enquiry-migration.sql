-- Demo Enquiries Table
CREATE TABLE IF NOT EXISTS demo_enquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  message TEXT NULL,
  preferred_date DATE NULL,
  preferred_time VARCHAR(20) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_demo_enquiries_email (email),
  INDEX idx_demo_enquiries_status (status),
  INDEX idx_demo_enquiries_created_at (created_at)
);

-- Add to ensure the table exists during server startup check
INSERT IGNORE INTO demo_enquiries (name, email, phone, message)
VALUES ('system', 'system@internal', '0000000000', 'migration marker');
DELETE FROM demo_enquiries WHERE email = 'system@internal';