"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, X, Minimize2, Loader2, Info, FileText } from "lucide-react";
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
                "Hello! I'm the Lexinel Sentinel. Ask me anything about AML rules, compliance requirements, or violations.",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
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
                { role: "model", content: data.answer, citations: data.citations },
            ]);
        } catch (error: any) {
            // Graceful offline mode — AML-aware canned response
            const q = userMsg.content.toLowerCase();
            let reply = "I'm currently running in offline mode. For live AML analysis, ensure the Lexinel backend is running.";
            if (q.includes("ctr") || q.includes("threshold")) reply = "CTR (Currency Transaction Report) rules flag transactions exceeding $10,000 as per BSA §1010.310. Lexinel's AML-R01 handles this automatically.";
            else if (q.includes("structur")) reply = "Structuring (smurfing) is detected by AML-R02: ≥3 transactions under $2,000 within 24h that collectively exceed $10,000.";
            else if (q.includes("sar") || q.includes("suspicious")) reply = "SAR (Suspicious Activity Report) is filed when a violation is confirmed. Lexinel's Violation Nexus queues SAR drafts automatically.";
            else if (q.includes("pii")) reply = "AML-R04 flags unencrypted PII in audit logs, aligning with GDPR Art. 5 and BSA record-keeping requirements.";
            setMessages((prev) => [...prev, { role: "model", content: reply }]);
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
                        className="mb-4 w-[400px] h-[560px] max-h-[80vh] rounded-2xl flex flex-col overflow-hidden"
                        style={{
                            background: '#070c0a',
                            border: '1px solid rgba(26,255,140,0.18)',
                            boxShadow: '0 0 40px rgba(26,255,140,0.08), 0 20px 60px rgba(0,0,0,0.6)',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(26,255,140,0.12)]"
                            style={{ background: 'rgba(26,255,140,0.06)' }}>
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-lg" style={{ background: 'rgba(26,255,140,0.12)', boxShadow: '0 0 10px rgba(26,255,140,0.2)' }}>
                                    <Bot className="h-4 w-4 text-[#1aff8c]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-white tracking-wide">Lexinel Sentinel</h3>
                                    <p className="text-[10px] text-[rgba(26,255,140,0.5)] uppercase tracking-widest">AML Compliance Assistant</p>
                                </div>
                                <div className="flex items-center gap-1.5 ml-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#1aff8c] animate-pulse" />
                                    <span className="text-[9px] font-mono text-[#1aff8c]">LIVE</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-[rgba(26,255,140,0.1)] rounded-full text-[rgba(255,255,255,0.4)] hover:text-[#1aff8c] transition-colors">
                                    <Minimize2 className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-[rgba(26,255,140,0.1)] rounded-full text-[rgba(255,255,255,0.4)] hover:text-[#1aff8c] transition-colors">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: '#030806' }}>
                            {messages.map((msg, idx) => (
                                <div key={idx} className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}>
                                    <div className={cn(
                                        "flex max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                                        msg.role === "user"
                                            ? "rounded-br-none text-[#030806] font-medium"
                                            : "rounded-bl-none text-[rgba(255,255,255,0.85)]"
                                    )}
                                        style={msg.role === "user"
                                            ? { background: '#1aff8c', boxShadow: '0 0 16px rgba(26,255,140,0.25)' }
                                            : { background: '#0d1a12', border: '1px solid rgba(26,255,140,0.1)' }
                                        }>
                                        {msg.role === "model" && (
                                            <Bot className="h-4 w-4 mr-2.5 mt-0.5 text-[#1aff8c] shrink-0" />
                                        )}
                                        <div className="flex flex-col gap-2">
                                            <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                                            {msg.citations && msg.citations.length > 0 && (
                                                <div className="mt-1 pt-2 border-t border-[rgba(26,255,140,0.1)]">
                                                    <p className="text-[10px] uppercase tracking-wider font-bold text-[rgba(26,255,140,0.4)] mb-1 flex items-center">
                                                        <Info className="h-3 w-3 mr-1" />Sources
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {msg.citations.map((cit, cIdx) => (
                                                            <span key={cIdx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                                                                style={{ background: 'rgba(26,255,140,0.08)', color: '#1aff8c', border: '1px solid rgba(26,255,140,0.2)' }}>
                                                                <FileText className="h-3 w-3 mr-1" />{cit}
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
                                    <div className="rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2"
                                        style={{ background: '#0d1a12', border: '1px solid rgba(26,255,140,0.1)' }}>
                                        <Loader2 className="h-4 w-4 animate-spin text-[#1aff8c]" />
                                        <span className="text-sm text-[rgba(26,255,140,0.5)] font-mono text-xs">processing...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-[rgba(26,255,140,0.1)]" style={{ background: '#070c0a' }}>
                            <form onSubmit={handleSend} className="relative flex items-center">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about AML rules, violations..."
                                    className="w-full rounded-xl pl-4 pr-12 py-3 text-sm text-white outline-none transition-all font-mono"
                                    style={{
                                        background: '#0d1a12',
                                        border: '1px solid rgba(26,255,140,0.15)',
                                        caretColor: '#1aff8c',
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'rgba(26,255,140,0.4)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(26,255,140,0.15)'}
                                    disabled={loading}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || loading}
                                    className="absolute right-2 p-2 rounded-lg transition-all duration-200"
                                    style={input.trim() && !loading
                                        ? { background: '#1aff8c', boxShadow: '0 0 12px rgba(26,255,140,0.4)', color: '#030806' }
                                        : { background: 'rgba(26,255,140,0.05)', color: 'rgba(26,255,140,0.2)', cursor: 'not-allowed' }
                                    }>
                                    <Send className="h-4 w-4" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating trigger button */}
            <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setIsOpen(!isOpen)}
                className="h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300"
                style={isOpen
                    ? { background: '#0d1a12', border: '1px solid rgba(26,255,140,0.2)', color: '#1aff8c' }
                    : { background: '#1aff8c', boxShadow: '0 0 30px rgba(26,255,140,0.4)', color: '#030806' }
                }
            >
                {isOpen ? <X className="h-5 w-5" /> : <Bot className="h-7 w-7" />}
            </motion.button>
        </div>
    );
}
