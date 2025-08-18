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

export const callOpenAI = async (res: Response, text: string, vectorRes?: QueryResponse<RecordMetadata>): Promise<string | null> => {
    const topMatches = vectorRes?.matches?.map((match: any) => match.metadata?.text).join('\n');
    let completeResponse = '';

    try {
        // If no matches found, return a direct response
        if (!topMatches || !topMatches.trim()) {
            const noContentResponse = "Sorry, the uploaded documents do not contain relevant information to answer this query.";
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.write(noContentResponse); // Immediate response
            res.end();
            return noContentResponse; // Return for storage or logging
        }

        // Proceed with generating the OpenAI response if matches are found
        const stream = await openai.chat.completions.create({
            model: openAiConfig.llmModel,
            messages: [
                {
                    "role": "system",
                    "content": "You are an AI assistant that answers questions based **exclusively** on the information in the provided documents and/or research papers. If the documents do not contain the information needed to answer the user's question, you must politely inform them and **do not speculate, invent, or infer information**. Clearly state that there is insufficient data to answer the question if the documents do not cover the requested topic."
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
                completeResponse += content; // Collect the complete response
                res.write(content); // Stream to client
            }
        }

        res.end();
        return completeResponse; // Return the complete response for storage

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
