'use client';

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useEffect, useState } from 'react';

interface PieChartProps {
    title: string;
    data: Array<{ name: string; value: number }>;
    loading?: boolean;
    height?: number;
}

export function PieChart({ title, data, loading, height = 350 }: PieChartProps) {
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

    const options: Highcharts.Options = {
        chart: {
            type: 'pie',
            height,
            backgroundColor: 'transparent',
        },
        title: {
            text: undefined,
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                    style: {
                        color: isDark ? '#f3f4f6' : '#111827',
                        textOutline: 'none',
                    },
                },
                showInLegend: true,
            },
        },
        legend: {
            itemStyle: {
                color: isDark ? '#a6adba' : '#666666',
            },
        },
        series: [
            {
                type: 'pie',
                name: 'Amount',
                data: data.map((item) => ({
                    name: item.name,
                    y: item.value,
                })),
                colors: isDark
                    ? ['#34d399', '#ef4444']
                    : ['#10b981', '#dc2626'],
            },
        ],
        tooltip: {
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderColor: isDark ? '#374151' : '#e5e7eb',
            style: {
                color: isDark ? '#f3f4f6' : '#111827',
            },
            pointFormat: '<b>{point.name}</b><br/>${point.y:,.0f} ({point.percentage:.1f}%)',
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
