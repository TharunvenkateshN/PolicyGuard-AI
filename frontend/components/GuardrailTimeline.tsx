import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, ShieldCheck, Search, AlertTriangle, PlayCircle } from 'lucide-react';

export type StepStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface TimelineStep {
    id: string;
    label: string;
    status: StepStatus;
    description?: string;
}

interface GuardrailTimelineProps {
    steps: TimelineStep[];
}

export function GuardrailTimeline({ steps }: GuardrailTimelineProps) {
    const getIcon = (step: TimelineStep) => {
        switch (step.id) {
            case 'ingest': return <Search className="w-4 h-4" />;
            case 'intent': return <Activity className="w-4 h-4" />;
            case 'conflict': return <AlertTriangle className="w-4 h-4" />;
            case 'verdict': return <ShieldCheck className="w-4 h-4" />;
            default: return <PlayCircle className="w-4 h-4" />;
        }
    };

    const getColor = (status: StepStatus) => {
        switch (status) {
            case 'completed': return 'bg-green-500 text-white';
            case 'processing': return 'bg-blue-500 text-white animate-pulse';
            case 'failed': return 'bg-red-500 text-white';
            default: return 'bg-gray-200 text-gray-400 dark:bg-zinc-800';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Guardrail Evaluation Timeline
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative pl-6 border-l-2 border-gray-100 dark:border-zinc-800 space-y-4 py-2">
                    {steps.map((step, idx) => (
                        <div key={step.id} className="relative">
                            {/* Dot */}
                            <div className={`absolute -left-[2.1rem] top-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white dark:border-black ${getColor(step.status)}`}>
                                {getIcon(step)}
                            </div>

                            <div className="pt-1">
                                <h4 className="text-sm font-semibold">{step.label}</h4>
                                {step.description && (
                                    <p className="text-xs text-gray-500">{step.description}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
