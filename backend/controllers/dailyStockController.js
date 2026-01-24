import pool from '../config/db.js';

export const addDailyStock = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { business_date, stock_additions } = req.body;
        
        if (!business_date || !stock_additions || !Array.isArray(stock_additions)) {
            return res.status(400).json({ error: 'business_date and stock_additions array are required' });
        }
        
        await client.query('BEGIN');
        
        const results = [];
        
        for (const addition of stock_additions) {
            const { variant_id, added_stock } = addition;
            
            if (!variant_id || !added_stock || isNaN(added_stock) || added_stock < 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: `Invalid stock data for variant_id: ${variant_id}` });
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
            
            // Get previous day's closing stock for carry-over
            const previousDate = new Date(business_date);
            previousDate.setDate(previousDate.getDate() - 1);
            const previousDateStr = previousDate.toISOString().split('T')[0];
            
            const previousStockResult = await client.query(
                'SELECT closing_stock FROM daily_variant_stock WHERE variant_id = $1 AND business_date = $2',
                [variant_id, previousDateStr]
            );
            
            const openingStock = previousStockResult.rows.length > 0 ? 
                parseInt(previousStockResult.rows[0].closing_stock) : 0;
            
            // Get today's used stock from usage tracking
            const usageResult = await client.query(
                'SELECT quantity_used FROM daily_variant_usage WHERE variant_id = $1 AND business_date = $2',
                [variant_id, business_date]
            );
            
            const usedStock = usageResult.rows.length > 0 ? 
                parseInt(usageResult.rows[0].quantity_used) : 0;
            
            // Update or insert stock record
            const stockResult = await client.query(
                `INSERT INTO daily_variant_stock (business_date, variant_id, opening_stock, added_stock, used_stock)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (business_date, variant_id)
                 DO UPDATE SET 
                     added_stock = daily_variant_stock.added_stock + EXCLUDED.added_stock,
                     used_stock = EXCLUDED.used_stock,
                     last_updated = CURRENT_TIMESTAMP
                 RETURNING *`,
                [business_date, variant_id, openingStock, parseInt(added_stock), usedStock]
            );
            
            results.push({
                variant: variantExists.rows[0],
                stock: stockResult.rows[0],
                previous_closing_stock: openingStock
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
        console.error('ERROR adding daily stock:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};

export const getDailyStock = async (req, res) => {
    try {
        const { date } = req.query;
        const business_date = date || new Date().toISOString().split('T')[0]; // CURRENT_DATE
        
        const stockResult = await pool.query(
            `SELECT dvs.*, pv.size_label, p.product_name, p.product_id
             FROM daily_variant_stock dvs
             JOIN product_variants pv ON dvs.variant_id = pv.variant_id
             JOIN products p ON pv.product_id = p.product_id
             WHERE dvs.business_date = $1
             ORDER BY p.product_name, pv.size_label`,
            [business_date]
        );
        
        // Calculate totals
        const totals = stockResult.rows.reduce((acc, item) => {
            acc.total_opening += parseInt(item.opening_stock);
            acc.total_added += parseInt(item.added_stock);
            acc.total_used += parseInt(item.used_stock);
            acc.total_closing += parseInt(item.closing_stock);
            return acc;
        }, {
            total_opening: 0,
            total_added: 0,
            total_total_used: 0,
            total_closing: 0
        });
        
        res.json({
            success: true,
            business_date: business_date,
            stock_data: stockResult.rows,
            summary: {
                total_variants: stockResult.rows.length,
                total_opening_stock: totals.total_opening,
                total_added_stock: totals.total_added,
                total_used_stock: totals.total_used,
                total_closing_stock: totals.total_closing
            }
        });
        
    } catch (error) {
        console.error('ERROR getting daily stock:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getStockRange = async (req, res) => {
    try {
        const { start_date, end_date, variant_id } = req.query;
        
        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'start_date and end_date are required' });
        }
        
        let query = `
            SELECT dvs.*, pv.size_label, p.product_name, p.product_id
            FROM daily_variant_stock dvs
            JOIN product_variants pv ON dvs.variant_id = pv.variant_id
            JOIN products p ON pv.product_id = p.product_id
            WHERE dvs.business_date >= $1 AND dvs.business_date <= $2
        `;
        
        const params = [start_date, end_date];
        
        if (variant_id) {
            query += ' AND dvs.variant_id = $3';
            params.push(variant_id);
        }
        
        query += ' ORDER BY dvs.business_date, p.product_name, pv.size_label';
        
        const stockResult = await pool.query(query, params);
        
        // Calculate totals and daily summaries
        const totals = stockResult.rows.reduce((acc, item) => {
            acc.total_opening += parseInt(item.opening_stock);
            acc.total_added += parseInt(item.added_stock);
            acc.total_used += parseInt(item.used_stock);
            acc.total_closing += parseInt(item.closing_stock);
            return acc;
        }, {
            total_opening: 0,
            total_added: 0,
            total_used: 0,
            total_closing: 0
        });
        
        const dailySummaries = {};
        stockResult.rows.forEach(item => {
            if (!dailySummaries[item.business_date]) {
                dailySummaries[item.business_date] = {
                    opening_stock: 0,
                    added_stock: 0,
                    used_stock: 0,
                    closing_stock: 0,
                    variant_count: 0
                };
            }
            const summary = dailySummaries[item.business_date];
            summary.opening_stock += parseInt(item.opening_stock);
            summary.added_stock += parseInt(item.added_stock);
            summary.used_stock += parseInt(item.used_stock);
            summary.closing_stock += parseInt(item.closing_stock);
            summary.variant_count += 1;
        });
        
        res.json({
            success: true,
            period: { start_date, end_date },
            stock_data: stockResult.rows,
            summary: {
                total_variants: stockResult.rows.length,
                total_opening_stock: totals.total_opening,
                total_added_stock: totals.total_added,
                total_used_stock: totals.total_used,
                total_closing_stock: totals.total_closing,
                daily_summaries: dailySummaries
            }
        });
        
    } catch (error) {
        console.error('ERROR getting stock range:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateStockFromUsage = async (business_date, variant_id, quantity_used) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Get previous day's closing stock for carry-over
        const previousDate = new Date(business_date);
        previousDate.setDate(previousDate.getDate() - 1);
        const previousDateStr = previousDate.toISOString().split('T')[0];
        
        const previousStockResult = await client.query(
            'SELECT closing_stock FROM daily_variant_stock WHERE variant_id = $1 AND business_date = $2',
            [variant_id, previousDateStr]
        );
        
        const openingStock = previousStockResult.rows.length > 0 ? 
            parseInt(previousStockResult.rows[0].closing_stock) : 0;
        
        // Get current added stock for today
        const currentStockResult = await client.query(
            'SELECT added_stock FROM daily_variant_stock WHERE variant_id = $1 AND business_date = $2',
            [variant_id, business_date]
        );
        
        const currentAddedStock = currentStockResult.rows.length > 0 ? 
            parseInt(currentStockResult.rows[0].added_stock) : 0;
        
        // Update stock record with new usage
        const stockResult = await client.query(
            `INSERT INTO daily_variant_stock (business_date, variant_id, opening_stock, added_stock, used_stock)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (business_date, variant_id)
             DO UPDATE SET 
                 used_stock = daily_variant_stock.used_stock + EXCLUDED.used_stock,
                 last_updated = CURRENT_TIMESTAMP
             RETURNING *`,
            [business_date, variant_id, openingStock, currentAddedStock, parseInt(quantity_used)]
        );
        
        // Update daily variant usage tracking
        await client.query(
            `INSERT INTO daily_variant_usage (business_date, variant_id, quantity_used)
             VALUES ($1, $2, $3)
             ON CONFLICT (business_date, variant_id)
             DO UPDATE SET 
                 quantity_used = daily_variant_usage.quantity_used + EXCLUDED.quantity_used,
                 last_updated = CURRENT_TIMESTAMP`,
            [business_date, variant_id, parseInt(quantity_used)]
        );
        
        await client.query('COMMIT');
        
        return {
            success: true,
            stock: stockResult.rows[0],
            previous_closing_stock: openingStock,
            message: `Subtracted ${quantity_used} from variant ${variant_id}`
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('ERROR updating stock from usage:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
};

export const getLowStockVariants = async (req, res) => {
    try {
        const { date, threshold = 10 } = req.query;
        const business_date = date || new Date().toISOString().split('T')[0]; // CURRENT_DATE
        
        const lowStockResult = await pool.query(
            `SELECT dvs.*, pv.size_label, p.product_name, p.product_id
             FROM daily_variant_stock dvs
             JOIN product_variants pv ON dvs.variant_id = pv.variant_id
             JOIN products p ON pv.product_id = p.product_id
             WHERE dvs.business_date = $1 AND dvs.closing_stock <= $2
             ORDER BY dvs.closing_stock ASC`,
            [business_date, parseInt(threshold)]
        );
        
        res.json({
            success: true,
            business_date: business_date,
            threshold: parseInt(threshold),
            low_stock_variants: lowStockResult.rows,
            count: lowStockResult.rows.length
        });
        
    } catch (error) {
        console.error('ERROR getting low stock variants:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const initializeDailyStock = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { business_date } = req.body;
        
        if (!business_date) {
            return res.status(400).json({ error: 'business_date is required' });
        }
        
        await client.query('BEGIN');
        
        // Get all variants
        const variantsResult = await client.query(
            'SELECT variant_id FROM product_variants'
        );
        
        const previousDate = new Date(business_date);
        previousDate.setDate(previousDate.getDate() - 1);
        const previousDateStr = previousDate.toISOString().split('T')[0];
        
        const results = [];
        
        for (const variant of variantsResult.rows) {
            // Get previous day's closing stock
            const previousStockResult = await client.query(
                'SELECT closing_stock FROM daily_variant_stock WHERE variant_id = $1 AND business_date = $2',
                [variant.variant_id, previousDateStr]
            );
            
            const openingStock = previousStockResult.rows.length > 0 ? 
                parseInt(previousStockResult.rows[0].closing_stock) : 0;
            
            // Initialize stock record for today
            const stockResult = await client.query(
                `INSERT INTO daily_variant_stock (business_date, variant_id, opening_stock, added_stock, used_stock)
                 VALUES ($1, $2, $3, 0, 0)
                 ON CONFLICT (business_date, variant_id) DO NOTHING
                 RETURNING *`,
                [business_date, variant.variant_id, openingStock]
            );
            
            if (stockResult.rows.length > 0) {
                results.push(stockResult.rows[0]);
            }
        }
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            business_date: business_date,
            initialized_variants: results.length,
            details: results
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('ERROR initializing daily stock:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};
