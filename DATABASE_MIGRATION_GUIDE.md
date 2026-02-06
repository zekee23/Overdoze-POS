# Database Migration Guide

## 🔄 Migration Methods

### Method 1: Automated Migration (Recommended)
**Double-click `Migrate-Database.bat`**

This automated script will:
- Export current database to SQL file
- Create new database on target server
- Import all tables and data
- Generate new configuration file

### Method 2: Manual Migration with pgAdmin
1. **Backup Current Database**
   - Open pgAdmin
   - Right-click your database → Backup
   - Save as `.sql` file

2. **Create New Database**
   - Connect to target PostgreSQL server
   - Right-click Databases → Create → Database
   - Name: `overdoze_pos` (or your preferred name)

3. **Restore Database**
   - Right-click new database → Restore
   - Select your backup file
   - Click Restore

### Method 3: Command Line Migration
```bash
# 1. Export current database
pg_dump -h localhost -U postgres -d overdoze_pos > backup.sql

# 2. Create new database
psql -h target_host -U postgres -c "CREATE DATABASE overdoze_pos;"

# 3. Import to new server
psql -h target_host -U postgres -d overdoze_pos < backup.sql
```

## 📋 Migration Checklist

### Before Migration
- [ ] Have target PostgreSQL server details
- [ ] Backup current database
- [ ] Test target server connection
- [ ] Stop application servers

### After Migration
- [ ] Update `.env` file with new database credentials
- [ ] Test application connectivity
- [ ] Verify all data is present
- [ ] Test key functionality

## 🔧 Configuration Update

After migration, update your `.env` file:

```env
DB_HOST=your_new_host
DB_PORT=5432
DB_NAME=overdoze_pos
DB_USER=postgres
DB_PASSWORD=your_new_password
```

## 🛠️ Database Scripts Available

Your project includes these SQL scripts in `backend/database/`:

- `create_daily_tracking_tables.sql` - Daily tracking tables
- `create_cup_stock_table.sql` - Cup stock management
- `create_daily_cash_drawer_table.sql` - Cash drawer tracking
- `create_monthly_reports_table.sql` - Monthly reports
- `create_cumulative_stock_function.sql` - Stock functions
- `modify_user_table_auth.sql` - User authentication

## 🚀 Quick Start with New Database

1. **Run migrations manually:**
   ```bash
   cd backend
   node run-migration.js
   ```

2. **Or use individual SQL files:**
   ```bash
   psql -h host -U user -d dbname -f database/create_daily_tracking_tables.sql
   ```

## 🔍 Verification

After migration, verify:

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check data count
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public';
```

## 🚨 Troubleshooting

### Connection Issues
- Verify PostgreSQL is running on target server
- Check firewall settings (port 5432)
- Ensure user has proper permissions

### Import Errors
- Check PostgreSQL version compatibility
- Verify SQL file encoding
- Check for duplicate table names

### Permission Issues
```sql
-- Grant permissions to user
GRANT ALL PRIVILEGES ON DATABASE overdoze_pos TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

## 📞 Support

For migration issues:
1. Check PostgreSQL logs
2. Verify network connectivity
3. Test with small data subset first
4. Use pgAdmin for visual verification
