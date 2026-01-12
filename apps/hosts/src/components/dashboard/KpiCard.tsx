interface KpiCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    loading?: boolean;
}

function formatValue(value: string | number): string {
    if (typeof value === 'string') return value;

    // If more than 1 million, show M
    if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(2)}M`;
    }

    return value.toLocaleString();
}

export function KpiCard({ title, value, subtitle, icon, trend, trendValue, loading }: KpiCardProps) {
    if (loading) {
        return (
            <div className="card bg-base-100 shadow-xl border border-base-300">
                <div className="card-body">
                    <div className="space-y-3">
                        <div className="h-4 bg-base-300 rounded animate-pulse w-24"></div>
                        <div className="h-8 bg-base-300 rounded animate-pulse w-32"></div>
                        <div className="h-3 bg-base-300 rounded animate-pulse w-20"></div>
                    </div>
                </div>
            </div>
        );
    }

    const getTrendColor = () => {
        if (!trend) return '';
        switch (trend) {
            case 'up':
                return 'text-success';
            case 'down':
                return 'text-error';
            default:
                return 'text-base-content/70';
        }
    };

    const getTrendIcon = () => {
        if (!trend) return null;
        if (trend === 'up') {
            return (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            );
        }
        if (trend === 'down') {
            return (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
            );
        }
        return null;
    };

    return (
        <div className="card bg-base-100 shadow-xl border border-base-300 hover:shadow-2xl transition-shadow">
            <div className="card-body">
                <div className="flex items-center gap-2 mb-2">
                    {icon && (
                        <div className="text-primary/60">
                            {icon}
                        </div>
                    )}
                    <h3 className="text-sm font-medium text-base-content/70">
                        {title}
                    </h3>
                </div>
                <p className="text-3xl font-bold text-base-content mb-1">
                    {typeof value === 'string' && value.startsWith('$') ? value : formatValue(value)}
                </p>
                {(subtitle || trendValue) && (
                    <div className="flex items-center gap-2 text-sm">
                        {trendValue && (
                            <span className={`flex items-center gap-1 font-medium ${getTrendColor()}`}>
                                {getTrendIcon()}
                                {trendValue}
                            </span>
                        )}
                        {subtitle && (
                            <span className="text-base-content/60">
                                {subtitle}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
