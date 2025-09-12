import { useState, useCallback } from 'react';
import { askTextApi, askSummaryApi, askFaqApi, askQueryApi, askQueryHistoryApi } from 'shared-api';

import { logMsg } from '@hosts/utils/logUtility';

export const useAsk = () => {
    const [asking, setAsking] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    // Summary specific state
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryText, setSummaryText] = useState('');
    const [summaryError, setSummaryError] = useState('');

    // FAQ specific state
    const [faqLoading, setFaqLoading] = useState(false);
    const [faqText, setFaqText] = useState('');
    const [faqError, setFaqError] = useState('');

    // Chat specific state
    const [chatLoading, setChatLoading] = useState(false);
    const [chatError, setChatError] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);

    // Chat history state
    const [chatHistoryLoading, setChatHistoryLoading] = useState(false);
    const [chatHistoryError, setChatHistoryError] = useState('');
    const [chatHistory, setChatHistory] = useState<unknown[]>([]);

    // Reset function for summary
    const resetSummary = useCallback(() => {
        setSummaryText('');
        setSummaryError('');
        setSummaryLoading(false);
    }, []);

    // Reset function for FAQ
    const resetFaq = useCallback(() => {
        setFaqText('');
        setFaqError('');
        setFaqLoading(false);
    }, []);

    // Reset function for chat
    const resetChat = useCallback(() => {
        setChatError('');
        setChatLoading(false);
        setIsStreaming(false);
    }, []);

    // Reset function for chat history
    const resetChatHistory = useCallback(() => {
        setChatHistory([]);
        setChatHistoryError('');
        setChatHistoryLoading(false);
    }, []);

    const parseRawText = useCallback(
        async (
            reader: ReadableStreamDefaultReader<Uint8Array>,
            decoder: TextDecoder,
            onChunk: (_chunk: string) => void,
            abortSignal?: AbortSignal,
        ) => {
            while (true) {
                if (abortSignal?.aborted) break;
                const { value, done } = await reader.read();
                if (done) break;
                if (value) {
                    const _chunk = decoder.decode(value);
                    onChunk(_chunk);
                }
            }
        },
        [],
    );

    const parseNDJSON = useCallback(
        async (
            reader: ReadableStreamDefaultReader<Uint8Array>,
            decoder: TextDecoder,
            onChunk: (_chunk: string) => void,
            abortSignal?: AbortSignal,
        ) => {
            let buffer = '';

            while (true) {
                if (abortSignal?.aborted) break;
                const { value, done } = await reader.read();
                if (done) break;
                if (value) {
                    buffer += decoder.decode(value, { stream: true });

                    let index;
                    while ((index = buffer.indexOf('\n')) !== -1) {
                        const line = buffer.slice(0, index).trim();
                        buffer = buffer.slice(index + 1);

                        if (!line) continue;

                        try {
                            const json = JSON.parse(line);
                            if (json.response) {
                                onChunk(json.response);
                            }
                        } catch (e) {
                            console.warn('Failed to parse chunk as JSON:', line, e);
                            // Fallback: append raw line if JSON parsing fails
                            onChunk(line);
                        }
                    }
                }
            }
        },
        [],
    );

    const processStream = useCallback(
        async (
            apiCall: () => Promise<Response>,
            onChunk: (_chunk: string) => void,
            setLoading: (_loading: boolean) => void,
            setError: (_error: string) => void,
            errorMsg: string,
            abortSignal?: AbortSignal,
        ) => {
            try {
                const apiRes = await apiCall();
                if (!apiRes.ok) {
                    setError(errorMsg);
                    return;
                }
                const stream = apiRes.body;
                if (!stream) throw new Error('No stream found');

                const reader = stream.getReader();
                const decoder = new TextDecoder();

                // Read first chunk to detect stream type
                const { value: firstValue, done: firstDone } = await reader.read();
                if (firstDone) {
                    setError('Empty response stream');
                    setLoading(false);
                    return;
                }

                const firstChunk = decoder.decode(firstValue);

                // Simple heuristic: if first chunk starts with '{' or '[' → NDJSON else raw text
                const isNDJSON = firstChunk.trim().startsWith('{') || firstChunk.trim().startsWith('[');

                // Create a new ReadableStreamDefaultReader that includes the first chunk
                async function* combinedChunks() {
                    yield new TextEncoder().encode(firstChunk);
                    while (true) {
                        if (abortSignal?.aborted) break;
                        const { value, done } = await reader.read();
                        if (done) break;
                        yield value;
                    }
                }

                const combinedStream = new ReadableStream<Uint8Array>({
                    start(controller) {
                        (async () => {
                            try {
                                for await (const chunk of combinedChunks()) {
                                    if (abortSignal?.aborted) {
                                        controller.close();
                                        return;
                                    }
                                    controller.enqueue(chunk);
                                }
                                controller.close();
                            } catch (e) {
                                controller.error(e);
                            }
                        })();
                    },
                });

                const combinedReader = combinedStream.getReader();

                if (isNDJSON) {
                    await parseNDJSON(combinedReader, decoder, onChunk, abortSignal);
                } else {
                    await parseRawText(combinedReader, decoder, onChunk, abortSignal);
                }
            } catch (error) {
                if (abortSignal?.aborted) {
                    return;
                }
                logMsg('useAsk hook', 'Stream processing error', error);
                setError('Error parsing response');
            } finally {
                setLoading(false);
            }
        },
        [parseNDJSON, parseRawText],
    );

    const fetchByText = async (payload: { prompt: string }) => {
        setError('');
        setAsking(true);
        setResult('');

        await processStream(
            () => askTextApi(payload),
            (chunk) => setResult((prev) => prev + chunk),
            setAsking,
            setError,
            'Error getting response, try later!',
        );
    };

    const fetchSummary = async (payload: { interactionId: string }) => {
        setSummaryError('');
        setSummaryLoading(true);
        setSummaryText('');

        let firstContentReceived = false;
        await processStream(
            () => askSummaryApi(payload),
            (chunk) => {
                if (!firstContentReceived) {
                    setSummaryLoading(false);
                    firstContentReceived = true;
                }
                setSummaryText((prev) => prev + chunk);
            },
            setSummaryLoading,
            setSummaryError,
            'Error getting summary, try later!',
        );
    };

    const fetchFaq = async (payload: { interactionId: string }) => {
        setFaqError('');
        setFaqLoading(true);
        setFaqText('');

        let firstContentReceived = false;
        await processStream(
            () => askFaqApi(payload),
            (chunk) => {
                if (!firstContentReceived) {
                    setFaqLoading(false);
                    firstContentReceived = true;
                }
                setFaqText((prev) => prev + chunk);
            },
            setFaqLoading,
            setFaqError,
            'Error getting FAQ, try later!',
        );
    };

    const fetchQuery = useCallback(async (payload: { query: string, interactionId: string }, onChunk?: (_chunk: string) => void, abortSignal?: AbortSignal): Promise<string> => {
        setChatError('');
        setChatLoading(true);
        setIsStreaming(true);

        let fullResponse = '';
        let firstContentReceived = false;

        await processStream(
            () => askQueryApi(payload),
            (chunk) => {
                if (!firstContentReceived) {
                    setChatLoading(false);
                    firstContentReceived = true;
                }
                fullResponse += chunk;
                if (onChunk) {
                    onChunk(chunk);
                }
            },
            setChatLoading,
            setChatError,
            'Error getting response, try later!',
            abortSignal,
        );

        setIsStreaming(false);
        return fullResponse;
    }, [processStream]);

    const fetchChatHistory = useCallback(async (payload: { interactionId: string }) => {
        setChatHistoryError('');
        setChatHistoryLoading(true);
        setChatHistory([]);

        try {
            const response = await askQueryHistoryApi(payload);

            if (!response.ok) {
                throw new Error('Failed to fetch chat history');
            }

            const historyData = await response.json();
            setChatHistory(historyData);
        } catch (error) {
            console.error('Error fetching chat history:', error);
            setChatHistoryError('Error loading chat history');
        } finally {
            setChatHistoryLoading(false);
        }
    }, []);

    return {
        asking,
        result,
        fetchByText,
        error,
        // Summary related exports
        summaryLoading,
        summaryText,
        summaryError,
        fetchSummary,
        resetSummary,
        // FAQ related exports
        faqLoading,
        faqText,
        faqError,
        fetchFaq,
        resetFaq,
        // Chat related exports
        chatLoading,
        chatError,
        isStreaming,
        fetchQuery,
        resetChat,
        // Chat history related exports
        chatHistoryLoading,
        chatHistoryError,
        chatHistory,
        fetchChatHistory,
        resetChatHistory,
    };
};
