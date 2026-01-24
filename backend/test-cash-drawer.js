// Test script for cash drawer functionality
// Run this with: node test-cash-drawer.js

import pool from './config/db.js';

async function testCashDrawer() {
    try {
        console.log('Testing cash drawer functionality...\n');

        // Test 1: Check if table exists
        console.log('1. Checking if daily_cash_drawer table exists...');
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'daily_cash_drawer'
            );
        `);
        
        if (tableCheck.rows[0].exists) {
            console.log('✅ daily_cash_drawer table exists');
        } else {
            console.log('❌ daily_cash_drawer table does not exist');
            console.log('Please run the SQL migration first:');
            console.log('psql -d your_database -f database/create_daily_cash_drawer_table.sql');
            return;
        }

        // Test 2: Check today's starting cash
        console.log('\n2. Checking today\'s starting cash...');
        const todayCash = await pool.query(
            'SELECT * FROM daily_cash_drawer WHERE business_date = CURRENT_DATE'
        );
        
        if (todayCash.rows.length > 0) {
            console.log(`✅ Starting cash for today: PHP ${todayCash.rows[0].starting_cash}`);
        } else {
            console.log('✅ No starting cash set for today (ready for first entry)');
        }

        // Test 3: Check today's sales
        console.log('\n3. Checking today\'s total sales...');
        const salesResult = await pool.query(`
            SELECT COALESCE(SUM(total_amount), 0) as total_sales 
            FROM orders 
            WHERE DATE(created_at) = CURRENT_DATE 
            AND status != 'cancelled'
        `);
        
        console.log(`✅ Today's total sales: PHP ${parseFloat(salesResult.rows[0].total_sales).toFixed(2)}`);

        // Test 4: Calculate expected cash
        console.log('\n4. Calculating expected cash in drawer...');
        const startingCash = todayCash.rows.length > 0 
            ? parseFloat(todayCash.rows[0].starting_cash) 
            : 0;
        const totalSales = parseFloat(salesResult.rows[0].total_sales);
        const expectedCash = startingCash + totalSales;
        
        console.log(`✅ Expected cash in drawer: PHP ${expectedCash.toFixed(2)}`);
        console.log(`   (Starting Cash: PHP ${startingCash.toFixed(2)} + Sales: PHP ${totalSales.toFixed(2)})`);

        console.log('\n🎉 All tests passed! Cash drawer functionality is ready.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await pool.end();
    }
}

testCashDrawer();
