-- ============================================
-- Bizzcohub Users Table Recreation Script
-- ============================================
-- This script drops and recreates the users table
-- with all necessary fields for the user management system
-- ============================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with all required fields
CREATE TABLE users (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Basic User Information
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Contact Information
    email VARCHAR(255),
    phone VARCHAR(20),
    
    -- Role and Status
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'salesman', 'supervisor', 'store keeper', 'purchaser', 'delivery biker', 'maintenance', 'quality analyst', 'accountant')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    
    -- Approval System
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    
    -- Profile Picture/Avatar
    avatar TEXT,  -- URL to profile picture (ImageKit or DiceBear)
    
    -- Audit Fields
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    
    -- Constraints
    CONSTRAINT email_or_phone_required CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Create indexes for better query performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_approval_status ON users(approval_status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
-- Password hash is SHA-256 of 'admin123'
INSERT INTO users (
    username,
    password_hash,
    email,
    phone,
    role,
    status,
    approval_status,
    created_by,
    avatar
) VALUES (
    'admin',
    '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',  -- SHA-256 hash of 'admin123'
    'admin@bizzcohub.com',
    '+1234567890',
    'admin',
    'active',
    'approved',
    'system',
    'https://api.dicebear.com/7.x/personas/svg?seed=Admin&backgroundColor=b6e3f4'
);

-- Display table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Display created user
SELECT 
    id,
    username,
    email,
    phone,
    role,
    status,
    approval_status,
    avatar,
    created_at
FROM users;

-- ============================================
-- Table Structure Summary
-- ============================================
-- Fields:
--   - id: Auto-incrementing primary key
--   - username: Unique username (required)
--   - password_hash: SHA-256 hashed password (required)
--   - email: Email address (optional, but email OR phone required)
--   - phone: Phone number (optional, but email OR phone required)
--   - role: User role (admin, manager, salesman, etc.)
--   - status: Account status (active/inactive)
--   - approval_status: Approval workflow status
--   - avatar: Profile picture URL
--   - created_by: Who created this user
--   - created_at: Creation timestamp
--   - updated_at: Last update timestamp (auto-updated)
--   - last_login: Last login timestamp
-- ============================================
