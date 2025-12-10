# Users Table Recreation Guide

## Overview
This guide explains how to recreate the users table in your PostgreSQL database to match the user creation form in the Bizzcohub application.

## Table Structure

### Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | SERIAL | Yes | Auto-incrementing primary key |
| `username` | VARCHAR(100) | Yes | Unique username |
| `password_hash` | VARCHAR(255) | Yes | SHA-256 hashed password |
| `email` | VARCHAR(255) | No* | Email address |
| `phone` | VARCHAR(20) | No* | Phone number |
| `role` | VARCHAR(50) | Yes | User role (see roles below) |
| `status` | VARCHAR(20) | Yes | Account status (active/inactive) |
| `approval_status` | VARCHAR(20) | Yes | Approval status (pending/approved/rejected) |
| `avatar` | TEXT | No | Profile picture URL |
| `created_by` | VARCHAR(100) | No | Creator username |
| `created_at` | TIMESTAMP | Yes | Creation timestamp |
| `updated_at` | TIMESTAMP | Yes | Last update timestamp |
| `last_login` | TIMESTAMP | No | Last login timestamp |

*Note: Either email OR phone must be provided

### Valid Roles
- `admin`
- `manager`
- `salesman`
- `supervisor`
- `store keeper`
- `purchaser`
- `delivery biker`
- `maintenance`
- `quality analyst`
- `accountant`

### Valid Statuses
- `active`
- `inactive`

### Valid Approval Statuses
- `pending`
- `approved`
- `rejected`

## How to Run the Script

### Method 1: Using psql Command Line

```bash
# Connect to your database
psql -U your_username -d your_database_name

# Run the script
\i d:/Bizzcohub/database/recreate_users_table.sql

# Or in one command
psql -U your_username -d your_database_name -f d:/Bizzcohub/database/recreate_users_table.sql
```

### Method 2: Using pgAdmin

1. Open pgAdmin
2. Connect to your database
3. Right-click on your database → Query Tool
4. Open the file: `d:\Bizzcohub\database\recreate_users_table.sql`
5. Click Execute (F5)

### Method 3: Using DBeaver

1. Open DBeaver
2. Connect to your database
3. File → Open SQL Script
4. Select: `d:\Bizzcohub\database\recreate_users_table.sql`
5. Click Execute SQL Statement (Ctrl+Enter)

### Method 4: Using Node.js Script

```bash
# From the Bizzcohub directory
cd d:\Bizzcohub

# Run the database setup
node -e "const { sql } = require('./lib/db'); const fs = require('fs'); const script = fs.readFileSync('./database/recreate_users_table.sql', 'utf8'); sql.unsafe(script).then(() => console.log('Table created successfully')).catch(console.error);"
```

## Default Admin User

The script creates a default admin user with the following credentials:

- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@bizzcohub.com`
- **Phone**: `+1234567890`
- **Role**: `admin`
- **Status**: `active`

**⚠️ IMPORTANT**: Change the default admin password immediately after first login!

## Features

### Automatic Timestamp Updates
The table includes a trigger that automatically updates the `updated_at` field whenever a record is modified.

### Indexes
The following indexes are created for better query performance:
- `idx_users_username` - On username field
- `idx_users_email` - On email field
- `idx_users_role` - On role field
- `idx_users_status` - On status field
- `idx_users_approval_status` - On approval_status field

### Constraints
- Username must be unique
- Either email OR phone must be provided
- Role must be one of the predefined roles
- Status must be either 'active' or 'inactive'
- Approval status must be 'pending', 'approved', or 'rejected'

## Avatar Field

The `avatar` field stores URLs to profile pictures. It can contain:
- **ImageKit URLs**: For uploaded custom images
- **DiceBear URLs**: For generated avatar suggestions
- **NULL**: If no avatar is set (will show initials in UI)

Example avatar URLs:
```
https://ik.imagekit.io/your-id/User%20Profile/john_doe.jpg
https://api.dicebear.com/7.x/personas/svg?seed=John&backgroundColor=b6e3f4
```

## Verification

After running the script, verify the table was created correctly:

```sql
-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check default admin user
SELECT * FROM users WHERE username = 'admin';

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'users';
```

## Troubleshooting

### Error: "relation users already exists"
The script includes `DROP TABLE IF EXISTS users CASCADE;` which should handle this. If you still get this error:
```sql
DROP TABLE users CASCADE;
```

### Error: "function update_updated_at_column already exists"
```sql
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

### Error: "permission denied"
Make sure your database user has CREATE TABLE privileges:
```sql
GRANT CREATE ON DATABASE your_database_name TO your_username;
```

## Next Steps

After recreating the table:

1. **Change default admin password**
2. **Create additional users** via the UI (Admin → Users → Add User)
3. **Test user login** with the new credentials
4. **Verify avatar upload** functionality
5. **Check user management** features (edit, delete, status change)

## Support

If you encounter any issues:
1. Check the PostgreSQL error logs
2. Verify database connection in `lib/db.ts`
3. Ensure all environment variables are set correctly
4. Check that the database user has necessary permissions
