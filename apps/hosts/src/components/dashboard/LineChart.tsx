'use client';

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useEffect, useState } from 'react';

interface LineChartProps {
    title: string;
    data: Array<{ month: string; revenue: number }>;
    loading?: boolean;
    height?: number;
}

export function LineChart({ title, data, loading, height = 350 }: LineChartProps) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Detect theme
        const theme = document.documentElement.getAttribute('data-theme');
        setIsDark(theme === 'dark' || theme === 'night' || theme === 'forest');

        // Listen for theme changes
        const observer = new MutationObserver(() => {
            const newTheme = document.documentElement.getAttribute('data-theme');
            setIsDark(newTheme === 'dark' || newTheme === 'night' || newTheme === 'forest');
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });

        return () => observer.disconnect();
    }, []);

    if (loading) {
        return (
            <div className="card bg-base-100 shadow-xl border border-base-300">
                <div className="card-body">
                    <h3 className="card-title text-base-content">{title}</h3>
                    <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="card bg-base-100 shadow-xl border border-base-300">
                <div className="card-body">
                    <h3 className="card-title text-base-content">{title}</h3>
                    <div className="flex items-center justify-center text-base-content/60" style={{ height: `${height}px` }}>
                        No data available
                    </div>
                </div>
            </div>
        );
    }

    const categories = data.map((item) => item.month);
    const values = data.map((item) => item.revenue);

    const options: Highcharts.Options = {
        chart: {
            type: 'line',
            height,
            backgroundColor: 'transparent',
        },
        title: {
            text: undefined,
        },
        xAxis: {
            categories,
            labels: {
                style: {
                    color: isDark ? '#a6adba' : '#666666',
                },
            },
            lineColor: isDark ? '#374151' : '#e5e7eb',
            tickColor: isDark ? '#374151' : '#e5e7eb',
        },
        yAxis: {
            title: {
                text: 'Revenue ($)',
                style: {
                    color: isDark ? '#a6adba' : '#666666',
                },
            },
            labels: {
                style: {
                    color: isDark ? '#a6adba' : '#666666',
                },
                formatter: function () {
                    const value = typeof this.value === 'number' ? this.value : 0;
                    return '$' + (value / 1000).toFixed(0) + 'k';
                },
            },
            gridLineColor: isDark ? '#374151' : '#e5e7eb',
        },
        legend: {
            enabled: false,
        },
        plotOptions: {
            line: {
                dataLabels: {
                    enabled: false,
                },
                enableMouseTracking: true,
                marker: {
                    radius: 4,
                    symbol: 'circle',
                },
            },
        },
        series: [
            {
                type: 'line',
                name: 'Revenue',
                data: values,
                color: isDark ? '#60a5fa' : '#3b82f6',
                lineWidth: 3,
            },
        ],
        tooltip: {
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderColor: isDark ? '#374151' : '#e5e7eb',
            style: {
                color: isDark ? '#f3f4f6' : '#111827',
            },
            formatter: function () {
                return `<b>${this.x}</b><br/>Revenue: $${(this.y ?? 0).toLocaleString()}`;
            },
        },
        credits: {
            enabled: false,
        },
    };

    return (
        <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
                <h3 className="card-title text-base-content mb-4">{title}</h3>
                <HighchartsReact highcharts={Highcharts} options={options} />
            </div>
        </div>
    );
}
