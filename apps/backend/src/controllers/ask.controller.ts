import { Request, Response } from 'express';

import { createInteraction, queryVector, storeInVector, updateInteraction, createMessage, updateMessage, getInteractionById, updateInteractionWithContent, getInteractionsByUserId, getChatHistory } from '@/services/ask.service';
import { callOllama } from '@/utils/askHelpers/ollama';
import { aiProviders, callOpenAI } from '@/utils/askHelpers/openAi';
import { generateGuestUserId } from '@/utils/commonHelper';
import { badRequest, internalError } from '@/utils/response';

export const query = async (req: Request, res: Response): Promise<void> => {
    let messageId: string | null = null;

    try {
        const { query, interactionId } = req.body;

        // Validate request payload
        if (!query || typeof query !== 'string') {
            badRequest(res, 'Invalid request', {
                error: { message: 'Query field missing or invalid' },
            });
            return;
        }

        if (!interactionId || typeof interactionId !== 'string') {
            badRequest(res, 'Invalid request', {
                error: { message: 'interactionId field missing or invalid' },
            });
            return;
        }

        // Create message entry in MongoDB
        messageId = await createMessage({
            interactionId,
            query,
            pending: true,
        });

        // Query vector database
        const vectorQueryRes = await queryVector(query, interactionId);

        // Validate vector results
        if (!vectorQueryRes || !vectorQueryRes.matches || vectorQueryRes.matches.length === 0) {
            console.warn('No vector matches found for query:', query);
        }

        // Default provider if none specified
        const llmProvider = process.env.DEFAULT_LLM_PROVIDER;

        let response;
        let responseText = '';

        if (llmProvider === aiProviders.ollama) {
            // TODO: Modify callOllama to accept vector context
            // For now, this is a limitation - Ollama doesn't use vector context
            response = await callOllama(res, { text: query });

            if (!response.ok) {
                if (messageId) {
                    await updateMessage({
                        messageId,
                        response: 'Error occurred while processing your request.',
                    });
                }
                if (!res.headersSent) {
                    internalError(res, undefined, { error: response });
                }
                return;
            }

            // Only set headers if not already sent
            if (!res.headersSent) {
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.setHeader('Transfer-Encoding', 'chunked');
            }

            const reader = response.body!.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                    const chunk = decoder.decode(value);
                    responseText += chunk;
                    if (!res.headersSent) {
                        res.write(chunk);
                    }
                }
            }

            if (!res.headersSent) {
                res.end();
            }

            // Update message with complete response
            if (messageId) {
                await updateMessage({
                    messageId,
                    response: responseText,
                });
            }

        } else if (llmProvider === aiProviders.openai) {
            // Call OpenAI with new object-based parameters
            const openAIResponse = await callOpenAI({
                res,
                text: query,
                vectorRes: vectorQueryRes,
            });

            // Update message with complete response once OpenAI is done
            if (messageId && openAIResponse) {
                await updateMessage({
                    messageId,
                    response: openAIResponse,
                });
            }

        } else {
            if (messageId) {
                await updateMessage({
                    messageId,
                    response: 'Invalid LLM provider configuration.',
                });
            }
            if (!res.headersSent) {
                badRequest(res, 'Invalid request', {
                    error: { message: 'Invalid LLM provider' },
                });
            }
            return;
        }

    } catch (error) {
        console.error('Error in query endpoint:', error);

        // If we created a message but failed, update it with error status
        if (messageId) {
            try {
                await updateMessage({
                    messageId,
                    response: 'An error occurred while processing your request.',
                });
            } catch (updateError) {
                console.error('Failed to update message with error:', updateError);
            }
        }

        if (!res.headersSent) {
            internalError(res, undefined, {
                error: { message: 'Internal server error' },
            });
        }
    }
};

export const ingestFile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { text } = req.body;

        if (!text || typeof text !== 'string') {
            badRequest(res, 'Invalid request', {
                error: { message: 'Text field missing or invalid' },
            });
            return;
        }

        await storeInVector(text, '');
        res.status(200).json({
            data: {
                message: 'Chunks and embedding stored for future queries',
            },
        });
    } catch (error) {
        console.error('Error in ask endpoint:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const ingestText = async (req: Request, res: Response): Promise<void> => {
    try {
        const { text, userId: loggedInUserId } = req.body;
        const userId = loggedInUserId ?? generateGuestUserId();

        if (!text || typeof text !== 'string') {
            badRequest(res, 'Invalid request', {
                error: { message: 'Text field missing or invalid' },
            });
            return;
        }

        // Create initial interaction with object params
        const interaction = await createInteraction({
            user: userId,
            documentType: 'text',
            interactionName: 'Text Ingestion',
            embeddingModel: 'cohere-small',
            status: 'processing',
            parsedText: text,
        });

        const interactionId: string = interaction._id as string;
        if (!interactionId) {
            internalError(res, undefined, {
                data: {
                    message: 'Error creating an interaction',
                },
            });
            return;
        }

        // Store text in vector database
        const { chunks } = await storeInVector(text, interactionId);

        // Update interaction using service
        await updateInteraction({
            interactionId,
            totalChunks: chunks.length,
            status: 'completed',
        });

        res.status(200).json({
            data: {
                message: 'Chunks and embedding stored for future queries',
                interactionId,
                userId: userId,
                totalChunks: chunks.length,
            },
        });
        return;
    } catch (error) {
        console.error('Error in ask endpoint:', error);
        internalError(res, 'Error in ask ingest text endpoint', {
            error,
        });
    }
};

interface ContentGenerationConfig {
    contentType: 'summary' | 'faq';
    prompt: string;
    errorMessage: string;
}

const generateContent = async (req: Request, res: Response, config: ContentGenerationConfig): Promise<void> => {
    try {
        const { interactionId } = req.body;

        // Validate request payload
        if (!interactionId || typeof interactionId !== 'string') {
            badRequest(res, 'Invalid request', {
                error: { message: 'interactionId field missing or invalid' },
            });
            return;
        }

        // Fetch interaction from database
        const interaction = await getInteractionById(interactionId);

        if (!interaction) {
            badRequest(res, 'Invalid request', {
                error: { message: 'Interaction not found' },
            });
            return;
        }

        // Check if content already exists and stream it
        const existingContent = interaction[config.contentType];
        if (existingContent && typeof existingContent === 'string') {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Transfer-Encoding', 'chunked');

            // Simulate streaming by sending the content in chunks
            const chunkSize = 50; // Characters per chunk
            for (let i = 0; i < existingContent.length; i += chunkSize) {
                const chunk = existingContent.slice(i, i + chunkSize);
                res.write(chunk);

                // Add a small delay to simulate streaming (make it more visible)
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            res.end();
            return;
        }

        // Check if parsedText exists
        if (
            !interaction.parsedText ||
            typeof interaction.parsedText !== 'string' ||
            interaction.parsedText.trim() === ''
        ) {
            badRequest(res, 'Invalid request', {
                error: { message: 'No parsed text found for this interaction' },
            });
            return;
        }

        // Generate content using callOpenAI
        const contentResponse = await callOpenAI({
            res,
            messages: [
                {
                    role: 'user',
                    content: `${config.prompt}:\n\n${interaction.parsedText}`,
                },
            ],
            overrideMessages: true,
        });

        // Cache the content in the interaction
        if (contentResponse && contentResponse.trim()) {
            await updateInteractionWithContent({
                interactionId,
                content: contentResponse.trim(),
                contentType: config.contentType,
            });
        }

    } catch (error) {
        console.error(`Error in ${config.contentType} endpoint:`, error);

        if (!res.headersSent) {
            internalError(res, undefined, {
                error: { message: config.errorMessage },
            });
        }
    }
};

export const getSummary = async (req: Request, res: Response): Promise<void> => {
    await generateContent(req, res, {
        contentType: 'summary',
        prompt: 'Please provide a comprehensive summary of the following text. Focus on the main points, key insights, and important details',
        errorMessage: 'Internal server error while generating summary',
    });
};

export const getFaq = async (req: Request, res: Response): Promise<void> => {
    await generateContent(req, res, {
        contentType: 'faq',
        prompt: 'Please generate a comprehensive list of frequently asked questions (FAQs) and their answers based on the following text. Format the response with clear questions followed by detailed answers. Focus on the most important and commonly asked questions about this content',
        errorMessage: 'Internal server error while generating FAQ',
    });
};

export const getHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.body;

        // Validate request payload
        if (!userId || typeof userId !== 'string') {
            badRequest(res, 'Invalid request', {
                error: { message: 'userId field missing or invalid' },
            });
            return;
        }

        // Fetch interaction history from service
        const history = await getInteractionsByUserId(userId);

        // Return the history array (empty array if no interactions)
        res.status(200).json(history);

    } catch (error) {
        console.error('Error in history endpoint:', error);
        internalError(res, undefined, {
            error: { message: 'Internal server error while fetching history' },
        });
    }
};

export const getInteraction = async (req: Request, res: Response): Promise<void> => {
    try {
        const { interactionId } = req.params;

        // Validate request parameters
        if (!interactionId || typeof interactionId !== 'string') {
            badRequest(res, 'Invalid request', {
                error: { message: 'interactionId parameter missing or invalid' },
            });
            return;
        }

        // Fetch interaction from database
        const interaction = await getInteractionById(interactionId);

        if (!interaction) {
            badRequest(res, 'Interaction not found', {
                error: { message: 'No interaction found with the provided ID' },
            });
            return;
        }

        // Return the interaction data in the format expected by the frontend
        const parsedText = interaction.parsedText as string;
        const title = parsedText && typeof parsedText === 'string' && parsedText.length > 100
            ? parsedText.substring(0, 100) + '...'
            : parsedText || 'Untitled Interaction';

        res.status(200).json({
            interactionId: interaction._id?.toString(),
            text: parsedText,
            userId: interaction.user,
            title: title,
            createdAt: interaction.createdAt,
            updatedAt: interaction.updatedAt,
        });

    } catch (error) {
        console.error('Error in get interaction endpoint:', error);
        internalError(res, undefined, {
            error: { message: 'Internal server error while fetching interaction' },
        });
    }
};

export const getQueryHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { interactionId } = req.body;

        // Validate request payload
        if (!interactionId || typeof interactionId !== 'string') {
            badRequest(res, 'Invalid request', {
                error: { message: 'interactionId field missing or invalid' },
            });
            return;
        }

        // Fetch chat history from service
        const chatHistory = await getChatHistory(interactionId);

        // Transform the data for frontend consumption
        const formattedHistory = chatHistory.map(message => ({
            id: message._id?.toString(),
            query: message.query,
            response: message.response || '',
            timestamp: message.createdAt,
            pending: message.pending,
        }));

        res.status(200).json(formattedHistory);

    } catch (error) {
        console.error('Error in get query history endpoint:', error);
        internalError(res, undefined, {
            error: { message: 'Internal server error while fetching chat history' },
        });
    }
};
