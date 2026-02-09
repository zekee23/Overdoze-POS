-- Add payment_method column to orders table
-- This migration adds support for tracking payment methods (Cash/GCash) for each order

-- Add payment_method column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) NOT NULL DEFAULT 'cash';

-- Add check constraint to ensure only valid payment methods
ALTER TABLE orders ADD CONSTRAINT chk_payment_method 
  CHECK (payment_method IN ('cash', 'gcash'));

-- Add index for better performance on payment method queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);

-- Add comment for documentation
COMMENT ON COLUMN orders.payment_method IS 'Payment method used: cash or gcash';
