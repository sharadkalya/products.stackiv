/**
 * Time utility functions for date/time calculations
 */

/**
 * Add days to a date
 * 
 * @param date - Base date
 * @param days - Number of days to add (can be negative)
 * @returns New date with days added
 */
export const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

/**
 * Add hours to a date
 * 
 * @param date - Base date
 * @param hours - Number of hours to add (can be negative)
 * @returns New date with hours added
 */
export const addHours = (date: Date, hours: number): Date => {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
};

/**
 * Add minutes to a date
 * 
 * @param date - Base date
 * @param minutes - Number of minutes to add (can be negative)
 * @returns New date with minutes added
 */
export const addMinutes = (date: Date, minutes: number): Date => {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
};

/**
 * Get the midpoint between two dates
 * 
 * @param start - Start date
 * @param end - End date
 * @returns Date at the midpoint
 */
export const getMidpoint = (start: Date, end: Date): Date => {
    const startTime = start.getTime();
    const endTime = end.getTime();
    const midTime = startTime + (endTime - startTime) / 2;
    return new Date(midTime);
};

/**
 * Get the difference between two dates in minutes
 * 
 * @param start - Start date
 * @param end - End date
 * @returns Difference in minutes
 */
export const getDifferenceInMinutes = (start: Date, end: Date): number => {
    const diffMs = end.getTime() - start.getTime();
    return diffMs / (1000 * 60);
};

/**
 * Get the difference between two dates in hours
 * 
 * @param start - Start date
 * @param end - End date
 * @returns Difference in hours
 */
export const getDifferenceInHours = (start: Date, end: Date): number => {
    const diffMs = end.getTime() - start.getTime();
    return diffMs / (1000 * 60 * 60);
};

/**
 * Format a date for Odoo API (YYYY-MM-DD HH:mm:ss)
 * 
 * @param date - Date to format
 * @returns Formatted date string
 */
export const formatForOdoo = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Parse an Odoo date string to Date object
 * 
 * @param odooDateStr - Date string from Odoo (YYYY-MM-DD HH:mm:ss)
 * @returns Parsed Date object
 */
export const parseOdooDate = (odooDateStr: string): Date => {
    return new Date(odooDateStr.replace(' ', 'T') + 'Z');
};
