'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText, Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
    role: 'user' | 'model';
    content: string;
    citations?: string[];
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', content: "Hello! I am your Compliance Assistant. Ask me anything about your uploaded policies." }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user' as const, content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/v1/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.content,
                    history: messages.map(m => ({ role: m.role, content: m.content }))
                })
            });

            if (!response.ok) throw new Error('Network error');

            const data = await response.json();
            setMessages(prev => [...prev, {
                role: 'model',
                content: data.answer,
                citations: data.citations
            }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error connecting to the server. Please check if the backend is running." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] max-w-5xl mx-auto p-4">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center">
                    <Bot className="mr-2 h-6 w-6 text-blue-600" />
                    Compliance Assistant
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Chat with your policies using AI. Ask questions about rules, restrictions, and requirements.
                </p>
            </div>

            {/* Chat Container */}
            <div className="flex-1 bg-white dark:bg-zinc-900/50 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col overflow-hidden">

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "flex w-full",
                                msg.role === 'user' ? "justify-end" : "justify-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "flex max-w-[80%] rounded-lg px-4 py-3 text-sm shadow-sm",
                                    msg.role === 'user'
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                                )}
                            >
                                {/* Icon for AI */}
                                {msg.role === 'model' && (
                                    <Bot className="h-5 w-5 mr-3 mt-0.5 text-blue-600 shrink-0" />
                                )}

                                <div className="flex flex-col gap-2">
                                    <div className="whitespace-pre-wrap leading-relaxed">
                                        {msg.content}
                                    </div>

                                    {/* Citations */}
                                    {msg.citations && msg.citations.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-zinc-700/50">
                                            <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center">
                                                <Info className="h-3 w-3 mr-1" /> Sources:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {msg.citations.map((cit, cIdx) => (
                                                    <span key={cIdx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                        <FileText className="h-3 w-3 mr-1" />
                                                        {cit}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start w-full">
                            <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg px-4 py-3 flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                                <span className="text-sm text-gray-500">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
                    <form onSubmit={handleSend} className="relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question about your policies... (e.g., 'Can I store user data locally?')"
                            className="w-full bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 rounded-full pl-5 pr-12 py-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className={cn(
                                "absolute right-2 p-2 rounded-full transition-colors",
                                input.trim() && !loading
                                    ? "bg-blue-600 text-white hover:bg-blue-700"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-zinc-800"
                            )}
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </form>
                    <p className="text-center text-xs text-gray-400 mt-2">
                        AI can make mistakes. Please review critical compliance decisions.
                    </p>
                </div>
            </div>
        </div>
    );
}
