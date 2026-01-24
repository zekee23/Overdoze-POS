-- Monthly Reports Table
-- Stores saved monthly dashboard data with PDF generation capability

CREATE TABLE IF NOT EXISTS monthly_reports (
    id SERIAL PRIMARY KEY,
    month DATE NOT NULL UNIQUE, -- First day of the month (e.g., '2026-01-01')
    total_orders INTEGER NOT NULL DEFAULT 0,
    gross_sales DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    starting_cash DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    profit DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    top_products JSONB NOT NULL DEFAULT '[]', -- Array of top 3 products with details
    pdf_file_path VARCHAR(500), -- Path to generated PDF file
    pdf_generated_at TIMESTAMP, -- When PDF was generated
    created_by INTEGER NOT NULL REFERENCES user_table(uid),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries by month
CREATE INDEX IF NOT EXISTS idx_monthly_reports_month ON monthly_reports(month);

-- Create index for queries by created_by
CREATE INDEX IF NOT EXISTS idx_monthly_reports_created_by ON monthly_reports(created_by);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_monthly_reports_updated_at ON monthly_reports;
CREATE TRIGGER update_monthly_reports_updated_at 
    BEFORE UPDATE ON monthly_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE monthly_reports IS 'Stores monthly dashboard data including orders, sales, profits and generated PDF reports';
COMMENT ON COLUMN monthly_reports.month IS 'First day of the month being reported (e.g., 2026-01-01 for January 2026)';
COMMENT ON COLUMN monthly_reports.top_products IS 'JSON array containing top 3 products with name, quantity sold, and revenue';
COMMENT ON COLUMN monthly_reports.pdf_file_path IS 'File path to the generated PDF report for this month';
