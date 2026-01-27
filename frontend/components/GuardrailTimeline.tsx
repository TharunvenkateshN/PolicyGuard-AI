import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

// Custom SVG Icons matching reference design
const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
    </svg>
);

const ClipboardIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M9 12l2 2 4-4" />
    </svg>
);

const RefreshIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2v6h-6" />
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
        <path d="M3 22v-6h6" />
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
);

const ShieldIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const DocumentIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </svg>
);

const ActivityIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
);

export function GuardrailTimeline({ steps }: GuardrailTimelineProps) {
    const getIcon = (step: TimelineStep) => {
        switch (step.id) {
            case 'ingest': return <SearchIcon />;
            case 'intent': return <ClipboardIcon />;
            case 'simulate': return <RefreshIcon />;
            case 'conflict': return <ShieldIcon />;
            case 'verdict': return <DocumentIcon />;
            default: return <SearchIcon />;
        }
    };

    const getStepColor = (stepId: string) => {
        switch (stepId) {
            case 'ingest': return 'bg-blue-500 text-white';
            case 'intent': return 'bg-green-500 text-white';
            case 'simulate': return 'bg-purple-500 text-white';
            case 'conflict': return 'bg-yellow-500 text-white';
            case 'verdict': return 'bg-cyan-400 text-white';
            default: return 'bg-gray-400 text-white';
        }
    };

    const getColor = (status: StepStatus, stepId: string) => {
        // If processing, show animation with step color
        if (status === 'processing') {
            return `${getStepColor(stepId)} animate-pulse`;
        }
        // If failed, show red
        if (status === 'failed') {
            return 'bg-red-500 text-white';
        }
        // Otherwise use step-specific color
        return getStepColor(stepId);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <ActivityIcon />
                    Guardrail Evaluation Timeline
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Desktop: Horizontal layout */}
                <div className="hidden md:block">
                    <div className="flex items-start justify-between relative">
                        {/* Connecting line */}
                        <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-200 dark:bg-zinc-800" style={{ width: 'calc(100% - 64px)', left: '32px' }} />

                        {steps.map((step, idx) => (
                            <div key={step.id} className="flex flex-col items-center flex-1 relative z-10">
                                {/* Icon */}
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 border-white dark:border-black ${getColor(step.status, step.id)} mb-3`}>
                                    {getIcon(step)}
                                </div>

                                {/* Label */}
                                <h4 className="text-sm font-semibold text-center mb-1">{step.label}</h4>

                                {/* Description */}
                                {step.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-[140px]">{step.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mobile: Vertical stack */}
                <div className="md:hidden space-y-4">
                    {steps.map((step, idx) => (
                        <div key={step.id} className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getColor(step.status, step.id)}`}>
                                {getIcon(step)}
                            </div>

                            <div className="flex-1 pt-2">
                                <h4 className="text-sm font-semibold mb-1">{step.label}</h4>
                                {step.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{step.description}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
