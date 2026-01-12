'use client';

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useEffect, useState } from 'react';

interface BarChartProps {
    title: string;
    data: Array<{ name: string; value: number }>;
    loading?: boolean;
    height?: number;
    valuePrefix?: string;
    valueSuffix?: string;
}

export function BarChart({ title, data, loading, height = 350, valuePrefix = '', valueSuffix = '' }: BarChartProps) {
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

    const categories = data.map((item) => item.name);

    const options: Highcharts.Options = {
        chart: {
            type: 'bar',
            height,
            backgroundColor: 'transparent',
        },
        title: {
            text: undefined,
        },
        xAxis: {
            categories,
            type: 'category',
            labels: {
                style: {
                    color: isDark ? '#a6adba' : '#666666',
                },
            },
            lineWidth: 0,
            tickWidth: 0,
            gridLineWidth: 0,
        },
        yAxis: {
            title: {
                text: undefined,
            },
            labels: {
                style: {
                    color: isDark ? '#a6adba' : '#666666',
                },
                formatter: function () {
                    const value = typeof this.value === 'number' ? this.value : 0;
                    if (valuePrefix === '$') {
                        return '$' + (value / 1000).toFixed(0) + 'k';
                    }
                    return `${valuePrefix}${this.value}${valueSuffix}`;
                },
            },
            gridLineWidth: 0,
        },
        legend: {
            enabled: false,
        },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: false,
                },
                borderWidth: 0,
            },
        },
        series: [
            {
                type: 'bar',
                name: title,
                data: data.map((item) => ({
                    name: item.name,
                    y: item.value,
                })),
                color: isDark ? '#34d399' : '#10b981',
            },
        ],
        tooltip: {
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderColor: isDark ? '#374151' : '#e5e7eb',
            style: {
                color: isDark ? '#f3f4f6' : '#111827',
            },
            pointFormat: '<b>{point.name}</b><br/>' +
                (valuePrefix === '$' ? '${point.y:,.0f}' : `${valuePrefix}{point.y}${valueSuffix}`),
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
