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
        selector: '#dashboard-title',
        badge: "Mission Control • 1/14",
        title: "Agent Governance Hub",
        desc: "Welcome, Officer. This is PolicyGuard AI—your unified control plane for autonomous agent governance. We ensure your AI fleet remains safe, ethical, and compliant.",
        icon: LayoutDashboard,
        color: "text-blue-400",
        bg: "bg-blue-500/10"
    },
    {
        id: 2,
        route: '/dashboard',
        selector: '#compliance-score-card',
        badge: "Mission Control • 2/14",
        title: "Compliance Sentinel",
        desc: "This is your most critical metric. The Compliance Score tracks aggregate risk across your entire organization. A drop here triggers automated intervention protocols.",
        icon: Activity,
        color: "text-green-400",
        bg: "bg-green-500/10"
    },
    {
        id: 3,
        route: '/dashboard',
        selector: '#ciso-view-toggle',
        badge: "Mission Control • 3/14",
        title: "Dual Operations Mode",
        desc: "Switch between CISO View for high-level regulatory risk and SRE View for live infrastructure and reliability telemetry. One platform, two mission-critical perspectives.",
        icon: LayoutDashboard,
        color: "text-indigo-400",
        bg: "bg-indigo-500/10"
    },
    {
        id: 4,
        route: '/dashboard',
        selector: '#coverage-map-card',
        badge: "Mission Control • 4/14",
        title: "Defense-in-Depth",
        desc: "The Coverage Map visualizes your active guardrail density across domains like Data Privacy, Ethical AI, and Prompt Security. No blind spots allowed.",
        icon: Globe,
        color: "text-cyan-400",
        bg: "bg-cyan-500/10",
        actionBtn: "Define Policies"
    },
    {
        id: 5,
        route: '/dashboard/policies',
        selector: '#policy-upload-panel',
        badge: "Governance • 5/14",
        title: "Policy Quantization",
        desc: "I will now simulate a policy upload. Loading 'Global AI Safety Standard (ISO-42001)'... Gemini 3 is parsing the PDF into vector embeddings.",
        icon: FileText,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        action: '#use-sample-policy-btn'
    },
    {
        id: 6,
        route: '/dashboard/policies',
        selector: '#active-policies-list',
        badge: "Governance • 6/14",
        title: "Active Guardrails",
        desc: "Done. The document is now a set of 12 executable guardrails. These inspect every token layer-by-layer. Powered by Gemini 3 Flash for sub-10ms latency.",
        icon: CheckCircle,
        color: "text-green-400",
        bg: "bg-green-500/10",
        actionBtn: "Start Audit"
    },
    {
        id: 7,
        route: '/dashboard/evaluate',
        selector: '#run-evaluation-btn',
        badge: "Forensics • 7/14",
        title: "High-Context Audit",
        desc: "Let's run a Forensic Audit on a 'Medical Claims Agent'. I'm starting the simulation now... Gemini is debating itself to find edge cases.",
        icon: Zap,
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        action: '#run-evaluation-btn'
    },
    {
        id: 8,
        route: '/dashboard/evaluate',
        selector: '#readiness-scorecard',
        badge: "Forensics • 8/14",
        title: "Cryptographic Proof",
        desc: "The verdict is in. We have a cryptographically verifiable proof of safety. This scorecard is the 'Green Light' (or Red Light) for production deployment.",
        icon: CheckCircle,
        color: "text-green-500",
        bg: "bg-green-500/10",
        actionBtn: "Attack Phase"
    },
    {
        id: 9,
        route: '/dashboard/redteam',
        selector: '#initiate-attack-btn',
        badge: "Adversarial • 9/14",
        title: "Red Team Lab",
        desc: "Initiating Adversarial Attack Protocol... My Red Team agents (powered by Gemini 3 Pro) are attempting 50+ jailbreak vectors.",
        icon: TargetIcon,
        color: "text-red-500",
        bg: "bg-red-500/10",
        actionBtn: "Auto-Remediate",
        action: '#initiate-attack-btn'
    },
    {
        id: 10,
        route: '/dashboard/remediate',
        selector: '#remediation-engine',
        badge: "Resilience • 10/14",
        title: "Auto-Fix Engine",
        desc: "Vulnerabilities found? No problem. Generating Python patches now... This code is ready to be merged into your repo.",
        icon: CheckCircle,
        color: "text-green-400",
        bg: "bg-green-500/10"
    },
    {
        id: 11,
        route: '/dashboard/remediate',
        selector: '#remediation-tabs',
        badge: "Resilience • 11/14",
        title: "Audit-Ready Artifacts",
        desc: "Download production-ready Python guardrails and rewritten PRDs. We close the loop from detection to implementation in a single click.",
        icon: FileText,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        actionBtn: "Live Monitoring"
    },
    {
        id: 12,
        route: '/dashboard/monitor',
        selector: '#audit-log-stream',
        badge: "Visibility • 12/14",
        title: "Operational Observability",
        desc: "Total transparency. Monitor every interaction across your agent fleet. Every block is tracked with sub-10ms latency for zero-impact security.",
        icon: Activity,
        color: "text-indigo-400",
        bg: "bg-indigo-500/10",
        actionBtn: "Predict Risks"
    },
    {
        id: 13,
        route: '/dashboard/sla',
        selector: '#gemini-risk-card',
        badge: "Intelligence • 13/14",
        title: "Predictive Guard",
        desc: "Finally, our predictive layer. We use real-time traffic simulations to forecast latency spikes and compliance breaches before they happen. Secure the future, today.",
        icon: Zap,
        color: "text-purple-400",
        bg: "bg-purple-500/10"
    },
    {
        id: 14,
        route: '/dashboard',
        selector: '#dashboard-title',
        badge: "Certified • 14/14",
        title: "Mission Accomplished",
        desc: "You've completed the full Governance Lifecycle. Your AI fleet is now robost, resilient, and ready for global scale. Build with confidence.",
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

    // Handle Page Changes, Scrolling, and AUTOMATION
    useEffect(() => {
        if (stepIndex >= 0 && stepIndex < TOUR_STEPS.length) {
            const step = TOUR_STEPS[stepIndex];

            // 1. Navigation Check
            const isMarketingPage = ['/', '/features', '/governance', '/pricing', '/team'].includes(pathname);
            if (pathname !== step.route && !isMarketingPage) {
                router.push(step.route);
                setHighlightElement(null); // Clear highlight during transit
                return;
            }

            // If on marketing page, don't try to highlight dash elements
            if (isMarketingPage && pathname !== step.route) {
                setHighlightElement(null);
                return;
            }

            // 2. Highlighting & Scrolling with persistent retry
            const locateAndHighlight = () => {
                const el = document.querySelector(step.selector) as HTMLElement;
                if (el) {
                    if (step.selector.includes('tab') && el.getAttribute('aria-selected') === 'false') {
                        el.click();
                    }

                    // AUTO-SCROLL TO RESULT
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setHighlightElement(el);

                    // 3. AUTOMATION ACTIONS (The "Self-Driving" Logic)
                    if (step.action) {
                        setTimeout(() => {
                            const actionTarget = document.querySelector(step.action!) as HTMLElement;
                            if (actionTarget) {
                                console.log(`Tour Guide: Executing auto-action on ${step.action}`);
                                actionTarget.click();
                            }
                        }, 1000); // Wait 1s after highlight to click
                    }

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

    const isMarketingPage = ['/', '/features', '/governance', '/pricing', '/team'].includes(pathname);
    if (stepIndex === -1 || isMarketingPage) return null;

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

        const timer = setTimeout(updateCoords, 100); // Slight delay for scroll to finish
        window.addEventListener('resize', updateCoords);
        window.addEventListener('scroll', updateCoords);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateCoords);
            window.removeEventListener('scroll', updateCoords);
        };
    }, [target]);

    const borderClass = color.includes('cyan') ? 'border-cyan-500' :
        color.includes('green') ? 'border-green-500' :
            color.includes('red') ? 'border-red-500' :
                color.includes('purple') ? 'border-purple-500' :
                    color.includes('orange') ? 'border-orange-500' : 'border-blue-500';

    const glowClass = borderClass.replace('border-', 'shadow-');

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-[95]">
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`absolute rounded-xl border-2 ${borderClass} shadow-[0_0_30px_rgba(59,130,246,0.3)] bg-transparent`}
                style={{
                    top: coords.top - 12,
                    left: coords.left - 12,
                    width: coords.width + 24,
                    height: coords.height + 24,
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
            >
                {/* Holographic Corners */}
                <div className={`absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 ${borderClass} rounded-tl-lg`} />
                <div className={`absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 ${borderClass} rounded-tr-lg`} />
                <div className={`absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 ${borderClass} rounded-bl-lg`} />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 ${borderClass} rounded-br-lg`} />

                {/* Scanning Light Effect */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent w-full h-[20%]"
                    animate={{
                        top: ['0%', '100%', '0%'],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />

                {/* Pulse Ring */}
                <div className={`absolute inset-0 animate-ping border border-white/20 rounded-xl opacity-50`} />
            </motion.div>
        </div>
    );
}
