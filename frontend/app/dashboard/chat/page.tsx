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

        // Offline mode — respond with contextual AML guidance
        await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
        const q = userMsg.content.toLowerCase();
        let answer = '';
        if (q.includes('ctr') || q.includes('threshold') || q.includes('10000')) {
            answer = '**Rule AML-R01 — CTR Threshold (BSA §1010.310)**\n\nLexinel flags any single transaction exceeding **$10,000** for Currency Transaction Report (CTR) filing. This includes cash deposits, withdrawals, and wire transfers. The rule also catches split transactions (structuring) across accounts within a 24-hour window.';
        } else if (q.includes('structur') || q.includes('smurf')) {
            answer = '**Rule AML-R02 — Structuring / Smurfing (FATF Rec. 10)**\n\nLexinel detects when ≥3 transactions to the same beneficiary occur within 24 hours, each below $2,000. This pattern indicates deliberate structuring to avoid CTR thresholds — a federal offense under 31 U.S.C. § 5324.';
        } else if (q.includes('cross') || q.includes('border') || q.includes('international')) {
            answer = '**Rule AML-R03 — Cross-Border Transactions (FinCEN 103.29)**\n\nAny international wire transfer exceeding **$5,000** is flagged for enhanced due diligence. High-risk jurisdictions (RU, KY, CH, BVI, PH) trigger immediate alert regardless of amount.';
        } else if (q.includes('pii') || q.includes('privacy') || q.includes('gdpr') || q.includes('data')) {
            answer = '**Rule AML-R04 — PII Exposure Guard (GDPR Art. 5 + AMLD6)**\n\nLexinel verifies that all personally identifiable information (SSN, passport, email) is encrypted at rest in audit records. Unencrypted PII fields trigger an immediate compliance block and are flagged for remediation.';
        } else if (q.includes('tax') || q.includes('haven') || q.includes('offshore')) {
            answer = '**Rule AML-R05 — Tax Haven Routing (AMLD6 Art. 3(4))**\n\nTransactions routed through known tax havens (Cayman Islands, Switzerland, Luxembourg, BVI) exceeding **$3,000** are reviewed for potential layering. Lexinel checks SWIFT correspondent routes against the FATF high-risk jurisdiction list.';
        } else if (q.includes('sar') || q.includes('suspicious')) {
            answer = '**SAR Filing — Suspicious Activity Report**\n\nLexinel can auto-draft SARs for any violation scored CRITICAL. The draft includes: transaction ID, counterparties, amount, rule triggered, and Gemini-generated narrative. SAR filing requires human confirmation in the Violation Nexus.';
        } else {
            answer = `**Lexinel AML Compliance Assistant**\n\nI can answer questions about your active AML enforcement rules:\n\n• **AML-R01** — CTR threshold ($10,000+)\n• **AML-R02** — Structuring / smurfing detection\n• **AML-R03** — Cross-border transaction flags\n• **AML-R04** — PII encryption compliance\n• **AML-R05** — Tax haven jurisdiction routing\n\nYou can also ask about SAR filing, FATF recommendations, BSA requirements, or GDPR/AMLD6 obligations.`;
        }
        setMessages(prev => [...prev, { role: 'model', content: answer }]);
        setLoading(false);
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
