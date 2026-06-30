-- ThriveFund Seed Data
-- Run after schema.sql: mysql -h <host> -u admin -p thrivefund < database/seed.sql
-- Password hashes are generated with bcrypt.

SET NAMES utf8mb4;

-- Admin user
INSERT IGNORE INTO users (id, full_name, email, phone_number, password_hash, role) VALUES
('usr_seed_admin01', 'Admin User', 'admin@thrivefund.ng', '+2348000000001',
 '$2a$10$L55p50RZCrEpqzXICvPKMuFt0ziBNoc11XoPJKYbWIoWRU.YScu7q', 'admin');

-- Organization owner
INSERT IGNORE INTO users (id, full_name, email, phone_number, password_hash, role) VALUES
('usr_seed_adebayo', 'Adebayo Okonkwo', 'adebayo@thrivefund.ng', '+2348034567890',
 '$2a$10$L55p50RZCrEpqzXICvPKMuFt0ziBNoc11XoPJKYbWIoWRU.YScu7q', 'user');

INSERT IGNORE INTO notification_preferences (user_id) VALUES ('usr_seed_adebayo');

INSERT IGNORE INTO organizations (id, name, slug, type, description, owner_id) VALUES
('org_seed_mosque01', 'Lagos Central Mosque', 'lagos-central-mosque', 'mosque',
 'Community mosque collecting Jumu''ah and renovation funds', 'usr_seed_adebayo');

INSERT IGNORE INTO organization_members (id, organization_id, user_id, role) VALUES
('om_seed_owner001', 'org_seed_mosque01', 'usr_seed_adebayo', 'owner');

INSERT IGNORE INTO goals (id, user_id, organization_id, title, description, target_amount, current_amount, category, status, deadline, slug) VALUES
('goal_seed_water01', 'usr_seed_adebayo', 'org_seed_mosque01',
 'Abuja Community Water Project', 'Borehole and water tank for the community', 5000000.00, 0.00,
 'community_project', 'active', '2024-12-31', 'abuja-community-water'),
('goal_seed_nysc001', 'usr_seed_adebayo', NULL,
 'NYSC Relocation Fund', 'Saving for relocation after NYSC', 300000.00, 0.00,
 'personal', 'active', '2024-06-30', 'nysc-relocation-fund');

-- Virtual accounts are created through the API after seed data is loaded.
