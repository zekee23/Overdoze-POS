-- User Authentication Modification Migration
-- Removes password-based authentication and OTP functionality
-- Keeps only username-based login with role-based access

-- 1. Remove password-related columns from user_table
ALTER TABLE user_table DROP COLUMN IF EXISTS pin_hash;

-- 2. Remove email-related columns (no OTP/forgot password needed)
ALTER TABLE user_table DROP COLUMN IF EXISTS email;
ALTER TABLE user_table DROP COLUMN IF EXISTS email_verified;

-- 3. Add comments to document the authentication change
COMMENT ON TABLE user_table IS 'User table with username-only authentication and role-based access';
COMMENT ON COLUMN user_table.username IS 'Primary identifier for user login (no password required)';
COMMENT ON COLUMN user_table.u_role IS 'User role for access control (admin, cashier, etc.)';

-- 4. Add indexes for better performance on username lookups
CREATE INDEX IF NOT EXISTS idx_user_table_username ON user_table(username);
