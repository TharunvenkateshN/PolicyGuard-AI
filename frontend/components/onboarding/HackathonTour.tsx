"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ChevronRight, X, Sparkles, Terminal, Shield, ArrowRight } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface TourStep {
    id: number;
    title: string;
    description: string;
    path: string;
    actionLabel: string;
    icon?: any;
    position?: "center" | "bottom-right";
}

const TOUR_STEPS: TourStep[] = [
    {
        id: 0,
        title: "Welcome, Judge! 👨‍⚖️",
        description: "You are now in 'Test Mode'. We've skipped the API key setup so you can experience the platform immediately. Let's start by reviewing the active policies.",
        path: "/dashboard",
        actionLabel: "Go to Policy Manager",
        icon: Sparkles,
        position: "center"
    },
    {
        id: 1,
        title: "Step 1: The Policy Engine",
        description: "See that PDF? That's the 'Global AI Usage Policy'. \n\n👉 ACTION: Click 'View' to see how Gemini extracted the rules. \n\nWe parse this unstructured text into a structured Policy Matrix that acts as the 'Law' for all agents.",
        path: "/dashboard/policy",
        actionLabel: "Next: See Red Team",
        icon: Shield,
        position: "bottom-right"
    },
    {
        id: 2,
        title: "Step 2: Red Team Evaluation",
        description: "This is the Main Event. \n\n👉 ACTION: Select 'Medical Claims Agent' from the dropdown and click 'Run Simulation'. \n\nWatch Gemini actively attack the agent definition to find 'Prompt Injection' and 'PII Leak' vulnerabilities.",
        path: "/dashboard/evaluate",
        actionLabel: "Finish Tour",
        icon: Terminal,
        position: "bottom-right"
    }
];

export function HackathonTour() {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [currentStep, setCurrentStep] = useState<number | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Init state from local storage or default
        if (user?.isAnonymous) {
            const savedStep = localStorage.getItem('hackathonTourStep');
            const stepNum = savedStep ? parseInt(savedStep) : 0;

            // Check if tour is completed
            const isCompleted = localStorage.getItem('hackathonTourCompleted');

            if (!isCompleted) {
                setCurrentStep(stepNum);
                setIsVisible(true);
            }
        }
    }, [user]);

    // Effect to handle navigation enforcement (optional, but good for guiding)
    useEffect(() => {
        if (currentStep !== null && isVisible) {
            const desiredPath = TOUR_STEPS[currentStep]?.path;
            if (desiredPath && pathname !== desiredPath) {
                // We don't auto-redirect, that's annoying. We'll let the button do it.
                // But we could show a "Wrong Page" warning? Nah, simplicity first.
            }
        }
    }, [currentStep, pathname, isVisible]);

    const handleNext = () => {
        if (currentStep === null) return;

        const nextStepIndex = currentStep + 1;

        if (nextStepIndex < TOUR_STEPS.length) {
            // Logic for navigation
            const nextPath = TOUR_STEPS[nextStepIndex].path;
            if (nextPath && nextPath !== pathname) {
                router.push(nextPath);
            }

            setCurrentStep(nextStepIndex);
            localStorage.setItem('hackathonTourStep', nextStepIndex.toString());
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsVisible(false);
        localStorage.setItem('hackathonTourCompleted', 'true');
        setCurrentStep(null);
    };

    if (!isVisible || currentStep === null) return null;

    const step = TOUR_STEPS[currentStep];
    const StepIcon = step.icon || Sparkles;
    const isCenter = step.position === "center";

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`fixed inset-0 z-[100] pointer-events-none p-6 flex ${isCenter ? 'items-center justify-center' : 'items-end justify-end'}`}
            >
                <div className={`pointer-events-auto bg-white dark:bg-zinc-900 border border-blue-500/30 shadow-2xl rounded-xl w-full max-w-md overflow-hidden ring-1 ring-blue-500/20 ${isCenter ? '' : 'mb-8 mr-4'}`}>
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white font-bold">
                            <StepIcon className="w-5 h-5 text-blue-100" />
                            <span>{step.title}</span>
                        </div>
                        <button onClick={handleComplete} className="text-white/70 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed text-sm">
                            {step.description}
                        </p>

                        <div className="flex items-center justify-between pt-2">
                            <div className="flex gap-1">
                                {TOUR_STEPS.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-6 bg-blue-600' : 'w-1.5 bg-gray-200 dark:bg-zinc-700'
                                            }`}
                                    />
                                ))}
                            </div>

                            <Button onClick={handleNext} size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                                {step.actionLabel}
                                {currentStep === TOUR_STEPS.length - 1 ? <CheckCircle2 className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
