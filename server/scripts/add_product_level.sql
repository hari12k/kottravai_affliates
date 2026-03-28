-- Migration to add min_affiliate_level to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS min_affiliate_level character varying DEFAULT 'Ambassador';
