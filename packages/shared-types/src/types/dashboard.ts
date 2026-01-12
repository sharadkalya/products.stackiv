/**
 * Dashboard Types
 * 
 * Type definitions for Odoo Dashboard data
 */

// ========== Sales Dashboard ==========

export interface SalesKPIs {
    totalSalesLast30Days: number;
    totalSalesMTD: number;
    salesGrowthPercentage: number;
    averageOrderValue: number;
    confirmedOrdersCount: number;
}

export interface MonthlySalesTrend {
    month: string;
    revenue: number;
}

export interface TopCustomer {
    partnerId: number;
    partnerName: string;
    revenue: number;
    ordersCount: number;
}

export interface TopProduct {
    productId: number;
    productName: string;
    revenue: number;
    quantitySold: number;
}

export interface SalesDashboardData {
    kpis: SalesKPIs;
    charts: {
        monthlySalesTrend: MonthlySalesTrend[];
        topCustomers: TopCustomer[];
        topProducts: TopProduct[];
    };
}

// ========== Invoice Dashboard ==========

export interface InvoiceKPIs {
    totalInvoicedAmount: number;
    totalInvoicedMTD: number;
    totalPaidAmount: number;
    totalOutstandingAmount: number;
    invoicesCount: number;
}

export interface MonthlyInvoicingTrend {
    month: string;
    amount: number;
}

export interface PaidVsUnpaid {
    paid: number;
    unpaid: number;
}

export interface TopCustomerByInvoice {
    partnerId: number;
    partnerName: string;
    invoicedAmount: number;
    invoicesCount: number;
}

export interface InvoiceDashboardData {
    kpis: InvoiceKPIs;
    charts: {
        monthlyInvoicingTrend: MonthlyInvoicingTrend[];
        paidVsUnpaid: PaidVsUnpaid;
        topCustomers: TopCustomerByInvoice[];
    };
}

// ========== Combined Dashboard ==========

export interface DashboardMeta {
    from: string;
    to: string;
    currency: string;
}

export interface CombinedDashboardData {
    meta: DashboardMeta;
    sales: SalesDashboardData;
    invoices: InvoiceDashboardData;
}
