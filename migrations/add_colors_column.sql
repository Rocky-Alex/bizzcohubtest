-- Migration: Add colors column to products table
-- Run this SQL in your Neon database console

-- Add colors column to store comma-separated color options
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS colors TEXT;

-- Add comment to document the column
COMMENT ON COLUMN products.colors IS 'Comma-separated list of available colors (e.g., "Silver,Space Gray,Gold")';
