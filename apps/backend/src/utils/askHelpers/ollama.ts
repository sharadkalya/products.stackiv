import { Response } from 'express';

import { OllamaPayload } from '@/types/ask';

export const callOllama = async (res: Response, payload: OllamaPayload) => {
    const { text } = payload;
    const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'llama2',
            prompt: text,
            stream: true,
        }),
    });
    return response;
};
