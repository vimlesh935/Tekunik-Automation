-- Smart Home Proposals Table - Complete Schema for CRM Module
CREATE TABLE IF NOT EXISTS smart_home_proposals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proposal_number VARCHAR(30) NOT NULL UNIQUE,
  user_id INT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  pincode VARCHAR(10) NULL,
  address TEXT NULL,
  home_type VARCHAR(50) NULL,
  total_rooms INT NOT NULL DEFAULT 0,
  current_step TINYINT NOT NULL DEFAULT 0,
  wizard_status VARCHAR(20) NULL DEFAULT NULL,
  rooms_json JSON NULL,
  devices_json JSON NULL,
  estimated_products_json JSON NULL,
  estimated_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  additional_notes TEXT NULL,
  status ENUM('New','Contacted','Under Review','Quotation Prepared','Quotation Sent','Site Visit Scheduled','Awaiting Customer Approval','Approved','Converted to Order','Completed','Cancelled') NOT NULL DEFAULT 'New',
  assigned_admin INT NULL,
  admin_notes TEXT NULL,
  quotation_amount DECIMAL(10,2) NULL,
  quotation_file VARCHAR(500) NULL,
  site_visit_date DATE NULL,
  converted_order_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_admin) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (converted_order_id) REFERENCES orders(id) ON DELETE SET NULL,
  INDEX idx_proposals_number (proposal_number),
  INDEX idx_proposals_email (email),
  INDEX idx_proposals_phone (phone),
  INDEX idx_proposals_status (status),
  INDEX idx_proposals_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Status history table for tracking status changes
CREATE TABLE IF NOT EXISTS proposal_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proposal_id INT NOT NULL,
  from_status VARCHAR(50) NULL,
  to_status VARCHAR(50) NOT NULL,
  changed_by INT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proposal_id) REFERENCES smart_home_proposals(id) ON DELETE CASCADE,
  INDEX idx_status_proposal (proposal_id),
  INDEX idx_status_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Unique proposal number generator helper table
CREATE TABLE IF NOT EXISTS proposal_counters (
  prefix VARCHAR(20) PRIMARY KEY,
  last_number INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO proposal_counters (prefix, last_number) VALUES ('SHP', 0);

-- Ensure smart_home_proposals has state and address columns (safe migration)
ALTER TABLE smart_home_proposals
  ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL AFTER city,
  ADD COLUMN IF NOT EXISTS pincode VARCHAR(10) NULL AFTER state,
  ADD COLUMN IF NOT EXISTS address TEXT NULL AFTER pincode,
  ADD COLUMN IF NOT EXISTS total_rooms INT NOT NULL DEFAULT 0 AFTER home_type,
  ADD COLUMN IF NOT EXISTS additional_notes TEXT NULL AFTER estimated_products_json,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT NULL AFTER assigned_admin,
  ADD COLUMN IF NOT EXISTS quotation_amount DECIMAL(10,2) NULL AFTER admin_notes;