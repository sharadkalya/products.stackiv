# Odoo Dashboard API

## Overview

The `/api/odoo/dashboard` endpoint provides comprehensive business intelligence data from your Odoo instance, combining both Sales and Invoice analytics in a single API call.

## Endpoint

```
GET /api/odoo/dashboard
```

### Query Parameters

| Parameter | Type          | Required | Description                                             |
| --------- | ------------- | -------- | ------------------------------------------------------- |
| `from`    | ISO 8601 Date | No       | Start date for data filtering (defaults to 30 days ago) |
| `to`      | ISO 8601 Date | No       | End date for data filtering (defaults to now)           |

### Example Requests

```bash
# Get last 30 days (default)
GET /api/odoo/dashboard

# Get specific date range
GET /api/odoo/dashboard?from=2025-12-01&to=2025-12-31

# Get current month to date
GET /api/odoo/dashboard?from=2026-01-01&to=2026-01-02
```

## Response Structure

The API returns a structured JSON response with three main sections:

```typescript
{
  meta: {
    from: string,      // ISO date
    to: string,        // ISO date
    currency: string   // e.g., "USD"
  },
  sales: { /* Sales dashboard data */ },
  invoices: { /* Invoice dashboard data */ }
}
```

---

## Sales Dashboard

### Data Source

-   **Collections**: `sale_orders`, `sale_order_lines`
-   **Filters**: Only confirmed orders (`state` = 'sale' or 'done')

### KPIs (Key Performance Indicators)

| Metric                  | Description                   | Calculation                                 |
| ----------------------- | ----------------------------- | ------------------------------------------- |
| `totalSalesLast30Days`  | Total revenue in last 30 days | Sum of `amount_total` for confirmed orders  |
| `totalSalesMTD`         | Month-to-date revenue         | Sum of `amount_total` from start of month   |
| `salesGrowthPercentage` | Period-over-period growth     | `((current - previous) / previous) * 100`   |
| `averageOrderValue`     | Average value per order       | `total_revenue / order_count`               |
| `confirmedOrdersCount`  | Number of confirmed orders    | Count of orders with state 'sale' or 'done' |

### Charts

#### 1. Monthly Sales Trend

-   **Timeframe**: Last 6 months
-   **Data**: Month-by-month revenue breakdown
-   **Format**: `[{ month: "2025-12", revenue: 123456.78 }]`

#### 2. Top 5 Customers

-   **Ranking**: By total revenue
-   **Data**: Customer name, revenue, order count
-   **Format**: `[{ partnerId, partnerName, revenue, ordersCount }]`

#### 3. Top 5 Products

-   **Ranking**: By total revenue
-   **Data**: Product name, revenue, quantity sold
-   **Format**: `[{ productId, productName, revenue, quantitySold }]`

### What's Excluded

-   Draft orders (`state` = 'draft')
-   Cancelled orders (`state` = 'cancel')
-   Quotations (not confirmed)

---

## Invoice Dashboard

### Data Source

-   **Collections**: `invoices`, `invoice_lines`, `partners`
-   **Filters**: Only posted invoices (`state` = 'posted')

### Date Logic

Uses `invoice_date` if available, otherwise falls back to `create_date`.

### KPIs (Key Performance Indicators)

| Metric                   | Description                    | Calculation                                                 |
| ------------------------ | ------------------------------ | ----------------------------------------------------------- |
| `totalInvoicedAmount`    | Total invoiced in last 30 days | Sum of `amount_total` for posted invoices                   |
| `totalInvoicedMTD`       | Month-to-date invoiced amount  | Sum of `amount_total` from start of month                   |
| `totalPaidAmount`        | Total paid invoices            | Sum where `payment_state` = 'paid' or `amount_residual` = 0 |
| `totalOutstandingAmount` | Total unpaid amount            | Sum of `amount_residual` where > 0                          |
| `invoicesCount`          | Number of posted invoices      | Count of invoices with state 'posted'                       |

### Charts

#### 1. Monthly Invoicing Trend

-   **Timeframe**: Last 6 months
-   **Data**: Month-by-month invoiced amounts
-   **Format**: `[{ month: "2025-12", amount: 123456.78 }]`

#### 2. Paid vs Unpaid Breakdown

-   **Data**: Total paid amount vs total unpaid amount
-   **Format**: `{ paid: 100000, unpaid: 25000 }`

#### 3. Top 5 Customers by Invoice Amount

-   **Ranking**: By total invoiced amount
-   **Data**: Customer name, invoiced amount, invoice count
-   **Format**: `[{ partnerId, partnerName, invoicedAmount, invoicesCount }]`

### What's Excluded

-   Draft invoices (`state` = 'draft')
-   Cancelled invoices (`state` = 'cancel')
-   Credit notes (not currently tracked separately)
-   Tax breakdowns (available in raw data but not aggregated)
-   Refunds (not currently tracked separately)

---

## Error Handling

### Common Errors

| Status | Error Code       | Description             |
| ------ | ---------------- | ----------------------- |
| 401    | -                | User not authenticated  |
| 403    | `sync_not_ready` | Odoo sync not completed |
| 400    | -                | Invalid date parameters |
| 500    | -                | Internal server error   |

### Example Error Response

```json
{
    "error": "sync_not_ready",
    "message": "Dashboard data is not ready yet. Please wait for sync to complete.",
    "syncStatus": "in_progress"
}
```

---

## Implementation Notes

### Performance Optimizations

1. **Parallel Execution**: Sales and invoice aggregations run concurrently
2. **Database-Level Calculations**: All aggregations use MongoDB pipelines
3. **Indexed Fields**: Queries leverage indexes on `userId`, `state`, `dateOrder`, `invoiceDate`

### Business Logic

#### Sales Growth Calculation

```
Previous Period = Date range equal to (to - from) days before 'from'
Growth % = ((Current Period Sales - Previous Period Sales) / Previous Period Sales) * 100
```

#### MTD (Month-to-Date)

-   Calculated from the **1st day of the month** specified in the `to` parameter
-   NOT based on current system date when custom date range provided

#### Paid vs Unpaid

An invoice is considered **paid** if:

-   `payment_state` = 'paid', OR
-   `amount_residual` = 0

---

## Usage Example

### Backend Service

```typescript
import { SalesDashboardService } from '@/services/salesDashboard.service';
import { InvoiceDashboardService } from '@/services/invoices/invoiceDashboard.service';

const from = new Date('2025-12-01');
const to = new Date('2025-12-31');

const [salesData, invoicesData] = await Promise.all([
    SalesDashboardService.getSalesDashboard(userId, from, to),
    InvoiceDashboardService.getInvoiceDashboard(userId, from, to),
]);
```

### Frontend (Redux)

```typescript
import { useAppDispatch, useAppSelector } from '@/hooks';
import {
    fetchSalesDashboard,
    selectSalesKPIs,
    selectInvoiceKPIs,
} from 'shared-redux';

// Fetch data
dispatch(fetchSalesDashboard({ from: '2025-12-01', to: '2025-12-31' }));

// Access sales data
const salesKPIs = useAppSelector(selectSalesKPIs);
const monthlySalesTrend = useAppSelector(selectMonthlySalesTrend);

// Access invoice data
const invoiceKPIs = useAppSelector(selectInvoiceKPIs);
const paidVsUnpaid = useAppSelector(selectPaidVsUnpaid);
```

---

## Future Enhancements (Not Currently Implemented)

-   Credit notes tracking
-   Refund analytics
-   Tax breakdown reports
-   Payment method analysis
-   Overdue invoice tracking
-   Customer credit limits
-   Multi-currency support

---

## Related Documentation

-   [Sales Dashboard Implementation](./SALES_DASHBOARD_README.md)
-   [Odoo Sync Documentation](./odoo-sync-readme-v3.md)
-   [API Routes](../routes/odoo.routes.ts)
