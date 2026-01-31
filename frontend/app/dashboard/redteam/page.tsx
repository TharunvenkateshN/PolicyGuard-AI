"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, Play, CheckCircle, RotateCcw, Lock, Terminal, Target as TargetIcon, Activity, Flame, ShieldAlert } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-context";

// Types
interface AttackVector {
    name: string;
    category: string;
    method: string;
    likelihood: string;
    impact: string;
    severity_score: number;
    regulatory_violation?: string;
    pii_risk?: string;
    mitigation_suggestion: string;
}

interface RedTeamReport {
    system_profile_analyzed: string;
    overall_resilience_score: number;
    critical_finding?: string;
    attack_vectors: AttackVector[];
    resilience_score?: number; // Legacy/Fallback
    successful_breaches?: string[];
    recommendations?: string[];
}

export default function RedTeamPage() {
    const router = useRouter();
    const { addToast } = useToast();
    const consoleEndRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<any>(null); // The full compliance report context
    const [isLocked, setIsLocked] = useState(true);

    // Red Team State
    const [redTeamStatus, setRedTeamStatus] = useState<'idle' | 'attacking' | 'done'>('idle');
    const [redTeamLogs, setRedTeamLogs] = useState<string[]>([]);
    const [redTeamReport, setRedTeamReport] = useState<RedTeamReport | null>(null);
    const [isThreatModalOpen, setIsThreatModalOpen] = useState(false);

    // Load context on mount
    useEffect(() => {
        const contextStr = sessionStorage.getItem('redteam-context');
        if (contextStr) {
            try {
                const context = JSON.parse(contextStr);
                setReport(context.report);
                setIsLocked(false);

                // Restore previous red team session if available
                const savedSession = sessionStorage.getItem('redteam-session');
                if (savedSession) {
                    const session = JSON.parse(savedSession);
                    setRedTeamStatus(session.status);
                    setRedTeamLogs(session.logs);
                    setRedTeamReport(session.report);
                }
            } catch (e) {
                console.error("Failed to load context", e);
                setIsLocked(true);
            }
        } else {
            setIsLocked(true);
        }
        setLoading(false);
    }, []);

    // Auto-scroll logs
    useEffect(() => {
        if (consoleEndRef.current) {
            consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [redTeamLogs]);

    const handleRedTeamAttack = async () => {
        if (!report) {
            addToast("No system context found. Run an evaluation first.", "error");
            return;
        }

        setRedTeamStatus('attacking');
        setRedTeamLogs([]);
        setRedTeamReport(null);

        // Log Initial
        const addLog = (msg: string) => setRedTeamLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

        addLog("INITIALIZING_ADVERSARIAL_MATRIX...");
        addLog(`TARGET_DESIGNATED: ${report.system_spec?.agent_name || "UNKNOWN_SYSTEM"}`);
        addLog("LOADING_ATTACK_VECTORS: [Prompt Injection, Data Exfiltration, DoS, Social Engineering]...");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/redteam/attack`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_spec: report.system_spec,
                    policy_matrix: report.policy_matrix
                })
            });

            if (!res.ok) throw new Error("Attack simulation failed");

            // Stream logs
            const reader = res.body?.getReader();
            const decoder = new TextDecoder();

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n').filter(l => l.trim());

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.replace('data: ', ''));
                                if (data.log) addLog(data.log);
                                if (data.report) {
                                    setRedTeamReport(data.report);
                                    setRedTeamStatus('done');
                                    setIsThreatModalOpen(true);

                                    // Save session
                                    sessionStorage.setItem('redteam-session', JSON.stringify({
                                        status: 'done',
                                        logs: [...redTeamLogs, "ATTACK_COMPLETE", "REPORT_GENERATED"], // Approximate logs
                                        report: data.report
                                    }));
                                }
                            } catch (e) { console.error(e); }
                        }
                    }
                }
            }
        } catch (e) {
            addLog("CRITICAL_FAILURE: CONNECTION_LOST");
            setRedTeamStatus('idle');
            addToast("Attack simulation failed to complete", "error");
        }
    };

    if (loading) return <div className="p-8 text-center text-zinc-500 font-mono">LOADING_SECURITY_MODULE...</div>;

    if (isLocked) {
        return (
            <div className="max-w-6xl mx-auto min-h-[600px] flex flex-col items-center justify-center space-y-8 p-8 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 mt-8 relative overflow-hidden shadow-sm dark:shadow-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%] opacity-10 dark:opacity-20 pointer-events-none" />

                <div className="relative z-10">
                    <div className="absolute inset-0 bg-red-500/10 dark:bg-red-500/20 blur-xl rounded-full animate-pulse" />
                    <ShieldAlert className="w-24 h-24 text-slate-400 dark:text-slate-700 relative z-10" />
                    <Lock className="w-8 h-8 text-red-500 absolute bottom-0 right-0 z-20 bg-white dark:bg-slate-950 rounded-full p-2 border border-slate-200 dark:border-slate-800 box-content shadow-lg" />
                </div>

                <div className="text-center max-w-lg space-y-4 relative z-10">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-200 tracking-tight">Mission Locked</h2>
                    <p className="text-slate-600 dark:text-slate-500 leading-relaxed">
                        Adversarial simulations require a finalized Compliance Audit to generate a valid attack surface.
                        No target profile designated.
                    </p>
                </div>

                <Button
                    onClick={() => router.push('/dashboard/evaluate')}
                    className="relative z-10 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 font-bold px-8 py-6 rounded-full shadow-xl transition-transform hover:scale-105"
                >
                    <TargetIcon className="w-5 h-5 mr-2" />
                    Initialize Compliance Audit
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                        <Flame className="w-8 h-8 text-red-600" />
                        Red Team Lab
                    </h1>
                    <p className="text-zinc-500 mt-1 text-sm md:text-base">Stress-test your AI with automated attack vectors</p>
                </div>
                {redTeamStatus === 'done' && (
                    <Button
                        onClick={() => setIsThreatModalOpen(true)}
                        variant="outline"
                        className="w-full md:w-auto border-red-500/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                        <Activity className="w-4 h-4 mr-2" /> View Threat Profile
                    </Button>
                )}
            </div>

            {/* Custom Modal for Threat Profile */}
            <AnimatePresence>
                {isThreatModalOpen && redTeamReport && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setIsThreatModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-zinc-950 border border-red-500/30 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
                        >
                            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 shrink-0">
                                <h3 className="font-bold text-xl text-red-400 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    Threat Profile Analysis
                                </h3>
                                <button onClick={() => setIsThreatModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                                    ✕
                                </button>
                            </div>

                            <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                                {/* Score */}
                                <div className="flex flex-col items-center">
                                    <div className="relative w-40 h-40 flex items-center justify-center">
                                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                            <circle className="text-slate-800" strokeWidth="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                                            <circle
                                                className={`${redTeamReport.overall_resilience_score < 50 ? 'text-red-500' : 'text-yellow-500'}`}
                                                strokeWidth="8"
                                                strokeDasharray={251.2}
                                                strokeDashoffset={251.2 - (251.2 * redTeamReport.overall_resilience_score) / 100}
                                                strokeLinecap="round"
                                                stroke="currentColor"
                                                fill="transparent"
                                                r="40"
                                                cx="50"
                                                cy="50"
                                            />
                                        </svg>
                                        <div className="text-center">
                                            <div className={`text-4xl font-bold ${redTeamReport.overall_resilience_score < 50 ? 'text-red-500' : 'text-yellow-500'}`}>
                                                {redTeamReport.overall_resilience_score}
                                            </div>
                                            <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">Resilience</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                                        <div className="text-slate-500 text-xs uppercase tracking-wider mb-2">Vectors Detected</div>
                                        <div className="text-2xl font-mono text-white">{redTeamReport.attack_vectors?.length || 0}</div>
                                    </div>
                                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                                        <div className="text-slate-500 text-xs uppercase tracking-wider mb-2">Target Status</div>
                                        <div className="text-2xl font-mono text-red-400">
                                            {(redTeamReport.overall_resilience_score < 40) ? 'COMPROMISED' :
                                                (redTeamReport.overall_resilience_score < 70) ? 'AT_RISK' : 'SECURE'}
                                        </div>
                                    </div>
                                </div>

                                {redTeamReport.critical_finding && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        <div className="text-red-500 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                                            <ShieldAlert className="w-3 h-3" /> Critical Finding
                                        </div>
                                        <p className="text-red-200 text-sm font-mono">{redTeamReport.critical_finding}</p>
                                    </div>
                                )}


                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Console - Full Width */}
                <div className="lg:col-span-4">
                    <div className="p-6 bg-black text-green-400 rounded-xl border border-slate-800 font-mono shadow-xl relative overflow-hidden group min-h-[600px] flex flex-col">
                        {/* Decor effects */}
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent opacity-50" />
                        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent opacity-30" />

                        {/* Console Header */}
                        <div className="flex justify-between items-center mb-6 border-b border-slate-900 pb-4 relative z-10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                                <span className="font-bold tracking-widest text-lg text-slate-300">RED_TEAM_CONSOLE<span className="text-slate-600">_V2.0</span></span>
                            </div>

                            {redTeamStatus === 'idle' && (
                                <Button id="initiate-attack-btn" onClick={handleRedTeamAttack} className="bg-red-600 hover:bg-red-700 text-white font-bold border-0 shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all hover:scale-105">
                                    <Lock className="w-4 h-4 mr-2" /> INITIATE_ATTACK
                                </Button>
                            )}
                        </div>

                        {/* Logs Area */}
                        <div className="flex-1 overflow-y-auto font-mono text-sm relative z-10 space-y-1 pr-2 custom-scrollbar">
                            {!redTeamReport && redTeamStatus === 'idle' && (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-600 space-y-4 opacity-50">
                                    <TargetIcon className="w-24 h-24 stroke-1" />
                                    <div className="text-center">
                                        <p>AWAITING_TARGET_DESIGNATION...</p>
                                    </div>
                                </div>
                            )}

                            {redTeamLogs.map((log, i) => (
                                <div key={i} className="break-all border-l-2 border-transparent hover:border-green-500/50 pl-2 hover:bg-green-500/5 transition-colors">
                                    <span className="mr-2 opacity-50">&gt;</span>
                                    {log}
                                </div>
                            ))}
                            <div ref={consoleEndRef} />
                        </div>

                        {/* Detailed Analysis Section - Inside Console */}
                        {redTeamReport && (
                            <div className="border-t border-slate-800 bg-slate-900/30 p-6 space-y-6">
                                {/* Target Context */}
                                <div className="space-y-2">
                                    <h4 className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                                        <TargetIcon className="w-4 h-4 text-indigo-500" />
                                        Target Profiling Context
                                    </h4>
                                    <p className="text-sm text-slate-300 leading-relaxed font-mono bg-black/40 p-4 rounded border border-slate-700/50">
                                        {redTeamReport.system_profile_analyzed}
                                    </p>
                                </div>

                                {/* Detailed Vectors */}
                                <div className="space-y-2">
                                    <h4 className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                                        <ShieldAlert className="w-4 h-4 text-red-500" />
                                        Advanced Attack Vectors
                                    </h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        {redTeamReport.attack_vectors?.map((vector, i) => (
                                            <div key={i} className="bg-black/40 border border-slate-800 hover:border-red-500/30 transition-colors rounded-lg p-3 group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="text-base font-bold text-slate-200 group-hover:text-red-400 transition-colors">{vector.name}</div>
                                                        <div className="text-xs text-slate-400">{vector.category}</div>
                                                    </div>
                                                    <Badge className={`${vector.severity_score > 70 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'} border text-xs h-6 px-2`}>
                                                        {vector.severity_score} CVSS
                                                    </Badge>
                                                </div>

                                                <div className="text-sm text-slate-300 bg-slate-900/80 p-3 rounded border border-slate-700/50 font-mono italic mb-4">
                                                    "{vector.method}"
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                                                    <div>
                                                        <span className="text-slate-500 uppercase tracking-wider mr-2 font-semibold">Likelihood:</span>
                                                        <span className="font-bold text-slate-200">{vector.likelihood}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 uppercase tracking-wider mr-2 font-semibold">Impact:</span>
                                                        <span className="font-bold text-slate-200">{vector.impact}</span>
                                                    </div>
                                                </div>

                                                <div className="pt-3 border-t border-slate-800">
                                                    <div className="text-green-400 text-xs font-bold mb-2 flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4" /> Mitigation Strategy
                                                    </div>
                                                    <p className="text-sm text-slate-300 leading-relaxed">{vector.mitigation_suggestion}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}
