-- Daily Cashier Sessions, Variant Usage, and Stock Tracking Migration
-- This migration adds support for daily cashier cash tracking, product size usage tracking, and daily stock carry-over

-- 1. Create cashier_sessions table for daily cashier session management
CREATE TABLE IF NOT EXISTS cashier_sessions (
    session_id SERIAL PRIMARY KEY,
    cashier_id INTEGER NOT NULL REFERENCES user_table(uid),
    business_date DATE NOT NULL DEFAULT CURRENT_DATE,
    starting_cash DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_sales DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    ending_cash DECIMAL(12,2) GENERATED ALWAYS AS (starting_cash + total_sales) STORED,
    session_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (session_status IN ('active', 'closed')),
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    created_by INTEGER NOT NULL REFERENCES user_table(uid),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- One active session per cashier per day
    UNIQUE(cashier_id, business_date)
);

-- 2. Create daily_variant_usage table for tracking product size usage per day
CREATE TABLE IF NOT EXISTS daily_variant_usage (
    usage_id SERIAL PRIMARY KEY,
    business_date DATE NOT NULL DEFAULT CURRENT_DATE,
    variant_id INTEGER NOT NULL REFERENCES product_variants(variant_id),
    quantity_used INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint for one record per variant per day
    UNIQUE(business_date, variant_id)
);

-- 3. Create daily_variant_stock table for daily stock tracking with carry-over
CREATE TABLE IF NOT EXISTS daily_variant_stock (
    stock_id SERIAL PRIMARY KEY,
    business_date DATE NOT NULL DEFAULT CURRENT_DATE,
    variant_id INTEGER NOT NULL REFERENCES product_variants(variant_id),
    opening_stock INTEGER NOT NULL DEFAULT 0,
    added_stock INTEGER NOT NULL DEFAULT 0,
    used_stock INTEGER NOT NULL DEFAULT 0,
    closing_stock INTEGER GENERATED ALWAYS AS (opening_stock + added_stock - used_stock) STORED,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint for one record per variant per day
    UNIQUE(business_date, variant_id)
);

-- 4. Add session_id column to orders table (after cashier_sessions table exists)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS session_id INTEGER REFERENCES cashier_sessions(session_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cashier_sessions_cashier_date ON cashier_sessions(cashier_id, business_date);
CREATE INDEX IF NOT EXISTS idx_cashier_sessions_date ON cashier_sessions(business_date);
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON orders(session_id);
CREATE INDEX IF NOT EXISTS idx_daily_variant_usage_date_variant ON daily_variant_usage(business_date, variant_id);
CREATE INDEX IF NOT EXISTS idx_daily_variant_stock_date_variant ON daily_variant_stock(business_date, variant_id);

-- Create trigger to automatically update updated_at timestamp for cashier_sessions
CREATE OR REPLACE FUNCTION update_cashier_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_cashier_sessions_updated_at ON cashier_sessions;
CREATE TRIGGER update_cashier_sessions_updated_at 
    BEFORE UPDATE ON cashier_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_cashier_sessions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE cashier_sessions IS 'Tracks daily cashier sessions including starting cash, total sales, and ending cash';
COMMENT ON COLUMN cashier_sessions.business_date IS 'The business date for this session (usually CURRENT_DATE)';
COMMENT ON COLUMN cashier_sessions.starting_cash IS 'Cash in drawer at start of day';
COMMENT ON COLUMN cashier_sessions.total_sales IS 'Total sales amount for the day';
COMMENT ON COLUMN cashier_sessions.ending_cash IS 'Calculated ending cash (starting_cash + total_sales)';
COMMENT ON COLUMN cashier_sessions.session_status IS 'Session status: active or closed';

COMMENT ON TABLE daily_variant_usage IS 'Tracks how many units of each product variant are used per day';
COMMENT ON COLUMN daily_variant_usage.business_date IS 'The business date for usage tracking';
COMMENT ON COLUMN daily_variant_usage.variant_id IS 'Reference to product variant (size)';
COMMENT ON COLUMN daily_variant_usage.quantity_used IS 'Total quantity of this variant used on this date';

COMMENT ON TABLE daily_variant_stock IS 'Tracks daily stock levels per product variant with carry-over functionality';
COMMENT ON COLUMN daily_variant_stock.business_date IS 'The business date for stock tracking';
COMMENT ON COLUMN daily_variant_stock.variant_id IS 'Reference to product variant (size)';
COMMENT ON COLUMN daily_variant_stock.opening_stock IS 'Stock carried over from previous day';
COMMENT ON COLUMN daily_variant_stock.added_stock IS 'New stock added during the day';
COMMENT ON COLUMN daily_variant_stock.used_stock IS 'Stock used/sold during the day';
COMMENT ON COLUMN daily_variant_stock.closing_stock IS 'Calculated closing stock (opening + added - used)';
