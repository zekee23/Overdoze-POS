# Daily Cashier Cash Tracking, Product Size Usage, and Stock Carry-Over Implementation

This implementation adds daily cashier cash tracking, product size usage tracking, and daily stock carry-over functionality to the existing PERN stack POS system.

## Overview

The implementation consists of:
1. **Daily Cashier Sessions** - Track starting cash, total sales, and ending cash per cashier per day
2. **Daily Variant Usage** - Track how many units of each product size (variant) are sold per day
3. **Daily Stock Management** - Track stock levels with automatic carry-over from previous day
4. **Daily Reports** - Generate cash, inventory, and summary reports

## Database Changes

### New Tables

#### 1. `cashier_sessions`
- Tracks daily cashier sessions with starting cash and total sales
- One active session per cashier per day
- Links to orders via `session_id`

#### 2. `daily_variant_usage`
- Tracks quantity used per product variant per day
- Automatically updated when orders are created

#### 3. `daily_variant_stock`
- Tracks stock levels per variant per day
- Automatic carry-over from previous day's closing stock
- Tracks opening, added, used, and closing stock

### Modified Tables

#### `orders`
- Added `session_id` column to link orders to cashier sessions

## API Endpoints

### Cashier Session Management

#### Open a Cashier Session
```http
POST /api/cashier-sessions/open
Content-Type: application/json

{
  "cashier_id": 1,
  "starting_cash": 1000.00
}
```

#### Get Active Session for Cashier
```http
GET /api/cashier-sessions/active/1
```

#### Close Cashier Session
```http
PUT /api/cashier-sessions/close/1
```

#### Get Daily Sessions
```http
GET /api/cashier-sessions/daily?date=2026-01-24
```

#### Get Session Sales Details
```http
GET /api/cashier-sessions/1/sales
```

### Variant Usage Tracking

#### Update Variant Usage
```http
POST /api/variant-usage/update
Content-Type: application/json

{
  "business_date": "2026-01-24",
  "variant_updates": [
    {
      "variant_id": 1,
      "quantity_used": 5
    }
  ]
}
```

#### Get Daily Variant Usage
```http
GET /api/variant-usage/daily?date=2026-01-24
```

#### Get Usage Range
```http
GET /api/variant-usage/range?start_date=2026-01-20&end_date=2026-01-24
```

#### Get Top Used Variants
```http
GET /api/variant-usage/top?date=2026-01-24&limit=10
```

### Daily Stock Management

#### Add Daily Stock
```http
POST /api/daily-stock/add
Content-Type: application/json

{
  "business_date": "2026-01-24",
  "stock_additions": [
    {
      "variant_id": 1,
      "added_stock": 50
    }
  ]
}
```

#### Get Daily Stock
```http
GET /api/daily-stock/daily?date=2026-01-24
```

#### Get Stock Range
```http
GET /api/daily-stock/range?start_date=2026-01-20&end_date=2026-01-24
```

#### Get Low Stock Variants
```http
GET /api/daily-stock/low?date=2026-01-24&threshold=10
```

#### Initialize Daily Stock
```http
POST /api/daily-stock/initialize
Content-Type: application/json

{
  "business_date": "2026-01-24"
}
```

### Daily Reports

#### Daily Cash Report
```http
GET /api/reports/daily/cash?date=2026-01-24
```

#### Daily Inventory Report
```http
GET /api/reports/daily/inventory?date=2026-01-24
```

#### Daily Summary Report
```http
GET /api/reports/daily/summary?date=2026-01-24
```

#### Report Range
```http
GET /api/reports/daily/range?start_date=2026-01-20&end_date=2026-01-24&report_type=summary
```

## Updated Order Creation

The order creation endpoint now accepts an optional `session_id` parameter:

```http
POST /api/orders
Content-Type: application/json

{
  "cashier_id": 1,
  "session_id": 1,
  "cart": [
    {
      "product_id": 1,
      "variant": {
        "variant_id": 1
      },
      "quantity": 2,
      "sugar": {
        "sugarlevel_id": 1
      },
      "addons": [
        {
          "add_id": 1,
          "quantity": 1
        }
      ]
    }
  ],
  "total_amount": 25.50
}
```

When an order is created:
1. The order is linked to the specified session (if provided)
2. Daily variant usage is automatically updated
3. Daily stock levels are automatically decremented

## Implementation Details

### Business Logic

1. **Session Management**: 
   - Only one active session per cashier per day
   - Sessions calculate ending cash automatically (starting_cash + total_sales)
   - Sessions can only be closed once

2. **Stock Carry-Over**:
   - Opening stock = previous day's closing stock
   - If no previous record exists, opening stock = 0
   - Stock is decremented when orders are created
   - Stock can be manually added during the day

3. **Usage Tracking**:
   - Automatically updated when orders are created
   - Tracks total quantity used per variant per day
   - Can be manually updated if needed

### Database Constraints

- `cashier_sessions`: Unique constraint on (cashier_id, business_date)
- `daily_variant_usage`: Unique constraint on (business_date, variant_id)
- `daily_variant_stock`: Unique constraint on (business_date, variant_id)
- Foreign key relationships maintain data integrity

### Error Handling

- All endpoints include comprehensive error handling
- Database operations use transactions for data consistency
- Usage/stock updates don't fail order creation if they encounter errors

## Migration

Run the SQL migration to create the new tables:

```sql
-- Run this migration script
\i backend/database/create_daily_tracking_tables.sql
```

## Testing

### Test Workflow

1. **Initialize Daily Stock**:
   ```bash
   POST /api/daily-stock/initialize
   ```

2. **Open Cashier Session**:
   ```bash
   POST /api/cashier-sessions/open
   ```

3. **Add Stock**:
   ```bash
   POST /api/daily-stock/add
   ```

4. **Create Orders**:
   ```bash
   POST /api/orders (with session_id)
   ```

5. **Check Reports**:
   ```bash
   GET /api/reports/daily/summary
   ```

6. **Close Session**:
   ```bash
   PUT /api/cashier-sessions/close/{session_id}
   ```

### Expected Behavior

- Orders without `session_id` work as before (backward compatibility)
- Daily usage and stock are updated automatically
- Reports show accurate daily data
- Stock carries over to next day automatically
- Monthly reports continue to work without changes

## Files Created/Modified

### New Files
- `backend/database/create_daily_tracking_tables.sql` - Database migration
- `backend/controllers/cashierSessionController.js` - Session management
- `backend/controllers/variantUsageController.js` - Usage tracking
- `backend/controllers/dailyStockController.js` - Stock management
- `backend/controllers/dailyReportsController.js` - Reporting
- `backend/routes/cashierSessionRoutes.js` - Session routes
- `backend/routes/variantUsageRoutes.js` - Usage routes
- `backend/routes/dailyStockRoutes.js` - Stock routes
- `backend/routes/dailyReportsRoutes.js` - Report routes

### Modified Files
- `backend/controllers/ordersController.js` - Added session linking and usage/stock updates
- `backend/server.js` - Added new route imports

## Security Considerations

- All endpoints require authentication (`authenticateToken` middleware)
- Session validation ensures only active sessions can be used
- Input validation prevents invalid data
- Database transactions prevent partial updates

## Performance Considerations

- Indexes added for frequently queried columns
- Generated columns reduce calculation overhead
- Batch operations for multiple updates
- Efficient queries with proper joins

## Backward Compatibility

- Existing order creation continues to work without `session_id`
- Monthly reports are unaffected
- No breaking changes to existing tables
- All existing functionality preserved
