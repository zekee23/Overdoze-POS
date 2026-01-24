import pool from './config/db.js';

// Test the stock system functionality
async function testStockSystem() {
    console.log('🧪 Testing Stock System...\n');
    
    try {
        // Test 1: Check if tables exist
        console.log('📋 Checking database tables...');
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('daily_variant_stock', 'daily_variant_usage', 'product_variants')
        `);
        
        console.log('✅ Tables found:', tablesResult.rows.map(r => r.table_name));
        
        // Test 2: Check if we have product variants
        console.log('\n📦 Checking product variants...');
        const variantsResult = await pool.query(`
            SELECT variant_id, pv.size_label, p.product_name 
            FROM product_variants pv 
            JOIN products p ON pv.product_id = p.product_id 
            LIMIT 5
        `);
        
        if (variantsResult.rows.length === 0) {
            console.log('⚠️  No product variants found. Please add some products first.');
            return;
        }
        
        console.log('✅ Sample variants:', variantsResult.rows);
        
        // Test 3: Test stock input function
        console.log('\n📥 Testing stock input...');
        const testVariant = variantsResult.rows[0];
        const today = new Date().toISOString().split('T')[0];
        
        // First, let's check if there's existing stock
        const existingStock = await pool.query(`
            SELECT * FROM daily_variant_stock 
            WHERE variant_id = $1 AND business_date = $2
        `, [testVariant.variant_id, today]);
        
        if (existingStock.rows.length > 0) {
            console.log('📊 Existing stock found:', existingStock.rows[0]);
        } else {
            console.log('📝 No existing stock for today, testing insert...');
        }
        
        // Test 4: Test the carry-over logic
        console.log('\n🔄 Testing carry-over logic...');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        // Create a test stock record for yesterday
        await pool.query(`
            INSERT INTO daily_variant_stock (business_date, variant_id, opening_stock, added_stock, used_stock)
            VALUES ($1, $2, 10, 20, 5)
            ON CONFLICT (business_date, variant_id) DO UPDATE SET
                added_stock = daily_variant_stock.added_stock + EXCLUDED.added_stock,
                used_stock = daily_variant_stock.used_stock + EXCLUDED.used_stock
        `, [yesterdayStr, testVariant.variant_id]);
        
        console.log('✅ Created test stock for yesterday');
        
        // Test 5: Test today's stock input with carry-over
        const { cashierInputStock } = await import('./controllers/cashierStockController.js');
        
        // Mock request/response objects
        const mockReq = {
            body: {
                variant_id: testVariant.variant_id,
                quantity: 15
            }
        };
        
        const mockRes = {
            json: (data) => {
                console.log('✅ Stock input response:', data);
                return data;
            },
            status: (code) => ({
                json: (data) => {
                    console.log(`❌ Error ${code}:`, data);
                    return data;
                }
            })
        };
        
        console.log('\n📥 Testing stock input with carry-over...');
        await cashierInputStock(mockReq, mockRes);
        
        // Test 6: Verify the carry-over worked
        console.log('\n🔍 Verifying carry-over results...');
        const todayStock = await pool.query(`
            SELECT * FROM daily_variant_stock 
            WHERE variant_id = $1 AND business_date = $2
        `, [testVariant.variant_id, today]);
        
        if (todayStock.rows.length > 0) {
            const stock = todayStock.rows[0];
            console.log('✅ Today\'s stock record:', {
                opening_stock: stock.opening_stock,
                added_stock: stock.added_stock,
                used_stock: stock.used_stock,
                closing_stock: stock.closing_stock
            });
            
            // Verify carry-over logic
            const expectedOpening = 25; // 10 + 20 - 5 from yesterday
            if (parseInt(stock.opening_stock) === expectedOpening) {
                console.log('✅ Carry-over logic working correctly!');
            } else {
                console.log(`❌ Carry-over issue. Expected opening: ${expectedOpening}, Got: ${stock.opening_stock}`);
            }
        }
        
        // Test 7: Test stock subtraction (usage)
        console.log('\n📉 Testing stock subtraction...');
        const { updateStockFromUsage } = await import('./controllers/dailyStockController.js');
        
        const usageResult = await updateStockFromUsage(today, testVariant.variant_id, 3);
        console.log('✅ Stock subtraction result:', usageResult);
        
        // Final verification
        const finalStock = await pool.query(`
            SELECT * FROM daily_variant_stock 
            WHERE variant_id = $1 AND business_date = $2
        `, [testVariant.variant_id, today]);
        
        if (finalStock.rows.length > 0) {
            console.log('🏁 Final stock state:', finalStock.rows[0]);
        }
        
        console.log('\n🎉 Stock system test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await pool.end();
    }
}

// Run the test
testStockSystem();
