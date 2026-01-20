"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench, FileText, Code, Copy, Lightbulb, Terminal, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Violation {
    policy_area: string;
    status: string;
    reason: string;
}

interface RemediationPanelProps {
    originalText: string;
    violations: Violation[];
    policySummary: string;
}

export function RemediationPanel({ originalText, violations, policySummary }: RemediationPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("detail");
    const [isFixing, setIsFixing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExplaining, setIsExplaining] = useState(false);

    const [remediatedDoc, setRemediatedDoc] = useState<string | null>(null);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [explanation, setExplanation] = useState<any | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState("Python");

    const serverUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const handleAutoRemediate = async () => {
        setIsOpen(true);
        if (!remediatedDoc && !isFixing) fixDoc();
        if (!generatedCode && !isGenerating) generateCode("Python");
        if (!explanation && !isExplaining) getExplanation();
    };

    const fixDoc = async () => {
        setIsFixing(true);
        try {
            const violationStrings = violations.map(v => `${v.policy_area}: ${v.reason}`);
            const res = await fetch(`${serverUrl}/api/v1/remediate/doc`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    original_text: originalText || "System Description",
                    violations: violationStrings
                })
            });
            const data = await res.json();
            setRemediatedDoc(data.remediated_text);
        } catch (e) { console.error(e); } finally { setIsFixing(false); }
    };

    const generateCode = async (language: string) => {
        setIsGenerating(true);
        setGeneratedCode(null);
        try {
            const res = await fetch(`${serverUrl}/api/v1/remediate/code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ policy_summary: policySummary, language: language })
            });
            const data = await res.json(); // Backend now returns safe text via clean_json_text
            setGeneratedCode(data.code);
        } catch (e) { console.error(e); } finally { setIsGenerating(false); }
    };

    const getExplanation = async () => {
        setIsExplaining(true);
        try {
            const violationStrings = violations.map(v => `${v.policy_area}: ${v.reason}`);
            const res = await fetch(`${serverUrl}/api/v1/remediate/explain`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    original_text: originalText || "System Description",
                    violations: violationStrings
                })
            });
            const data = await res.json();
            setExplanation(data);
        } catch (e) { console.error(e); } finally { setIsExplaining(false); }
    };

    if (!isOpen) {
        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 flex justify-center">
                <Button
                    size="lg"
                    onClick={handleAutoRemediate}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md transition-all duration-300 transform hover:scale-105"
                >
                    <Wrench className="w-5 h-5 mr-2" />
                    Auto-Remediate Violations
                </Button>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-12 space-y-6">
            <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg dark:bg-indigo-900/30">
                    <Wrench className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Remediation Engine</h2>
                    <p className="text-muted-foreground text-sm">Automated fixes and guardrails deployed.</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-2xl mb-6">
                    <TabsTrigger value="detail" className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Solution Strategy
                    </TabsTrigger>
                    <TabsTrigger value="doc" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Rewritten Spec
                    </TabsTrigger>
                    <TabsTrigger value="code" className="flex items-center gap-2">
                        <Terminal className="w-4 h-4" />
                        Guardrail Code
                    </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                    {/* EXPLANATION TAB */}
                    <TabsContent value="detail" key="detail">
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                            <Card className="border-l-4 border-l-yellow-500 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Lightbulb className="w-5 h-5 text-yellow-500" />
                                        Why is this blocked?
                                    </CardTitle>
                                    <CardDescription>Understanding the security risks and the applied fix.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isExplaining || !explanation ? (
                                        <div className="space-y-4 animate-pulse">
                                            <div className="h-4 bg-muted rounded w-3/4"></div>
                                            <div className="h-4 bg-muted rounded w-1/2"></div>
                                            <div className="h-20 bg-muted rounded"></div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
                                                <strong>Summary:</strong> {explanation.summary}
                                            </div>
                                            <div className="space-y-4">
                                                {explanation.risks_explained?.map((item: any, idx: number) => (
                                                    <div key={idx} className="border p-4 rounded-lg bg-card hover:bg-muted/5 transition-colors">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <AlertTriangle className="w-4 h-4 text-red-500" />
                                                            <h4 className="font-semibold text-sm">{item.violation}</h4>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mb-2">{item.why_it_matters}</p>
                                                        <div className="flex items-start gap-2 mt-2 text-sm text-green-600 dark:text-green-400">
                                                            <CheckCircle2 className="w-4 h-4 mt-0.5" />
                                                            <span><strong>Fix:</strong> {item.fix_strategy}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="bg-muted/50 p-6 rounded-lg border border-border/50">
                                                <h4 className="font-semibold text-base mb-4 flex items-center gap-2">
                                                    <Lightbulb className="w-4 h-4 text-indigo-500" />
                                                    Improvement Tips
                                                </h4>
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    {explanation.improvement_tips?.map((tip: string, i: number) => (
                                                        <div key={i} className="bg-card p-3 rounded border text-sm text-muted-foreground shadow-sm hover:shadow-md transition-all">
                                                            • {tip}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </TabsContent>

                    {/* DOCUMENT TAB */}
                    <TabsContent value="doc" key="doc">
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                            <Card className="border-indigo-100 dark:border-indigo-900/50 shadow-sm overflow-hidden">
                                <CardHeader className="bg-muted/30 pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-indigo-500" />
                                        Compliant PRD (Rewritten)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {isFixing ? (
                                        <div className="flex flex-col items-center justify-center p-12 space-y-4">
                                            <div className="h-4 w-4 bg-indigo-500 rounded-full animate-bounce"></div>
                                            <p className="text-sm text-muted-foreground animate-pulse">Rewriting document...</p>
                                        </div>
                                    ) : (
                                        <div className="bg-muted/10 p-6 min-h-[300px] text-sm overflow-auto max-h-[500px] font-mono leading-relaxed whitespace-pre-wrap">
                                            {remediatedDoc}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </TabsContent>

                    {/* CODE TAB */}
                    <TabsContent value="code" key="code">
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                            <Card className="border-indigo-100 dark:border-indigo-900/50 shadow-sm bg-black text-green-400">
                                <CardHeader className="border-b border-white/10 pb-3 flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Terminal className="w-5 h-5 text-green-500" />
                                        <span className="font-mono text-sm tracking-wider">GUARDRAIL_GENERATOR_V1.exe</span>
                                    </div>
                                    <div className="flex bg-white/10 rounded overflow-hidden p-1 gap-1">
                                        {["Python", "TypeScript", "Go", "Rust", "Java"].map((lang) => (
                                            <button
                                                key={lang}
                                                onClick={() => { setSelectedLanguage(lang); generateCode(lang); }}
                                                className={`px-3 py-1 text-xs font-mono transition-colors ${selectedLanguage === lang ? 'bg-green-500 text-black font-bold' : 'text-green-500/70 hover:text-green-400'}`}
                                            >
                                                {lang.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 relative group min-h-[400px]">
                                    {isGenerating ? (
                                        <div className="flex flex-col items-center justify-center p-12 space-y-4 h-full">
                                            <span className="font-mono text-green-500 animate-pulse">{`> Compiling ${selectedLanguage} safeguards...`}</span>
                                            <span className="font-mono text-green-500/50 text-xs">Processing logic blocks...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-4 right-4 h-8 w-8 text-green-500 hover:text-green-300 hover:bg-white/10 z-10"
                                                onClick={() => navigator.clipboard.writeText(generatedCode || "")}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <div className="h-[400px] w-full bg-black overflow-auto">
                                                <SyntaxHighlighter
                                                    language={selectedLanguage.toLowerCase()}
                                                    style={vscDarkPlus}
                                                    customStyle={{ margin: 0, padding: '1rem', height: '100%', fontSize: '0.9rem', backgroundColor: '#09090b' }}
                                                    showLineNumbers={true}
                                                    wrapLines={true}
                                                >
                                                    {generatedCode || "# Waiting for code generation..."}
                                                </SyntaxHighlighter>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </TabsContent>
                </AnimatePresence>
            </Tabs>
        </motion.div>
    );
}
