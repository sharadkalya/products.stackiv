/**
 * Sleep utility for async operations
 * 
 * @param ms - Duration to sleep in milliseconds
 * @returns Promise that resolves after the specified duration
 */
export const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Sleep for a specified number of seconds
 * 
 * @param seconds - Duration to sleep in seconds
 * @returns Promise that resolves after the specified duration
 */
export const sleepSeconds = (seconds: number): Promise<void> => {
    return sleep(seconds * 1000);
};
