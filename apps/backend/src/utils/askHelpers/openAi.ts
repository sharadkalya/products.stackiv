// utils/askHelpers/openAi.ts
import { QueryResponse, RecordMetadata } from '@pinecone-database/pinecone';
import { Response } from 'express';
import OpenAI from 'openai';

import { internalError } from '../response';

export const aiProviders = {
    ollama: 'ollama',
    openai: 'openai',
    groq: 'groq',
    cohere: 'cohere',
};

type OpenAiConfigType = {
    apiKey: string;
    baseUrl: string;
    llmModel: string;
    embeddingModel: string;
};

export const getOpenAiConfig = (provider = aiProviders.cohere): OpenAiConfigType => {
    switch (provider) {
        case aiProviders.groq:
            return {
                apiKey: process.env.LLM_API_KEY_GROQ as string,
                baseUrl: process.env.LLM_API_BASE_GROQ as string,
                llmModel: process.env.LLM_MODEL_GROQ as string,
                embeddingModel: '',
            };
        case aiProviders.cohere:
            return {
                apiKey: process.env.LLM_API_KEY_COHERE as string,
                baseUrl: process.env.LLM_API_BASE_COHERE as string,
                llmModel: process.env.LLM_MODEL_COHERE as string,
                embeddingModel: process.env.LLM_EMBEDDING_MODEL_COHERE as string,
            };
        default:
            return {
                apiKey: process.env.LLM_API_KEY as string,
                baseUrl: process.env.LLM_API_BASE as string,
                llmModel: process.env.LLM_MODEL as string,
                embeddingModel: process.env.LLM_EMBEDDING_MODEL as string,
            };
    }
};

const openAiConfig = getOpenAiConfig(aiProviders.cohere);

const openai = new OpenAI({
    apiKey: openAiConfig.apiKey,
    baseURL: openAiConfig.baseUrl,
});

interface CallOpenAIParams {
    res: Response;
    text?: string;
    vectorRes?: QueryResponse<RecordMetadata>;
    messages?: Array<{ role: string; content: string }>;
    overrideMessages?: boolean;
    systemPrompt?: string;
}

export const callOpenAI = async ({
    res,
    text,
    vectorRes,
    messages = [],
    overrideMessages = false,
    systemPrompt
}: CallOpenAIParams): Promise<string | null> => {
    let completeResponse = '';

    try {
        let finalMessages;

        if (overrideMessages) {
            if (messages.length > 0) {
                // Use only the provided messages when overrideMessages is true and messages exist
                finalMessages = messages;
            } else {
                // Fallback to predefined prompt if overrideMessages is true but no messages provided
                finalMessages = [
                    {
                        role: "system",
                        content: "You are a helpful AI assistant."
                    },
                    {
                        role: "user",
                        content: text || "How can I help you?"
                    }
                ];
            }
        } else {
            // Original logic for vector-based queries
            const topMatches = vectorRes?.matches?.map((match: any) => match.metadata?.text).join('\n');

            // If no matches found and we're doing vector search, return a direct response
            if (text && (!topMatches || !topMatches.trim())) {
                const noContentResponse = "Sorry, the uploaded documents do not contain relevant information to answer this query.";
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.write(noContentResponse);
                res.end();
                return noContentResponse;
            }

            // Build default messages for vector-based queries
            finalMessages = [
                {
                    role: "system",
                    content: systemPrompt || "You are an AI assistant that answers questions based **exclusively** on the information in the provided documents and/or research papers. If the documents do not contain the information needed to answer the user's question, you must politely inform them and **do not speculate, invent, or infer information**. Clearly state that there is insufficient data to answer the question if the documents do not cover the requested topic."
                }
            ];

            // Add vector context if available
            if (text && topMatches) {
                finalMessages.push({
                    role: 'user',
                    content: `Here is some information from the document:\n${topMatches}\n\nAnswer the user's question based on the above context: ${text}`,
                });
            } else if (text) {
                // Direct text query without vector context
                finalMessages.push({
                    role: 'user',
                    content: text,
                });
            }

            // Extend messages (append additional messages if provided)
            if (messages.length > 0) {
                finalMessages.push(...messages);
            }
        }

        // Proceed with generating the OpenAI response
        const stream = await openai.chat.completions.create({
            model: openAiConfig.llmModel,
            messages: finalMessages as any,
            stream: true,
        });

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        for await (const chunk of stream) {
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
                completeResponse += content;
                res.write(content);
            }
        }

        res.end();
        return completeResponse;

    } catch (error) {
        console.error('Error in callOpenAI:', error);
        internalError(res, undefined, {
            error,
        });
        return null;
    }
};

export const getEmbedding = async (chunks: string[]): Promise<number[][]> => {
    try {
        const response = await openai.embeddings.create({
            model: openAiConfig.embeddingModel,
            input: chunks,
        });

        const embeddings = response.data.map((item) => item.embedding);
        if (!embeddings.length) throw new Error('No embeddings returned');

        return embeddings;
    } catch (error) {
        console.error('Error in getEmbedding:', error);
        throw error;
    }
};
