"use client"

import React, { useState } from 'react';
import { GuardrailTimeline, StepStatus } from '@/components/GuardrailTimeline';
import { ReadinessScorecard, ComplianceReport } from '@/components/ReadinessScorecard';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Play, FileText as FileIcon } from 'lucide-react';

export default function EvaluatePage() {
    const [evaluationStatus, setEvaluationStatus] = useState<'idle' | 'running' | 'done'>('idle');
    const [timelineSteps, setTimelineSteps] = useState([
        { id: 'ingest', label: 'Policy Context Load', status: 'pending' as StepStatus, description: 'Checking active policies...' },
        { id: 'intent', label: 'Workflow Analysis', status: 'pending' as StepStatus, description: 'Parsing workflow capabilities' },
        { id: 'simulate', label: 'Trace Simulation', status: 'pending' as StepStatus, description: 'Generating synthetic post-deployment traffic' },
        { id: 'conflict', label: 'Guardrail Checks', status: 'pending' as StepStatus, description: 'Gemini 3 Pro reasoning on traces' },
        { id: 'verdict', label: 'Compliance Verdict', status: 'pending' as StepStatus, description: 'Generating report' },
    ]);

    // Initial Policy Check
    React.useEffect(() => {
        const checkPolicies = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/v1/policies');
                if (res.ok) {
                    const policies = await res.json();
                    setTimelineSteps(prev => {
                        const newSteps = [...prev];
                        newSteps[0].description = `Ready with ${policies.length} active policies`;
                        return newSteps;
                    });
                }
            } catch (e) {
                console.error("Failed to check policies", e);
            }
        };
        checkPolicies();
    }, []);

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
            const policiesRes = await fetch('http://localhost:8000/api/v1/policies');
            const policies = await policiesRes.json();
            updateStepStatus(0, 'completed');

            // Dynamic Policy Count Update
            setTimelineSteps(prev => {
                const newSteps = [...prev];
                newSteps[0].description = `Loading ${policies.length} active policies`;
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
            const evalRes = await fetch('http://localhost:8000/api/v1/evaluate', {
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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzingDoc(true);
        // Simulate AI Parsing
        setTimeout(() => {
            setWorkflowData({
                intent: {
                    purpose: 'Automated mortgage approval agent for retail banking',
                    users: 'Public applicants seeking home loans'
                },
                data: {
                    types: 'Credit scores, Income statements, Tax returns, PII (SSN, Address)'
                },
                decision: {
                    output: 'Final loan approval/rejection decision without human review'
                },
                safeguards: {
                    controls: 'None currently configured'
                },
                deployment: {
                    region: 'Global (including EU/GDPR zones)',
                    scale: 'Full public launch'
                }
            });
            setIsAnalyzingDoc(false);
        }, 1500);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Workflow Evaluation</h1>
                    <p className="text-gray-500 dark:text-gray-400">Test AI agents against guardrails before deployment.</p>
                </div>
                <Button onClick={handleRunEvaluation} disabled={evaluationStatus === 'running'} size="lg">
                    <Play className="w-4 h-4 mr-2" />
                    {evaluationStatus === 'running' ? 'Analyzing...' : 'Start Analysis'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Input */}
                <div className="lg:col-span-2 space-y-6">
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

                    {evaluationStatus === 'done' && complianceReport && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <ReadinessScorecard report={complianceReport} />
                        </div>
                    )}
                </div>

                {/* Right: Timeline */}
                <div className="lg:col-span-1">
                    <GuardrailTimeline steps={timelineSteps} />
                </div>
            </div>
        </div>
    );
}
