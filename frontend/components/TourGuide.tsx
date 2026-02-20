"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowRight, ArrowLeft, CheckCircle, ShieldAlert, Zap, Globe, X,
    LayoutDashboard, FileText, Activity, Target as TargetIcon,
    Shield, Server, Box, Wrench, Lightbulb, Brain, TrendingUp, Code2
} from 'lucide-react';

const TOUR_STEPS = [
    {
        id: 1,
        route: '/dashboard',
        selector: '#dashboard-title',
        badge: "Mission Control • 1/23",
        title: "Agent Governance Hub",
        desc: "Welcome to Lexinel. This is your unified control plane for autonomous agent governance. We ensure your AI fleet remains safe, ethical, and within regulatory boundaries.",
        icon: LayoutDashboard,
        color: "text-cyan-400",
        bg: "bg-cyan-500/10"
    },
    {
        id: 2,
        route: '/dashboard',
        selector: '#coverage-map-card', // NEW: Coverage Map
        badge: "Overview • 2/23",
        title: "Policy Coverage Map",
        desc: "Visualize your governance posture. The radar chart shows real-time alignment with key frameworks like GDPR, SOC2, and Ethical AI standards.",
        icon: Globe,
        color: "text-indigo-400",
        bg: "bg-indigo-500/10"
    },
    {
        id: 3,
        route: '/dashboard/policies',
        selector: '#active-policies-list',
        badge: "Governance • 3/23",
        title: "Active Guardrails",
        desc: "Every AI agent is governed by these live policies. This is where your organization's legal and safety requirements are translated into real-time enforcement rules.",
        icon: Shield,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        interactiveAction: {
            label: "Try Sample Policy",
            target: "#try-sample-policy-btn"
        }
    },
    {
        id: 4,
        route: '/dashboard',
        selector: '#tab-analytics',
        badge: "Telemetry • 4/23",
        title: "SRE Reliability Console",
        desc: "Monitor per-token latency, error rates, and throughput. Lexinel tracks the heartbeat of your distributed AI infrastructure to prevent performance degradation.",
        icon: Activity,
        color: "text-indigo-400",
        bg: "bg-indigo-500/10",
        action: '#tab-analytics'
    },
    {
        id: 5,
        route: '/dashboard/proxy',
        selector: '#stream-1-selector',
        badge: "Integration • 5/23",
        title: "Inline Interceptor (Stream 1 - Disconnected)",
        desc: "Stream 1 provides real-time, synchronous protection. It intercepts prompts and responses, blocking PII leaks and non-compliant content instantly.",
        icon: Zap,
        color: "text-cyan-400",
        bg: "bg-cyan-500/10",
        action: '#stream-1-selector'
    },
    {
        id: 6,
        route: '/dashboard/proxy',
        selector: '#proxy-wizard-step1-next', // NEW: Wizard Step 1
        badge: "Setup • 6/23",
        title: "Gateway Configuration",
        desc: "Assign a unique ID to your AI Gateway. This identifier tags all audit logs and telemetry, ensuring traceability across your fleet.",
        icon: Server,
        color: "text-indigo-400",
        bg: "bg-indigo-500/10",
        action: '#proxy-wizard-step1-next'
    },
    {
        id: 7,
        route: '/dashboard/proxy',
        selector: '#proxy-wizard-step2-next', // NEW: Wizard Step 2
        badge: "Setup • 7/23",
        title: "Integration Pattern",
        desc: "Select your stack. Lexinel generates drop-in SDK snippets for Python and Node.js to route traffic through the secure gateway.",
        icon: Code2,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        action: '#proxy-wizard-step2-next'
    },
    {
        id: 8,
        route: '/dashboard/proxy',
        selector: '#finalize-gatekeeper-btn',
        badge: "Integration • 8/23",
        title: "Zero-Trust Activation",
        desc: "Activating Stream 1 deploys our sub-10ms latency interceptor. Your agent is now protected by a cryptographic policy handshake for every interaction.",
        icon: Shield,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        action: '#finalize-gatekeeper-btn'
    },
    {
        id: 9,
        route: '/dashboard/proxy',
        selector: '#stream-2-selector',
        badge: "Reliability • 9/23",
        title: "SLA Stability (Stream 2)",
        desc: "Stream 2 focuses on long-term reliability. We ingest system heartbeats and model output logs to detect performance drift and ensure SLIs are maintained.",
        icon: Server,
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        action: '#stream-2-selector'
    },
    {
        id: 10,
        route: '/dashboard/evaluate',
        selector: '#run-evaluation-btn',
        badge: "Forensics • 10/23",
        title: "Deep Forensic Audit",
        desc: "Let's run a Deep Audit. Our Gemini-powered engine debates itself to find edge cases and hidden policy contradictions in your system spec.",
        icon: Zap,
        color: "text-orange-400",
        bg: "bg-orange-500/10",
        action: '#run-evaluation-btn',
        interactiveAction: {
            label: "Try Sample PRD",
            target: "#try-sample-prd-btn"
        },
        duration: 45000 // Large duration to wait for analysis
    },
    {
        id: 11,
        route: '/dashboard/evaluate',
        selector: '#readiness-scorecard',
        badge: "Analysis • 11/23",
        title: "Compliance Readiness Results",
        desc: "The audit is complete. Lexinel has generated a comprehensive scorecard mapping your agent's behavior against corporate policy and legal requirements.",
        icon: FileText,
        color: "text-green-500",
        bg: "bg-green-500/10"
    },
    {
        id: 12,
        route: '/dashboard/evaluate',
        selector: '#tab-executive',
        badge: "Analysis • 12/23",
        title: "Executive Summary",
        desc: "High-level verdict and categorical risk assessment. This tab provides a binary 'Go/No-Go' status for deployment based on legal reasoning.",
        icon: CheckCircle,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        action: '#tab-executive'
    },
    {
        id: 13,
        route: '/dashboard/evaluate',
        selector: '#section-risk',
        badge: "Analysis • 13/23",
        title: "Failure Class Simulation",
        desc: "We simulate catastrophic scenarios—from prompt injection to data exfiltration—and quantify the financial and reputational exposure for your business.",
        icon: ShieldAlert,
        color: "text-red-400",
        bg: "bg-red-500/10"
    },
    {
        id: 14,
        route: '/dashboard/evaluate',
        selector: '#tab-proof',
        badge: "Analysis • 14/23",
        title: "Remedy & Evidence Log",
        desc: "Transparency is key. This tab contains raw trace evidence snippets for every violation, alongside immutable cryptographic hashes for audit-readiness.",
        icon: FileText,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        action: '#tab-proof'
    },
    {
        id: 15,
        route: '/dashboard/remediate',
        selector: '#auto-remediate-btn',
        badge: "Resilience • 15/23",
        title: "Automated Patching",
        desc: "Vulnerabilities found? The Remediation Engine generates production-ready library code and rewritten system instructions to patch gaps instantly.",
        icon: Wrench,
        color: "text-cyan-500",
        bg: "bg-cyan-500/10",
        action: '#auto-remediate-btn',
        interactiveAction: {
            label: "Try Sample Remediate",
            target: "#try-sample-remediation-btn"
        },
        duration: 15000 // wait for remediation generation
    },
    {
        id: 16,
        route: '/dashboard/remediate',
        selector: '#remediation-tabs',
        badge: "Resilience • 16/23",
        title: "Explainable Remediation",
        desc: "Lexinel explains precisely HOW the fix solves the risk. We provide a logic graph and code-level walkthrough for the generated guardrails.",
        icon: Lightbulb,
        color: "text-indigo-400",
        bg: "bg-indigo-500/10"
    },
    {
        id: 17,
        route: '/dashboard/redteam',
        selector: '#initiate-attack-btn',
        badge: "Adversarial • 17/23",
        title: "Offensive Security Lab",
        desc: "Now we test. We launch 50+ adversarial attacks—including jailbreaks and prompt-probing—to see if the new guardrails hold under pressure.",
        icon: TargetIcon,
        color: "text-red-500",
        bg: "bg-red-500/10",
        action: '#initiate-attack-btn',
        interactiveAction: {
            label: "Try Sample Attack",
            target: "#try-sample-red-team-btn"
        },
        duration: 25000 // wait for red team attack simulation
    },
    {
        id: 18,
        route: '/dashboard/redteam',
        selector: '#red-team-logs',
        badge: "Adversarial • 18/23",
        title: "Real-time Attack Feed",
        desc: "Watch the 'Debate Protocol'. Our red-team engine attempts to bypass defenses while the Guardrail Interceptor blocks malicious intent in real-time.",
        icon: Activity,
        color: "text-orange-500",
        bg: "bg-orange-500/10"
    },
    {
        id: 19,
        route: '/dashboard/monitor',
        selector: '#audit-log-stream',
        badge: "Visibility • 19/23",
        title: "Live Safety Stream",
        desc: "Final visibility layer. Monitor the production interceptor as it executes PASS/BLOCK decisions on live traffic with 100% auditability.",
        icon: Activity,
        color: "text-indigo-500",
        bg: "bg-indigo-500/10"
    },
    {
        id: 20,
        route: '/dashboard/sla',
        selector: '#gemini-risk-card',
        badge: "Intelligence • 20/23",
        title: "Predictive SLA Monitoring",
        desc: "We look ahead. Gemini analyzes historical latency and throughput to forecast risk spikes and breaches before they impact your end-users.",
        icon: Brain,
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        interactiveAction: {
            label: "Try Sample SLA",
            target: "#try-sample-sla-btn"
        }
    },
    {
        id: 21,
        route: '/dashboard/sla',
        selector: '#risk-factors-section',
        badge: "Intelligence • 21/23",
        title: "Risk Factor Analysis",
        desc: "Lexinel identifies the causal drivers for SLA breaches—whether it's model versioning, prompt length, or geographic traffic spikes.",
        icon: Zap,
        color: "text-cyan-500",
        bg: "bg-cyan-500/10"
    },
    {
        id: 22,
        route: '/dashboard/sla',
        selector: '#forecast-section',
        badge: "Intelligence • 22/23",
        title: "Future Output Forecast",
        desc: "Projected latency and success rates for the next hour. This allows for proactive infrastructure scaling and model fallback strategies.",
        icon: TrendingUp,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10"
    },
    {
        id: 23,
        route: '/dashboard',
        selector: '#dashboard-title',
        badge: "Certified • 23/23",
        title: "Governance Mastery",
        desc: "Mission Accomplished. Your AI fleet is now robust, compliant, and ready for scale. You have completed the full Lexinel Governance Cycle.",
        icon: CheckCircle,
        color: "text-green-500",
        bg: "bg-green-500/10",
        actionBtn: "Finish Tour"
    }
];

export function TourGuide() {
    const [stepIndex, setStepIndex] = useState(-1);
    const [isAutoPilot, setIsAutoPilot] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const [isHovered, setIsHovered] = useState(false);
    const [highlightElement, setHighlightElement] = useState<HTMLElement | null>(null);
    const highlightTimerRef = React.useRef<NodeJS.Timeout | null>(null);
    const autoAdvanceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const checkTourStatus = () => {
            const tourActive = localStorage.getItem('pg_tour_active');
            if (tourActive === 'true' && stepIndex === -1) {
                setStepIndex(0);
            }
        };

        const handleStartTour = () => {
            setStepIndex(0);
        };

        checkTourStatus();

        window.addEventListener('pg-start-tour', handleStartTour);
        window.addEventListener('focus', checkTourStatus);
        return () => {
            window.removeEventListener('pg-start-tour', handleStartTour);
            window.removeEventListener('focus', checkTourStatus);
        };
    }, [pathname, stepIndex]);

    // Auto-Advance Logic (Auto-Pilot)
    useEffect(() => {
        if (stepIndex >= 0 && isAutoPilot && !isHovered) {
            if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);

            // Wait dynamic duration (default 8s) before moving to next step
            const duration = (TOUR_STEPS[stepIndex] as any).duration || 8000;
            autoAdvanceTimerRef.current = setTimeout(() => {
                nextStep();
            }, duration);
        }
        return () => {
            if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
        };
    }, [stepIndex, isAutoPilot, isHovered]);

    // Handle Page Changes, Scrolling, and AUTOMATION
    useEffect(() => {
        if (stepIndex >= 0 && stepIndex < TOUR_STEPS.length) {
            const step = TOUR_STEPS[stepIndex];

            // 1. Navigation Check
            const isMarketingPage = ['/', '/features', '/governance', '/pricing', '/team', '/login', '/signup'].includes(pathname);
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

    const isMarketingPage = ['/', '/features', '/governance', '/pricing', '/team', '/login', '/signup'].includes(pathname);
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
                <div className="absolute inset-0 pointer-events-none z-[9999]" style={{ overflow: 'hidden' }}>
                    <AnimatePresence>
                        {highlightElement && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute border-4 border-cyan-500 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.5)] z-[9999]"
                                style={{
                                    top: highlightElement.getBoundingClientRect().top + window.scrollY - 8,
                                    left: highlightElement.getBoundingClientRect().left + window.scrollX - 8,
                                    width: highlightElement.getBoundingClientRect().width + 16,
                                    height: highlightElement.getBoundingClientRect().height + 16,
                                }}
                            >
                                <motion.div
                                    className="absolute -top-3 -right-3 bg-cyan-500 text-white rounded-full p-1 shadow-lg"
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                >
                                    <Zap className="w-4 h-4" />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="bg-[#0b101a] border border-cyan-500/30 p-1 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] w-[380px] overflow-hidden">
                    {/* Header Bar */}
                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono uppercase tracking-widest ${currentStep.color} font-black`}>
                                {currentStep.badge}
                            </span>
                            {isAutoPilot && (
                                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[8px] animate-pulse">Auto-Pilot Active</Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsAutoPilot(!isAutoPilot)}
                                className={`h-6 w-6 ${isAutoPilot ? 'text-cyan-400' : 'text-gray-500'}`}
                                title={isAutoPilot ? "Pause Auto-Pilot" : "Resume Auto-Pilot"}
                            >
                                <Zap className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={endTour} className="h-6 w-6 hover:text-white text-gray-500">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
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
                                {currentStep.interactiveAction && (
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            const target = document.querySelector(currentStep.interactiveAction!.target) as HTMLElement;
                                            if (target) {
                                                target.click();
                                                setIsAutoPilot(false); // Pause so they can see result
                                            }
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-5 rounded-full font-bold shadow-lg shadow-emerald-500/20"
                                    >
                                        <Zap className="w-3 h-3 mr-2" /> {currentStep.interactiveAction.label}
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    onClick={nextStep}
                                    className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs h-8 px-5 rounded-full font-bold shadow-lg shadow-cyan-500/20"
                                >
                                    {currentStep.actionBtn || "Next"} <ArrowRight className="w-3 h-3 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1 bg-gray-900 w-full mt-0">
                        <motion.div
                            className="h-full bg-cyan-500"
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

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-[95]">
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`absolute rounded-xl border-2 ${borderClass} shadow-[0_0_30px_rgba(6,182,212,0.3)] bg-transparent`}
                style={{
                    top: coords.top - 12,
                    left: coords.left - 12,
                    width: coords.width + 24,
                    height: coords.height + 24,
                    transition: 'all 0.3s ease-out'
                }}
            >
                {/* Holographic Corners */}
                <div className={`absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 ${borderClass} rounded-tl-lg`} />
                <div className={`absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 ${borderClass} rounded-tr-lg`} />
                <div className={`absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 ${borderClass} rounded-bl-lg`} />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 ${borderClass} rounded-br-lg`} />

                {/* Scanning Light Effect */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent w-full h-[20%]"
                    animate={{
                        top: ['0%', '100%', '0%'],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
            </motion.div>
        </div>
    );
}
