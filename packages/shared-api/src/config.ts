// Configuration for API endpoints

export const API_BASE_URL =
    typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL
        ? process.env.NEXT_PUBLIC_API_BASE_URL
        : 'http://localhost:5001/api';
