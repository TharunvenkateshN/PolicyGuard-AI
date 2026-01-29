"use client"

import React, { useState, useRef, useEffect } from 'react';
import { GuardrailTimeline, StepStatus } from '@/components/GuardrailTimeline';
import { ReadinessScorecard } from '@/components/ReadinessScorecard';
import { ComplianceReport } from '@/types/policy';
import { RemediationPanel } from '@/components/dashboard/RemediationPanel';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Play, FileText as FileIcon, ShieldCheck, CheckCircle, Activity, Target as TargetIcon, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Lock, Terminal, ShieldAlert, Shield, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast-context';
import { useRouter } from 'next/navigation';

export default function EvaluatePage() {
    const [evaluationStatus, setEvaluationStatus] = useState<'idle' | 'running' | 'done'>('idle');
    const [activeTab, setActiveTab] = useState("compliance");
    const toast = useToast();
    const router = useRouter();


    const [timelineSteps, setTimelineSteps] = useState([
        { id: 'ingest', label: 'Policy Verification', status: 'pending' as StepStatus, description: 'Checking authorized governance rules...' },
        { id: 'intent', label: 'Workflow Discovery', status: 'pending' as StepStatus, description: 'Extracting semantic behavior maps' },
        { id: 'simulate', label: 'Counterfactual Modeling', status: 'pending' as StepStatus, description: 'Simulating plausible failure modes' },
        { id: 'conflict', label: 'Semantic Risk Analysis', status: 'pending' as StepStatus, description: 'Gemini reasoning on policy edge cases' },
        { id: 'verdict', label: 'Forensic Snapshot', status: 'pending' as StepStatus, description: 'Hashing immutable audit report' },
    ]);

    // Initial Policy Check
    React.useEffect(() => {
        const checkPolicies = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout

                const res = await fetch(`${apiUrl}/api/v1/policies`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (res.ok) {
                    const policies = await res.json();
                    setTimelineSteps(prev => {
                        const newSteps = [...prev];
                        const activeCount = policies.filter((p: any) => p.is_active).length;
                        newSteps[0].description = `Ready with ${activeCount} active policies`;
                        return newSteps;
                    });
                }
            } catch (e: any) {
                if (e.name === 'AbortError') {
                    console.error("Evaluate policy check timed out after 120s");
                } else {
                    console.error("Failed to check policies", e);
                }
            }
        };
        checkPolicies();
    }, []);

    const resultsRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to results when done
    useEffect(() => {
        if (evaluationStatus === 'done' && resultsRef.current) {
            // Small timeout to ensure DOM render
            setTimeout(() => {
                resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [evaluationStatus]);

    const [workflowData, setWorkflowData] = useState({
        intent: { purpose: '', users: '' },
        data: { types: '' },
        decision: { output: '' },
        safeguards: { controls: '' },
        deployment: { region: '', scale: '' }
    });

    const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);



    const handleRunEvaluation = async () => {
        setEvaluationStatus('running');
        setComplianceReport(null);

        // Reset Steps
        setTimelineSteps(prev => prev.map(s => ({ ...s, status: 'pending' as StepStatus })));

        // Animate first few steps visually while we fetch
        updateStepStatus(0, 'processing');

        try {
            // 1. Fetch Policies (Verify context)
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const policiesRes = await fetch(`${apiUrl}/api/v1/policies`);
            const policies = await policiesRes.json();
            updateStepStatus(0, 'completed');

            // Dynamic Policy Count Update
            setTimelineSteps(prev => {
                const newSteps = [...prev];
                const activeCount = policies.filter((p: any) => p.is_active).length;
                newSteps[0].description = `Loading ${activeCount} active policies`;
                return newSteps;
            });

            updateStepStatus(1, 'processing');

            // 2. Parse Intent
            updateStepStatus(1, 'processing');
            updateStepStatus(1, 'completed');

            // 3. Simulate Traces
            updateStepStatus(2, 'processing');
            updateStepStatus(2, 'completed');
            updateStepStatus(3, 'processing');

            // 4. Call Real Evaluation API
            const evalRes = await fetch(`${apiUrl}/api/v1/evaluate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: "Workflow", description: JSON.stringify(workflowData, null, 2) })
            });

            if (!evalRes.ok) {
                const errorData = await evalRes.json();
                throw new Error(errorData.detail || "Evaluation Failed");
            }

            const result: ComplianceReport = await evalRes.json();

            updateStepStatus(3, 'completed');
            updateStepStatus(4, 'processing');

            // 5. Final Forensic Snapshot
            updateStepStatus(4, 'completed');

            setEvaluationStatus('done');
            setComplianceReport(result);

        } catch (error: any) {
            console.error(error);
            setEvaluationStatus('idle'); // Reset on error
            toast.error(error.message || "Evaluation Failed: Possible Backend Connection Error");
        }
    };

    const updateStepStatus = (index: number, status: StepStatus) => {
        setTimelineSteps(prev => {
            const newSteps = [...prev];
            if (newSteps[index]) newSteps[index].status = status;
            return newSteps;
        });
    }

    const [isAutoGenerateOn, setIsAutoGenerateOn] = useState(false);
    const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzingDoc(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const res = await fetch(`${apiUrl}/api/v1/analyze-workflow-doc`, {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setWorkflowData({
                    intent: {
                        purpose: data.intent?.purpose || '',
                        users: data.intent?.users || ''
                    },
                    data: {
                        types: data.data?.types || ''
                    },
                    decision: {
                        output: data.decision?.output || ''
                    },
                    safeguards: {
                        controls: data.safeguards?.controls || 'None detected'
                    },
                    deployment: {
                        region: data.deployment?.region || '',
                        scale: data.deployment?.scale || ''
                    }
                });
            } else {
                console.error("Analysis failed");
                const errorData = await res.json().catch(() => ({}));
                toast.error(errorData.detail || "Failed to analyze document. Please check the file format.");
            }
        } catch (error) {
            console.error("Error analyzing doc:", error);
            toast.error("Error uploading document.");
        } finally {
            setIsAnalyzingDoc(false);
        }
    };

    // State Persistence
    useEffect(() => {
        const savedState = sessionStorage.getItem('evaluate_state');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                if (parsed.status === 'done' && parsed.report) {
                    setWorkflowData(parsed.workflowData);
                    setComplianceReport(parsed.report);
                    setEvaluationStatus('done');
                    // fast-forward steps
                    setTimelineSteps(prev => prev.map(s => ({ ...s, status: 'completed' as StepStatus, description: 'Restored from session' })));
                    toast.success("Restored previous audit session");
                }
            } catch (e) {
                console.error("Failed to restore state", e);
            }
        }
    }, []);

    useEffect(() => {
        if (evaluationStatus === 'done' && complianceReport) {
            sessionStorage.setItem('evaluate_state', JSON.stringify({
                status: 'done',
                report: complianceReport,
                workflowData: workflowData
            }));
        }
    }, [evaluationStatus, complianceReport, workflowData]);

    const handleNewAudit = () => {
        sessionStorage.removeItem('evaluate_state');
        sessionStorage.removeItem('remediation-context');
        sessionStorage.removeItem('redteam-context');
        sessionStorage.removeItem('redteam-session');
        setEvaluationStatus('idle');
        setComplianceReport(null);
        setWorkflowData({
            intent: { purpose: '', users: '' },
            data: { types: '' },
            decision: { output: '' },
            safeguards: { controls: '' },
            deployment: { region: '', scale: '' }
        });
        setTimelineSteps(prev => prev.map(s => ({ ...s, status: 'pending' as StepStatus, description: s.id === 'ingest' ? s.description : 'Pending...' })));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleExportPDF = () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        window.open(`${apiUrl}/api/v1/evaluate/export/latest`, '_blank');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">

            <div className="w-full">
                <div className="mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 p-8 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between gap-8 flex-wrap lg:flex-nowrap">
                            <div className="flex items-center gap-5 flex-1 min-w-0">
                                <div className="p-4 bg-blue-600 rounded-xl shadow-md flex-shrink-0">
                                    <Shield className="w-8 h-8 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-3">
                                        Fiduciary Shield: High-Context Policy Reasoning
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-3 mb-3">
                                        <Badge variant="outline" className="text-sm bg-white/80 dark:bg-zinc-900/80 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300">
                                            Gemini 1.5 Pro
                                        </Badge>
                                        <Badge className="text-sm bg-blue-600 hover:bg-blue-700 text-white">
                                            ADVANCED_MODE
                                        </Badge>
                                    </div>
                                    <p className="text-base text-blue-700 dark:text-blue-300">
                                        Active Reasoning on policy edge cases
                                    </p>
                                </div>
                            </div>
                            <Button
                                id="run-evaluation-btn"
                                onClick={handleRunEvaluation}
                                disabled={evaluationStatus === 'running'}
                                size="lg"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all flex-shrink-0"
                            >
                                <Play className="w-5 h-5 mr-2" />
                                {evaluationStatus === 'running' ? 'Analyzing...' : 'Start Audit'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Timeline: Full Width */}
                <div className="mb-8">
                    <GuardrailTimeline steps={timelineSteps} />
                </div>

                {/* Workflow Input: Full Width */}
                <div className="mb-8">
                    <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Workflow Specification</h3>
                            <div className="flex items-center gap-4">
                                {evaluationStatus === 'done' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleNewAudit}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        Start New Audit
                                    </Button>
                                )}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">Auto-generate from docs</span>
                                    <Button
                                        variant={isAutoGenerateOn ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setIsAutoGenerateOn(!isAutoGenerateOn)}
                                        className={isAutoGenerateOn ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                                    >
                                        {isAutoGenerateOn ? "ON" : "OFF"}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* File Upload Zone */}
                        {isAutoGenerateOn && (
                            <div className="mb-6 p-6 border-2 border-dashed border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center transition-all">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-full shadow-sm">
                                        <FileIcon className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div className="font-medium text-blue-900 dark:text-blue-200">
                                        {isAnalyzingDoc ? "AI Analysis in progress..." : "Upload PRD or Architecture Doc"}
                                    </div>
                                    {!isAnalyzingDoc && (
                                        <>
                                            <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                                                We'll automatically extract intent, data flows, and safeguards.
                                            </p>
                                            <input
                                                type="file"
                                                className="hidden"
                                                id="doc-upload"
                                                accept=".pdf,.docx,.txt,.md"
                                                onChange={handleFileUpload}
                                            />
                                            <label htmlFor="doc-upload">
                                                <Button size="sm" variant="secondary" className="cursor-pointer" asChild>
                                                    <span>Select File</span>
                                                </Button>
                                            </label>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-6 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {/* 1. AI System Intent */}
                            <div className="space-y-4 p-4 border rounded-md bg-gray-50 dark:bg-zinc-950">
                                <h4 className="font-medium text-blue-600 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs">1</span>
                                    AI System Intent
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Purpose</Label>
                                        <input
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="e.g. Customer support chatbot"
                                            value={workflowData.intent.purpose}
                                            onChange={(e) => setWorkflowData(prev => ({ ...prev, intent: { ...prev.intent, purpose: e.target.value } }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Target Users</Label>
                                        <input
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="e.g. Banking customers"
                                            value={workflowData.intent.users}
                                            onChange={(e) => setWorkflowData(prev => ({ ...prev, intent: { ...prev.intent, users: e.target.value } }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 2. Data Interaction */}
                            <div className="space-y-4 p-4 border rounded-md bg-gray-50 dark:bg-zinc-950">
                                <h4 className="font-medium text-blue-600 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs">2</span>
                                    Data Interaction
                                </h4>
                                <div className="space-y-2">
                                    <Label>Data Types & Sensitivity</Label>
                                    <textarea
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="What data does it touch? (e.g. PII, Financial data, Health records)"
                                        value={workflowData.data.types}
                                        onChange={(e) => setWorkflowData(prev => ({ ...prev, data: { ...prev.data, types: e.target.value } }))}
                                    />
                                </div>
                            </div>

                            {/* 3. Decision & Output */}
                            <div className="space-y-4 p-4 border rounded-md bg-gray-50 dark:bg-zinc-950">
                                <h4 className="font-medium text-blue-600 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs">3</span>
                                    Decision & Output Behavior
                                </h4>
                                <div className="space-y-2">
                                    <Label>Output Type & Impact</Label>
                                    <textarea
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="What does it output? (e.g. Financial advice, Loan approval decision)"
                                        value={workflowData.decision.output}
                                        onChange={(e) => setWorkflowData(prev => ({ ...prev, decision: { ...prev.decision, output: e.target.value } }))}
                                    />
                                </div>
                            </div>

                            {/* 4. Safeguards */}
                            <div className="space-y-4 p-4 border rounded-md bg-gray-50 dark:bg-zinc-950">
                                <h4 className="font-medium text-blue-600 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs">4</span>
                                    Existing Safeguards
                                </h4>
                                <div className="space-y-2">
                                    <Label>Controls</Label>
                                    <input
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="e.g. Content filtering, Human-in-the-loop"
                                        value={workflowData.safeguards.controls}
                                        onChange={(e) => setWorkflowData(prev => ({ ...prev, safeguards: { ...prev.safeguards, controls: e.target.value } }))}
                                    />
                                </div>
                            </div>

                            {/* 5. Deployment Environment */}
                            <div className="space-y-4 p-4 border rounded-md bg-gray-50 dark:bg-zinc-950">
                                <h4 className="font-medium text-blue-600 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs">5</span>
                                    Deployment Context
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Region</Label>
                                        <input
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="e.g. EU, India, Global"
                                            value={workflowData.deployment.region}
                                            onChange={(e) => setWorkflowData(prev => ({ ...prev, deployment: { ...prev.deployment, region: e.target.value } }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Scale</Label>
                                        <input
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="e.g. Internal pilot, Public beta"
                                            value={workflowData.deployment.scale}
                                            onChange={(e) => setWorkflowData(prev => ({ ...prev, deployment: { ...prev.deployment, scale: e.target.value } }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reasoning Trace (when running) */}
                {evaluationStatus === 'running' && (
                    <div className="mb-8">
                        <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 font-mono text-[10px] space-y-2 text-cyan-500 overflow-hidden shadow-2xl">
                            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 mb-2">
                                <Terminal className="w-3 h-3" />
                                <span className="uppercase tracking-widest font-bold">Reasoning_Trace_v2</span>
                            </div>
                            <div className="animate-pulse flex flex-col gap-1">
                                <p>&gt; Fetching active policy set...</p>
                                <p>&gt; Identifying semantic anchors in workflow...</p>
                                <p>&gt; Running cross-policy contradiction detection...</p>
                                <p className="text-white">&gt; Gemini reasoning on policy edge cases...</p>
                                <p className="text-zinc-600">&gt; [WAIT] Quantizing risk simulations...</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bottom Row: Full Width Results */}
                {evaluationStatus === 'done' && complianceReport && (
                    <div ref={resultsRef} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                                Compliance Evaluation Results
                            </h2>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleNewAudit} className="border-gray-200 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-zinc-800">
                                    Start New Audit
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleExportPDF} className="border-gray-200 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-zinc-800">
                                    <FileIcon className="mr-2 h-4 w-4" /> Download Certificate
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white shadow-lg font-semibold"
                                    onClick={() => {
                                        // Save context for Red Team Page
                                        const context = {
                                            report: complianceReport,
                                            timestamp: Date.now()
                                        };
                                        sessionStorage.setItem('redteam-context', JSON.stringify(context));
                                        router.push('/dashboard/redteam');
                                    }}
                                >
                                    <Flame className="w-4 h-4 mr-2" />
                                    Run Red Team Attack
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg font-semibold"
                                    onClick={() => {
                                        // Save context for Remediation Page
                                        const context = {
                                            violations: complianceReport.policy_matrix
                                                .map((p: any) => ({
                                                    policy_area: p.policy_area,
                                                    status: p.status,
                                                    reason: p.reason
                                                })),
                                            workflowName: workflowData.intent.purpose || "Workflow Specification",
                                            workflowDescription: JSON.stringify(workflowData, null, 2),
                                            policySummary: complianceReport.risk_assessment.breakdown ? JSON.stringify(complianceReport.risk_assessment.breakdown) : "Standard Enterprise Policy",
                                            report: complianceReport
                                        };
                                        sessionStorage.setItem('remediation-context', JSON.stringify(context));
                                        router.push('/dashboard/remediate?autoStart=true');
                                    }}
                                >
                                    <Wrench className="w-4 h-4 mr-2" />
                                    Auto-Remediate
                                </Button>
                            </div>
                        </div>
                        <div id="readiness-scorecard">
                            <ReadinessScorecard report={complianceReport} />
                        </div>


                    </div>
                )}

                {/* Focus Mode Overlay */}
                <AnimatePresence>
                    {evaluationStatus === 'running' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] bg-white/30 dark:bg-zinc-950/40 backdrop-blur-sm flex flex-col items-center justify-center p-4"
                        >
                            {(() => {
                                const activeStep = timelineSteps.find(s => s.status === 'processing') || timelineSteps.find(s => s.status === 'pending') || timelineSteps[timelineSteps.length - 1];

                                const getIcon = (id: string) => {
                                    switch (id) {
                                        case 'ingest': return <FileIcon className="w-20 h-20 text-blue-500" />;
                                        case 'intent': return <Activity className="w-20 h-20 text-indigo-500" />;
                                        case 'simulate': return <Play className="w-20 h-20 text-purple-500" />;
                                        case 'conflict': return <ShieldCheck className="w-20 h-20 text-amber-500" />;
                                        case 'verdict': return <CheckCircle className="w-20 h-20 text-green-500" />;
                                        default: return <Activity className="w-20 h-20 text-gray-400" />;
                                    }
                                };

                                return (
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeStep?.id}
                                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -20, scale: 0.9 }}
                                            transition={{ duration: 0.4, ease: "easeInOut" }}
                                            className="flex flex-col items-center text-center space-y-6"
                                        >
                                            <div className="p-8 bg-white dark:bg-zinc-900 rounded-full shadow-2xl border border-gray-100 dark:border-zinc-800 relative">
                                                <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                                                {getIcon(activeStep?.id || '')}
                                            </div>
                                            <div className="space-y-2">
                                                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                                    {activeStep?.label}
                                                </h2>
                                                <p className="text-lg text-gray-500 dark:text-gray-400 max-w-md">
                                                    {activeStep?.description}
                                                </p>
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                );
                            })()}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div >
    );
}

