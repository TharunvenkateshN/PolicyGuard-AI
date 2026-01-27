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
            title: "Workflow Analysis",
            desc: "Map your agent's behavior, data flows, and decision points. We create a complete behavioral blueprint of your AI system.",
            icon: GitBranch
        },
        {
            id: "06",
            title: "Red Team Initialization",
            desc: "Prepare our adversarial testing suite with OWASP Top 10 attack vectors, prompt injection patterns, and PII extraction techniques.",
            icon: Shield
        },
        {
            id: "07",
            title: "Vulnerability Scanning",
            desc: "Automated security testing against OWASP Top 10 for LLMs: prompt injection, insecure output handling, training data poisoning, and more.",
            icon: Bug
        },
        {
            id: "08",
            title: "Attack Simulation",
            desc: "Our Red Team AI simulates real-world attacks: indirect prompt injection, PII mining, jailbreak attempts, and data exfiltration.",
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
            title: "Auto-Remediation",
            desc: "Generate production-ready guardrail code in Python/TypeScript. Automatically patch vulnerabilities with secure, tested implementations.",
            icon: Wrench
        },
        {
            id: "11",
            title: "Real-time Monitoring",
            desc: "Deploy our PII detection proxy layer. Monitor every request/response in real-time, detecting SSN, credit cards, medical records, and more.",
            icon: Eye
        },
        {
            id: "12",
            title: "Compliance Enforcement",
            desc: "Block policy violations in <100ms. Prevent PII leaks, unauthorized data access, and compliance breaches before they happen.",
            icon: Lock
        },
        {
            id: "13",
            title: "SLA Monitoring & Guarantees",
            desc: "Track system performance with 99.9% uptime SLA. Monitor response times, throughput, and compliance check latency with real-time dashboards.",
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
                        How PolicyGuard Works
                    </h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        A comprehensive 15-step process from policy upload to continuous protection
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
                    <h2 className="text-2xl font-semibold mb-4">Ready to Secure Your AI?</h2>
                    <p className="text-gray-400 mb-6">Start protecting your AI agents with PolicyGuard today.</p>
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
