'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAppSelector, useAppDispatch } from 'shared-redux';
import { selectActiveSession, loadInteractionAction } from 'shared-redux';
import { useEffect, useState, useRef } from 'react';
import { useAsk } from '../../hooks/useAsk';

interface Message {
    id: string;
    content: string;
    isUser: boolean;
    timestamp: Date;
    isStreaming?: boolean;
}

interface ChatHistoryItem {
    id: string;
    query: string;
    response: string;
    timestamp: string;
    pending: boolean;
}

export default function Chat() {
    const params = useParams();
    const dispatch = useAppDispatch();
    const interactionId = params.interactionId as string;

    const activeSession = useAppSelector(selectActiveSession);
    const [interactionLoaded, setInteractionLoaded] = useState(false);
    const [chatHistoryLoaded, setChatHistoryLoaded] = useState(false);
    const [historyConverted, setHistoryConverted] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');

    const { fetchQuery, isStreaming, chatError, resetChat, chatHistory, chatHistoryLoading, chatHistoryError, fetchChatHistory, resetChatHistory } = useAsk();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const prevInteractionIdRef = useRef<string>('');

    // Check if this is the correct interaction loaded in active session
    const isCorrectInteractionLoaded = activeSession?.id === interactionId;

    // Debug logging
    useEffect(() => {
        console.log('Chat Debug Info:');
        console.log('- interactionId:', interactionId);
        console.log('- activeSession?.id:', activeSession?.id);
        console.log('- isCorrectInteractionLoaded:', isCorrectInteractionLoaded);
        console.log('- interactionLoaded:', interactionLoaded);
        console.log('- chatHistoryLoaded:', chatHistoryLoaded);
    }, [interactionId, activeSession?.id, isCorrectInteractionLoaded, interactionLoaded, chatHistoryLoaded]);

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, currentStreamingMessage]);

    // Reset states when interaction changes
    useEffect(() => {
        if (prevInteractionIdRef.current && prevInteractionIdRef.current !== interactionId) {
            console.log('Interaction changed from', prevInteractionIdRef.current, 'to', interactionId);
            setChatHistoryLoaded(false);
            setHistoryConverted(false);
            setMessages([]);
            setCurrentStreamingMessage('');
            setInteractionLoaded(false);
            resetChatHistory(); // Reset chat history state in the hook
        }
        prevInteractionIdRef.current = interactionId;
    }, [interactionId, resetChatHistory]);

    // Load interaction if not already loaded
    useEffect(() => {
        if (interactionId && !isCorrectInteractionLoaded && !interactionLoaded) {
            console.log('Loading interaction:', interactionId);
            setInteractionLoaded(true);
            dispatch(loadInteractionAction({ interactionId }));
        }
    }, [interactionId, isCorrectInteractionLoaded, interactionLoaded, dispatch]);

    // Load chat history when interaction is ready
    useEffect(() => {
        if (isCorrectInteractionLoaded && interactionId && !chatHistoryLoaded) {
            console.log('Loading chat history for interaction:', interactionId);
            setChatHistoryLoaded(true);
            fetchChatHistory({ interactionId });
        }
    }, [isCorrectInteractionLoaded, interactionId, chatHistoryLoaded, fetchChatHistory]);

    // Convert chat history to messages when history is loaded
    useEffect(() => {
        if (chatHistory && chatHistory.length > 0 && !historyConverted) {
            const historyMessages: Message[] = [];

            chatHistory.forEach((item: ChatHistoryItem) => {
                // Add user message
                historyMessages.push({
                    id: `${item.id}-user`,
                    content: item.query,
                    isUser: true,
                    timestamp: new Date(item.timestamp)
                });

                // Add bot response if it exists and is not pending
                if (item.response && !item.pending) {
                    historyMessages.push({
                        id: `${item.id}-bot`,
                        content: item.response,
                        isUser: false,
                        timestamp: new Date(item.timestamp)
                    });
                }
            });

            if (historyMessages.length > 0) {
                setMessages(historyMessages);
                setHistoryConverted(true);
            }
        }
    }, [chatHistory, historyConverted]);

    // Add initial welcome message when interaction is loaded and no chat history
    useEffect(() => {
        if (isCorrectInteractionLoaded && messages.length === 0 && !chatHistoryLoading && !historyConverted && (!chatHistory || chatHistory.length === 0)) {
            const welcomeMessage: Message = {
                id: 'welcome',
                content: `Hello! I'm here to help you understand and explore your content. Feel free to ask me any questions about the document you've uploaded.`,
                isUser: false,
                timestamp: new Date()
            };
            setMessages([welcomeMessage]);
        }
    }, [isCorrectInteractionLoaded, messages.length, chatHistoryLoading, historyConverted, chatHistory]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isStreaming) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            content: inputValue.trim(),
            isUser: true,
            timestamp: new Date()
        };

        const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: '',
            isUser: false,
            timestamp: new Date(),
            isStreaming: true
        };

        setMessages(prev => [...prev, userMessage, botMessage]);
        setInputValue('');
        setCurrentStreamingMessage('');

        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();

        try {
            const fullResponse = await fetchQuery(
                { query: userMessage.content, interactionId },
                (chunk) => {
                    console.log('Received chunk:', chunk);
                    setCurrentStreamingMessage(prev => prev + chunk);
                },
                abortControllerRef.current?.signal
            );

            // Update the bot message with final content
            setMessages(prev => prev.map(msg =>
                msg.id === botMessage.id
                    ? { ...msg, content: fullResponse, isStreaming: false }
                    : msg
            ));
        } catch (error) {
            if (abortControllerRef.current?.signal.aborted) {
                // Request was aborted, update message appropriately
                setMessages(prev => prev.map(msg =>
                    msg.id === botMessage.id
                        ? { ...msg, content: currentStreamingMessage || 'Response was stopped.', isStreaming: false }
                        : msg
                ));
            } else {
                console.error('Error sending message:', error);
                setMessages(prev => prev.map(msg =>
                    msg.id === botMessage.id
                        ? { ...msg, content: 'Sorry, I encountered an error while processing your request.', isStreaming: false }
                        : msg
                ));
            }
        }

        setCurrentStreamingMessage('');
    };

    const handleStopStreaming = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        // Update the current streaming message to stop
        setMessages(prev => prev.map(msg =>
            msg.isStreaming
                ? { ...msg, content: currentStreamingMessage, isStreaming: false }
                : msg
        ));
        setCurrentStreamingMessage('');
        resetChat();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Show loading state while loading interaction
    if (!isCorrectInteractionLoaded) {
        return (
            <div className="min-h-screen bg-base-100 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center py-12">
                        <div className="loading loading-spinner loading-lg text-primary"></div>
                        <p className="mt-4 text-base-content/70">Loading interaction...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-100 flex flex-col">
            {/* Header */}
            <div className="bg-base-200 border-b border-base-300 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="breadcrumbs text-sm mb-2">
                        <ul>
                            <li><Link href="/stackivdocs">StackivDocs</Link></li>
                            <li><Link href={`/stackivdocs/${interactionId}`}>Interaction</Link></li>
                            <li>Chat</li>
                        </ul>
                    </div>
                    <h1 className="text-xl font-semibold flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Chat with Content
                    </h1>
                </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-hidden">
                <div className="max-w-4xl mx-auto h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Chat history loading */}
                        {chatHistoryLoading && (
                            <div className="flex justify-center">
                                <div className="flex items-center gap-2 text-base-content/70">
                                    <div className="loading loading-spinner loading-sm"></div>
                                    <span>Loading chat history...</span>
                                </div>
                            </div>
                        )}

                        {/* Chat history error */}
                        {chatHistoryError && (
                            <div className="flex justify-start">
                                <div className="max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg bg-error text-error-content">
                                    {chatHistoryError}
                                </div>
                            </div>
                        )}

                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${message.isUser
                                        ? 'bg-primary text-primary-content ml-auto'
                                        : 'bg-base-200 text-base-content'
                                        }`}
                                >
                                    <div className="whitespace-pre-wrap break-words">
                                        {message.isStreaming ? (
                                            <div>
                                                {currentStreamingMessage}
                                                <span className="inline-block w-1 h-4 bg-current ml-1 animate-pulse"></span>
                                            </div>
                                        ) : (
                                            message.content
                                        )}
                                    </div>
                                    <div className={`text-xs mt-1 opacity-70 ${message.isUser ? 'text-right' : 'text-left'}`}>
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {chatError && (
                            <div className="flex justify-start">
                                <div className="max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg bg-error text-error-content">
                                    {chatError}
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-base-200 border-t border-base-300 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask a question about your content..."
                                className="textarea textarea-bordered w-full min-h-[50px] max-h-32 resize-none"
                                disabled={isStreaming}
                                rows={1}
                                style={{
                                    height: 'auto',
                                    minHeight: '50px'
                                }}
                                onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = 'auto';
                                    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                                }}
                            />
                        </div>

                        {isStreaming ? (
                            <button
                                onClick={handleStopStreaming}
                                className="btn btn-square btn-error"
                                title="Stop generation"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h12v12H6z" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim()}
                                className="btn btn-square btn-primary"
                                title="Send message"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-center space-x-4 mt-4">
                        <Link href={`/stackivdocs/${interactionId}/summary`} className="btn btn-outline btn-sm">
                            View Summary
                        </Link>
                        <Link href={`/stackivdocs/${interactionId}/faq`} className="btn btn-outline btn-sm">
                            View FAQ
                        </Link>
                        <Link href={`/stackivdocs/${interactionId}`} className="btn btn-primary btn-sm">
                            Back to Interaction
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
