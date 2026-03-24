-- Hardening Migration for Orders and Shipping Zones
-- 1. Auditing Columns for Financial Integrity in 'orders'
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS subtotal_server INTEGER, -- Recorded in cents
ADD COLUMN IF NOT EXISTS shipping_server INTEGER, -- Recorded in cents
ADD COLUMN IF NOT EXISTS total_server INTEGER,    -- Recorded in cents
ADD COLUMN IF NOT EXISTS zone_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS rule_version INTEGER DEFAULT 1;

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_shipping_zones_active ON shipping_zones(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_shipping_zones_fallback ON shipping_zones(is_fallback) WHERE is_fallback = true;
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 3. Integrity Constraints: Ensure ONLY ONE fallback zone exists
-- Using a partial unique index to enforce single-source-of-truth fallback
DROP INDEX IF EXISTS idx_single_fallback;
CREATE UNIQUE INDEX idx_single_fallback 
ON shipping_zones (is_fallback) 
WHERE (is_fallback = true);
