import { useState, useCallback } from 'react';
import { askTextApi } from 'shared-api';

import { logMsg } from '@hosts/utils/logUtility';

export const useAsk = () => {
    const [asking, setAsking] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const parseRawText = useCallback(
        async (reader: ReadableStreamDefaultReader<Uint8Array>, decoder: TextDecoder) => {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                if (value) {
                    const chunk = decoder.decode(value);
                    setResult((prev) => prev + chunk);
                }
            }
        },
        [],
    );

    const parseNDJSON = useCallback(
        async (reader: ReadableStreamDefaultReader<Uint8Array>, decoder: TextDecoder) => {
            let buffer = '';

            while (true) {
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
                                setResult((prev) => prev + json.response);
                            }
                        } catch (e) {
                            console.warn('Failed to parse chunk as JSON:', line, e);
                            // Fallback: append raw line if JSON parsing fails
                            setResult((prev) => prev + line);
                        }
                    }
                }
            }
        },
        [],
    );

    const fetchByText = async (payload: { prompt: string }) => {
        setError('');
        setAsking(true);
        setResult('');

        try {
            const apiRes = await askTextApi(payload);
            if (!apiRes.ok) {
                setError('Error getting response, try later!');
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
                setAsking(false);
                return;
            }

            const firstChunk = decoder.decode(firstValue);

            // Simple heuristic: if first chunk starts with '{' or '[' → NDJSON else raw text
            const isNDJSON = firstChunk.trim().startsWith('{') || firstChunk.trim().startsWith('[');

            // Create a new ReadableStreamDefaultReader that includes the first chunk
            // We'll create an async generator that yields first chunk and then rest from original reader

            async function* combinedChunks() {
                yield new TextEncoder().encode(firstChunk);
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    yield value;
                }
            }

            // Wrap combinedChunks with a reader for parser function
            const combinedStream = new ReadableStream<Uint8Array>({
                start(controller) {
                    (async () => {
                        try {
                            for await (const chunk of combinedChunks()) {
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
                await parseNDJSON(combinedReader, decoder);
            } else {
                await parseRawText(combinedReader, decoder);
            }
        } catch (error) {
            logMsg('useAsk hook', 'Error ask api', error);
            setError('Error parsing response');
        } finally {
            setAsking(false);
        }
    };

    return {
        asking,
        result,
        fetchByText,
        error,
    };
};
