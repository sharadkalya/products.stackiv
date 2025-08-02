import { Pinecone, QueryResponse, RecordMetadata } from '@pinecone-database/pinecone';

import { chunkText } from '@/utils/askHelpers/helper';
import { getEmbedding } from '@/utils/askHelpers/openAi';

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string,
});

export const storeInVector = async (text: string) => {
    const chunks = chunkText(text);
    const embeddings = await getEmbedding(chunks);
    console.log('embeddings', embeddings[0], embeddings[1]);
    const index = pinecone.index('stackiv-docs');

    const vectors = embeddings.map((vector, i) => ({
        id: `chunk-${i}`,
        values: Array.isArray(vector) ? vector : [vector],
        metadata: { text: chunks[i] },
    }));

    await index.upsert(vectors);

    const queryEmbedding = (await getEmbedding(['A Revolution in Human Biology and Sustainability']))[0];

    const queryResponse = await index.query({
        topK: 10,
        vector: Array.isArray(queryEmbedding) ? queryEmbedding : [queryEmbedding],
        includeMetadata: true,
    });

    console.log('queryResponse', queryResponse);

    return { chunks, embeddings, queryResponse };
};

export const queryVector = async (queryText: string): Promise<QueryResponse<RecordMetadata>> => {
    const queryEmbedding = (await getEmbedding([queryText]))[0]; // Get embedding for the query text

    const queryResponse = await pinecone.index('stackiv-docs').query({
        topK: 10, // Return top 10 results
        vector: Array.isArray(queryEmbedding) ? queryEmbedding : [queryEmbedding], // Query vector
        includeMetadata: true, // Include metadata (text) in results
    });

    return queryResponse; // Return the query response
};
