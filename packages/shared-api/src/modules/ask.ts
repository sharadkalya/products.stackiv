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
