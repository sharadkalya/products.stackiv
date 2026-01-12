import Highcharts from 'highcharts';

/**
 * Get theme colors from DaisyUI CSS variables
 */
export function getThemeColors() {
    if (typeof window === 'undefined') {
        return {
            baseContent: '#666666',
            base200: '#f3f4f6',
            base300: '#e5e7eb',
            primary: '#3b82f6',
            success: '#10b981',
        };
    }

    const styles = getComputedStyle(document.documentElement);
    return {
        baseContent: `hsl(${styles.getPropertyValue('--bc')})`,
        base200: `hsl(${styles.getPropertyValue('--b2')})`,
        base300: `hsl(${styles.getPropertyValue('--b3')})`,
        primary: `hsl(${styles.getPropertyValue('--p')})`,
        success: `hsl(${styles.getPropertyValue('--su')})`,
    };
}

/**
 * Apply theme colors to Highcharts options
 */
export function applyThemeToChart(baseOptions: Highcharts.Options): Highcharts.Options {
    const colors = getThemeColors();

    return {
        ...baseOptions,
        chart: {
            ...baseOptions.chart,
            backgroundColor: 'transparent',
        },
        xAxis: {
            ...(baseOptions.xAxis as Highcharts.XAxisOptions),
            labels: {
                ...(baseOptions.xAxis as Highcharts.XAxisOptions)?.labels,
                style: {
                    color: colors.baseContent,
                },
            },
            lineColor: colors.base300,
            tickColor: colors.base300,
        },
        yAxis: {
            ...(baseOptions.yAxis as Highcharts.YAxisOptions),
            title: {
                ...(baseOptions.yAxis as Highcharts.YAxisOptions)?.title,
                style: {
                    color: colors.baseContent,
                },
            },
            labels: {
                ...(baseOptions.yAxis as Highcharts.YAxisOptions)?.labels,
                style: {
                    color: colors.baseContent,
                },
            },
            gridLineColor: colors.base300,
        },
        tooltip: {
            ...baseOptions.tooltip,
            backgroundColor: colors.base200,
            borderColor: colors.base300,
            style: {
                color: colors.baseContent,
            },
        },
        credits: {
            enabled: false,
        },
    };
}

/**
 * Get primary color for line/area charts
 */
export function getPrimaryColor(): string {
    return getThemeColors().primary;
}

/**
 * Get success color for bar charts
 */
export function getSuccessColor(): string {
    return getThemeColors().success;
}
