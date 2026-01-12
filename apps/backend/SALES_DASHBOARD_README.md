# Sales Dashboard Implementation

## Overview

This document outlines the phased implementation of the Sales Performance Dashboard, which aggregates Odoo data synced to MongoDB and provides KPIs and visualizations for business insights.

---

## Phase 1: Sales Performance Dashboard ✅

### Scope

**Endpoint:** `GET /api/odoo/dashboard`

**Authentication:** JWT token required (via `Authorization` cookie)

**Query Parameters:**

-   `from` (optional): ISO 8601 date string (e.g., `2025-01-01T00:00:00Z`)
-   `to` (optional): ISO 8601 date string
-   If not provided, defaults to last 30 days

**Response Structure:**

```json
{
    "success": true,
    "data": {
        "meta": {
            "from": "2025-12-02T00:00:00.000Z",
            "to": "2026-01-01T00:00:00.000Z",
            "currency": "USD"
        },
        "kpis": {
            "totalSalesLast30Days": 125430.5,
            "totalSalesMTD": 89200.25,
            "salesGrowthPercentage": 15.75,
            "averageOrderValue": 4250.3,
            "confirmedOrdersCount": 32
        },
        "charts": {
            "monthlySalesTrend": [
                { "month": "2025-08", "revenue": 95000.0 },
                { "month": "2025-09", "revenue": 110000.0 },
                { "month": "2025-10", "revenue": 105000.0 },
                { "month": "2025-11", "revenue": 120000.0 },
                { "month": "2025-12", "revenue": 135000.0 },
                { "month": "2026-01", "revenue": 89200.25 }
            ],
            "topCustomers": [
                {
                    "partnerId": 123,
                    "partnerName": "Acme Corp",
                    "revenue": 45000.0,
                    "ordersCount": 8
                }
                // ... top 5
            ],
            "topProducts": [
                {
                    "productId": 456,
                    "productName": "Premium Widget",
                    "revenue": 28500.0,
                    "quantitySold": 150.0
                }
                // ... top 5
            ]
        }
    }
}
```

### KPIs Implemented

1. **Total Sales (Last 30 Days)**

    - Sum of `amountTotal` from sale orders in last 30 days
    - Only confirmed orders (`state = 'sale' or 'done'`)

2. **Total Sales (Month-to-Date)**

    - Sum from start of current month to now
    - Only confirmed orders

3. **Sales Growth Percentage**

    - Compares current period vs previous equal period
    - Formula: `((current - previous) / previous) * 100`
    - Example: If querying Dec 1-31, compares to Nov 1-30

4. **Average Order Value**

    - Average of `amountTotal` for confirmed orders in date range

5. **Confirmed Orders Count**
    - Count of orders with `state = 'sale' or 'done'`

### Charts Implemented

1. **Monthly Sales Trend (Last 6 Months)**

    - Groups confirmed orders by year-month
    - Sums revenue per month
    - Returns chronologically sorted data

2. **Top 5 Customers by Revenue**

    - Groups by `partnerId`
    - Sums revenue and counts orders
    - Sorted descending by revenue

3. **Top 5 Products by Revenue**
    - Uses `sale.order.line` data
    - Filters by orders in date range
    - Groups by `productId`
    - Sums `priceSubtotal` and `productUomQty`

### Business Rules

-   **Confirmed Orders Only:** Only orders with `state` in `['sale', 'done']` are counted
-   **Cancelled Orders Excluded:** Orders with other states (draft, cancelled, etc.) are ignored
-   **Date Field:** Uses `dateOrder` for filtering
-   **Revenue Field:** Uses `amountTotal` from sale orders
-   **Currency:** Currently hardcoded to USD (TODO: get from company settings)

### MongoDB Indexes

Added performance indexes to support dashboard aggregations:

**OdooSaleOrder:**

```typescript
{ userId: 1, state: 1, dateOrder: 1 }
{ userId: 1, state: 1, partnerId: 1, dateOrder: 1 }
```

**OdooSaleOrderLine:**

```typescript
{ userId: 1, state: 1, productId: 1 }
{ userId: 1, orderId: 1, state: 1 }
```

These indexes optimize the most common query patterns:

-   Filtering by user + state + date range
-   Grouping by partner/product
-   Joining sale orders with sale order lines

### Performance Optimizations

1. **Parallel Aggregations:** All independent aggregations run concurrently using `Promise.all()`
2. **Database-Level Calculations:** All sums, averages, and grouping done via MongoDB aggregation pipelines
3. **Indexed Fields:** All filter and group-by fields are indexed
4. **Minimal Data Transfer:** Only required fields returned in aggregations

### Technical Architecture

**File Structure:**

```
apps/backend/src/
├── controllers/
│   └── salesDashboard.controller.ts   # HTTP request handling
├── services/
│   └── salesDashboard.service.ts      # Business logic & aggregations
├── routes/
│   └── dashboard.routes.ts            # Route definitions
└── models/
    ├── odooSaleOrder.model.ts         # Updated with indexes
    └── odooSaleOrderLine.model.ts     # Updated with indexes
```

**Design Patterns:**

-   **Service Layer:** All business logic in `SalesDashboardService`
-   **Thin Controllers:** Controllers only handle HTTP concerns
-   **Aggregation Pipelines:** Complex calculations at database level
-   **Type Safety:** Full TypeScript interfaces for all data structures

---

## Phase 2: Extended Analytics (Planned)

### CRM Dashboard

-   **Pipeline Metrics:** Leads by stage, conversion rates, win/loss analysis
-   **Lead Sources:** Revenue attribution by source
-   **Sales Funnel:** Stage-by-stage drop-off rates
-   **Activities:** Tasks completed, calls made, meetings scheduled

### Inventory Dashboard

-   **Stock Levels:** Current vs minimum quantities
-   **Top Moving Products:** By turnover rate
-   **Reorder Alerts:** Products below reorder point
-   **Stock Valuation:** Total inventory value

### Financial Dashboard

-   **Cash Flow:** Revenue vs expenses trend
-   **Accounts Receivable:** Outstanding invoices, aging analysis
-   **Profit Margins:** Gross margin by product/customer
-   **Payment Status:** Paid vs unpaid invoices breakdown

### Employee Performance Dashboard

-   **Sales by Employee:** Revenue per salesperson
-   **Activity Metrics:** Tasks, calls, meetings per employee
-   **Target Tracking:** Actual vs quota performance
-   **Commission Calculations:** Based on sales attributed to employee

---

## Phase 3: Advanced Features (Future)

### Interactive Features

-   **Date Range Picker:** Custom date range selection
-   **Drill-Down:** Click chart elements to see detailed records
-   **Export:** CSV/PDF export of dashboard data
-   **Scheduled Reports:** Email dashboards on schedule

### Comparative Analysis

-   **Year-over-Year:** Compare same period across years
-   **Period-over-Period:** Flexible comparison periods
-   **Benchmarking:** Compare to company targets or industry averages

### Forecasting

-   **Sales Prediction:** ML-based revenue forecasting
-   **Trend Analysis:** Detect patterns and anomalies
-   **What-If Scenarios:** Simulate business changes

### Real-Time Updates

-   **WebSocket Integration:** Live dashboard updates
-   **Notifications:** Alert on significant changes
-   **Auto-Refresh:** Configurable refresh intervals

---

## Intentionally Skipped (Phase 1)

To keep Phase 1 focused and deliverable, we intentionally deferred:

1. **Multi-Currency Support:** Hardcoded to USD; TODO: read from company settings
2. **Company Filtering:** No `companyId` filter; assumes single company
3. **Date Field Flexibility:** Uses `dateOrder` only; ignores `confirmation_date`
4. **Advanced Filtering:** No product category, salesperson, or region filters
5. **Cached Results:** No caching layer; always queries live data
6. **Pagination:** Charts return top 5 only; no pagination for more results
7. **Custom KPIs:** Fixed KPI set; no user-defined metrics
8. **Comparative Charts:** No side-by-side period comparisons
9. **Drill-Down Views:** No detail pages for chart elements
10. **Export Functionality:** No CSV/PDF export yet

These features are candidates for Phase 2 or 3 based on user feedback and priority.

---

## Testing the Endpoint

### Example Request

```bash
# Last 30 days (default)
curl -X GET "http://localhost:5001/api/dashboard/sales" \
  -H "Cookie: Authorization=<your-jwt-token>"

# Custom date range
curl -X GET "http://localhost:5001/api/dashboard/sales?from=2025-12-01T00:00:00Z&to=2025-12-31T23:59:59Z" \
  -H "Cookie: Authorization=<your-jwt-token>"
```

### Expected Response Time

-   **Small Dataset (<1000 orders):** <500ms
-   **Medium Dataset (1000-10000 orders):** 500ms - 2s
-   **Large Dataset (>10000 orders):** 2s - 5s

If queries exceed 5 seconds, consider:

1. Adding more specific indexes
2. Implementing result caching
3. Pre-aggregating data in background jobs

---

## Database Migrations

The new indexes are added automatically when the models load. To manually ensure indexes:

```javascript
// Run in MongoDB shell or via script
db.odoosaleorders.createIndex({ userId: 1, state: 1, dateOrder: 1 });
db.odoosaleorders.createIndex({
    userId: 1,
    state: 1,
    partnerId: 1,
    dateOrder: 1,
});
db.odoosaleorderlines.createIndex({ userId: 1, state: 1, productId: 1 });
db.odoosaleorderlines.createIndex({ userId: 1, orderId: 1, state: 1 });
```

To verify indexes:

```javascript
db.odoosaleorders.getIndexes();
db.odoosaleorderlines.getIndexes();
```

---

## Monitoring & Maintenance

### Performance Monitoring

-   Monitor query execution time via MongoDB slow query log
-   Set alert if dashboard response time > 5 seconds
-   Review index usage: `db.collection.aggregate([]).explain("executionStats")`

### Data Quality

-   Ensure all sale orders have `dateOrder` populated
-   Validate `state` values match expected enums
-   Check for null `amountTotal` values (should be 0 or valid number)

### Scaling Considerations

-   Current implementation handles up to ~100k orders efficiently
-   For larger datasets, consider:
    -   Materialized views (pre-aggregated tables)
    -   Background jobs to compute daily summaries
    -   Read replicas for dashboard queries

---

## Next Steps

1. **Gather User Feedback:** Test with real users, collect feature requests
2. **Prioritize Phase 2:** Decide which dashboard to build next based on user needs
3. **Performance Tuning:** Monitor query performance, add indexes as needed
4. **UI Implementation:** Build frontend components to visualize this data
5. **Documentation:** Add API docs to Swagger/OpenAPI spec

---

## Questions or Issues?

For questions about this implementation, contact the development team or refer to:

-   [MongoDB Aggregation Framework Docs](https://docs.mongodb.com/manual/aggregation/)
-   [Mongoose Aggregation Guide](https://mongoosejs.com/docs/api/aggregate.html)
-   Internal codebase standards: `apps/backend/README.md`
