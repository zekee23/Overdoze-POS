import fs from 'fs';
import path from 'path';
import pool from './config/db.js';

async function runMigration() {
    console.log('🔄 Running database migrations...\n');
    
    try {
        // Read the migration file
        const migrationPath = path.join(process.cwd(), 'database', 'create_daily_tracking_tables.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('📝 Executing migration SQL...');
        
        // Execute the entire migration at once
        await pool.query(migrationSQL);
        
        console.log('\n✅ Migration completed successfully!');
        
        // Verify tables were created
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('daily_variant_stock', 'daily_variant_usage', 'cashier_sessions')
        `);
        
        console.log('📋 Created tables:', tablesResult.rows.map(r => r.table_name));
        
        // Also run the user table modification
        console.log('\n🔧 Running user table modification...');
        const userMigrationPath = path.join(process.cwd(), 'database', 'modify_user_table_auth.sql');
        const userMigrationSQL = fs.readFileSync(userMigrationPath, 'utf8');
        
        await pool.query(userMigrationSQL);
        console.log('✅ User table modification completed!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await pool.end();
    }
}

runMigration();
