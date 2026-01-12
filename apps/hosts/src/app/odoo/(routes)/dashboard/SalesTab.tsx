'use client';

import type { SalesKPIs, MonthlySalesTrend, TopCustomer, TopProduct } from 'shared-redux';

import { BarChart } from '@/components/dashboard/BarChart';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { LineChart } from '@/components/dashboard/LineChart';

interface SalesTabProps {
    kpis: SalesKPIs | undefined;
    monthlySalesTrend: MonthlySalesTrend[] | undefined;
    topCustomers: TopCustomer[] | undefined;
    topProducts: TopProduct[] | undefined;
    loading: boolean;
}

export function SalesTab({
    kpis,
    monthlySalesTrend,
    topCustomers,
    topProducts,
    loading,
}: SalesTabProps) {
    const getTrend = (value: number): 'up' | 'down' | 'neutral' => {
        if (value > 0) return 'up';
        if (value < 0) return 'down';
        return 'neutral';
    };

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <KpiCard
                    title="Total Sales (Last 30 Days)"
                    value={kpis?.totalSalesLast30Days ?? 0}
                    subtitle={`${kpis?.confirmedOrdersCount ?? 0} orders`}
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                    loading={loading}
                />

                <KpiCard
                    title="Month-to-Date Sales"
                    value={kpis?.totalSalesMTD ?? 0}
                    subtitle="Current month"
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    }
                    loading={loading}
                />

                <KpiCard
                    title="Sales Growth"
                    value={`${kpis?.salesGrowthPercentage.toFixed(1) ?? '0'}%`}
                    trend={getTrend(kpis?.salesGrowthPercentage ?? 0)}
                    trendValue={(kpis?.salesGrowthPercentage ?? 0) >= 0 ? `+${kpis?.salesGrowthPercentage.toFixed(1)}%` : `${kpis?.salesGrowthPercentage.toFixed(1)}%`}
                    subtitle="vs previous period"
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    }
                    loading={loading}
                />

                <KpiCard
                    title="Average Order Value"
                    value={kpis?.averageOrderValue ?? 0}
                    subtitle="Per order"
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    }
                    loading={loading}
                />

                <KpiCard
                    title="Confirmed Orders"
                    value={kpis?.confirmedOrdersCount ?? 0}
                    subtitle="Last 30 days"
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                    loading={loading}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                    <LineChart
                        title="Monthly Sales Trend (Last 6 Months)"
                        data={monthlySalesTrend ?? []}
                        loading={loading}
                        height={400}
                    />
                </div>

                <BarChart
                    title="Top 5 Customers"
                    data={(topCustomers ?? []).map((c) => ({ name: c.partnerName, value: c.revenue }))}
                    loading={loading}
                    valuePrefix="$"
                />

                <BarChart
                    title="Top 5 Products"
                    data={(topProducts ?? []).map((p) => ({ name: p.productName, value: p.revenue }))}
                    loading={loading}
                    valuePrefix="$"
                />
            </div>
        </div>
    );
}
