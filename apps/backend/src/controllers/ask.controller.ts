import { Request, Response } from 'express';

import { queryVector, storeInVector } from '@/services/ask.service';
import { callOllama } from '@/utils/askHelpers/ollama';
import { aiProviders, callOpenAI } from '@/utils/askHelpers/openAi';
import { badRequest, internalError } from '@/utils/response';

export const ask = async (req: Request, res: Response): Promise<void> => {
    try {
        const { text } = req.body;

        if (!text || typeof text !== 'string') {
            badRequest(res, 'Invalid request', {
                error: { message: 'Text field missing or invalid' },
            });
            return;
        }

        const vectorQueryRes = await queryVector(text);

        // Default provider if none specified
        const llmProvider = process.env.DEFAULT_LLM_PROVIDER;

        let response;

        if (llmProvider === aiProviders.ollama) {
            response = await callOllama(res, { text });
        } else if (llmProvider === aiProviders.openai) {
            return callOpenAI(res, text, vectorQueryRes);
        } else {
            badRequest(res, 'Invalid request', {
                error: { message: `Unsupported provider: ${llmProvider}` },
            });
            return;
        }

        if (!response.ok) {
            internalError(res, undefined, { error: response });
            return;
        }

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
                const chunk = decoder.decode(value);
                res.write(chunk);
            }
        }

        res.end();
    } catch (error) {
        console.error('Error in ask endpoint:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
