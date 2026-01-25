"use client"

import React, { useState, useRef, useEffect } from 'react';
import { GuardrailTimeline, StepStatus } from '@/components/GuardrailTimeline';
import { ReadinessScorecard, ComplianceReport } from '@/components/ReadinessScorecard';
import { RemediationPanel } from '@/components/dashboard/RemediationPanel';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Play, FileText as FileIcon, ShieldCheck, CheckCircle, Activity, Target as TargetIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Lock, Terminal, ShieldAlert } from 'lucide-react';

export default function EvaluatePage() {
    const [evaluationStatus, setEvaluationStatus] = useState<'idle' | 'running' | 'done'>('idle');
    const [activeTab, setActiveTab] = useState("compliance");

    // UI State for Red Team
    const [isThreatModalOpen, setIsThreatModalOpen] = useState(false);

    // ... (keep usage of timelineSteps)

    // Red Team State
    const [redTeamStatus, setRedTeamStatus] = useState<'idle' | 'attacking' | 'done'>('idle');
    const [redTeamReport, setRedTeamReport] = useState<any>(null);

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
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                const res = await fetch(`${apiUrl}/api/v1/policies`);
                if (res.ok) {
                    const policies = await res.json();
                    setTimelineSteps(prev => {
                        const newSteps = [...prev];
                        const activeCount = policies.filter((p: any) => p.is_active).length;
                        newSteps[0].description = `Ready with ${activeCount} active policies`;
                        return newSteps;
                    });
                }
            } catch (e) {
                console.error("Failed to check policies", e);
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

    const handleRedTeamAttack = async () => {
        setRedTeamStatus('attacking');
        setRedTeamReport(null);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const res = await fetch(`${apiUrl}/api/v1/redteam/simulate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: "RedTeamTarget", description: JSON.stringify(workflowData, null, 2) })
            });
            if (res.ok) {
                const data = await res.json();
                setRedTeamReport(data);
                setRedTeamStatus('done');
            } else {
                alert("Attack Simulation Failed");
                setRedTeamStatus('idle');
            }
        } catch (e) {
            console.error(e);
            setRedTeamStatus('idle');
        }
    };

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

            // 2. Parse Intent (Mock delay for visual)
            await new Promise(r => setTimeout(r, 800));
            updateStepStatus(1, 'completed');
            updateStepStatus(2, 'processing');

            // 3. Simulate Traces
            await new Promise(r => setTimeout(r, 800));
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
            updateStepStatus(4, 'completed');
            setEvaluationStatus('done');
            setComplianceReport(result);

        } catch (error: any) {
            console.error(error);
            setEvaluationStatus('idle'); // Reset on error
            alert(error.message || "Evaluation Failed: Possible Backend Connection Error");
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
                alert("Failed to analyze document. Please try again.");
            }
        } catch (error) {
            console.error("Error analyzing doc:", error);
            alert("Error uploading document.");
        } finally {
            setIsAnalyzingDoc(false);
        }
    };

    const handleExportPDF = () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        window.open(`${apiUrl}/api/v1/evaluate/export/latest`, '_blank');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Demo Trigger Section */}
            <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border-4 border-blue-400">
                <div className="space-y-2">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Shield className="w-6 h-6 text-blue-200" />
                        Fiduciary Shield: Financial Decision Agents
                    </h2>
                    <p className="text-sm text-blue-100 max-w-xl">
                        PolicyGuard doesn't decide what to build—<strong>it proves what you knew before you built it.</strong> A pre-deployment forensic record for high-stakes financial agents.
                    </p>
                    <div className="flex gap-2 pt-1">
                        <Badge className="bg-blue-500/50 border-blue-300 text-[10px] uppercase">Indispensable Gemini Reasoning</Badge>
                        <Badge className="bg-blue-500/50 border-blue-300 text-[10px] uppercase">Cross-Policy Contradiction Detection</Badge>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="compliance" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger id="compliance-tab" value="compliance" className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" /> Compliance Audit
                    </TabsTrigger>
                    <TabsTrigger id="red-team-tab" value="redteam" className="flex items-center gap-2 data-[state=active]:bg-red-500 data-[state=active]:text-white">
                        <Terminal className="h-4 w-4" /> Red Team (Attack)
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="compliance">
                    <div className="flex justify-end mb-4">
                        <Button id="run-evaluation-btn" onClick={handleRunEvaluation} disabled={evaluationStatus === 'running'} size="lg">
                            <Play className="w-4 h-4 mr-2" />
                            {evaluationStatus === 'running' ? 'Analyzing...' : 'Start Analysis'}
                        </Button>
                    </div>

                    {/* Top Row: Input + Timeline */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
                        {/* Left: Input */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold">Workflow Specification</h3>
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

                        {/* Right: Timeline */}
                        <div className="lg:col-span-1">
                            <GuardrailTimeline steps={timelineSteps} />
                        </div>
                    </div>

                    {/* Bottom Row: Full Width Results */}
                    {evaluationStatus === 'done' && complianceReport && (
                        <div ref={resultsRef} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-full">
                            <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="font-semibold">Analysis Complete</span>
                                </div>
                                <Button variant="outline" onClick={handleExportPDF} className="border-green-200 hover:bg-green-100 dark:border-green-800 dark:hover:bg-green-900/30">
                                    <FileIcon className="mr-2 h-4 w-4" /> Download Certificate
                                </Button>
                            </div>
                            <div id="readiness-scorecard">
                                <ReadinessScorecard report={complianceReport} />
                            </div>

                            {/* Auto Remediation Interaction */}
                            {complianceReport.risk_assessment.overall_score > 0 && (
                                <div id="remediation-panel">
                                    <RemediationPanel
                                        originalText={JSON.stringify(workflowData, null, 2)}
                                        violations={complianceReport.policy_matrix
                                            .filter((p) => p.status !== "Compliant")
                                            .map((p) => ({
                                                policy_area: p.policy_area,
                                                status: p.status,
                                                reason: p.reason
                                            }))
                                        }
                                        policySummary={complianceReport.risk_assessment.breakdown ? JSON.stringify(complianceReport.risk_assessment.breakdown) : "Standard Enterprise Policy"}
                                        report={complianceReport}
                                    />
                                </div>
                            )}
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
                </TabsContent>

                <TabsContent value="redteam">
                    <div className="space-y-6 relative">
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
                                        className="bg-zinc-950 border border-red-500/30 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden"
                                    >
                                        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                                            <h3 className="font-bold text-xl text-red-400 flex items-center gap-2">
                                                <AlertTriangle className="w-5 h-5" />
                                                Threat Profile Analysis
                                            </h3>
                                            <button onClick={() => setIsThreatModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                                                ✕
                                            </button>
                                        </div>

                                        <div className="p-8 space-y-8">
                                            {/* Score */}
                                            <div className="flex flex-col items-center">
                                                <div className="relative w-40 h-40 flex items-center justify-center">
                                                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                                        <circle className="text-zinc-800" strokeWidth="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
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
                                                        <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Resilience</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                                                    <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Vectors Detected</div>
                                                    <div className="text-2xl font-mono text-white">{redTeamReport.attack_vectors.length}</div>
                                                </div>
                                                <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                                                    <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Target Status</div>
                                                    <div className="text-2xl font-mono text-red-400">COMPROMISED</div>
                                                </div>
                                            </div>

                                            <div className="bg-zinc-900/30 p-4 rounded-lg border border-zinc-800">
                                                <h4 className="text-sm font-semibold text-zinc-300 mb-2">Target Analysis</h4>
                                                <p className="text-sm text-zinc-400 leading-relaxed font-mono">
                                                    {redTeamReport.system_profile_analyzed}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Full Width Console */}
                        <div className="w-full">
                            <div className="p-6 bg-zinc-950 text-green-400 rounded-xl border border-zinc-800 font-mono shadow-2xl relative overflow-hidden group">
                                {/* Decor effects */}
                                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent opacity-50" />
                                <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent opacity-30" />

                                <div className="flex justify-between items-center mb-6 border-b border-zinc-900 pb-4 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                                        <span className="font-bold tracking-widest text-lg text-zinc-300">RED_TEAM_CONSOLE<span className="text-zinc-600">_V2.0</span></span>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {redTeamStatus === 'idle' && (
                                            <Button id="initiate-attack-btn" onClick={handleRedTeamAttack} className="bg-red-600 hover:bg-red-700 text-white font-bold border-0 shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all hover:scale-105">
                                                <Lock className="w-4 h-4 mr-2" /> INITIATE_ATTACK
                                            </Button>
                                        )}
                                        {redTeamStatus === 'done' && (
                                            <Button
                                                onClick={() => setIsThreatModalOpen(true)}
                                                variant="outline"
                                                className="border-red-500/50 text-red-400 hover:bg-red-950 hover:text-red-300"
                                            >
                                                <Activity className="w-4 h-4 mr-2" /> THREAT_PROFILE
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="min-h-[600px] font-mono text-sm relative z-10">
                                    {/* Scanlines */}
                                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%] opacity-20" />

                                    {!redTeamReport && redTeamStatus === 'idle' && (
                                        <div className="flex flex-col items-center justify-center h-[500px] text-zinc-600 space-y-4">
                                            <TargetIcon className="w-24 h-24 opacity-20 animate-pulse" />
                                            <div className="text-center">
                                                <p className="typing-effect">AWAITING_TARGET_DESIGNATION...</p>
                                                <p className="text-xs mt-2">Ready to deploy adversarial agents.</p>
                                            </div>
                                        </div>
                                    )}

                                    {redTeamStatus === 'attacking' && (
                                        <div className="p-8 space-y-2">
                                            <p className="text-green-500">{">"} Initializing attack vectors...</p>
                                            <p className="text-green-500/80">{">"} Probing endpoint vulnerabilities...</p>
                                            <p className="text-green-500/60">{">"} Attempting prompt injection...</p>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 2 }}
                                                className="h-1 bg-green-500 mt-4"
                                            />
                                        </div>
                                    )}

                                    {redTeamReport && (
                                        <div className="space-y-4 animate-in fade-in duration-500 p-4">
                                            <div className="flex items-center gap-2 text-red-400 mb-6">
                                                <span className="animate-ping w-2 h-2 bg-red-500 rounded-full inline-block" />
                                                <span>ATTACK_COMPLETE :: {redTeamReport.attack_vectors.length} VECTORS EXPLOITED</span>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="border-l-4 border-red-500 bg-red-500/5 p-4 pl-6">
                                                    <h4 className="font-bold text-red-400 mb-2 text-xs uppercase tracking-widest">Critical Finding</h4>
                                                    <p className="text-zinc-300 text-lg md:text-xl font-light">{redTeamReport.critical_finding}</p>
                                                </div>

                                                <div className="space-y-3 mt-4">
                                                    {redTeamReport.attack_vectors.map((attack: any, i: number) => (
                                                        <div key={i} className="group border border-zinc-800 bg-zinc-900/30 p-4 rounded hover:border-green-500/30 hover:bg-zinc-900/80 transition-all duration-300">
                                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                                                <span className="font-bold text-green-400 flex items-center gap-2">
                                                                    <span className="text-zinc-600">[{i.toString().padStart(2, '0')}]</span>
                                                                    {attack.name}
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-400">{attack.category}</span>
                                                                    <span className={`text-xs px-2 py-1 rounded border font-bold ${attack.severity_score > 80 ? 'border-red-900 text-red-500 bg-red-950/30' : 'border-yellow-900 text-yellow-500 bg-yellow-950/30'
                                                                        }`}>
                                                                        SEV: {attack.severity_score}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="pl-0 md:pl-8 space-y-4">
                                                                <p className="text-sm text-zinc-400"><span className="text-zinc-600 font-bold">{">"} METHOD:</span> {attack.method}</p>

                                                                <div className="flex flex-wrap gap-3">
                                                                    {attack.regulatory_violation && (
                                                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-md">
                                                                            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                                                                            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-tight">Policy: {attack.regulatory_violation}</span>
                                                                        </div>
                                                                    )}
                                                                    {attack.pii_risk && (
                                                                        <div className={`flex items-center gap-1.5 px-3 py-1 ${attack.pii_risk === 'High' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'} border rounded-md`}>
                                                                            <Lock className="w-3.5 h-3.5" />
                                                                            <span className="text-[10px] font-bold uppercase tracking-tight">PII RISK: {attack.pii_risk}</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="text-xs text-cyan-400/80 mt-2 flex items-start gap-2 bg-cyan-950/20 p-2 rounded border border-cyan-500/10">
                                                                    <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-500" />
                                                                    <span><span className="font-bold text-cyan-500">MITIGATION:</span> {attack.mitigation_suggestion}</span>
                                                                </div>
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
                    </div>
                </TabsContent>
            </Tabs>
        </div >
    );
}

