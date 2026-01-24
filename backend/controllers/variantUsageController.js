import pool from '../config/db.js';

export const updateVariantUsage = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { business_date, variant_updates } = req.body;
        
        if (!business_date || !variant_updates || !Array.isArray(variant_updates)) {
            return res.status(400).json({ error: 'business_date and variant_updates array are required' });
        }
        
        await client.query('BEGIN');
        
        const results = [];
        
        for (const update of variant_updates) {
            const { variant_id, quantity_used } = update;
            
            if (!variant_id || !quantity_used || isNaN(quantity_used) || quantity_used < 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: `Invalid variant data for variant_id: ${variant_id}` });
            }
            
            // Verify variant exists
            const variantExists = await client.query(
                'SELECT variant_id, pv.size_label, p.product_name FROM product_variants pv JOIN products p ON pv.product_id = p.product_id WHERE pv.variant_id = $1',
                [variant_id]
            );
            
            if (variantExists.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: `Variant not found: ${variant_id}` });
            }
            
            // Update or insert usage record
            const usageResult = await client.query(
                `INSERT INTO daily_variant_usage (business_date, variant_id, quantity_used)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (business_date, variant_id)
                 DO UPDATE SET 
                     quantity_used = daily_variant_usage.quantity_used + EXCLUDED.quantity_used,
                     last_updated = CURRENT_TIMESTAMP
                 RETURNING *`,
                [business_date, variant_id, parseInt(quantity_used)]
            );
            
            results.push({
                variant: variantExists.rows[0],
                usage: usageResult.rows[0]
            });
        }
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            business_date: business_date,
            updated_variants: results.length,
            details: results
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('ERROR updating variant usage:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};

export const getDailyVariantUsage = async (req, res) => {
    try {
        const { date } = req.query;
        const business_date = date || new Date().toISOString().split('T')[0]; // CURRENT_DATE
        
        const usageResult = await pool.query(
            `SELECT dvu.*, pv.size_label, p.product_name, p.product_id
             FROM daily_variant_usage dvu
             JOIN product_variants pv ON dvu.variant_id = pv.variant_id
             JOIN products p ON pv.product_id = p.product_id
             WHERE dvu.business_date = $1
             ORDER BY p.product_name, pv.size_label`,
            [business_date]
        );
        
        res.json({
            success: true,
            business_date: business_date,
            usage_data: usageResult.rows,
            total_variants_used: usageResult.rows.length,
            total_quantity_used: usageResult.rows.reduce((sum, item) => sum + parseInt(item.quantity_used), 0)
        });
        
    } catch (error) {
        console.error('ERROR getting daily variant usage:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getVariantUsageRange = async (req, res) => {
    try {
        const { start_date, end_date, variant_id } = req.query;
        
        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'start_date and end_date are required' });
        }
        
        let query = `
            SELECT dvu.*, pv.size_label, p.product_name, p.product_id
            FROM daily_variant_usage dvu
            JOIN product_variants pv ON dvu.variant_id = pv.variant_id
            JOIN products p ON pv.product_id = p.product_id
            WHERE dvu.business_date >= $1 AND dvu.business_date <= $2
        `;
        
        const params = [start_date, end_date];
        
        if (variant_id) {
            query += ' AND dvu.variant_id = $3';
            params.push(variant_id);
        }
        
        query += ' ORDER BY dvu.business_date, p.product_name, pv.size_label';
        
        const usageResult = await pool.query(query, params);
        
        // Calculate totals
        const totalQuantityUsed = usageResult.rows.reduce((sum, item) => sum + parseInt(item.quantity_used), 0);
        const dailyTotals = {};
        
        usageResult.rows.forEach(item => {
            if (!dailyTotals[item.business_date]) {
                dailyTotals[item.business_date] = 0;
            }
            dailyTotals[item.business_date] += parseInt(item.quantity_used);
        });
        
        res.json({
            success: true,
            period: { start_date, end_date },
            usage_data: usageResult.rows,
            summary: {
                total_variants_used: usageResult.rows.length,
                total_quantity_used: totalQuantityUsed,
                daily_totals: dailyTotals
            }
        });
        
    } catch (error) {
        console.error('ERROR getting variant usage range:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateUsageFromOrder = async (order_id) => {
    const client = await pool.connect();
    
    try {
        const business_date = new Date().toISOString().split('T')[0]; // CURRENT_DATE
        
        await client.query('BEGIN');
        
        // Get order items with variants
        const orderItemsResult = await client.query(
            `SELECT oi.variant_id, oi.quantity
             FROM order_items oi
             WHERE oi.order_id = $1`,
            [order_id]
        );
        
        if (orderItemsResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return { success: false, error: 'No order items found' };
        }
        
        const results = [];
        
        for (const item of orderItemsResult.rows) {
            // Update usage for each variant
            const usageResult = await client.query(
                `INSERT INTO daily_variant_usage (business_date, variant_id, quantity_used)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (business_date, variant_id)
                 DO UPDATE SET 
                     quantity_used = daily_variant_usage.quantity_used + EXCLUDED.quantity_used,
                     last_updated = CURRENT_TIMESTAMP
                 RETURNING *`,
                [business_date, item.variant_id, parseInt(item.quantity)]
            );
            
            results.push(usageResult.rows[0]);
        }
        
        await client.query('COMMIT');
        
        return {
            success: true,
            business_date: business_date,
            updated_variants: results.length,
            details: results
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('ERROR updating usage from order:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
};

export const getTopUsedVariants = async (req, res) => {
    try {
        const { date, limit = 10 } = req.query;
        const business_date = date || new Date().toISOString().split('T')[0]; // CURRENT_DATE
        
        const topVariantsResult = await pool.query(
            `SELECT dvu.*, pv.size_label, p.product_name, p.product_id
             FROM daily_variant_usage dvu
             JOIN product_variants pv ON dvu.variant_id = pv.variant_id
             JOIN products p ON pv.product_id = p.product_id
             WHERE dvu.business_date = $1 AND dvu.quantity_used > 0
             ORDER BY dvu.quantity_used DESC
             LIMIT $2`,
            [business_date, parseInt(limit)]
        );
        
        res.json({
            success: true,
            business_date: business_date,
            top_variants: topVariantsResult.rows
        });
        
    } catch (error) {
        console.error('ERROR getting top used variants:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
