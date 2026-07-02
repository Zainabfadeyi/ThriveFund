-- ThriveFund Seed Data
-- Run after schema.sql:
--   mysql -u root thrivefund < database/seed.sql
-- Or: npm run seed
--
-- Demo password for ALL seed accounts: DemoPass123!
-- bcrypt hash below matches DemoPass123!

SET NAMES utf8mb4;

SET @demo_hash = '$2a$10$L55p50RZCrEpqzXICvPKMuFt0ziBNoc11XoPJKYbWIoWRU.YScu7q';

-- ── Admin (platform superadmin — use for /admin UI) ─────────────────────────
INSERT INTO users (id, full_name, email, phone_number, password_hash, role, email_verified_at) VALUES
('usr_seed_admin01', 'ThriveFund Admin', 'admin@thrivefund.ng', '+2348000000001', @demo_hash, 'admin', NOW())
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  password_hash = VALUES(password_hash),
  role = 'admin',
  email_verified_at = COALESCE(email_verified_at, NOW());

INSERT IGNORE INTO notification_preferences (user_id) VALUES ('usr_seed_admin01');

-- ── Organization owners ───────────────────────────────────────────────────────
INSERT INTO users (id, full_name, email, phone_number, password_hash, role, email_verified_at) VALUES
('usr_seed_adebayo', 'Adebayo Okonkwo', 'adebayo@thrivefund.ng', '+2348034567890', @demo_hash, 'user', NOW()),
('usr_seed_chidi01', 'Chidi Eze', 'chidi@thrivefund.ng', '+2348034567891', @demo_hash, 'user', NOW()),
('usr_seed_fatima01', 'Fatima Bello', 'fatima@thrivefund.ng', '+2348034567892', @demo_hash, 'user', NOW())
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  password_hash = VALUES(password_hash),
  email_verified_at = COALESCE(email_verified_at, NOW());

INSERT IGNORE INTO notification_preferences (user_id) VALUES
('usr_seed_adebayo'),
('usr_seed_chidi01'),
('usr_seed_fatima01');

-- ── Organizations ─────────────────────────────────────────────────────────────
INSERT INTO organizations (id, name, slug, type, description, email, owner_id) VALUES
('org_seed_mosque01', 'Lagos Central Mosque', 'lagos-central-mosque', 'mosque',
 'Community mosque collecting Jumu''ah and renovation funds', 'info@lagoscentralmosque.ng', 'usr_seed_adebayo'),
('org_seed_school01', 'Greenfield Academy PTA', 'greenfield-academy-pta', 'school',
 'Parent association fundraising for classroom blocks and labs', 'pta@greenfield.edu.ng', 'usr_seed_chidi01'),
('org_seed_coop001', 'Ikeja Traders Cooperative', 'ikeja-traders-cooperative', 'cooperative',
 'Member savings and welfare collections', 'office@ikejacoop.ng', 'usr_seed_fatima01')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  email = VALUES(email),
  owner_id = VALUES(owner_id);

INSERT IGNORE INTO organization_members (id, organization_id, user_id, role) VALUES
('om_seed_owner001', 'org_seed_mosque01', 'usr_seed_adebayo', 'owner'),
('om_seed_owner002', 'org_seed_school01', 'usr_seed_chidi01', 'owner'),
('om_seed_owner003', 'org_seed_coop001', 'usr_seed_fatima01', 'owner');

-- ── Campaigns ─────────────────────────────────────────────────────────────────
INSERT INTO goals (id, user_id, organization_id, title, description, target_amount, current_amount, category, status, deadline, slug) VALUES
('goal_seed_water01', 'usr_seed_adebayo', 'org_seed_mosque01',
 'Abuja Community Water Project', 'Borehole and water tank for the community', 5000000.00, 1250000.00,
 'community_project', 'active', '2026-12-31', 'abuja-community-water'),
('goal_seed_nysc001', 'usr_seed_adebayo', NULL,
 'NYSC Relocation Fund', 'Saving for relocation after NYSC', 300000.00, 75000.00,
 'personal', 'active', '2026-06-30', 'nysc-relocation-fund'),
('goal_seed_lab001', 'usr_seed_chidi01', 'org_seed_school01',
 'Science Lab Equipment Drive', 'Microscopes, chemicals, and lab furniture', 2500000.00, 640000.00,
 'education', 'active', '2026-09-30', 'science-lab-equipment'),
('goal_seed_welfare01', 'usr_seed_fatima01', 'org_seed_coop001',
 'Member Welfare Fund 2026', 'Emergency support pool for cooperative members', 1000000.00, 420000.00,
 'business', 'active', '2026-12-31', 'member-welfare-2026')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  current_amount = VALUES(current_amount),
  status = VALUES(status);

-- Virtual accounts are created through the API after seed data is loaded.
