-- Cumulative Stock Migration
-- This file is no longer needed - stock logic moved to controllers
-- The daily_variant_stock table already handles cumulative stock correctly

-- Add index for better performance on stock queries
CREATE INDEX IF NOT EXISTS idx_daily_variant_stock_date_variant ON daily_variant_stock(business_date, variant_id);
