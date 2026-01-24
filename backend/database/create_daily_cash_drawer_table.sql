-- Create daily_cash_drawer table for tracking starting cash
CREATE TABLE IF NOT EXISTS daily_cash_drawer (
    business_date DATE PRIMARY KEY,
    starting_cash NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_by INTEGER REFERENCES user_table(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_starting_cash CHECK (starting_cash >= 0)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_daily_cash_drawer_date ON daily_cash_drawer(business_date);

-- Add comment for documentation
COMMENT ON TABLE daily_cash_drawer IS 'Stores daily starting cash amounts for cash drawer reconciliation';
COMMENT ON COLUMN daily_cash_drawer.business_date IS 'Business date (primary key - one entry per day)';
COMMENT ON COLUMN daily_cash_drawer.starting_cash IS 'Starting cash amount for the business day';
COMMENT ON COLUMN daily_cash_drawer.created_by IS 'User who entered the starting cash amount';
COMMENT ON COLUMN daily_cash_drawer.created_at IS 'Timestamp when starting cash was recorded';
