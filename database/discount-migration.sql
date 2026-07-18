-- Migration: Add discount columns to order_items table
-- Run this to support dynamic discounts in orders

USE Technique;

-- Add discount fields to order_items if they don't exist
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS final_price DECIMAL(10,2) DEFAULT NULL;

-- Add comments for documentation
-- price column will store the final paid price (discounted)
-- original_price column stores the original product price
-- discount_percent stores the discount percentage applied
-- discount_amount stores the calculated discount amount (original - final)
-- final_price is the effective price after discount