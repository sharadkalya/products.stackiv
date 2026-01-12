'use client';

import type {
    InvoiceKPIs,
    MonthlyInvoicingTrend,
    PaidVsUnpaid,
    TopCustomerByInvoice,
} from 'shared-redux';

import { BarChart } from '@/components/dashboard/BarChart';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { LineChart } from '@/components/dashboard/LineChart';
import { PieChart } from '@/components/dashboard/PieChart';

interface InvoicesTabProps {
    kpis: InvoiceKPIs | undefined;
    monthlyInvoicingTrend: MonthlyInvoicingTrend[] | undefined;
    paidVsUnpaid: PaidVsUnpaid | undefined;
    topCustomers: TopCustomerByInvoice[] | undefined;
    loading: boolean;
}

export function InvoicesTab({
    kpis,
    monthlyInvoicingTrend,
    paidVsUnpaid,
    topCustomers,
    loading,
}: InvoicesTabProps) {
    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <KpiCard
                    title="Total Invoiced (Last 30 Days)"
                    value={kpis?.totalInvoicedAmount ?? 0}
                    subtitle={`${kpis?.invoicesCount ?? 0} invoices`}
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    }
                    loading={loading}
                />

                <KpiCard
                    title="Month-to-Date Invoiced"
                    value={kpis?.totalInvoicedMTD ?? 0}
                    subtitle="Current month"
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    }
                    loading={loading}
                />

                <KpiCard
                    title="Paid Amount"
                    value={kpis?.totalPaidAmount ?? 0}
                    subtitle="Received payments"
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                    loading={loading}
                />

                <KpiCard
                    title="Outstanding Amount"
                    value={kpis?.totalOutstandingAmount ?? 0}
                    subtitle="Pending payments"
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                    loading={loading}
                />

                <KpiCard
                    title="Invoice Count"
                    value={kpis?.invoicesCount ?? 0}
                    subtitle="Last 30 days"
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    }
                    loading={loading}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                    <LineChart
                        title="Monthly Invoicing Trend (Last 6 Months)"
                        data={(monthlyInvoicingTrend ?? []).map((item) => ({
                            month: item.month,
                            revenue: item.amount,
                        }))}
                        loading={loading}
                        height={400}
                    />
                </div>

                <PieChart
                    title="Paid vs Unpaid"
                    data={[
                        { name: 'Paid', value: paidVsUnpaid?.paid ?? 0 },
                        { name: 'Unpaid', value: paidVsUnpaid?.unpaid ?? 0 },
                    ]}
                    loading={loading}
                />

                <BarChart
                    title="Top 5 Customers by Invoice Amount"
                    data={(topCustomers ?? []).map((c) => ({
                        name: c.partnerName,
                        value: c.invoicedAmount,
                    }))}
                    loading={loading}
                    valuePrefix="$"
                />
            </div>
        </div>
    );
}
