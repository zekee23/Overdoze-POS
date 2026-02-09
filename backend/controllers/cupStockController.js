import pool from '../config/db.js';

// Get current cup stock for all sizes
export const getCupStock = async (req, res) => {
    try {
        // Simple direct query instead of function
        const result = await pool.query(`
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
                END
        `);
        
        // Add status calculation in backend
        const stockData = result.rows.map(row => ({
            ...row,
            stock_status: row.stock_count <= 0 ? 'OUT OF STOCK' : 
                         row.stock_count <= 10 ? 'LOW STOCK' : 'IN STOCK',
            status_color: row.stock_count <= 0 ? '#dc3545' : 
                         row.stock_count <= 10 ? '#ffc107' : '#28a745'
        }));
        
        res.json({
            success: true,
            stock_data: stockData
        });
        
    } catch (error) {
        console.error('ERROR getting cup stock:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Add cup stock (for restocking)
export const addCupStock = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { size_label, add_quantity } = req.body;
        
        if (!size_label || !add_quantity || isNaN(add_quantity) || add_quantity <= 0) {
            return res.status(400).json({ 
                error: 'size_label and add_quantity (positive) are required' 
            });
        }
        
        await client.query('BEGIN');
        
        // Add cup stock
        await client.query(
            'SELECT add_cup_stock($1, $2)',
            [size_label, parseInt(add_quantity)]
        );
        
        // Get updated stock status with direct query
        const stockResult = await client.query(`
            SELECT size_label, stock_count, updated_at
            FROM cup_stock 
            WHERE size_label = $1
        `, [size_label]);
        
        await client.query('COMMIT');
        
        const stockInfo = stockResult.rows[0];
        
        // Calculate status in backend
        const stockStatus = stockInfo.stock_count <= 0 ? 'OUT OF STOCK' : 
                           stockInfo.stock_count <= 10 ? 'LOW STOCK' : 'IN STOCK';
        const statusColor = stockInfo.stock_count <= 0 ? '#dc3545' : 
                           stockInfo.stock_count <= 10 ? '#ffc107' : '#28a745';
        
        res.json({
            success: true,
            message: `Added ${add_quantity} cups to ${size_label} stock`,
            size_label: size_label,
            added_quantity: parseInt(add_quantity),
            new_stock_count: stockInfo.stock_count,
            stock_status: stockStatus,
            status_color: statusColor,
            updated_at: stockInfo.updated_at
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('ERROR adding cup stock:', error);
        
        if (error.message.includes('Insufficient cup stock')) {
            return res.status(400).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};

export const updateStock = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { cup16oz, cup12oz, cup22oz } = req.body;
        
        // Validate input
        if (cup16oz === undefined || cup12oz === undefined || cup22oz === undefined) {
            return res.status(400).json({ 
                error: 'cup16oz, cup12oz, and cup22oz are required' 
            });
        }
        
        // Validate that all values are non-negative numbers
        const sizes = { '16oz': cup16oz, '12oz': cup12oz, '22oz': cup22oz };
        for (const [size, quantity] of Object.entries(sizes)) {
            if (isNaN(quantity) || quantity < 0) {
                return res.status(400).json({ 
                    error: `${size} must be a non-negative number` 
                });
            }
        }
        
        await client.query('BEGIN');
        
        // Update each cup size stock
        const updates = [];
        
        for (const [size_label, stock_count] of Object.entries(sizes)) {
            // Update or insert stock for each size
            const result = await client.query(`
                INSERT INTO cup_stock (size_label, stock_count, updated_at)
                VALUES ($1, $2, NOW())
                ON CONFLICT (size_label) 
                DO UPDATE SET 
                    stock_count = $2,
                    updated_at = NOW()
                RETURNING size_label, stock_count, updated_at
            `, [size_label, parseInt(stock_count)]);
            
            updates.push(result.rows[0]);
        }
        
        await client.query('COMMIT');
        
        // Add status calculation for each updated size
        const responseData = updates.map(stock => ({
            ...stock,
            stock_status: stock.stock_count <= 0 ? 'OUT OF STOCK' : 
                         stock.stock_count <= 10 ? 'LOW STOCK' : 'IN STOCK',
            status_color: stock.stock_count <= 0 ? '#dc3545' : 
                         stock.stock_count <= 10 ? '#ffc107' : '#28a745'
        }));
        
        res.json({
            success: true,
            message: 'Cup stock updated successfully',
            updated_stock: responseData
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('ERROR updating cup stock:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};