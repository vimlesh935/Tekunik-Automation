CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  activity_type VARCHAR(60) NOT NULL,
  entity_type VARCHAR(50) NULL,
  entity_id INT NULL,
  metadata JSON NULL,
  priority ENUM('LOW','NORMAL','HIGH','CRITICAL') NOT NULL DEFAULT 'LOW',
  is_actionable BOOLEAN NOT NULL DEFAULT FALSE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at DATETIME NULL,
  event_key VARCHAR(180) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_activity_event (event_key),
  INDEX idx_activity_type (activity_type), INDEX idx_activity_user (user_id),
  INDEX idx_activity_priority (priority), INDEX idx_activity_read (is_read),
  INDEX idx_activity_created (created_at), INDEX idx_activity_user_created (user_id, created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);