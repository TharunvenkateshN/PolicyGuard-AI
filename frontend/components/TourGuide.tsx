"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, CheckCircle, ShieldAlert, Zap, Globe, X, LayoutDashboard, FileText, Activity, Target as TargetIcon } from 'lucide-react';

const TOUR_STEPS = [
    {
        id: 1,
        route: '/dashboard',
        selector: 'h1',
        badge: "Overview • 1/14",
        title: "Mission Control",
        desc: "Welcome to the Command Center. This dashboard gives you a high-level view of your AI's compliance posture. All critical metrics are aggregated here.",
        icon: LayoutDashboard,
        color: "text-cyan-400",
        bg: "bg-cyan-500/10"
    },
    {
        id: 2,
        route: '/dashboard',
        selector: '#compliance-score-card',
        badge: "Overview • 2/14",
        title: "Compliance Score",
        desc: "Look at the 'Compliance Score' card. This is a real-time aggregate of your active policies vs. detected violations. A score below 80 triggers automatic alerts.",
        icon: Activity,
        color: "text-green-400",
        bg: "bg-green-500/10"
    },
    {
        id: 3,
        route: '/dashboard',
        selector: '#recent-evaluations-list',
        badge: "Overview • 3/14",
        title: "Recent Audits",
        desc: "The 'Recent Evaluations' panel shows the latest gatekeeper checks. Green means 'PASS', red means 'BLOCK'. You can audit every single agent interaction here.",
        icon: ShieldAlert,
        color: "text-red-400",
        bg: "bg-red-500/10",
        actionBtn: "Go to Policies"
    },
    {
        id: 4,
        route: '/dashboard/policies',
        selector: '#policy-upload-panel',
        badge: "Policies • 4/14",
        title: "Policy Library",
        desc: "This is where you define the rules. You can upload PDF documents or use templates. The AI parses these into executable guardrails.",
        icon: FileText,
        color: "text-blue-400",
        bg: "bg-blue-500/10"
    },
    {
        id: 5,
        route: '/dashboard/policies',
        selector: '#active-policies-list h3',
        badge: "Policies • 5/14",
        title: "Active Guardrails",
        desc: "These are your active rules. They are currently enforcing checks on every API call. You can toggle them on/off instantly.",
        icon: CheckCircle,
        color: "text-cyan-400",
        bg: "bg-cyan-500/10",
        actionBtn: "Next: Attack Phase"
    },
    {
        id: 6,
        route: '/dashboard/evaluate',
        selector: '#compliance-tab',
        badge: "Red Team • 6/14",
        title: "Adversarial Console",
        desc: "This engine simulates a malicious hacker attacking your agent. It uses 'Prompt Injection' and 'Jailbreak' techniques to find holes.",
        icon: ShieldAlert,
        color: "text-red-500",
        bg: "bg-red-500/10"
    },
    {
        id: 7,
        route: '/dashboard/evaluate',
        selector: '#red-team-tab',
        badge: "Red Team • 7/14",
        title: "Targeting Assets",
        desc: "Switch to the 'Red Team' tab to see our targeting console. From here, you can launch specific adversarial simulations against your models.",
        icon: Zap,
        color: "text-orange-400",
        bg: "bg-orange-500/10"
    },
    {
        id: 8,
        route: '/dashboard/evaluate',
        selector: '#initiate-attack-btn',
        badge: "Red Team • 8/14",
        title: "Running an Attack",
        desc: "Click 'INITIATE_ATTACK'. Watch as it probes for PII leaks and Toxic output. The results will appear in the scrollable console below.",
        icon: TargetIcon,
        color: "text-red-400",
        bg: "bg-red-500/10"
    },
    {
        id: 9,
        route: '/dashboard/evaluate',
        selector: '#remediation-panel',
        badge: "Remediation • 9/14",
        title: "Auto-Fix Engine",
        desc: "PolicyGuard doesn't just find bugs; it fixes them. It generates Python/Pydantic code to patch the specific holes found in your system.",
        icon: CheckCircle,
        color: "text-green-400",
        bg: "bg-green-500/10",
        actionBtn: "Next: Live Monitor"
    },
    {
        id: 10,
        route: '/dashboard/monitor',
        selector: '#topology-tab',
        badge: "Monitor • 10/14",
        title: "Live Data Topology",
        desc: "Welcome to the Visualizer. This 3D Graph shows your AI's brain in real-time. Blue squares are Policies, Purple circles are Data Assets.",
        icon: Globe,
        color: "text-blue-400",
        bg: "bg-blue-500/10"
    },
    {
        id: 11,
        route: '/dashboard/monitor',
        selector: '#compliance-graph-container',
        badge: "Monitor • 11/14",
        title: "Visualizing Risks",
        desc: "Red Diamonds represent Risks (e.g., PII Leak). Notice how they are visually isolated by the layout. This helps you spot threats instantly.",
        icon: TargetIcon,
        color: "text-red-400",
        bg: "bg-red-500/10"
    },
    {
        id: 12,
        route: '/dashboard/monitor',
        selector: '#audit-log-table',
        badge: "Monitor • 12/14",
        title: "Live Event Logs",
        desc: "The 'Audit Log Stream' records every single gatekeeper event. You can see timestamps, latency, and blocking reasons in real-time.",
        icon: Activity,
        color: "text-green-400",
        bg: "bg-green-500/10"
    },
    {
        id: 13,
        route: '/dashboard/sla',
        selector: '#sla-header',
        badge: "Predictive • 13/14",
        title: "SLA Designer AI",
        desc: "This is the 'Predictive' engine. It uses Gemini to forecast latency spikes, token costs, and uptime risks based on your configuration. It's essentially a simulator for your AI Production environment.",
        icon: Activity,
        color: "text-purple-400",
        bg: "bg-purple-500/10"
    },
    {
        id: 14,
        route: '/dashboard',
        selector: 'h1',
        badge: "Complete",
        title: "You are Certified!",
        desc: "You've toured the full lifecycle: Policy -> Attack -> Fix -> Monitor. Your AI Agent is now robust and secure.",
        icon: CheckCircle,
        color: "text-green-400",
        bg: "bg-green-500/10",
        actionBtn: "Finish Tour"
    }
];

export function TourGuide() {
    const [stepIndex, setStepIndex] = useState(-1);
    const router = useRouter();
    const pathname = usePathname();
    const [isHovered, setIsHovered] = useState(false);
    const [highlightElement, setHighlightElement] = useState<HTMLElement | null>(null);
    const highlightTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const tourActive = localStorage.getItem('pg_tour_active');
        if (tourActive === 'true') {
            setStepIndex(0);
        }
    }, []);

    // Handle Page Changes and Scrolling
    useEffect(() => {
        if (stepIndex >= 0 && stepIndex < TOUR_STEPS.length) {
            const step = TOUR_STEPS[stepIndex];

            // 1. Navigation Check
            if (pathname !== step.route) {
                router.push(step.route);
                setHighlightElement(null); // Clear highlight during transit
                return;
            }

            // 2. Highlighting & Scrolling with persistent retry
            const locateAndHighlight = () => {
                const el = document.querySelector(step.selector) as HTMLElement;
                if (el) {
                    if (step.selector.includes('tab') && el.getAttribute('aria-selected') === 'false') {
                        el.click();
                    }

                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setHighlightElement(el);
                } else {
                    highlightTimerRef.current = setTimeout(locateAndHighlight, 500);
                }
            };

            const timer = setTimeout(locateAndHighlight, 300);
            return () => {
                clearTimeout(timer);
                if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
            };
        } else {
            setHighlightElement(null);
        }
    }, [stepIndex, pathname, router]);

    const nextStep = () => {
        if (stepIndex < TOUR_STEPS.length - 1) {
            setStepIndex(prev => prev + 1);
        } else {
            endTour();
        }
    };

    const prevStep = () => {
        if (stepIndex > 0) {
            setStepIndex(prev => prev - 1);
        }
    };

    const endTour = () => {
        localStorage.removeItem('pg_tour_active');
        setHighlightElement(null); // Explicitly clear highlight
        setStepIndex(-1);
    };

    if (stepIndex === -1) return null;

    const currentStep = TOUR_STEPS[stepIndex];
    const Icon = currentStep.icon;

    return (
        <AnimatePresence mode="wait">
            {/* Spotlight Overlay */}
            {highlightElement && (
                <motion.div
                    key={`overlay-${currentStep.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[90] pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.3) 100%)'
                    }}
                />
            )}

            {/* Highlighting Pulse Box */}
            {highlightElement && (
                <HighlightBox key={`box-${currentStep.id}`} target={highlightElement} color={currentStep.color} />
            )}

            <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={`fixed z-[100] ${isHovered ? 'opacity-20' : 'opacity-100'} transition-opacity duration-300`}
                style={{
                    bottom: '2rem',
                    left: '2rem',
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="bg-[#0b101a] border border-blue-500/30 p-1 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] w-[380px] overflow-hidden">
                    {/* Header Bar */}
                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                        <span className={`text-[10px] font-mono uppercase tracking-widest ${currentStep.color} font-black`}>
                            {currentStep.badge}
                        </span>
                        <Button variant="ghost" size="icon" onClick={endTour} className="h-5 w-5 hover:text-white text-gray-500">
                            <X className="w-3 h-3" />
                        </Button>
                    </div>

                    <div className="p-6 relative">
                        {/* Content */}
                        <div className="flex items-start gap-4 mb-5">
                            <div className={`p-2.5 rounded-xl ${currentStep.bg} ${currentStep.color} shrink-0 shadow-lg`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg mb-1">{currentStep.title}</h3>
                                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                                    {currentStep.desc}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={prevStep}
                                disabled={stepIndex === 0}
                                className="text-gray-500 hover:text-white text-xs px-0"
                            >
                                <ArrowLeft className="w-3 h-3 mr-1" /> Back
                            </Button>

                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={nextStep}
                                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-8 px-5 rounded-full font-bold shadow-lg shadow-blue-500/20"
                                >
                                    {currentStep.actionBtn || "Next"} <ArrowRight className="w-3 h-3 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1 bg-gray-900 w-full mt-0">
                        <motion.div
                            className="h-full bg-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${((stepIndex + 1) / TOUR_STEPS.length) * 100}%` }}
                        />
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// Sub-component for the highlight box
function HighlightBox({ target, color }: { target: HTMLElement, color: string }) {
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

    useEffect(() => {
        const updateCoords = () => {
            const box = target.getBoundingClientRect();
            setCoords({
                top: box.top + window.scrollY,
                left: box.left + window.scrollX,
                width: box.width,
                height: box.height
            });
        };

        updateCoords();
        window.addEventListener('resize', updateCoords);
        window.addEventListener('scroll', updateCoords);
        return () => {
            window.removeEventListener('resize', updateCoords);
            window.removeEventListener('scroll', updateCoords);
        };
    }, [target]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute z-[95] pointer-events-none rounded-xl border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] bg-blue-500/5 mix-blend-screen"
            style={{
                top: coords.top - 8,
                left: coords.left - 8,
                width: coords.width + 16,
                height: coords.height + 16,
            }}
        >
            <div className="absolute inset-0 animate-ping border border-blue-400/30 rounded-xl" />
        </motion.div>
    );
}
