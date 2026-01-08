# Monthly Dashboard Implementation

## Overview
A comprehensive monthly dashboard for the POS admin system that provides dynamic insights for any selected month.

## Features
- **Dynamic Month Selection**: Works for any month (YYYY-MM format)
- **KPI Cards**: Total orders, gross sales, starting cash, calculated profit
- **Top Products**: Top 3 products by revenue with rankings
- **Admin Cash Management**: Set starting cash for profit calculations
- **Role-based Access**: Admin-only endpoints with JWT authentication

## API Endpoints

### GET /api/dashboard/monthly?month=YYYY-MM
**Description**: Fetches monthly dashboard data
**Authentication**: Required (Admin only)
**Parameters**:
- `month` (string): Month in YYYY-MM format

**Response**:
```json
{
  "total_orders": 150,
  "gross_sales": 12500.50,
  "starting_cash": 1000.00,
  "profit": 11500.50,
  "top_products": [
    {
      "product_name": "Product A",
      "total_sold": 45,
      "total_revenue": 2250.00
    }
  ]
}
```

### POST /api/dashboard/admin/monthly-cash
**Description**: Sets starting cash for a month
**Authentication**: Required (Admin only)
**Body**:
```json
{
  "month": "2024-01",
  "starting_cash": 1000.00
}
```

## Database Schema

### monthly_cash table (assumed existing)
```sql
CREATE TABLE monthly_cash (
  id serial primary key,
  month date unique not null,
  starting_cash numeric(10,2) not null,
  created_by integer references user_table(id),
  created_at timestamp with time zone default now()
);
```

### Existing Indexes (assumed existing)
```sql
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

## Backend Implementation

### Controller Functions
- `getMonthlyDashboard`: Main dashboard data aggregation
- `setMonthlyCash`: Admin cash management

### Key Features
- **Parameterized SQL**: Prevents SQL injection
- **Single Optimized Query**: Uses CTEs for efficient data retrieval
- **Dynamic Date Handling**: No hardcoded months
- **Error Handling**: Comprehensive error responses
- **Data Validation**: Input validation and sanitization

### SQL Query Structure
```sql
WITH monthly_orders AS (
  -- Total orders and gross sales for the month
),
monthly_cash_data AS (
  -- Starting cash from monthly_cash table
),
top_products AS (
  -- Top 3 products by revenue
)
SELECT -- Combined dashboard data
```

## Frontend Implementation

### Components
- `MonthlyDashboard`: Main dashboard component
- `dashboardAPI`: API integration layer

### Features
- **Month Selector**: Native HTML month input
- **KPI Cards**: Ant Design Statistics components
- **Data Table**: Top products with trophy icons for rankings
- **Modal Form**: Set starting cash interface
- **Loading States**: Proper loading indicators
- **Error Handling**: User-friendly error messages
- **Responsive Design**: Mobile-friendly layout

### Key Dependencies
- React 19
- Ant Design 5
- Axios for HTTP requests
- @ant-design/icons

## Security Considerations

### Backend
- JWT authentication required
- Role-based access control (admin only)
- Parameterized queries prevent SQL injection
- Input validation and sanitization

### Frontend
- Token-based authentication
- Automatic token injection in requests
- Error handling for unauthorized access

## Usage Examples

### Setting Starting Cash
```javascript
// API Call
await dashboardAPI.setMonthlyCash('2024-01', 1000.00);

// Frontend: Click "Set Starting Cash" button, enter amount
```

### Fetching Dashboard Data
```javascript
// API Call
const data = await dashboardAPI.getMonthlyDashboard('2024-01');

// Frontend: Select month from dropdown, data loads automatically
```

## Best Practices Implemented

### Backend
- ✅ Single optimized SQL query
- ✅ Parameterized queries
- ✅ Proper error handling
- ✅ Input validation
- ✅ Role-based middleware
- ✅ Consistent response format

### Frontend
- ✅ Component-based architecture
- ✅ Proper state management
- ✅ Loading states
- ✅ Error boundaries
- ✅ Responsive design
- ✅ Accessibility features

## Pitfalls to Avoid

### Common Issues
1. **Hardcoded dates**: Always use dynamic month parameters
2. **Multiple queries**: Use single optimized query with CTEs
3. **Missing validation**: Always validate input parameters
4. **Frontend calculations**: Keep business logic on backend
5. **Missing indexes**: Ensure proper database indexing

### Performance Considerations
- Use date ranges instead of month extraction in WHERE clauses
- Implement proper database indexes
- Consider pagination for large datasets
- Cache frequently accessed data

## Testing

### Manual Testing Steps
1. Login as admin user
2. Navigate to Reports/Dashboard page
3. Select different months using month picker
4. Verify KPI cards display correctly
5. Set starting cash for a month
6. Verify profit calculation updates
7. Check top products table displays correctly
8. Test error handling for invalid months

### API Testing
```bash
# Get dashboard data
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/dashboard/monthly?month=2024-01"

# Set starting cash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"month":"2024-01","starting_cash":1000}' \
  "http://localhost:5000/api/dashboard/admin/monthly-cash"
```

## Deployment Notes

### Environment Variables
- `VITE_API_URL`: Frontend API base URL
- `JWT_SECRET`: Backend JWT secret
- Database connection variables

### Production Considerations
- Enable HTTPS
- Set up proper CORS
- Implement rate limiting
- Add logging and monitoring
- Regular database backups
