"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Shield, Stethoscope, Sparkles, CheckCircle2, AlertTriangle, Eye, Wrench, Check } from "lucide-react"
import { useAuth } from '@/hooks/useAuth';
import { SelfHealingModal } from '@/components/dashboard/SelfHealingModal'
import { IntegrationCodeModal } from '@/components/settings/IntegrationCodeModal'
import { toast } from 'sonner'

interface Trace {
    id: string;
    timestamp: string;
    agent: string;
    action: string;
    status: 'pass' | 'block' | 'warn';
    details: string;
}

interface MonitorData {
    traces_per_min: number;
    blocking_rate: number;
    active_policies: number;
    traces: Trace[];
}

export default function MonitorPage() {
    const { isJudge } = useAuth();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const [data, setData] = useState<MonitorData>({ traces_per_min: 0, blocking_rate: 0, active_policies: 0, traces: [] });
    const [selfHealingEnabled, setSelfHealingEnabled] = useState(false);
    const [showHealingModal, setShowHealingModal] = useState(false);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null);
    const [patchedPrompt, setPatchedPrompt] = useState('');
    const [healedViolations, setHealedViolations] = useState<Set<string>>(new Set());
    const [healingStatus, setHealingStatus] = useState<{
        active: boolean;
        agent: string;
        stage: 'analyzing' | 'patching' | 'verified' | 'idle';
        patchedPrompt?: string;
    }>({ active: false, agent: '', stage: 'idle' });

    useEffect(() => {
        checkSelfHealingStatus();

        // Load healed violations from localStorage
        const savedHealed = localStorage.getItem('pg_healed_violations');
        if (savedHealed) {
            try {
                const healedArray = JSON.parse(savedHealed);
                setHealedViolations(new Set(healedArray));
            } catch (e) {
                console.error('Failed to load healed violations:', e);
            }
        }
    }, []);

    const checkSelfHealingStatus = async () => {
        try {
            // 1. Check localStorage first for immediate UI update
            const savedConfig = localStorage.getItem('pg_stability_config');
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                if (config.selfHealingEnabled !== undefined) {
                    setSelfHealingEnabled(config.selfHealingEnabled);
                }
            }

            // 2. Verify with backend gatekeeper settings (source of truth)
            const res = await fetch(`${apiUrl}/api/v1/settings/gatekeeper`);
            if (res.ok) {
                const settings = await res.json();
                const enabled = settings.self_healing_enabled || false;
                setSelfHealingEnabled(enabled);

                // Update localStorage to stay in sync
                if (savedConfig) {
                    const config = JSON.parse(savedConfig);
                    config.selfHealingEnabled = enabled;
                    localStorage.setItem('pg_stability_config', JSON.stringify(config));
                }
            }
        } catch (error) {
            console.error('Failed to check self-healing status:', error);
        }
    };

    const handleHealClick = async (trace: Trace) => {
        if (!selfHealingEnabled) {
            setShowSetupModal(true);
            return;
        }

        setSelectedTrace(trace);

        // Generate patch
        try {
            const res = await fetch(`${apiUrl}/api/v1/self-healing/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent_id: 'stream-2',
                    current_prompt: 'You are a helpful assistant...', // TODO: Fetch actual prompt
                    violations: [trace.action]
                })
            });

            if (!res.ok) throw new Error('Failed to generate patch');

            const analysis = await res.json();
            setPatchedPrompt(analysis.patched_prompt);
            setShowHealingModal(true);
        } catch (error) {
            toast.error('Failed to generate patch: ' + (error as Error).message);
        }
    };

    const handleConfirmHealing = async () => {
        if (!selectedTrace) return;

        // Close modal and show progress card
        setShowHealingModal(false);
        setHealingStatus({ active: true, agent: selectedTrace.agent, stage: 'analyzing' });

        try {
            // Stage 1: Analyzing (simulate delay)
            await new Promise(resolve => setTimeout(resolve, 1500));
            setHealingStatus(prev => ({ ...prev, stage: 'patching' }));

            // Stage 2: Patching (simulate delay)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Get agent URL from settings
            const settingsRes = await fetch(`${apiUrl}/api/v1/settings/gatekeeper`);
            const settings = await settingsRes.json();
            const agentUrl = settings.stream2_url || 'http://localhost:8001';

            // Deploy patch
            const res = await fetch(`${apiUrl}/api/v1/self-healing/deploy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent_url: agentUrl,
                    patched_prompt: patchedPrompt,
                    healing_id: `HEAL-${Date.now()}`
                })
            });

            const result = await res.json();

            if (!result.success) {
                throw new Error(result.error || 'Deployment failed');
            }

            // Stage 3: Verified
            setHealingStatus({ active: true, agent: selectedTrace.agent, stage: 'verified', patchedPrompt });

            // Mark this violation as healed
            if (selectedTrace) {
                const newHealedSet = new Set(healedViolations).add(selectedTrace.id);
                setHealedViolations(newHealedSet);

                // Persist to localStorage
                localStorage.setItem('pg_healed_violations', JSON.stringify(Array.from(newHealedSet)));
            }

            toast.success('Self-healing completed successfully!');
            setSelectedTrace(null);
        } catch (error) {
            setHealingStatus({ active: false, agent: '', stage: 'idle' });
            throw error;
        }
    };

    useEffect(() => {
        const fetchMonitor = async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                const res = await fetch(`${apiUrl}/api/v1/dashboard/monitor`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (res.ok) {
                    const monitorData = await res.json();
                    setData(monitorData);
                    // Mock data logic removed to prevent confusion during real testing
                }
            } catch (err: any) {
                if (err.name === 'AbortError') {
                    console.error("Monitor fetch timed out");
                } else {
                    console.error(err);
                }
                // Mock data logic removed to prevent confusion during real testing
                // We want to see empty state if fetch fails, not fake data
            }
        };
        fetchMonitor();
        const interval = setInterval(fetchMonitor, 3000);
        return () => clearInterval(interval);
    }, [isJudge]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <Shield className="h-8 w-8 md:h-10 md:h-10 text-indigo-500" />
                        Safety Console (Stream 1)
                    </h1>
                    <p className="text-muted-foreground mt-2 text-base md:text-lg">
                        Real-time audit logs of every prompt intercepted by PolicyGuard.
                    </p>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Guardian Active</span>
                    </div>
                    {selfHealingEnabled && (
                        <Badge variant="default" className="bg-purple-600">
                            <Stethoscope className="w-3 h-3 mr-1" />
                            Self-Healing Active
                        </Badge>
                    )}
                </div>
            </div>

            {/* Self-Healing Setup Banner (if disabled) */}
            {!selfHealingEnabled && (
                <Card className="border-2 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-300">
                            <Sparkles className="w-5 h-5" />
                            Enable Self-Healing Lab
                        </CardTitle>
                        <CardDescription>
                            Autonomous self-healing is not enabled. Set up the integration to automatically patch vulnerabilities when they're detected.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => setShowSetupModal(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <Stethoscope className="w-4 h-4 mr-2" />
                            Setup Self-Healing
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Self-Healing Progress Card */}
            {healingStatus.active && (
                <Card className="border-2 border-emerald-500/30 bg-emerald-50/5 dark:bg-emerald-950/10 overflow-hidden animate-in zoom-in-95 duration-500">
                    <div className="p-4 bg-emerald-500/20 flex items-center justify-between border-b border-emerald-500/30">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-600" />
                            <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">Self-Healing Lab: Curative Remediation</h3>
                        </div>
                        <Badge variant="outline" className="bg-emerald-500 text-white border-none text-[10px] animate-pulse">HOT-PATCHING IN PROGRESS</Badge>
                    </div>
                    <CardContent className="p-5 space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { id: 'analyzing', label: 'ANALYZE DRIFT', icon: <Eye className="w-4 h-4" /> },
                                { id: 'patching', label: 'GEMINI PATCH', icon: <Wrench className="w-4 h-4" /> },
                                { id: 'verified', label: 'DEPLOY FIXED', icon: <Check className="w-4 h-4" /> }
                            ].map((step, i) => (
                                <div key={step.id} className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-500 ${healingStatus.stage === step.id ? 'border-emerald-500 bg-emerald-500/10 scale-105' :
                                    (i < ['analyzing', 'patching', 'verified', 'idle'].indexOf(healingStatus.stage) ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20 grayscale-0' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 grayscale opacity-50')
                                    }`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${healingStatus.stage === step.id ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
                                        {step.icon}
                                    </div>
                                    <span className="text-[10px] font-bold text-center leading-tight uppercase tracking-widest">{step.label}</span>
                                </div>
                            ))}
                        </div>

                        {healingStatus.stage === 'verified' && (
                            <div className="mt-4 animate-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Core Patch Successful</span>
                                        <span className="text-[10px] text-slate-500">Target: {healingStatus.agent} (System Prompt)</span>
                                    </div>
                                    <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setHealingStatus({ active: false, agent: '', stage: 'idle' })}>Dismiss</Button>
                                </div>
                                <div className="p-3 bg-slate-900 rounded-lg border border-emerald-500/30 overflow-hidden">
                                    <pre className="text-[10px] text-emerald-400 font-mono leading-relaxed max-h-[150px] overflow-y-auto whitespace-pre-wrap">
                                        {healingStatus.patchedPrompt}
                                    </pre>
                                </div>
                                <p className="text-[9px] text-slate-500 mt-2 italic font-medium">* This agent has been autonomously hardened against detected vulnerabilities.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card className="border-indigo-100 dark:border-indigo-900/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Live Traces / Min</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.traces_per_min}</div>
                    </CardContent>
                </Card>
                <Card className="border-indigo-100 dark:border-indigo-900/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Blocking Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${data.blocking_rate > 0 ? "text-red-500" : "text-green-500"}`}>
                            {data.blocking_rate}%
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-indigo-100 dark:border-indigo-900/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Active Policies</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-500">{data.active_policies}</div>
                    </CardContent>
                </Card>
            </div>

            <Card id="audit-log-stream" className="border-indigo-200 dark:border-indigo-900 shadow-sm">
                <CardHeader className="bg-gray-50/50 dark:bg-zinc-900/50">
                    <CardTitle className="text-base font-semibold">Audit Log Stream</CardTitle>
                    <CardDescription>All authorized and blocked interactions.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-zinc-800 dark:text-gray-400 border-b dark:border-zinc-700">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Timestamp</th>
                                    <th className="px-6 py-4 font-semibold">Trace ID</th>
                                    <th className="px-6 py-4 font-semibold">Agent</th>
                                    <th className="px-6 py-4 font-semibold">Action</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold">Details</th>
                                    <th className="px-6 py-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                                {data.traces.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <Activity className="w-6 h-6 text-gray-400 animate-pulse" />
                                                <span>Waiting for live traffic...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    data.traces.map((trace) => (
                                        <tr key={trace.id} className="bg-white dark:bg-zinc-950 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors animate-in fade-in slide-in-from-top-2 duration-300">
                                            <td className="px-6 py-4 font-mono text-gray-500 text-xs text-nowrap">
                                                {new Date(trace.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">{trace.id.substring(0, 8)}...</td>
                                            <td className="px-6 py-4 truncate max-w-[150px] font-medium" title={trace.agent}>{trace.agent}</td>
                                            <td className="px-6 py-4">{trace.action}</td>
                                            <td className="px-6 py-4">
                                                {trace.status === 'pass' && <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">PASS</Badge>}
                                                {trace.status === 'block' && <Badge variant="destructive" className="animate-pulse">BLOCKED</Badge>}
                                                {trace.status === 'warn' && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">WARN</Badge>}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 truncate max-w-xs text-xs">{trace.details}</td>
                                            <td className="px-6 py-4">
                                                {(trace.status === 'block' || trace.status === 'warn') && (
                                                    healedViolations.has(trace.id) ? (
                                                        <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100">
                                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                                            Healed
                                                        </Badge>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleHealClick(trace)}
                                                            className="gap-1 text-purple-600 border-purple-300 hover:bg-purple-50"
                                                        >
                                                            <Stethoscope className="w-3 h-3" />
                                                            Heal
                                                        </Button>
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Modals */}
            {selectedTrace && (
                <SelfHealingModal
                    open={showHealingModal}
                    onClose={() => {
                        setShowHealingModal(false);
                        setSelectedTrace(null);
                    }}
                    violation={{
                        type: selectedTrace.action,
                        agent: selectedTrace.agent,
                        details: selectedTrace.details
                    }}
                    patchedPrompt={patchedPrompt}
                    onConfirm={handleConfirmHealing}
                />
            )}

            <IntegrationCodeModal
                open={showSetupModal}
                onClose={() => setShowSetupModal(false)}
            />
        </div>
    )
}
