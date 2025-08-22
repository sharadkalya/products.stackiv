import { Pinecone, QueryResponse, RecordMetadata } from '@pinecone-database/pinecone';

import { Interactions } from '@/models/interactions.model';
import { Message } from '@/models/messages.model';
import { chunkText } from '@/utils/askHelpers/helper';
import { getEmbedding, getOpenAiConfig } from '@/utils/askHelpers/openAi';

// Types
type Vector = number[];
type VectorResponse = {
    chunks: string[];
    embeddings: Vector[];
};

const TOP_K_RESULTS = 10;
const PINECONE_INDEX = 'stackiv';

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string,
});

interface CreateInteractionParams {
    user: string;
    documentType: 'text' | 'pdf' | 'docx';
    totalChunks?: number;
    interactionName?: string;
    embeddingModel?: string;
    status?: string;
    parsedText?: string;
}

/**
 * Store interaction in db
 */
export const createInteraction = async ({
    user,
    documentType,
    totalChunks,
    interactionName = 'Open interaction',
    status = 'processing',
    parsedText = '',
}: CreateInteractionParams): Promise<InstanceType<typeof Interactions>> => {
    try {
        const interaction = new Interactions({
            user,
            interactionName,
            documentType,
            totalChunks: totalChunks ?? 0,
            status,
            parsedText,
            embeddingModel: getOpenAiConfig().embeddingModel,
        });

        const savedInteraction = await interaction.save();
        return savedInteraction;
    } catch (error) {
        console.error('Error creating interaction:', error);
        throw new Error('Failed to create interaction');
    }
};

export const storeInVector = async (text: string, vectorIndex: string): Promise<VectorResponse> => {
    const chunks = chunkText(text);
    const embeddings = await getEmbedding(chunks);
    const index = pinecone.index(PINECONE_INDEX).namespace(vectorIndex);

    const vectors = embeddings.map((vector, i) => ({
        id: `chunk-${i}`,
        values: Array.isArray(vector) ? vector : [vector],
        metadata: { text: chunks[i] },
    }));

    await index.upsert(vectors);

    return { chunks, embeddings };
};

export const queryVector = async (queryText: string, vectorIndex: string): Promise<QueryResponse<RecordMetadata>> => {
    const queryEmbedding = (await getEmbedding([queryText]))[0];
    const index = pinecone.index(PINECONE_INDEX).namespace(vectorIndex);

    return index.query({
        topK: TOP_K_RESULTS,
        vector: Array.isArray(queryEmbedding) ? queryEmbedding : [queryEmbedding],
        includeMetadata: true,
    });
};

interface UpdateInteractionParams {
    interactionId: string;
    totalChunks: number;
    status?: string;
}

export const updateInteraction = async ({
    interactionId,
    totalChunks,
    status = 'completed',
}: UpdateInteractionParams): Promise<InstanceType<typeof Interactions>> => {
    const updatedInteraction = await Interactions.findByIdAndUpdate(
        interactionId,
        {
            totalChunks,
            status,
        },
        { new: true },
    );
    if (!updatedInteraction) {
        throw new Error('Interaction not found');
    }
    return updatedInteraction;
}

interface CreateMessageParams {
    interactionId: string;
    query: string;
    pending?: boolean;
    response?: string;
}

/**
 * Create a new message
 */
export const createMessage = async ({
    interactionId,
    query,
    pending = true,
    response = '',
}: CreateMessageParams): Promise<string> => {
    try {
        const message = new Message({
            interactionId,
            query,
            pending,
            response,
        });

        const savedMessage = await message.save();
        if (savedMessage && savedMessage._id?.toString) {
            return savedMessage._id.toString();
        }
        throw new Error('Missing id');
    } catch (error) {
        console.error('Error creating message:', error);
        throw new Error('Failed to create message');
    }
};

interface UpdateMessageParams {
    messageId: string;
    response: string;
}

/**
 * Update a message with response
 */
export const updateMessage = async ({
    messageId,
    response,
}: UpdateMessageParams): Promise<InstanceType<typeof Message>> => {
    try {
        const updatedMessage = await Message.findByIdAndUpdate(
            messageId,
            {
                response,
                pending: false,
            },
            { new: true }
        );

        if (!updatedMessage) {
            throw new Error('Message not found');
        }

        return updatedMessage;
    } catch (error) {
        console.error('Error updating message:', error);
        throw new Error('Failed to update message');
    }
};

interface GetMessagesParams {
    interactionId: string;
    limit?: number;
    cursor?: string; // createdAt timestamp of last message
}

interface GetMessagesResponse {
    messages: InstanceType<typeof Message>[];
    nextCursor?: string;
    hasMore: boolean;
}

/**
 * Get messages for an interaction with simple cursor-based pagination
 * Always returns newest messages first
 */
export const getMessages = async ({
    interactionId,
    limit = 20,
    cursor,
}: GetMessagesParams): Promise<GetMessagesResponse> => {
    try {
        // Validate input parameters
        if (!interactionId || typeof interactionId !== 'string') {
            throw new Error('Invalid interaction ID provided');
        }

        if (limit <= 0 || limit > 100) {
            throw new Error('Limit must be between 1 and 100');
        }

        // Validate cursor format if provided
        if (cursor) {
            const cursorDate = new Date(cursor);
            if (isNaN(cursorDate.getTime())) {
                throw new Error('Invalid cursor format. Expected ISO date string');
            }
        }

        const query: any = { interactionId };

        // If cursor provided, get messages older than cursor
        if (cursor) {
            query.createdAt = { $lt: new Date(cursor) };
        }

        // Fetch one extra to check if there are more
        const messages = await Message.find(query)
            .sort({ createdAt: -1 }) // Always newest first
            .limit(limit + 1);

        // Handle empty result set
        if (!messages || messages.length === 0) {
            return {
                messages: [],
                nextCursor: undefined,
                hasMore: false,
            };
        }

        const hasMore = messages.length > limit;
        if (hasMore) {
            messages.pop(); // Remove extra message
        }

        // Safely handle nextCursor for empty or single message arrays
        const nextCursor = messages.length > 0 && hasMore ?
            messages[messages.length - 1].createdAt?.toISOString() :
            undefined;

        return {
            messages,
            nextCursor,
            hasMore,
        };
    } catch (error) {
        // Distinguish between validation errors and database errors
        if (error instanceof Error && error.message.includes('Invalid')) {
            console.error('Validation error in getMessages:', error.message);
            throw error; // Re-throw validation errors as-is
        }

        console.error('Database error fetching messages:', error);
        throw new Error('Failed to fetch messages');
    }
};

// Alternative method with cached count for backwards compatibility
interface GetMessagesWithCountParams {
    interactionId: string;
    page?: number;
    limit?: number;
}

interface GetMessagesWithCountResponse {
    messages: InstanceType<typeof Message>[];
    totalMessages: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

/**
 * Get messages with traditional pagination and cached count
 * Use this when you need exact totals, but prefer cursor-based pagination for better performance
 */
export const getMessagesWithCount = async ({
    interactionId,
    page = 1,
    limit = 20,
}: GetMessagesWithCountParams): Promise<GetMessagesWithCountResponse> => {
    try {
        // Use cursor-based approach for better performance even with offset
        const skip = (page - 1) * limit;

        // Only count when necessary (e.g., first page or when specifically needed)
        const shouldCount = page === 1;

        const [messages, totalMessages] = await Promise.all([
            Message.find({ interactionId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            shouldCount ? Message.countDocuments({ interactionId }) : Promise.resolve(0),
        ]);

        const totalPages = shouldCount ? Math.ceil(totalMessages / limit) : 0;

        return {
            messages,
            totalMessages,
            totalPages,
            currentPage: page,
            hasNextPage: messages.length === limit, // Simple check without counting
            hasPrevPage: page > 1,
        };
    } catch (error) {
        console.error('Error fetching messages:', error);
        throw new Error('Failed to fetch messages');
    }
};

interface UpdateInteractionWithContentParams {
    interactionId: string;
    content: string;
    contentType: 'summary' | 'faq';
}

export const updateInteractionWithContent = async ({
    interactionId,
    content,
    contentType,
}: UpdateInteractionWithContentParams): Promise<InstanceType<typeof Interactions>> => {
    try {
        const updateField = { [contentType]: content, updatedAt: new Date() };

        const updatedInteraction = await Interactions.findByIdAndUpdate(
            interactionId,
            updateField,
            { new: true }
        );

        if (!updatedInteraction) {
            throw new Error('Interaction not found');
        }

        return updatedInteraction;
    } catch (error) {
        console.error(`Error updating interaction with ${contentType}:`, error);
        throw new Error(`Failed to update interaction with ${contentType}`);
    }
};

export const getInteractionById = async (interactionId: string): Promise<InstanceType<typeof Interactions> | null> => {
    try {
        const interaction = await Interactions.findById(interactionId);
        return interaction;
    } catch (error) {
        console.error('Error fetching interaction:', error);
        throw new Error('Failed to fetch interaction');
    }
};
