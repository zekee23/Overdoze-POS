-- Create simple cup_stock table for tracking cup inventory by size
CREATE TABLE IF NOT EXISTS cup_stock (
    size_label VARCHAR(50) PRIMARY KEY,
    stock_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add check constraint to prevent negative stock
ALTER TABLE cup_stock 
ADD CONSTRAINT chk_cup_stock_non_negative 
CHECK (stock_count >= 0);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cup_stock_label ON cup_stock(size_label);

-- Function to update cup stock
CREATE OR REPLACE FUNCTION update_cup_stock(p_size_label VARCHAR(50), p_stock_count INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validate input
    IF p_stock_count < 0 THEN
        RAISE EXCEPTION 'Stock count cannot be negative: %', p_stock_count;
    END IF;
    
    -- Update or insert stock
    INSERT INTO cup_stock (size_label, stock_count)
    VALUES (p_size_label, p_stock_count)
    ON CONFLICT (size_label) 
    DO UPDATE SET 
        stock_count = EXCLUDED.stock_count,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to add stock to existing cup stock
CREATE OR REPLACE FUNCTION add_cup_stock(p_size_label VARCHAR(50), p_add_quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    -- Validate input
    IF p_add_quantity <= 0 THEN
        RAISE EXCEPTION 'Add quantity must be positive: %', p_add_quantity;
    END IF;
    
    -- Update stock atomically
    UPDATE cup_stock 
    SET stock_count = stock_count + p_add_quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE size_label = p_size_label
    RETURNING stock_count INTO current_stock;
    
    -- Insert if not found
    IF NOT FOUND THEN
        INSERT INTO cup_stock (size_label, stock_count)
        VALUES (p_size_label, p_add_quantity);
        current_stock := p_add_quantity;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to deduct cup stock (with safety check)
CREATE OR REPLACE FUNCTION deduct_cup_stock(p_size_label VARCHAR(50), p_quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    -- Validate input
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be positive: %', p_quantity;
    END IF;
    
    -- Get current stock and check availability
    SELECT stock_count INTO current_stock
    FROM cup_stock 
    WHERE size_label = p_size_label;
    
    -- Insert with 0 stock if not found
    IF current_stock IS NULL THEN
        INSERT INTO cup_stock (size_label, stock_count)
        VALUES (p_size_label, 0);
        current_stock := 0;
    END IF;
    
    -- Check if enough stock is available
    IF current_stock < p_quantity THEN
        RAISE EXCEPTION 'Insufficient cup stock for %: available=%d, requested=%d', 
                        p_size_label, current_stock, p_quantity;
    END IF;
    
    -- Deduct stock
    UPDATE cup_stock 
    SET stock_count = stock_count - p_quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE size_label = p_size_label;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get all cup stock (simple version)
CREATE OR REPLACE FUNCTION get_cup_stock_status()
RETURNS TABLE (
    size_label VARCHAR(50),
    stock_count INTEGER,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.size_label,
        cs.stock_count,
        cs.updated_at
    FROM cup_stock cs
    ORDER BY 
        CASE cs.size_label 
            WHEN '12oz' THEN 1
            WHEN '12 oz' THEN 1
            WHEN '16oz' THEN 2
            WHEN '16 oz' THEN 2
            WHEN '22oz' THEN 3
            WHEN '22 oz' THEN 3
            ELSE 4
        END;
END;
$$ LANGUAGE plpgsql;

-- Initialize with default stock values (optional - can be done via API)
INSERT INTO cup_stock (size_label, stock_count) 
VALUES 
    ('12oz', 100),
    ('16oz', 100),
    ('22oz', 100)
ON CONFLICT (size_label) DO NOTHING;
