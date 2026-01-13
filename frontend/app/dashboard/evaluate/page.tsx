"use client"

import React, { useState } from 'react';
import { GuardrailTimeline, StepStatus } from '@/components/GuardrailTimeline';
import { ReadinessScorecard } from '@/components/ReadinessScorecard';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

export default function EvaluatePage() {
    const [evaluationStatus, setEvaluationStatus] = useState<'idle' | 'running' | 'done'>('idle');
    const [timelineSteps, setTimelineSteps] = useState([
        { id: 'ingest', label: 'Policy Context Load', status: 'pending' as StepStatus, description: 'Loading 14 active policies' },
        { id: 'intent', label: 'Workflow Analysis', status: 'pending' as StepStatus, description: 'Parsing workflow capabilities' },
        { id: 'simulate', label: 'Trace Simulation', status: 'pending' as StepStatus, description: 'Generating synthetic post-deployment traffic' },
        { id: 'conflict', label: 'Guardrail Checks', status: 'pending' as StepStatus, description: 'Gemini 3 Pro reasoning on traces' },
        { id: 'verdict', label: 'Compliance Verdict', status: 'pending' as StepStatus, description: 'Generating report' },
    ]);

    const [workflowInput, setWorkflowInput] = useState('');

    const [realResult, setRealResult] = useState<{
        verdict: 'PASS' | 'BLOCK' | 'WARN' | 'FAIL' | 'pass' | 'block' | 'warn' | 'fail',
        reasoning: string,
        violations: { policy_name: string, details: string, severity: string }[]
    } | null>(null);

    const handleRunEvaluation = async () => {
        setEvaluationStatus('running');
        setRealResult(null);

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
                body: JSON.stringify({ name: "Workflow", description: workflowInput })
            });

            if (!evalRes.ok) {
                const errorData = await evalRes.json();
                throw new Error(errorData.detail || "Evaluation Failed");
            }

            const result = await evalRes.json();

            updateStepStatus(3, 'completed');
            updateStepStatus(4, 'completed');
            setEvaluationStatus('done');

            // Map Valid Verdicts
            let finalVerdict: any = result.verdict;
            if (finalVerdict === 'FAIL') finalVerdict = 'block'; // Map backend FAIL to frontend block
            if (finalVerdict === 'WARN') finalVerdict = 'warn';
            if (finalVerdict === 'PASS') finalVerdict = 'pass';

            setRealResult({
                verdict: finalVerdict,
                reasoning: result.reasoning,
                violations: result.violations
            });

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
                        <h3 className="text-lg font-semibold mb-3">Workflow Specification</h3>
                        <textarea
                            className="w-full h-64 p-4 text-sm bg-gray-50 dark:bg-zinc-950 border rounded-md font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder={`Enter the AI Agent Workflow description here. 
Example:
{
  "name": "HR Assistant",
  "model": "gemini-1.5-pro",
  "capabilities": ["access_employee_data"],
  "restrictions": ["no_external_emails"]
}`}
                            value={workflowInput}
                            onChange={(e) => setWorkflowInput(e.target.value)}
                        />
                    </div>

                    {evaluationStatus === 'done' && realResult && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <ReadinessScorecard
                                overallStatus={realResult.verdict as any}
                                components={[
                                    {
                                        name: "Policy Compliance",
                                        status: realResult.verdict === 'pass' ? 'pass' : (realResult.verdict === 'warn' ? 'warn' : 'fail'),
                                        details: realResult.reasoning
                                    },
                                    ...realResult.violations.map(v => ({
                                        name: "Violation Detected",
                                        status: "fail" as const,
                                        details: v.details
                                    }))
                                ]}
                            />
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
