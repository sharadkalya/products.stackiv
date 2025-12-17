/**
 * Odoo Sync Engine Configuration
 * 
 * This file contains all configurable constants for the Odoo sync engine.
 * Modify these values to adjust sync behavior without changing core logic.
 */

export const SYNC_CONFIG = {
    /**
     * Maximum number of records to fetch in a single Odoo API call
     * v3: Used for cursor-based pagination limit
     */
    LIMIT_PER_CALL: 200,

    /**
     * Maximum number of attempts for a failed batch before marking it as permanently failed
     */
    MAX_BATCH_ATTEMPTS: 4,

    /**
     * Number of days to look back for the initial sync
     * E.g., 14 means sync data from the last 14 days
     */
    INITIAL_SYNC_RANGE_DAYS: 14,

    /**
     * Safety buffer in minutes for incremental syncs
     * Subtracts this from last sync time to catch edge cases
     * Handles clock skew, transaction timing, and boundary conditions
     */
    SYNC_BUFFER_MINUTES: 10,

    /**
     * Initial time window size in hours for each batch
     * v3: Windows adapt based on density (can split smaller)
     */
    WINDOW_HOURS: 24,

    /**
     * Minimum window size in hours when adaptive splitting
     * If a window reaches this size and still has too many records, process anyway
     */
    MIN_WINDOW_HOURS: 1,

    /**
     * Maximum records per window before triggering adaptive split
     * If a window contains more than this, split it in half
     */
    MAX_RECORDS_PER_WINDOW: 5000,

    /**
     * Chunk size for bulk upsert operations
     * Large batches are split into chunks to avoid MongoDB limits
     */
    BULK_UPSERT_CHUNK_SIZE: 2000,

    /**
     * Sort order for ID-based pagination
     * CRITICAL: Must be 'id asc' for reliable pagination
     * Works for both normal data and timestamp bursts (CSV imports)
     */
    SORT_ORDER: 'id asc',

    /**
     * Delay between API calls in milliseconds to avoid rate limiting
     */
    API_CALL_DELAY_MS: 1000,

    /**
     * Cron schedule for running sync checks
     * Format: every 10 seconds
     * Change to run every 30 seconds, etc. by modifying the value
     */
    CRON_SCHEDULE: '*/10 * * * * *',

    /**
     * Number of users to process concurrently in each cron cycle
     * Higher = faster processing but more memory usage
     * Lower = slower but more memory efficient
     * Recommended: 10-20 for most deployments
     */
    CONCURRENT_USER_LIMIT: 10,

    /**
     * List of Odoo modules supported for synchronization
     * Only these modules will be synced from Odoo
     */
    SUPPORTED_MODULES: [
        'sale.order',      // Sales Orders
        'sale.order.line', // Sales Order Lines
        'account.move',    // Invoices
        'res.partner',     // Contacts/Partners
        'hr.employee',     // Employees
    ] as const,

    /**
     * Cleanup configuration for old batch records
     */
    CLEANUP: {
        /**
         * Enable automatic cleanup of old completed batches
         */
        ENABLED: false,

        /**
         * Number of days to keep completed batch records
         * Batches older than this will be deleted
         */
        RETENTION_DAYS: 30,

        /**
         * Cron schedule for cleanup job
         * Format: every day at 2:00 AM
         */
        SCHEDULE: '0 0 2 * * *',
    },
} as const;

/**
 * Type for supported module names
 */
export type SupportedModule = (typeof SYNC_CONFIG.SUPPORTED_MODULES)[number];

/**
 * Module display names for logging and UI
 */
export const MODULE_DISPLAY_NAMES: Record<SupportedModule, string> = {
    'sale.order': 'Sales Orders',
    'sale.order.line': 'Sales Order Lines',
    'account.move': 'Invoices',
    'res.partner': 'Contacts',
    'hr.employee': 'Employees',
};

/**
 * Mapping of Odoo module names to MongoDB collection names
 */
export const MODULE_TO_COLLECTION: Record<SupportedModule, string> = {
    'sale.order': 'odoosaleorders',
    'sale.order.line': 'odoosaleorderlines',
    'account.move': 'odooinvoices',
    'res.partner': 'odoocontacts',
    'hr.employee': 'odooemployees',
};
