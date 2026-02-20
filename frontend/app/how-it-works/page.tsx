"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileSearch, Database, Link2, GitBranch, Shield, Bug, Crosshair, Brain, Wrench, Eye, Lock, FileCheck, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HowItWorksPage() {
    const router = useRouter();

    const steps = [
        {
            id: "01",
            title: "Policy Upload",
            desc: "Upload your governance documents (GDPR, HIPAA, SOC2, internal policies). Our system accepts PDFs, Word docs, and text files.",
            icon: Upload
        },
        {
            id: "02",
            title: "Document Parsing",
            desc: "Gemini AI extracts requirements, rules, and compliance criteria from your documents using advanced NLP and semantic understanding.",
            icon: FileSearch
        },
        {
            id: "03",
            title: "Knowledge Base Creation",
            desc: "Build a searchable, vector-indexed policy database. Every rule is embedded and ready for semantic matching against your AI workflows.",
            icon: Database
        },
        {
            id: "04",
            title: "Agent Connection",
            desc: "Connect your AI agent's API endpoints. We support REST APIs, GraphQL, and webhook integrations for seamless monitoring.",
            icon: Link2
        },
        {
            id: "05",
            title: "Interaction Map",
            desc: "Map observed agent interactions and behavioral patterns. We create an indicative map of your AI system's operational surface.",
            icon: GitBranch
        },
        {
            id: "06",
            title: "Scenario Preparation",
            desc: "Prepare adversarial testing scenarios based on common risk patterns and policy requirements.",
            icon: Shield
        },
        {
            id: "07",
            title: "Risk Scanning",
            desc: "Automated scanning for policy-based risk patterns, including adversarial prompt types and data exposure indicators.",
            icon: Bug
        },
        {
            id: "08",
            title: "Adversarial Simulation",
            desc: "Our Red Team modules simulate potential adversarial interactions to identify latent policy weaknesses.",
            icon: Crosshair
        },
        {
            id: "09",
            title: "Risk Assessment",
            desc: "Gemini 3 Pro analyzes security gaps, policy violations, and compliance risks. Get detailed forensic evidence of every vulnerability.",
            icon: Brain
        },
        {
            id: "10",
            title: "Remediation Guidance",
            desc: "Produce policy-aligned guardrail snippets and integration templates to help mitigate identified risks.",
            icon: Wrench
        },
        {
            id: "11",
            title: "Operation Monitoring",
            desc: "Observe telemetry for key risk indicators in real-time within the operational environment.",
            icon: Eye
        },
        {
            id: "12",
            title: "Risk Containment",
            desc: "Flag or manage policy violations as they surface. Help minimize exposure to non-compliant agent behavior.",
            icon: Lock
        },
        {
            id: "13",
            title: "Performance & Stability Signals",
            desc: "Observe system performance indicators, response times, and throughput via a centralized stability dashboard.",
            icon: TrendingUp
        },
        {
            id: "14",
            title: "Audit Trail Generation",
            desc: "Create immutable, cryptographically-signed compliance reports. Full traceability for regulatory audits and certification.",
            icon: FileCheck
        },
        {
            id: "15",
            title: "Continuous Learning",
            desc: "Adapt to new threats and evolving policies. Our system learns from every interaction, improving detection and prevention over time.",
            icon: Brain
        }
    ];

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white pt-10 pb-20 px-6 font-sans">
            <div className="max-w-5xl mx-auto">
                {/* Back Button */}
                <div className="mb-12">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="hover:bg-white/10 hover:text-white text-gray-400 gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                </div>

                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                        How Lexinel Works
                    </h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        A structured approach to assisting teams with AI risk management and governance.
                    </p>
                </div>

                {/* Steps */}
                <div className="space-y-12">
                    {steps.map((step, i) => (
                        <div key={i} className="flex gap-6 items-start">
                            {/* Step Number */}
                            <div className="shrink-0 w-16 h-16 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                <span className="text-lg font-semibold text-purple-400">{step.id}</span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 pt-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <step.icon className="w-5 h-5 text-purple-400" />
                                    <h3 className="text-xl font-semibold">{step.title}</h3>
                                </div>
                                <p className="text-gray-400 leading-relaxed">
                                    {step.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="mt-20 text-center border-t border-white/10 pt-12">
                    <h2 className="text-2xl font-semibold mb-4">Ready to Govern Your AI?</h2>
                    <p className="text-gray-400 mb-6">Start improving your AI governance with Lexinel today.</p>
                    <Button
                        onClick={() => router.push('/signup')}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-base rounded-lg"
                    >
                        Get Started Free
                    </Button>
                </div>
            </div>
        </div>
    );
}
