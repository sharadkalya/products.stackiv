import { API_BASE_URL } from "../config";

export async function askTextApi(payload: { prompt: string }) {
    const { prompt } = payload;
    const response = await fetch(`${API_BASE_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: prompt }),
    });

    return response;
}

export async function askIngestTextApi(payload: { text: string, userId?: string | null }) {
    const { text, userId } = payload;
    const response = await fetch(`${API_BASE_URL}/ask/ingest/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, userId }),
        credentials: 'include', // Include cookies for authentication
    });

    return response;
}

export async function askSummaryApi(payload: { interactionId: string }) {
    const { interactionId } = payload;
    const response = await fetch(`${API_BASE_URL}/ask/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactionId }),
        credentials: 'include', // Include cookies for authentication
    });

    return response;
}

export async function askFaqApi(payload: { interactionId: string }) {
    const { interactionId } = payload;
    const response = await fetch(`${API_BASE_URL}/ask/faq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactionId }),
        credentials: 'include', // Include cookies for authentication
    });

    return response;
}

export async function askHistoryApi(payload: { userId: string }) {
    const { userId } = payload;
    const response = await fetch(`${API_BASE_URL}/ask/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        // No credentials needed - unauthorized access allowed for guests
    });

    return response;
}

export async function loadInteractionApi(payload: { interactionId: string }) {
    const { interactionId } = payload;
    const response = await fetch(`${API_BASE_URL}/ask/interaction/${interactionId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
    });

    return response;
}

export async function askQueryApi(payload: { query: string, interactionId: string }) {
    const { query, interactionId } = payload;
    const response = await fetch(`${API_BASE_URL}/ask/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, interactionId }),
        credentials: 'include', // Include cookies for authentication
    });

    return response;
}

export async function askQueryHistoryApi(payload: { interactionId: string }) {
    const { interactionId } = payload;
    const response = await fetch(`${API_BASE_URL}/ask/query/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactionId }),
        credentials: 'include', // Include cookies for authentication
    });

    return response;
}
