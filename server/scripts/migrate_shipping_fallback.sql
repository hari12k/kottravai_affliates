-- Migration to add is_fallback column to shipping_zones and mark Zone 3 as fallback
ALTER TABLE shipping_zones ADD COLUMN IF NOT EXISTS is_fallback BOOLEAN DEFAULT false;

-- Mark Zone 3 (Rest of India) as the fallback zone
UPDATE shipping_zones 
SET is_fallback = true 
WHERE zone_name = 'Zone 3' OR states IS NULL OR array_length(states, 1) IS NULL;
