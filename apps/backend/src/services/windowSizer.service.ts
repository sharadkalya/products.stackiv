import { SYNC_CONFIG, SupportedModule } from '@/config/sync.config';
import { OdooClientService, OdooConnection } from '@/services/odooClient.service';
import { getDifferenceInMinutes, getMidpoint } from '@/utils/time';

export interface TimeWindow {
    startTime: Date;
    endTime: Date;
    recordCount: number;
}

export interface WindowSizeResult {
    success: boolean;
    window?: TimeWindow;
    error?: string;
}

/**
 * Window Sizer Service
 * 
 * Adaptively shrinks time windows to ensure each batch has ≤ LIMIT_PER_CALL records
 */
export class WindowSizerService {
    /**
     * Shrink a time window until record count is within acceptable limits
     * 
     * @param conn - Odoo connection details
     * @param module - Module to check
     * @param startTime - Window start time
     * @param endTime - Window end time
     * @returns Window with acceptable record count or error
     */
    static async shrinkWindow(
        conn: OdooConnection,
        module: SupportedModule,
        startTime: Date,
        endTime: Date,
    ): Promise<WindowSizeResult> {
        const currentStart = startTime;
        let currentEnd = endTime;

        // Safety counter to prevent infinite loops
        let iterations = 0;
        const maxIterations = 20;

        while (iterations < maxIterations) {
            iterations++;

            try {
                // Check current window size
                const windowMinutes = getDifferenceInMinutes(currentStart, currentEnd);

                if (windowMinutes < SYNC_CONFIG.MIN_WINDOW_MINUTES) {
                    return {
                        success: false,
                        error: `Data too dense: window reduced to ${windowMinutes.toFixed(1)} minutes (minimum: ${SYNC_CONFIG.MIN_WINDOW_MINUTES})`,
                    };
                }

                // Count records in current window
                const recordCount = await OdooClientService.countRecords(
                    conn,
                    module,
                    currentStart,
                    currentEnd,
                );

                // If count is acceptable, return this window
                if (recordCount <= SYNC_CONFIG.LIMIT_PER_CALL) {
                    return {
                        success: true,
                        window: {
                            startTime: currentStart,
                            endTime: currentEnd,
                            recordCount,
                        },
                    };
                }

                // Too many records, halve the window
                currentEnd = getMidpoint(currentStart, currentEnd);

            } catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error during window sizing',
                };
            }
        }

        return {
            success: false,
            error: `Max iterations (${maxIterations}) reached while shrinking window`,
        };
    }

    /**
     * Validate a time window without shrinking
     * 
     * @param conn - Odoo connection details
     * @param module - Module to check
     * @param startTime - Window start time
     * @param endTime - Window end time
     * @returns Record count and whether it's acceptable
     */
    static async validateWindow(
        conn: OdooConnection,
        module: SupportedModule,
        startTime: Date,
        endTime: Date,
    ): Promise<{ count: number; acceptable: boolean }> {
        try {
            const count = await OdooClientService.countRecords(
                conn,
                module,
                startTime,
                endTime,
            );

            return {
                count,
                acceptable: count <= SYNC_CONFIG.LIMIT_PER_CALL,
            };
        } catch (error) {
            throw new Error(
                `Failed to validate window: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}
