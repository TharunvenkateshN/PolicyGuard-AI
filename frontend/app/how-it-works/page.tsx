"use client";

import React from 'react';
import Link from 'next/link';
import { Network, Search, ShieldCheck, Zap, ArrowLeft, Terminal, Code, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function HowItWorksPage() {
    const router = useRouter();

    const steps = [
        {
            id: "01",
            title: "Define & Connect",
            desc: "Upload corporate policies (GDPR, HIPAA, SOC2) and connect your Agent's API. We build a knowledge base of your specific compliance requirements.",
            icon: Search
        },
        {
            id: "02",
            title: "Adversarial Red Teaming",
            desc: "Before deployment, our 'Red Team' AI simulates attacker behavior (Prompt Injection, PII Mining) to stress-test your agent against OWASP Top 10 vulnerabilities.",
            icon: Terminal
        },
        {
            id: "03",
            title: "Auto-Remediation",
            desc: "If vulnerabilities are found, the Remediation Engine generates secure Guardrail Code (Python/TypeScript) and rewrites system specs to patch holes instantly.",
            icon: Code
        },
        {
            id: "04",
            title: "Real-time PII & Compliance",
            desc: "Once live, our Proxy Layer detects and blocks PII leaks (SSN, MRI, etc.) in <100ms, ensuring HIPAA/GDPR compliance for every single request.",
            icon: Globe
        }
    ];

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white pt-10 pb-20 px-6 font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="mb-12">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="hover:bg-white/10 hover:text-white text-gray-400 gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                </div>

                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
                        How PolicyGuard Works
                    </h1>
                    <p className="text-xl text-gray-400">
                        From Audit to Enforcement in 4 Steps.
                    </p>
                </div>

                <div className="space-y-12 relative">
                    {/* Connecting Line */}
                    <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-[#7C3AED] to-transparent hidden md:block" />

                    {steps.map((step, i) => (
                        <div key={i} className="relative flex flex-col md:flex-row gap-8 md:items-start pl-0 md:pl-0">
                            <div className="hidden md:flex flex-col items-center z-10">
                                <div className="w-14 h-14 rounded-full bg-[#0B0F19] border-2 border-[#7C3AED] flex items-center justify-center text-[#7C3AED] font-bold text-lg shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                                    {step.id}
                                </div>
                            </div>

                            <div className="flex-1 p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-[#7C3AED]/30 transition-all hover:translate-x-2">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED] md:hidden">
                                        <span className="font-bold">{step.id}</span>
                                    </div>
                                    <step.icon className="w-8 h-8 text-[#A78BFA]" />
                                    <h3 className="text-2xl font-bold">{step.title}</h3>
                                </div>
                                <p className="text-gray-400 leading-relaxed text-lg">
                                    {step.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
