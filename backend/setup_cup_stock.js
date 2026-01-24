const pool = require('./config/db.js');

async function setupCupStock() {
    const client = await pool.connect();
    
    try {
        console.log('Setting up cup stock system...');
        
        // Check if cup_stock table exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'cup_stock'
            );
        `);
        
        if (!tableCheck.rows[0].exists) {
            console.log('Creating cup_stock table...');
            await client.query(`
                CREATE TABLE cup_stock (
                    size_label VARCHAR(50) PRIMARY KEY,
                    stock_count INTEGER NOT NULL DEFAULT 0,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            
            await client.query(`
                ALTER TABLE cup_stock 
                ADD CONSTRAINT chk_cup_stock_non_negative 
                CHECK (stock_count >= 0);
            `);
            
            console.log('✓ Cup stock table created');
        } else {
            console.log('✓ Cup stock table already exists');
        }
        
        // Insert initial data if empty
        const countCheck = await client.query('SELECT COUNT(*) FROM cup_stock');
        if (parseInt(countCheck.rows[0].count) === 0) {
            console.log('Inserting initial cup stock data...');
            await client.query(`
                INSERT INTO cup_stock (size_label, stock_count) 
                VALUES 
                    ('12oz', 100),
                    ('16oz', 100),
                    ('22oz', 100)
            `);
            console.log('✓ Initial cup stock data inserted');
        } else {
            console.log('✓ Cup stock data already exists');
        }
        
        // Test query
        const testResult = await client.query(`
            SELECT size_label, stock_count, updated_at
            FROM cup_stock 
            ORDER BY size_label
        `);
        
        console.log('Current cup stock:');
        testResult.rows.forEach(row => {
            console.log(`  ${row.size_label}: ${row.stock_count} cups`);
        });
        
        console.log('🎉 Cup stock setup complete!');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

setupCupStock();
