"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, MessageSquare, X, Minimize2, Loader2, Info, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface Message {
    role: "user" | "model";
    content: string;
    citations?: string[];
}

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "model",
            content:
                "Hello! I am your Policy Robot. Ask me anything about your compliance requirements.",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { role: "user" as const, content: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch("http://127.0.0.1:8000/api/v1/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMsg.content,
                    history: messages.map((m) => ({ role: m.role, content: m.content })),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "Network error");
            }

            const data = await response.json();
            setMessages((prev) => [
                ...prev,
                {
                    role: "model",
                    content: data.answer,
                    citations: data.citations,
                },
            ]);
        } catch (error: any) {
            console.error(error);
            setMessages((prev) => [
                ...prev,
                {
                    role: "model",
                    content:
                        error.message ||
                        "Sorry, I encountered an error connecting to the server.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-end pointer-events-auto">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="mb-4 w-[400px] h-[600px] max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-blue-600">
                            <div className="flex items-center text-white">
                                <Bot className="h-6 w-6 mr-2" />
                                <div>
                                    <h3 className="font-semibold text-sm">Policy Robot</h3>
                                    <p className="text-xs text-blue-100">Always here to help</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-white/20 rounded-full text-white transition-colors"
                                >
                                    <Minimize2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-white/20 rounded-full text-white transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "flex w-full",
                                        msg.role === "user" ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "flex max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                                            msg.role === "user"
                                                ? "bg-blue-600 text-white rounded-br-none"
                                                : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-100 dark:border-slate-700"
                                        )}
                                    >
                                        {msg.role === "model" && (
                                            <Bot className="h-5 w-5 mr-3 mt-0.5 text-blue-600 shrink-0" />
                                        )}
                                        <div className="flex flex-col gap-2">
                                            <div className="whitespace-pre-wrap leading-relaxed">
                                                {msg.content}
                                            </div>
                                            {/* Citations */}
                                            {msg.citations && msg.citations.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1 flex items-center">
                                                        <Info className="h-3 w-3 mr-1" /> Sources
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {msg.citations.map((cit, cIdx) => (
                                                            <span key={cIdx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
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
                                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 shadow-sm">
                                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                        <span className="text-sm text-slate-500">Processing...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                            <form onSubmit={handleSend} className="relative flex items-center">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask policy questions..."
                                    className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-full pl-4 pr-12 py-3 shadow-inner focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
                                    disabled={loading}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || loading}
                                    className={cn(
                                        "absolute right-2 p-2 rounded-full transition-all duration-200",
                                        input.trim() && !loading
                                            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:scale-105"
                                            : "bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800"
                                    )}
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300",
                    isOpen
                        ? "bg-slate-200 text-slate-600 rotate-90 dark:bg-slate-800 dark:text-slate-300"
                        : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/25 animate-bounce-subtle"
                )}
            >
                {isOpen ? (
                    <X className="h-6 w-6" />
                ) : (
                    <Bot className="h-8 w-8" />
                )}
            </motion.button>
        </div>
    );
}
