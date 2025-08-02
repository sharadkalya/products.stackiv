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

const getOpenAiConfig = (provider: string): OpenAiConfigType => {
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

export const callOpenAI = async (res: Response, text: string, vectorRes?: QueryResponse<RecordMetadata>) => {
    const topMatches = vectorRes?.matches?.map((match: any) => match.metadata?.text).join('\n');

    try {
        const stream = await openai.chat.completions.create({
            model: openAiConfig.llmModel,
            messages: [
                {
                    role: 'system',
                    content: 'You are an AI assistant that helps answer questions based on uploaded documents and Or research papers.',
                },
                {
                    role: 'user',
                    content: `Here is some information from the document:\n${topMatches}\n\nAnswer the user's question based on the above context: ${text}`,
                },
            ],
            stream: true,
        });

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        for await (const chunk of stream) {
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
                res.write(content);
            }
        }
        res.end();
    } catch (error) {
        internalError(res, undefined, {
            error,
        });
        return;
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
